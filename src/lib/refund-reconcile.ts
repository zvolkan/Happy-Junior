import { prisma } from '@/lib/db'
import { retrievePayment } from '@/lib/iyzico'
import { appendOrderNote } from '@/lib/order-note'
import { IADE_BELIRSIZ_DURUMU } from '@/lib/refund'

/**
 * İADE MUTABAKATI — askıda kalmış iadelerin takibi.
 *
 * ── Hangi boşluğu kapatıyor ─────────────────────────────────────────────────
 *
 * `processRefund` bir iade isteğinin sonucunu öğrenemediğinde siparişi
 * `refund_pending` durumuna alıyor ve yöneticiye bırakıyor. Bırakmak tek başına
 * yetmez: kimse panele bakmazsa sipariş orada sonsuza kadar kalır ve müşterinin
 * parası askıda durur. Bu görev iki şey yapıyor.
 *
 * ── 1) Takılı kalmış kilitleri çözüyor ──────────────────────────────────────
 *
 * `refunding`, bir hâl değil bir KİLİT: iki sekmeden aynı anda basılan iade
 * düğmesinin çift iade yapmasını engelliyor. Ama Worker'ın işlem ortasında
 * ölmesi (zaman aşımı, dağıtım, bellek) kilidi açık bırakıyor. O siparişe
 * bir daha hiçbir şey yapılamıyor: müşteri "iade sürüyor" görüyor, yönetici
 * de aynı duvara çarpıyor. Makul bir süre geçmiş kilitler belirsiz durumuna
 * alınıyor — orası çıkışı olan bir hâl.
 *
 * ── 2) iyzico'ya "gerçekte ne oldu" diye soruyor ─────────────────────────────
 *
 * Yanıtı YORUMLAMAYA ÇALIŞMIYORUZ. iyzico'nun iade alanlarının adları ve
 * anlamları sürümler arasında değişiyor; yanlış okuyup siparişi kendiliğinden
 * "iade edildi" saymak, çift iadeden daha kötü sonuçlar doğurabilir. Bunun
 * yerine yanıtın özeti siparişin yönetici notuna yazılıyor: panelde bakan kişi
 * tahmin etmek zorunda kalmıyor, elinde iyzico'nun kendi cevabı oluyor.
 *
 * Kararı insan veriyor, kanıtı bu görev topluyor.
 */

/** Bu süreden uzun süredir `refunding` duran sipariş takılı kalmış sayılır. */
const KILIT_ASIM_DK = 20

/** Belirsiz siparişe bu sıklıktan daha sık sorgu yapılmıyor — not kirlenmesin. */
const SORGU_ARALIGI_SA = 6

/** Tek çalıştırmada en fazla kaç siparişe sorgu yapılır. */
const SORGU_SINIRI = 20

export interface MutabakatSonucu {
  /** Takılı kilitten belirsiz durumuna alınan sipariş sayısı */
  kilitCozuldu: number
  /** iyzico'ya sorulup notu güncellenen sipariş sayısı */
  sorgulanan: number
  /** Şu anda incelenmeyi bekleyen toplam sipariş sayısı */
  bekleyen: number
}

export async function reconcilePendingRefunds(): Promise<MutabakatSonucu> {
  const simdi = Date.now()

  // ── 1) Takılı `refunding` kilitleri ───────────────────────────────────────
  const takiliSinir = new Date(simdi - KILIT_ASIM_DK * 60_000)

  const takilanlar = await prisma.order.findMany({
    where: {
      paymentStatus: 'refunding',
      updatedAt: { lt: takiliSinir },
    },
    select: { id: true, orderNumber: true },
    take: 100,
  })

  let kilitCozuldu = 0
  for (const siparis of takilanlar) {
    // Koşullu güncelleme: bu satır okunduktan sonra iade gerçekten
    // tamamlanmış olabilir. `paymentStatus` koşulu onu eziyor olmamızı
    // engelliyor.
    const { count } = await prisma.order.updateMany({
      where: { id: siparis.id, paymentStatus: 'refunding' },
      data: { paymentStatus: IADE_BELIRSIZ_DURUMU },
    })
    if (count === 0) continue

    await appendOrderNote(
      siparis.id,
      `MUTABAKAT: iade işlemi ${KILIT_ASIM_DK} dakikadan uzun süredir yarıda kalmış ` +
        `(${new Date().toISOString()}). Kilit açıldı, sipariş incelemeye alındı. ` +
        'iyzico panelinden ödemeyi kontrol edin.',
    )
    kilitCozuldu += 1
    console.warn('[mutabakat] takılı iade kilidi çözüldü:', siparis.orderNumber ?? siparis.id)
  }

  // ── 2) Belirsiz siparişleri iyzico'ya sor ─────────────────────────────────
  const sorguSiniri = new Date(simdi - SORGU_ARALIGI_SA * 3_600_000)

  const belirsizler = await prisma.order.findMany({
    where: {
      paymentStatus: IADE_BELIRSIZ_DURUMU,
      paymentId: { not: null },
      updatedAt: { lt: sorguSiniri },
    },
    select: { id: true, orderNumber: true, paymentId: true },
    orderBy: { updatedAt: 'asc' },
    take: SORGU_SINIRI,
  })

  let sorgulanan = 0
  for (const siparis of belirsizler) {
    if (!siparis.paymentId) continue

    let ozet: string
    try {
      const detay = await retrievePayment({
        paymentId: siparis.paymentId,
        conversationId: siparis.orderNumber ?? siparis.id,
      })
      ozet = JSON.stringify({
        status: detay?.status,
        errorCode: detay?.errorCode,
        errorMessage: detay?.errorMessage,
        paymentStatus: detay?.paymentStatus,
        price: detay?.price,
        paidPrice: detay?.paidPrice,
      })
    } catch (error) {
      ozet = `sorgu başarısız: ${String(error).slice(0, 160)}`
    }

    await appendOrderNote(
      siparis.id,
      `MUTABAKAT ${new Date().toISOString()} — iyzico ödeme sorgusu: ${ozet}`,
    )

    // `appendOrderNote` `updatedAt`'i tazeliyor; bir sonraki çalıştırma bu
    // siparişi `SORGU_ARALIGI_SA` saat geçmeden tekrar sormayacak.
    sorgulanan += 1
  }

  const bekleyen = await prisma.order.count({
    where: { paymentStatus: { in: ['refunding', IADE_BELIRSIZ_DURUMU] } },
  })

  return { kilitCozuldu, sorgulanan, bekleyen }
}
