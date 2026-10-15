export type ActiveBrand = 'alb-tarim' | 'alb-su-aritma' | 'grup'

/**
 * Adres yolundan aktif markayı çözer.
 *
 * Hem sunucuda (ilk boyama için kök düzen) hem tarayıcıda (gezinme sırasında
 * `BrandSync`) aynı fonksiyon kullanılıyor ki iki taraf birbirinden ayrılmasın.
 */
export function brandFromPath(pathname: string): ActiveBrand {
  if (pathname.startsWith('/alb-su-aritma')) return 'alb-su-aritma'
  // Grup ana sayfası kendi kimliğini kullanıyor. Sepet, ödeme, hesap gibi
  // ortak sayfalarda ana marka olan ALB Tarım geçerli sayılıyor.
  if (pathname === '/') return 'grup'
  return 'alb-tarim'
}
