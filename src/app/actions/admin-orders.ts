'use server'

import { cookies, headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { prisma, type TransactionClient } from '@/lib/db'
import { verifyAdminToken } from '@/lib/admin-auth'
import { processRefund, IADE_BELIRSIZ_DURUMU } from '@/lib/refund'
import { IADE_INCELEME_FILTRESI } from '@/lib/order-cancel'
import { restoreStock } from '@/lib/stock'
import { approveDeliveredOrder } from '@/lib/iyzico-delivery'
import {
  notifyOrderShipped,
  notifyOrderDelivered,
  notifyOrderCancelled,
} from '@/lib/email/notify'
import { clientIp } from '@/lib/rate-limit'
import { appendOrderNote } from '@/lib/order-note'

/**
 * Admin sipariş yönetimi.
 *
 * Eskiden admin panelinde sipariş bölümü hiç yoktu: sipariş durumu yalnızca
 * ödeme callback'i ile CONFIRMED'a geçiyor, PROCESSING/SHIPPED/DELIVERED
 * durumlarına asla ulaşamıyordu. İade çağrısı da yoktu; müşteri siparişi iptal
 * ediyor ama parası iade edilmiyordu.
 */

const ADMIN_COOKIE = 'admin_session'

/**
 * Bir sipariş değiştiğinde tazelenecek BÜTÜN yollar.
 *
 * ── Neden tek yerde ─────────────────────────────────────────────────────────
 *
 * Bu liste altı ayrı aksiyonda elle tekrarlanıyordu ve hepsinde YALNIZCA
 * yönetici sayfaları vardı. Müşterinin kendi sipariş sayfaları hiçbir zaman
 * tazelenmiyordu: yönetici siparişi iptal ediyor, kargoya veriyor, iade
 * ediyor — müşteri tarafında hiçbir şey değişmiyordu. Bildirilen "iptal
 * edilmesine rağmen iptal düğmesi duruyor" belirtisinin ikinci kaynağı buydu.
 *
 * Marka bazlı panel yolları iki kez yazılıyor çünkü siparişin hangi markaya
 * ait olduğu burada bilinmiyor; ikisini de tazelemek yanlış olanı aramaktan
 * ucuz.
 */
async function siparisYollariniTazele(orderId: string): Promise<void> {
  revalidatePath('/admin/alb-tarim/siparisler')
  revalidatePath('/admin/alb-su-aritma/siparisler')
  revalidatePath(`/admin/alb-tarim/siparisler/${orderId}`)
  revalidatePath(`/admin/alb-su-aritma/siparisler/${orderId}`)
  revalidatePath('/hesabim/siparislerim')
  revalidatePath(`/hesabim/siparislerim/${orderId}`)
  revalidatePath('/hesabim')
}

async function requireAdmin(): Promise<void> {
  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_COOKIE)?.value
  if (!(await verifyAdminToken(token))) {
    throw new Error('Yetkisiz erişim: admin oturumu gerekli')
  }
}

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED'

const VALID_STATUSES: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
]

/**
 * Elle seçilebilen durumlar. REFUNDED listede YOK: iade, para gerçekten iade
 * edilmeden işaretlenirse geri alınamaz bir tutarsızlık oluşuyordu. İade
 * yalnızca `refundOrder` akışından geçer.
 */
const MANUAL_STATUSES: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
]

