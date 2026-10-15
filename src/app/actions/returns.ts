'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { verifyAdminToken } from '@/lib/admin-auth'
import { notifyReturnRequested, notifyReturnDecision } from '@/lib/email/notify'
import { CAYMA_GUN, remainingReturnDays, type ReturnActionResult } from '@/lib/returns'

/**
 * İade talebi (cayma hakkı) akışı.
 *
 * Müşterinin onayladığı sözleşme metni "Hesabım > Siparişlerim > sipariş
 * detayından iade talebinde bulunun" diyordu ama böyle bir mekanizma yoktu.
 * Teslim edilmiş bir üründe 14 günlük cayma hakkını sitede kullanmanın yolu
 * bulunmuyordu — yasal olarak bağlayıcı bir metinde var olmayan süreç tarif
 * etmek doğrudan risk.
 */

const ADMIN_COOKIE = 'admin_session'

async function requireAdmin(): Promise<void> {
  const cookieStore = await cookies()
  if (!(await verifyAdminToken(cookieStore.get(ADMIN_COOKIE)?.value))) {
    throw new Error('Yetkisiz erişim: admin oturumu gerekli')
  }
}

async function getAuthUserId(): Promise<string> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Giriş yapmanız gerekiyor.')
  return user.id
}

// ─── Müşteri: talep oluştur ──────────────────────────────────────────────────

export async function createReturnRequest(
  orderId: string,
  reason: string,
  selectedItemIds: string[],
): Promise<ReturnActionResult> {
  let userId: string
  try {
    userId = await getAuthUserId()
  } catch {
    return { ok: false, error: 'Giriş yapmanız gerekiyor.' }
  }

  const cleanReason = reason.trim().slice(0, 2000)
  if (cleanReason.length < 10) {
    return { ok: false, error: 'Lütfen iade sebebinizi en az 10 karakter yazın.' }
  }

  try {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        deliveredAt: true,
        items: { select: { id: true, quantity: true } },
        returnRequests: { select: { id: true, status: true } },
      },
    })

    if (!order) return { ok: false, error: 'Sipariş bulunamadı.' }

    if (order.status !== 'DELIVERED') {
      return {
        ok: false,
        error:
          'İade talebi yalnızca teslim edilmiş siparişler için açılabilir. ' +
          'Henüz teslim edilmemiş siparişi iptal etmek için "Siparişi İptal Et" seçeneğini kullanın.',
      }
    }

    if (order.paymentStatus !== 'paid') {
      return { ok: false, error: 'Bu siparişin ödemesi tahsil edilmemiş.' }
    }

    if (remainingReturnDays(order.deliveredAt) === 0) {
      return {
        ok: false,
        error: `Cayma hakkı süresi (${CAYMA_GUN} gün) dolmuş. Yine de bizimle iletişime geçebilirsiniz.`,
      }
    }

    const openRequest = order.returnRequests.find(
      (r: { status: string }) => r.status === 'PENDING' || r.status === 'APPROVED',
    )
    if (openRequest) {
      return { ok: false, error: 'Bu sipariş için zaten açık bir iade talebiniz var.' }
    }

    // Yalnızca bu siparişe ait kalemler kabul edilir
    const ownedIds = new Set(order.items.map((i: { id: string }) => i.id))
    const validIds = selectedItemIds.filter((id) => ownedIds.has(id))
    if (validIds.length === 0) {
      return { ok: false, error: 'İade etmek istediğiniz en az bir ürün seçin.' }
    }

    const quantities = new Map(
      order.items.map((i: { id: string; quantity: number }) => [i.id, i.quantity]),
    )

    const request = await prisma.returnRequest.create({
      data: {
        orderId: order.id,
        userId,
        reason: cleanReason,
        items: validIds.map((id) => ({ orderItemId: id, quantity: quantities.get(id) ?? 1 })),
      },
      select: { id: true },
    })

    await notifyReturnRequested(request.id)

    revalidatePath(`/hesabim/siparislerim/${orderId}`)
    revalidatePath('/admin/alb-tarim/iadeler')
