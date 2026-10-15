/**
 * Ürün değerlendirmeleri.
 *
 * Sistemde HENÜZ gerçek bir yorum tablosu (Review modeli) yok. Buna rağmen
 * ürün sayfaları seed'den gelen sabit `rating`/`reviewCount` değerlerini
 * ("4.7 · 42 değerlendirme") yayınlıyordu. Var olmayan değerlendirmeleri
 * göstermek yanıltıcı ticari uygulamadır.
 *
 * Gerçek yorum sistemi kurulana kadar yıldızlar gizleniyor. Sistem
 * kurulduğunda tek yapılacak: bu bayrağı true'ya çevirmek.
 */
export const REVIEWS_ENABLED = false

/** Yıldız/puan bloğu gösterilsin mi? */
export function shouldShowRating(reviewCount: number): boolean {
  return REVIEWS_ENABLED && reviewCount > 0
}