/**
 * DURUM GEÇİŞ MATRİSİ — hangi durumdan hangisine gidilebilir?
 *
 * ── Neden gerekli ───────────────────────────────────────────────────────────
 *
 * Doğrulama eskiden yalnızca HEDEF durumu kontrol ediyordu: "CONFIRMED geçerli
 * bir durum mu?" Evet. Ama nereden gelindiği hiç sorulmuyordu. Sonuç: iptal
 * edilmiş bir sipariş tek tıkla CONFIRMED yapılabiliyordu. O siparişin stoğu
 * iptalde geri verilmiş olduğu için, artık rezerve edilmemiş bir mal kargoya
 * çıkıyordu. Aynı şekilde teslim edilmiş bir sipariş PENDING'e döndürülebiliyor,
 * iade edilmiş bir sipariş yeniden işleme alınabiliyordu.
 *
 * ── Kurallar ────────────────────────────────────────────────────────────────
 *
 * PENDING    → ödeme bekliyor. Onaylanabilir ya da iptal edilebilir.
 * CONFIRMED  → ödeme alındı. Hazırlığa geçebilir, kargoya verilebilir ya da
 *              iptal edilebilir (iptal = iade, `processRefund` devreye girer).
 * PROCESSING → hazırlanıyor. Kargoya verilebilir ya da iptal edilebilir.
 * SHIPPED    → yola çıktı. Yalnızca teslim edilebilir. İptal artık yönetici
 *              işi değil; iade süreci var.
 * DELIVERED  → SON DURUM. Sonrası iade sürecinden geçer.
 * CANCELLED  → SON DURUM. Yeniden canlandırılamaz; müşteri yeni sipariş verir.
 * REFUNDED   → SON DURUM.
 *
 * Aynı duruma geçiş (CONFIRMED → CONFIRMED) serbest: yönetici listede yanlışlıkla
 * aynı seçeneği seçtiğinde hata görmesin, hiçbir şey değişmesin.
 */
const GECERLI_GECISLER: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'SHIPPED', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
  REFUNDED: [],
}

const DURUM_ADI: Record<OrderStatus, string> = {
  PENDING: 'Ödeme Bekliyor',
  CONFIRMED: 'Onaylandı',
  PROCESSING: 'Hazırlanıyor',
  SHIPPED: 'Kargoya Verildi',
  DELIVERED: 'Teslim Edildi',
  CANCELLED: 'İptal Edildi',
  REFUNDED: 'İade Edildi',
}

function gecisGecerliMi(kaynak: OrderStatus, hedef: OrderStatus): boolean {
  if (kaynak === hedef) return true
  return GECERLI_GECISLER[kaynak]?.includes(hedef) ?? false
}

// ─── Listeleme ───────────────────────────────────────────────────────────────