revalidatePath('/admin/alb-su-aritma/iadeler')

    return {
      ok: true,
      message:
        'İade talebiniz alındı. En kısa sürede değerlendirip size e-posta ile dönüş yapacağız.',
    }
  } catch (error) {
    console.error('[iade] talep oluşturulamadı:', orderId, error)
    return { ok: false, error: 'İade talebi oluşturulamadı. Lütfen tekrar deneyin.' }
  }
}

// ─── Admin: listele ──────────────────────────────────────────────────────────

export async function getReturnRequests(onlyOpen = false, brandKey?: string) {
  await requireAdmin()

  // İade talebinin kendi markası yok; bağlı olduğu siparişin markasına bakılır.
  const where: Record<string, unknown> = {}
  if (onlyOpen) where.status = { in: ['PENDING', 'APPROVED'] }
  if (brandKey) where.order = { brand: { key: brandKey } }

  return prisma.returnRequest.findMany({
    where: Object.keys(where).length ? where : undefined,
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    include: {
      user: { select: { email: true, name: true } },
      order: {
        select: {
          id: true,
          totalAmount: true,
          paymentStatus: true,
          deliveredAt: true,
          shipFullName: true,
          shipPhone: true,
          brand: { select: { name: true } },
          items: {
            select: {
              id: true,
              quantity: true,
              totalPrice: true,
              product: { select: { name: true, unit: true } },
            },
          },
        },
      },
    },
  })
}

export async function getOpenReturnCount(brandKey?: string): Promise<number> {
  await requireAdmin()
  return prisma.returnRequest.count({
    where: {
      status: 'PENDING',
      ...(brandKey ? { order: { brand: { key: brandKey } } } : {}),
    },
  })
}

// ─── Admin: karar ────────────────────────────────────────────────────────────

export async function decideReturnRequest(
  requestId: string,
  decision: 'APPROVED' | 'REJECTED',
  adminNote: string,
): Promise<ReturnActionResult> {
  await requireAdmin()

  const note = adminNote.trim().slice(0, 2000)
  if (decision === 'REJECTED' && note.length < 10) {
    return {
      ok: false,
      error: 'Reddetme gerekçesi zorunlu — müşteriye bu metin gönderiliyor.',
    }
  }

  try {
    // Yalnızca beklemedeki talep karara bağlanır: iki yönetici aynı anda
    // işlem yaparsa ikincisi boşa düşsün.
    const updated = await prisma.returnRequest.updateMany({
      where: { id: requestId, status: 'PENDING' },
      data: { status: decision, adminNote: note || null, resolvedAt: new Date() },
    })

    if (updated.count === 0) {
      return { ok: false, error: 'Bu talep zaten karara bağlanmış.' }
    }

    await notifyReturnDecision(requestId)

    revalidatePath('/admin/alb-tarim/iadeler')
revalidatePath('/admin/alb-su-aritma/iadeler')
    return {
      ok: true,
      message:
        decision === 'APPROVED'
          ? 'Talep onaylandı ve müşteriye bildirildi. Ürün elinize ulaşınca sipariş ekranından "Siparişi İade Et" ile parayı iade edin.'
          : 'Talep reddedildi ve gerekçe müşteriye gönderildi.',
    }
  } catch (error) {
    console.error('[iade] karar kaydedilemedi:', requestId, error)
    return { ok: false, error: 'Karar kaydedilemedi.' }
  }
}

// `completeReturnRequestsForOrder` buradan `src/lib/return-requests.ts`'e
// taşındı: `'use server'` dosyasında export edilen her fonksiyon tarayıcıdan
// çağrılabilen bir uç noktadır ve o fonksiyonda hiçbir yetki kontrolü yoktu.
