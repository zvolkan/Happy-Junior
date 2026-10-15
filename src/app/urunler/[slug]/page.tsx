import { notFound, permanentRedirect } from 'next/navigation'
import { prisma } from '@/lib/db'

/**
 * Eski (marka öncesi) ürün detay rotası.
 *
 * Sahte `MOCK_PRODUCTS` verisinden besleniyordu. Artık ürünün gerçek markasını
 * veritabanından bulup doğru adrese yönlendiriyor — eski bağlantılar ve arama
 * motoru kayıtları bozulmuyor.
 */
export default async function EskiUrunDetayPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const product = await prisma.product.findUnique({
    where: { slug },
    select: { brand: { select: { key: true } } },
  })

  // ── Olmayan ürün 404 DÖNMELİ, listeye yönlendirilmemeli ─────────────────
  //
  // Burada eskiden ürün listesine yönlendirme vardı. Ziyaretçi açısından
  // nazik görünüyor, ama arama motoru açısından "soft 404": adres geçerli
  // sayılıyor, yönlendirmenin ucundaki sayfa HTTP 200 dönüyor ve Google
  // olmayan ürünü dizininde tutmaya devam ediyor. Kırık bağlantı tarayan
  // araçlar da hiçbir şey görmüyor. Bir kaynak yoksa doğru cevap 404.
  if (!product) notFound()

  // `permanentRedirect` 308 döndürüyor; `redirect` 307 (geçici) döndürüyordu.
  // Bu rota marka öncesi döneme ait KALICI bir taşınma: arama motorunun eski
  // adresi bırakıp yenisine geçmesi için kalıcı olduğunu söylemek gerekiyor.
  permanentRedirect(`/${product.brand.key}/urunler/${slug}`)
}