export async function getOrdersForAdmin(options?: {
  status?: string
  search?: string
  page?: number
  pageSize?: number
  /** Marka anahtarı. Verilmezse tüm markalar gelir. */
  brandKey?: string
}) {
  await requireAdmin()

  const page = Math.max(1, options?.page ?? 1)
  const pageSize = Math.min(100, Math.max(10, options?.pageSize ?? 25))
  const status = options?.status
  const search = options?.search?.trim()

  const where: Record<string, unknown> = {}

  // Panel marka bazlı çalışıyor; filtre burada uygulanmazsa yönetici ALB Su
  // ekranında ALB Tarım siparişlerini de görür.
  if (options?.brandKey) where.brand = { key: options.brandKey }

  if (status && VALID_STATUSES.includes(status as OrderStatus)) {
    where.status = status
  }

  // ── "İade incelemesi" filtresi ─────────────────────────────────────────────
  //
  // Bu filtre sipariş DURUMUNA değil ÖDEME durumuna bakıyor, çünkü aranan şey
  // bir sipariş durumu değil: iadesi başlamış ama sonuçlanmamış siparişler.
  // Onların `status`'u hâlâ CONFIRMED olduğu için durum filtrelerinin hiçbiri
  // göstermiyordu — panelde tamamen görünmezlerdi.
  if (status === IADE_INCELEME_FILTRESI) {
    where.paymentStatus = { in: ['refunding', IADE_BELIRSIZ_DURUMU] }
  }

  if (search) {
    where.OR = [
      { orderNumber: { contains: search.replace(/\D/g, '') || search } },
      { id: { contains: search, mode: 'insensitive' } },
      { shipFullName: { contains: search, mode: 'insensitive' } },
      { trackingNumber: { contains: search, mode: 'insensitive' } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
    ]
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        user: { select: { email: true, name: true, phone: true } },
        brand: { select: { key: true, name: true } },
        items: {
          include: { product: { select: { name: true, unit: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.order.count({ where }),
  ])

  return { orders, total, page, pageSize, pageCount: Math.ceil(total / pageSize) }
}

export async function getOrderCountsByStatus(brandKey?: string) {
  await requireAdmin()

  const grouped = await prisma.order.groupBy({
    by: ['status'],
    where: brandKey ? { brand: { key: brandKey } } : undefined,
    _count: { status: true },
  })

  const counts: Record<string, number> = {}
  for (const row of grouped as Array<{ status: string; _count: { status: number } }>) {
    counts[row.status] = row._count.status
  }

  // İade incelemesi bekleyenler `status`'a göre gruplanamıyor (hepsi hâlâ
  // CONFIRMED görünüyor); ayrı sayılıp aynı tabloya ekleniyor.
  counts[IADE_INCELEME_FILTRESI] = await prisma.order.count({
    where: {
      ...(brandKey ? { brand: { key: brandKey } } : {}),
      paymentStatus: { in: ['refunding', IADE_BELIRSIZ_DURUMU] },
    },
  })

  return counts
}

// ─── Durum güncelleme ────────────────────────────────────────────────────────

export async function updateOrderStatus(
  orderId: string,
  status: string,
): Promise<OrderStatusResult> {
  await requireAdmin()

  if (!MANUAL_STATUSES.includes(status as OrderStatus)) {
    return {
      ok: false,
      error:
        status === 'REFUNDED'
          ? 'İade işlemi durum menüsünden yapılamaz. "Siparişi İade Et" butonunu kullanın.'
          : 'Geçersiz sipariş durumu.',
    }
  }

  // Buradan sonra `status` gerçekten bir OrderStatus; yukarıdaki kontrol bunu
  // garanti ediyor ama tip sistemi bilmiyor. Daraltma tek yerde yapılıyor ki
  // aşağıda her kullanımda `as` tekrarlanmasın.
  const hedefDurum = status as OrderStatus

  const existing = await prisma.order.findUnique({
    where: { id: orderId },
    select: { paymentStatus: true, status: true },
  })
  if (!existing) return { ok: false, error: 'Sipariş bulunamadı.' }

  // ── Geçiş geçerli mi? ────────────────────────────────────────────────────
  //
  // Yalnızca hedef durumun geçerliliği kontrol ediliyordu, kaynak durum değil.
  // Gerekçe ve matris için bkz. GECERLI_GECISLER.
  const mevcutDurum = existing.status as OrderStatus
  if (!gecisGecerliMi(mevcutDurum, hedefDurum)) {
    const izinli = GECERLI_GECISLER[mevcutDurum]
    return {
      ok: false,
      error:
        izinli.length === 0
          ? `Bu sipariş "${DURUM_ADI[mevcutDurum]}" durumunda ve bu son bir durum; ` +
            `durumu değiştirilemez.`
          : `"${DURUM_ADI[mevcutDurum]}" durumundaki bir sipariş "${DURUM_ADI[hedefDurum]}" ` +
            `yapılamaz. Buradan yalnızca şuraya geçilebilir: ` +
            `${izinli.map((d) => DURUM_ADI[d]).join(', ')}.`,
    }
  }

  // ── Ödemesi alınmış siparişin iptali = iade ──────────────────────────────
  //
  // Durum menüsünden "İptal Edildi" seçmek eskiden yalnızca durumu yazıyordu:
  // müşterinin parası hesapta kalıyor, düşülen stok geri gelmiyordu. Sonra bu
  // yolu hata fırlatarak kapatmıştım — ama sunucu aksiyonundan fırlatılan hata
  // üretimde mesajı gizlenmiş genel bir hataya dönüşüyor, yönetici de "bir
  // şeyler ters gitti" ekranı görüyordu.
  //
  // Doğrusu: iptal seçildiğinde iyzico'ya iptal/iade isteğini KENDİMİZ
  // göndermek. `processRefund` önce aynı gün iptalini (cancel), o olmazsa
  // iadeyi (refund) deniyor; stokları geri yüklüyor ve müşteriye e-posta
  // atıyor. Gateway başarısız olursa sipariş iade edilmiş sayılmıyor.
  if (status === 'CANCELLED' && existing.paymentStatus === 'paid') {
    // Projenin kendi `clientIp()` yardımcısı kullanılıyor: `cf-connecting-ip`
    // başlığını tercih ediyor ve zincirin SON öğesini alıyor. Buradaki eski
    // kod `x-forwarded-for` zincirinin İLK öğesini alıyordu — o öğeyi istemci
    // yazabilir, yani iade kaydındaki IP kanıtı sahtelenebilirdi.
    const ip = clientIp(await headers())

    const result = await processRefund({
      orderId,
      ip,
      reason: 'Sipariş yönetici tarafından iptal edildi.',
    })

    await siparisYollariniTazele(orderId)

    if (!result.ok) {
      return {
        ok: false,
        error: result.needsManualReview
          ? `${result.error} Sipariş iptal edilmedi — iyzico panelinden kontrol edip elle iade edin.`
          : result.error,
      }
    }

    return {
      ok: true,
      // `processRefund` siparişi REFUNDED olarak işaretliyor (para geri
      // döndüğü için doğrusu bu). Yönetici "İptal Edildi" seçtiği hâlde satırda
      // "İade Edildi" göreceği için mesajda açıkça söyleniyor.
      message:
        result.gateway === 'cancel'
          ? 'Ödeme iyzico üzerinden iptal edildi (aynı gün iptali), stoklar geri yüklendi. Sipariş "İade Edildi" olarak işaretlendi.'
          : 'Ödeme iyzico üzerinden iade edildi, stoklar geri yüklendi. Sipariş "İade Edildi" olarak işaretlendi; kartına yansıması 1-7 iş günü sürebilir.',
    }
  }

  const data: Record<string, unknown> = { status }

  // Durum geçişlerinde tarih damgaları
  if (status === 'SHIPPED') data.shippedAt = new Date()
  if (status === 'DELIVERED') data.deliveredAt = new Date()

  // ÖDEMESİZ siparişin yönetici iptali.
  //
  // Yukarıdaki dal yalnızca `paymentStatus === 'paid'` durumunu ele alıyor;
  // ödemesi alınmamış bir siparişi yönetici iptal ettiğinde buraya düşülüyordu
  // ve stok geri verilmiyordu. Müşteri tarafındaki `cancelOrder` aynı durumda
  // `restoreStock` çağırıyor — yani iki taraf farklı davranıyordu.
  //
  // Kaybın kalıcı olmasının sebebi: iptal edilen sipariş artık PENDING
  // olmadığı için bekleyen sipariş temizliği de onu bir daha görmüyor. Stok
  // sonsuza kadar rezerve kalıyor, satılabilir ürün "tükendi" görünüyor.
  //
  // `restoreStock` `stockReduced` bayrağıyla idempotent; iki kez çağrılsa da
  // stoğu iki kez artırmıyor.
  if (status === 'CANCELLED' && existing.status !== 'CANCELLED') {
    data.paymentToken = null
    await restoreStock(orderId, 'yönetici iptali')
  }

  await prisma.order.update({ where: { id: orderId }, data })

  let extra = ''

  // Müşteri bildirimleri — durum gerçekten değiştiyse, tekrar tekrar
  // gönderilmesin diye önceki durumla karşılaştırılıyor.
  if (existing.status !== status) {
    if (status === 'SHIPPED') await notifyOrderShipped(orderId)
    if (status === 'CANCELLED') await notifyOrderCancelled(orderId)

    if (status === 'DELIVERED') {
      await notifyOrderDelivered(orderId)

      // Korumalı Alışveriş kullanan hesaplarda teslimat onayı iyzico'ya
      // bildirilmeli, yoksa para satıcıya aktarılmaz. Kapalıysa hiçbir istek
      // gönderilmiyor. Başarısızlık teslimat kaydını bozmaz.
      const approval = await approveDeliveredOrder(orderId)

      if (approval.attempted) {
        if (approval.note) {
          await appendOrderNote(orderId, approval.note)
          extra = ' Ancak iyzico teslimat onayında sorun çıktı — siparişin yönetici notuna bakın.'
        } else if (approval.approved > 0) {
          extra = ` ${approval.approved} kalem iyzico'da onaylandı.`
        }
      }
    }
  }

  await siparisYollariniTazele(orderId)

  return { ok: true, message: `Sipariş durumu güncellendi.${extra}` }
}

// ─── Kargo bilgisi ───────────────────────────────────────────────────────────

export async function updateOrderShipping(
  orderId: string,
  carrier: string,
  trackingNumber: string,
) {
  await requireAdmin()

  const cleanCarrier = carrier.trim().slice(0, 100)
  const cleanTracking = trackingNumber.trim().slice(0, 100)

  if (!cleanCarrier || !cleanTracking) {
    throw new Error('Kargo firması ve takip numarası gerekli')
  }

  await prisma.order.update({
    where: { id: orderId },
    data: {
      carrier: cleanCarrier,
      trackingNumber: cleanTracking,
      status: 'SHIPPED',
      shippedAt: new Date(),
    },
  })

  // Müşteriye takip numarasını gönder
  await notifyOrderShipped(orderId)

  await siparisYollariniTazele(orderId)
}

// ─── Admin notu ──────────────────────────────────────────────────────────────

export async function updateOrderNote(orderId: string, note: string) {
  await requireAdmin()

  await prisma.order.update({
    where: { id: orderId },
    data: { adminNote: note.trim().slice(0, 2000) || null },
  })

  await siparisYollariniTazele(orderId)
}

// ─── İade ────────────────────────────────────────────────────────────────────

export type OrderStatusResult = { ok: true; message: string } | { ok: false; error: string }

export type RefundResult = { ok: true; message: string } | { ok: false; error: string }

/**
 * Siparişi iade eder: iyzico'ya iade isteği gönderir, stokları geri yükler ve
 * siparişi REFUNDED yapar.
 */
export async function refundOrder(
  orderId: string,
  options?: { reason?: string; returnRequestId?: string },
): Promise<RefundResult> {
  await requireAdmin()

  const headerList = await headers()
  const ip = clientIp(headerList)

  // Açık bir iade talebi varsa iade O TALEBİN kalemleri üzerinden yapılır.
  // Eskiden talep kısmi olsa bile siparişin tamamı iade ediliyordu.
  let returnRequestId = options?.returnRequestId
  if (!returnRequestId) {
    const acik = await prisma.returnRequest.findMany({
      where: { orderId, status: { in: ['PENDING', 'APPROVED'] } },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    })
    // Birden fazla açık talep varsa hangisinin iade edileceği belirsiz;
    // yöneticinin talebi iadeler ekranından seçmesi gerekir.
    if (acik.length === 1) returnRequestId = acik[0].id
    else if (acik.length > 1) {
      return {
        ok: false,
        error:
          'Bu siparişte birden fazla açık iade talebi var. İadeler ekranından hangi talebi ' +
          'iade edeceğinizi seçin.',
      }
    }
  }

  const result = await processRefund({
    orderId,
    ip,
    reason: options?.reason,
    returnRequestId,
  })

  await siparisYollariniTazele(orderId)

  if (!result.ok) return { ok: false, error: result.error }
  return { ok: true, message: result.message }
}

/**
 * "Parayı iyzico panelinden elle iade ettim" durumu.
 *
 * Eskiden bu, `refundOrder`'ın `options.force` bayrağıydı — yani istemciden
 * gelebilen, arayüzde karşılığı olmayan ve geri alınamaz bir durum değişikliği
 * tetikleyen bir parametreydi. Ayrı ve açıkça adlandırılmış bir aksiyona
 * taşındı; `refundOrder`'ın imzasında artık `force` yok.
 *
 * Gateway çağrısı YAPILMAZ: para zaten elle iade edilmiş varsayılır.
 */
export async function markOrderManuallyRefunded(
  orderId: string,
  reason?: string,
): Promise<RefundResult> {
  await requireAdmin()

  const headerList = await headers()
  const ip = clientIp(headerList)

  const result = await processRefund({
    orderId,
    ip,
    force: true,
    // Yönetici ödemeyi iyzico panelinden zaten iade etti; buradan ikinci bir
    // para hareketi isteği göndermenin hiçbir gerekçesi yok.
    gatewayAtla: true,
    reason: reason ? `Elle iade: ${reason}` : 'iyzico panelinden elle iade edildi',
  })

  await siparisYollariniTazele(orderId)

  if (!result.ok) return { ok: false, error: result.error }
  return { ok: true, message: result.message }
}

// ─── Form kayıtları ──────────────────────────────────────────────────────────

/**
 * @param kapsam 'alb-tarim' | 'alb-su-aritma' → o markanın mesajları.
 *               'belirtilmemis' → grup iletişim formundan gelen, markası boş
 *               olanlar. Verilmezse hepsi.
 */
export async function getContactMessages(options?: {
  unreadOnly?: boolean
  kapsam?: string
}) {
  await requireAdmin()

  const where: Record<string, unknown> = {}
  if (options?.unreadOnly) where.isRead = false
  if (options?.kapsam === 'belirtilmemis') where.brandKey = null
  else if (options?.kapsam) where.brandKey = options.kapsam

  return prisma.contactMessage.findMany({
    where: Object.keys(where).length ? where : undefined,
    orderBy: { createdAt: 'desc' },
    take: 200,
  })
}

export async function getUnreadMessageCount(kapsam?: string): Promise<number> {
  await requireAdmin()

  const where: Record<string, unknown> = { isRead: false }
  if (kapsam === 'belirtilmemis') where.brandKey = null
  else if (kapsam) where.brandKey = kapsam

  return prisma.contactMessage.count({ where }).catch(() => 0)
}

export async function markMessageRead(id: string, isRead: boolean) {
  await requireAdmin()
  await prisma.contactMessage.update({ where: { id }, data: { isRead } })
  revalidatePath('/admin/alb-tarim/mesajlar')
revalidatePath('/admin/alb-su-aritma/mesajlar')
  revalidatePath('/admin/belirtilmemis/mesajlar')
}

/**
 * Başvuru formunda "Her İkisi" seçeneği var; o başvurular iki markanın
 * listesinde de görünür, yoksa birinde çıkıp diğerinde kaybolurlardı.
 */
function bayiKapsamFiltresi(kapsam?: string): Record<string, unknown> | undefined {
  if (!kapsam) return undefined
  if (kapsam === 'belirtilmemis') {
    return { OR: [{ brandInterest: null }, { brandInterest: '' }] }
  }
  return { brandInterest: { in: [kapsam, 'her-ikisi'] } }
}

export async function getDealerApplications(kapsam?: string) {
  await requireAdmin()

  return prisma.dealerApplication.findMany({
    where: bayiKapsamFiltresi(kapsam),
    orderBy: { createdAt: 'desc' },
    take: 200,
  })
}

export async function getNewDealerCount(kapsam?: string): Promise<number> {
  await requireAdmin()

  const kapsamFiltre = bayiKapsamFiltresi(kapsam)
  return prisma.dealerApplication
    .count({ where: { status: 'new', ...(kapsamFiltre ?? {}) } })
    .catch(() => 0)
}

export async function updateDealerStatus(id: string, status: string) {
  await requireAdmin()

  const allowed = ['new', 'contacted', 'approved', 'rejected']
  if (!allowed.includes(status)) throw new Error('Geçersiz durum')

  await prisma.dealerApplication.update({ where: { id }, data: { status } })
  revalidatePath('/admin/alb-tarim/bayi-basvurulari')
revalidatePath('/admin/alb-su-aritma/bayi-basvurulari')
  revalidatePath('/admin/belirtilmemis/bayi-basvurulari')
}

// NOT: Buradaki yerel `appendOrderNote` kopyası KALDIRILDI.
//
// İki sürüm vardı: bu kopya notu 2000 karaktere kırpıyor ve tarih damgası
// koymuyordu; `lib/order-note.ts` içindeki asıl sürüm 4000 karakter tutuyor ve
// her nota damga atıyor. Aynı siparişin notu, hangi koddan geçtiğine göre iki
// farklı biçimde yazılıyordu. Artık tek kaynak: lib/order-note.ts
