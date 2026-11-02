import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { money } from '@/lib/checkout'

/**
 * İndirim kuponu doğrulama — TEK KAYNAK.
 *
 * Ödeme sayfasındaki "Uygula" düğmesi de, siparişi oluşturan sunucu kodu da
 * buradan geçer. Ekranda kabul edilen kupon siparişte de aynı kurallarla
 * kontrol edilir; istemcinin gönderdiği indirim tutarına hiç bakılmaz.
 */

/**
 * Kuponun "kullanılmış" sayıldığı siparişler.
 *
 * Kartla ödemede sipariş, ödeme formu açılırken PENDING olarak oluşuyor; müşteri
 * formu kapatırsa öyle kalıyor. Bunları saymak, ödemeden vazgeçen müşterinin
 * kuponunu yakardı. Havale siparişi ise PENDING açılır ama müşteri bir taahhütte
 * bulunmuştur; o sayılır.
 */
export const KUPON_SAYILAN_SIPARIS: Prisma.OrderWhereInput = {
  OR: [
    { status: { in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] } },
    { status: 'PENDING', paymentMethod: 'havale' },
  ],
}

export function kuponKoduTemizle(kod: unknown): string {
  return String(kod ?? '')
    .trim()
    .toLocaleUpperCase('tr-TR')
    .replace(/İ/g, 'I')
    .replace(/[^A-Z0-9_-]/g, '')
    .slice(0, 40)
}

export type KuponSonucu =
  | { ok: true; kod: string; yuzde: number; indirim: number; aciklama: string | null }
  | { ok: false; hata: string }

/**
 * Kuponu kullanıcı ve sepet tutarı için doğrular.
 * @param araToplam  Ürünlerin indirimsiz toplamı (kargo hariç)
 */
export async function kuponDogrula(kodHam: unknown, userId: string, araToplam: number): Promise<KuponSonucu> {
  const kod = kuponKoduTemizle(kodHam)
  if (!kod) return { ok: false, hata: 'Kupon kodunu yazın.' }

  const kupon = await prisma.coupon.findUnique({ where: { code: kod } })
  const simdi = new Date()

  if (!kupon || !kupon.isActive) return { ok: false, hata: 'Bu kupon kodu geçerli değil.' }
  if (kupon.startsAt && kupon.startsAt > simdi) return { ok: false, hata: 'Bu kupon henüz kullanıma açılmadı.' }
  if (kupon.endsAt && kupon.endsAt < simdi) return { ok: false, hata: 'Bu kuponun süresi dolmuş.' }

  const altSinir = kupon.minAmount ? Number(kupon.minAmount) : 0
  if (altSinir > 0 && araToplam < altSinir) {
    return {
      ok: false,
      hata: `Bu kupon ${altSinir.toLocaleString('tr-TR')} ₺ ve üzeri alışverişlerde geçerli.`,
    }
  }

  if (kupon.maxUses !== null) {
    const toplam = await prisma.order.count({ where: { couponCode: kod, ...KUPON_SAYILAN_SIPARIS } })
    if (toplam >= kupon.maxUses) return { ok: false, hata: 'Bu kuponun kullanım hakkı doldu.' }
  }

  const kullanicinin = await prisma.order.count({
    where: { userId, couponCode: kod, ...KUPON_SAYILAN_SIPARIS },
  })
  if (kullanicinin >= kupon.perUserLimit) {
    return { ok: false, hata: 'Bu kuponu daha önce kullandınız.' }
  }

  if (kupon.onlyNewMembers) {
    const oncekiSiparis = await prisma.order.count({ where: { userId, ...KUPON_SAYILAN_SIPARIS } })
    if (oncekiSiparis > 0) return { ok: false, hata: 'Bu kupon yalnızca ilk siparişte geçerli.' }
  }

  const yuzde = Math.min(Math.max(kupon.percent, 1), 90)
  return { ok: true, kod, yuzde, indirim: money((araToplam * yuzde) / 100), aciklama: kupon.description }
}

/**
 * Yeni üyelere gösterilecek hoş geldin kuponu: aktif, süresi geçmemiş,
 * "yalnızca yeni üyeler" işaretli ilk kupon. Yoksa null.
 */
export async function hosgeldinKuponu(): Promise<{ code: string; percent: number } | null> {
  const simdi = new Date()
  return prisma.coupon.findFirst({
    where: {
      isActive: true,
      onlyNewMembers: true,
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: simdi } }] },
        { OR: [{ endsAt: null }, { endsAt: { gte: simdi } }] },
      ],
    },
    orderBy: { createdAt: 'asc' },
    select: { code: true, percent: true },
  })
}
