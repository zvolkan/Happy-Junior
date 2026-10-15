/**
 * Sipariş numarası — TEK KAYNAK.
 *
 * Siparişin veritabanı kimliği bir cuid ("cmsi91lrv0001jl044fw4o5do").
 * İç kimlik olarak sorunsuz ama müşteriye gösterilecek bir numara değil:
 * telefonda okunmuyor, elle yazılamıyor, kargo evrağına veya faturaya
 * yazılınca anlamsız görünüyor.
 *
 * Bu yüzden her siparişin ayrıca yalnızca rakamlardan oluşan bir numarası var:
 *
 *     YYAAGG + 4 rastgele hane   →   2608074831
 *
 * Neden bu biçim:
 * - **Rastgele kısım şart.** Artan bir sayaç kullansaydık (1001, 1002, …)
 *   herkes iki sipariş verip aradaki farka bakarak günlük satış adedini
 *   öğrenebilirdi. 4 haneli rastgele son bunu engelliyor.
 * - **Tarih öneki işe yarıyor.** Yönetici numaraya bakınca siparişin hangi
 *   gün verildiğini görüyor; kargo ve muhasebe eşleştirmesi kolaylaşıyor.
 * - **10 hane.** Telefonda okunabilecek kadar kısa, çakışmayacak kadar geniş.
 *
 * Çakışma iki katmanda engelleniyor: burada üretilen numara veritabanındaki
 * benzersizlik kısıtına takılırsa çağıran taraf yeni numarayla tekrar deniyor
 * (bkz. `isUniqueConstraintError`).
 */

// 4 haneden 6'ya çıkarıldı. 4 hane, bir gün için yalnızca 10.000 olasılık
// demekti: (a) sipariş takibi ekranında bir günün tamamı taranarak başkasının
// siparişi bulunabiliyordu, (b) çok sipariş alınan bir günde numaralar tükenip
// checkout "Siparişiniz oluşturulamadı" hatası vermeye başlıyordu.
// 6 hane → günde 1.000.000 olasılık. Numara 12 hane olur, telefonda hâlâ
// okunabilir.
const RANDOM_DIGITS = 6

/** Kriptografik rastgelelik — Math.random() tahmin edilebilir olabilir */
function randomSuffix(): string {
  const max = 10 ** RANDOM_DIGITS
  let value: number

  // Node 18+ ve Edge runtime'da mevcut
  const cryptoObj = globalThis.crypto
  if (cryptoObj?.getRandomValues) {
    const buffer = new Uint32Array(1)
    cryptoObj.getRandomValues(buffer)
    value = buffer[0] % max
  } else {
    value = Math.floor(Math.random() * max)
  }

  return String(value).padStart(RANDOM_DIGITS, '0')
}

/**
 * Yeni sipariş numarası üretir.
 *
 * Tarih öneki Türkiye saatinden alınır — sunucu UTC'de çalıştığı için
 * gece yarısına yakın verilen siparişlerin numarası bir önceki güne
 * düşmesin diye.
 */
export function generateOrderNumber(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Istanbul',
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00'
  const prefix = `${get('year')}${get('month')}${get('day')}`

  return `${prefix}${randomSuffix()}`
}

/**
 * Prisma'nın "benzersiz alan çakıştı" hatası mı?
 *
 * Numara üretilirken önce sorgulayıp sonra yazmak yarış durumunu çözmez:
 * iki sipariş aynı anda aynı numarayı kapabilir. Doğru yol, veritabanının
 * benzersizlik kısıtına güvenip çakışmada yeniden denemek.
 */
export function isUniqueConstraintError(error: unknown): boolean {
  const code = (error as { code?: unknown })?.code
  return code === 'P2002'
}

/**
 * Müşteriye gösterilecek numara.
 *
 * Bu alan eklenmeden önce oluşturulmuş siparişlerde `orderNumber` boş
 * olabilir; o durumda eski davranışa (cuid'in son 10 hanesi) düşülüyor ki
 * hiçbir ekranda boşluk görünmesin.
 */
export function formatOrderNo(order: {
  orderNumber?: string | null
  id: string
}): string {
  return order.orderNumber ?? order.id.slice(-10).toUpperCase()
}

/**
 * Müşterinin sipariş takibi kutusuna yazdığını temizler.
 *
 * "#2608074831", "2608 074 831", " 2608074831 " gibi girdilerin hepsi aynı
 * numaraya çözülmeli — aksi hâlde müşteri e-postadan kopyaladığı numarayla
 * siparişini bulamaz.
 */
export function normalizeOrderNoInput(raw: string): {
  digits: string | null
  raw: string
} {
  const trimmed = (raw ?? '').trim().replace(/^#/, '')
  const digits = trimmed.replace(/\D/g, '')
  return { digits: digits.length >= 6 ? digits : null, raw: trimmed }
}
