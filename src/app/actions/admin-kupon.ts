'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { verifyAdminToken } from '@/lib/admin-auth'
import { KUPON_SAYILAN_SIPARIS, kuponKoduTemizle } from '@/lib/kupon'

/**
 * Yönetim paneli — indirim kuponları.
 * Her aksiyon kendi içinde yetki kontrolü yapar (sunucu aksiyonları herhangi
 * bir sayfadan çağrılabildiği için yalnızca sayfa koruması yetmez).
 */

async function yoneticiMi(): Promise<boolean> {
  const cookieStore = await cookies()
  return verifyAdminToken(cookieStore.get('admin_session')?.value)
}

export type KuponSatiri = {
  id: number
  code: string
  percent: number
  description: string | null
  isActive: boolean
  onlyNewMembers: boolean
  maxUses: number | null
  perUserLimit: number
  minAmount: number | null
  endsAt: string | null
  kullanim: number
  toplamIndirim: number
}

export async function kuponlariGetir(): Promise<KuponSatiri[]> {
  if (!(await yoneticiMi())) return []

  const [kuponlar, kullanimlar] = await Promise.all([
    prisma.coupon.findMany({ orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }] }),
    prisma.order.groupBy({
      by: ['couponCode'],
      where: { couponCode: { not: null }, ...KUPON_SAYILAN_SIPARIS },
      _count: { _all: true },
      _sum: { discountAmount: true },
    }),
  ])

  const sayac = new Map(kullanimlar.map((k) => [k.couponCode, k]))
  return kuponlar.map((k) => ({
    id: k.id,
    code: k.code,
    percent: k.percent,
    description: k.description,
    isActive: k.isActive,
    onlyNewMembers: k.onlyNewMembers,
    maxUses: k.maxUses,
    perUserLimit: k.perUserLimit,
    minAmount: k.minAmount ? Number(k.minAmount) : null,
    endsAt: k.endsAt ? k.endsAt.toISOString() : null,
    kullanim: sayac.get(k.code)?._count._all ?? 0,
    toplamIndirim: Number(sayac.get(k.code)?._sum.discountAmount ?? 0),
  }))
}

export type KuponSonuc = { ok: true } | { ok: false; error: string }

export async function kuponOlustur(formData: FormData): Promise<KuponSonuc> {
  if (!(await yoneticiMi())) return { ok: false, error: 'Oturumunuz sona ermiş. Yeniden giriş yapın.' }

  const metin = (k: string) => ((formData.get(k) as string | null) ?? '').trim()
  const tamSayi = (k: string) => (metin(k) ? Number(metin(k)) : null)

  const code = kuponKoduTemizle(metin('code'))
  const percent = Number(metin('percent'))
  const maxUses = tamSayi('maxUses')
  const perUserLimit = tamSayi('perUserLimit') ?? 1
  const minAmount = metin('minAmount') ? Number(metin('minAmount').replace(',', '.')) : null
  const endsAtRaw = metin('endsAt')

  if (code.length < 3) return { ok: false, error: 'Kupon kodu en az 3 karakter olmalı (harf ve rakam).' }
  if (!Number.isInteger(percent) || percent < 1 || percent > 90) {
    return { ok: false, error: 'İndirim oranı 1 ile 90 arasında bir tam sayı olmalı.' }
  }
  if (maxUses !== null && (!Number.isInteger(maxUses) || maxUses < 1)) {
    return { ok: false, error: 'Toplam kullanım sınırı 1 veya daha büyük olmalı (sınırsız için boş bırakın).' }
  }
  if (!Number.isInteger(perUserLimit) || perUserLimit < 1 || perUserLimit > 100) {
    return { ok: false, error: 'Kişi başı kullanım 1 ile 100 arasında olmalı.' }
  }
  if (minAmount !== null && (!Number.isFinite(minAmount) || minAmount < 0)) {
    return { ok: false, error: 'En düşük sepet tutarı geçerli bir sayı olmalı.' }
  }

  // Tarih alanı gün olarak gelir; kupon o günün sonuna kadar geçerli olsun
  let endsAt: Date | null = null
  if (endsAtRaw) {
    endsAt = new Date(`${endsAtRaw}T23:59:59+03:00`)
    if (Number.isNaN(endsAt.getTime())) return { ok: false, error: 'Bitiş tarihi geçersiz.' }
  }

  try {
    await prisma.coupon.create({
      data: {
        code,
        percent,
        description: metin('description').slice(0, 200) || null,
        onlyNewMembers: formData.get('onlyNewMembers') === 'on',
        maxUses,
        perUserLimit,
        minAmount,
        endsAt,
      },
    })
  } catch (error) {
    if ((error as { code?: string })?.code === 'P2002') {
      return { ok: false, error: `"${code}" kodlu bir kupon zaten var.` }
    }
    console.error('[admin] kupon oluşturulamadı:', error)
    return { ok: false, error: 'Kupon kaydedilemedi. Tekrar deneyin.' }
  }

  revalidatePath('/admin/kuponlar')
  return { ok: true }
}

export async function kuponAktiflik(id: number, aktif: boolean): Promise<KuponSonuc> {
  if (!(await yoneticiMi())) return { ok: false, error: 'Oturumunuz sona ermiş.' }
  await prisma.coupon.update({ where: { id }, data: { isActive: aktif } })
  revalidatePath('/admin/kuponlar')
  return { ok: true }
}

/**
 * Hiç kullanılmamış kupon silinir. Kullanılmış kupon silinmez, pasife alınır:
 * siparişlerde kodu zaten kayıtlı ama raporlarda görünmeye devam etsin.
 */
export async function kuponSil(id: number): Promise<KuponSonuc | { ok: true; pasif: true }> {
  if (!(await yoneticiMi())) return { ok: false, error: 'Oturumunuz sona ermiş.' }
  const kupon = await prisma.coupon.findUnique({ where: { id }, select: { code: true } })
  if (!kupon) return { ok: false, error: 'Kupon bulunamadı.' }

  const kullanim = await prisma.order.count({ where: { couponCode: kupon.code } })
  if (kullanim > 0) {
    await prisma.coupon.update({ where: { id }, data: { isActive: false } })
    revalidatePath('/admin/kuponlar')
    return { ok: true, pasif: true }
  }

  await prisma.coupon.delete({ where: { id } })
  revalidatePath('/admin/kuponlar')
  return { ok: true }
}
