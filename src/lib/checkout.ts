/**
 * Sipariş tutarı hesabı — TEK KAYNAK.
 *
 * Kargo limiti/ücreti eskiden dört ayrı dosyada kopyalanmıştı; biri
 * değiştiğinde diğerleri unutuluyordu. Sepet, ödeme ve sipariş detayı artık
 * hepsi buradan okur.
 */

export const KARGO_LIMIT = 500
export const KARGO_UCRETI = 29.9

/**
 * Teslimat süresi — TEK KAYNAK.
 *
 * Site genelinde üç farklı süre yazıyordu: mesafeli satış sözleşmesi "3-7 iş
 * günü", kullanım koşulları "2-5 iş günü", marka sayfaları "2-3 iş günü".
 * Bağlayıcı olan sözleşme metnidir; pazarlama sayfalarının daha kısa süre vaat
 * etmesi tüketici şikâyetine açık bir durumdu. Hepsi buradan okuyor.
 */
export const TESLIMAT_SURESI = '2-5 iş günü'


/** Fiyatları 2 haneye yuvarla — kayan nokta artıklarını temizler */
export function money(value: number): number {
  // NaN/Infinity burada 0'a çekiliyor. Eskiden `money(NaN)` NaN döndürüyor,
  // NaN de her karşılaştırmada false verdiği için `if (total <= 0)` gibi
  // korumaların hepsinden sessizce geçiyordu — yani geçersiz bir tutar
  // "geçerli" muamelesi görüyordu. Sıfıra çekmek, o korumaların devreye
  // girmesini sağlıyor.
  if (!Number.isFinite(value)) return 0
  return Math.round((value + Number.EPSILON) * 100) / 100
}

/**
 * Müşterinin ödeyeceği birim fiyat — TEK KAYNAK.
 *
 * ── Neden bir fonksiyon ─────────────────────────────────────────────────────
 *
 * Aynı karar dört yerde, üç farklı kuralla veriliyordu:
 *   · sepet deposu (`cartStore`)   → `salePrice > 0 ? salePrice : price`
 *   · sepet deposunun eşitlemesi   → `salePrice ?? price`
 *   · ödeme ekranı (`CheckoutClient`) → `salePrice ?? price`
 *   · sunucu (`odeme/initialize`)  → `salePrice > 0 ? salePrice : price`
 *
 * Fark sadece üslupta değil: `??` sıfırı GEÇERLİ bir fiyat sayar. Veritabanına
 * `sale_price = 0` düşen bir ürün — ki yönetim panelinde alanı boş bırakmak
 * yerine sıfır yazmak kolay bir hata — ödeme ekranında 0 TL görünüyor, ama
 * sunucu `> 0` kuralıyla tam fiyatı tahsil ediyordu. Müşteri ekranda gördüğü
 * tutardan farklı bir tutar ödüyordu.
 *
 * Kural: indirimli fiyat ancak POZİTİF ve geçerli bir sayıysa kullanılır.
 */
export function etkinBirimFiyat(
  price: number | string,
  salePrice?: number | string | null,
): number {
  const liste = Number(price)
  const indirim = Number(salePrice)
  if (Number.isFinite(indirim) && indirim > 0) return indirim
  return Number.isFinite(liste) ? liste : 0
}

export function calculateShipping(subtotal: number): number {
  return subtotal >= KARGO_LIMIT ? 0 : KARGO_UCRETI
}

/**
 * KDV DAHİL bir tutardan KDV'yi ayrıştırır.
 * Fiyatlar KDV dahil girildiği için matrah = tutar / (1 + oran/100).
 *
 * Örn. 120 TL, %20 → matrah 100, KDV 20.
 */
export function extractVat(grossAmount: number, vatRatePercent: number) {
  const rate = Number.isFinite(vatRatePercent) ? Math.max(0, vatRatePercent) : 0
  const net = money(grossAmount / (1 + rate / 100))
  return { net, vat: money(grossAmount - net), rate }
}


export interface OrderTotals {
  /** Ürünlerin toplamı (indirimden önce) */
  subtotal: number
  /** Kupon indirimi (yoksa 0) */
  discount: number
  shippingFee: number
  total: number
}

/**
 * Sipariş toplamı.
 *
 * NOT: Gösterilen fiyatlar KDV DAHİLDİR; ayrı KDV satırı toplama eklenmez.
 *
 * Kupon indirimi yalnızca ürün ara toplamına uygulanır, kargoya değil.
 * Ücretsiz kargo sınırı İNDİRİMLİ tutara bakar: 520 TL'lik sepete %10 kupon
 * girilince müşteri 468 TL öder ve kargo ücreti eklenir. Sepet ve ödeme
 * ekranı bunu aynı fonksiyonla hesapladığı için müşteri farkı önceden görür.
 */
export function calculateTotals(subtotal: number, discountPercent = 0): OrderTotals {
  const sub = money(subtotal)
  const oran = Number.isFinite(discountPercent) ? Math.min(Math.max(discountPercent, 0), 90) : 0
  const discount = money((sub * oran) / 100)
  const indirimli = money(sub - discount)
  const shippingFee = calculateShipping(indirimli)
  return {
    subtotal: sub,
    discount,
    shippingFee,
    total: money(indirimli + shippingFee),
  }
}
