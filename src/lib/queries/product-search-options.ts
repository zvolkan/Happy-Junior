/**
 * Ürün listeleme sıralama seçenekleri — VERİTABANINDAN BAĞIMSIZ.
 *
 * ── Neden ayrı dosya ────────────────────────────────────────────────────────
 *
 * Bu sabitler `product-search.ts` içindeydi ve `UrunlerContent.tsx` (bir
 * istemci bileşeni) oradan import ediyordu. `product-search.ts` ise
 * `@/lib/db`'yi import ediyor, yani veritabanı yığınının tamamı istemci
 * paketine sürükleniyordu.
 *
 * Vercel'de bu yalnızca gereksiz bir paket şişmesiydi. Cloudflare'e geçince
 * ölümcül hâle geldi: Prisma artık `pg` sürücüsünü kullanıyor ve `pg`,
 * `net`/`dns`/`fs`/`tls` gibi Node modüllerini çağırıyor. Bunlar tarayıcı
 * paketinde çözülemediği için derleme "Module not found: Can't resolve 'net'"
 * hatasıyla duruyordu.
 *
 * Saf değerler buraya alındı; `product-search.ts` bunları yeniden dışa
 * veriyor, dolayısıyla sunucu tarafındaki mevcut import'lar bozulmadı.
 */

export type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'newest' | 'name'

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'featured', label: 'Öne Çıkanlar' },
  { value: 'price-asc', label: 'Fiyat: Düşükten Yükseğe' },
  { value: 'price-desc', label: 'Fiyat: Yüksekten Düşüğe' },
  { value: 'newest', label: 'En Yeniler' },
  { value: 'name', label: 'İsme Göre (A-Z)' },
]

export const PAGE_SIZE = 24
