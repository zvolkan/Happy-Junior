import { MetadataRoute } from 'next'
import { getDbAsync } from '@/lib/db'

// DİKKAT: sitemap DERLEME sırasında da çalışıyor ve o anda istek bağlamı yok.
// `prisma` proxy'si `getCloudflareContext()`in senkron sürümüne dayandığı için
// burada çalışmaz; asenkron sürüm kullanılıyor.
import { SITE_CONFIG } from '@/lib/constants'

/**
 * Site haritası.
 *
 * Eskiden `MOCK_PRODUCTS` ve `MOCK_BLOG_POSTS` sabitlerinden üretiliyordu; yani
 * Google'a veritabanında var olmayan ürün adresleri bildiriliyordu. Artık
 * gerçek verilerden üretiliyor.
 */

/**
 * ── Site haritası İSTEK ANINDA üretiliyor ───────────────────────────────────
 *
 * Burada `revalidate = 3600` yazıyordu. Bu, dosyayı "derlemede üret, sonra
 * saatte bir tazele" moduna sokuyor — yani site haritası DERLEME sırasında bir
 * kez oluşturuluyordu. Derleme ortamında ise veritabanı yok: Hyperdrive bağlantısı
 * yalnızca çalışan Worker içinde var, derleme makinesinde değil.
 *
 * Bu, hatayı yutmayı bırakıp fırlatmaya başlayınca ortaya çıktı: eskiden derleme
 * sırasındaki veritabanı hatası sessizce geçiliyor ve ÜRÜNSÜZ bir site haritası
 * derlemenin içine gömülüyordu. Yani Google'a haftalarca boş harita sunulmasının
 * asıl sebebi de buymuş — çalışma anındaki bir kesinti değil, her derlemede
 * tekrarlanan bir durum.
 *
 * `force-dynamic` ile harita her istekte, Worker içinde, veritabanı erişilebilirken
 * üretiliyor. Maliyeti önemsiz: site haritasını yalnızca arama motorları çekiyor,
 * günde birkaç kez.
 */
export const dynamic = 'force-dynamic'

const BRAND_KEYS = ['alb-tarim', 'alb-su-aritma'] as const

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE_CONFIG.url.replace(/\/+$/, '')
  const now = new Date()

  // ── Genel (marka dışı) sayfalar ──────────────────────────────────────────
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/hakkimizda`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/hizmetler`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/iletisim`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/bayi-basvuru`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/siparis-takibi`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${base}/gizlilik`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${base}/kvkk`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    {
      url: `${base}/mesafeli-satis-sozlesmesi`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: `${base}/kullanim-kosullari`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: `${base}/iade-politikasi`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
  ]

  // ── Marka sayfaları ──────────────────────────────────────────────────────
  const brandRoutes: MetadataRoute.Sitemap = BRAND_KEYS.flatMap((key) => [
    { url: `${base}/${key}`, lastModified: now, changeFrequency: 'daily' as const, priority: 0.9 },
    {
      url: `${base}/${key}/urunler`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${base}/${key}/hakkimizda`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${base}/${key}/hizmetler`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: `${base}/${key}/referanslar`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${base}/${key}/iletisim`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${base}/${key}/blog`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    },
  ])

  // ── Yayındaki blog yazıları ──────────────────────────────────────────────
  let blogRoutes: MetadataRoute.Sitemap = []

  try {
    const posts = await (await getDbAsync()).blogPost.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true, brand: { select: { key: true } } },
    })

    blogRoutes = posts.map((post: { slug: string; updatedAt: Date; brand: { key: string } }) => ({
      url: `${base}/${post.brand.key}/blog/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    }))
  } catch (error) {
    console.error('[sitemap] blog yazıları okunamadı:', error)
    throw new Error('Site haritası üretilemedi: blog yazıları okunamadı.', { cause: error })
  }

  // ── Gerçek ürünler ───────────────────────────────────────────────────────
  let productRoutes: MetadataRoute.Sitemap = []

  try {
    const products = await (await getDbAsync()).product.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true, brand: { select: { key: true } } },
      orderBy: { updatedAt: 'desc' },
      take: 5000,
    })

    productRoutes = products.map(
      (product: { slug: string; updatedAt: Date; brand: { key: string } }) => ({
        url: `${base}/${product.brand.key}/urunler/${product.slug}`,
        lastModified: product.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }),
    )
  } catch (error) {
    // ── Hata artık YUTULMUYOR ────────────────────────────────────────────
    //
    // Burada eskiden "veritabanına ulaşılamazsa site haritası yine de
    // üretilsin" yazıyordu ve hata sessizce geçiliyordu. İyi niyetli ama
    // tersine çalışan bir karar: veritabanı kesintisinde site çökmüyor,
    // Google'a "hiç ürünüm yok" diyen geçerli bir site haritası sunuyordu.
    // Arama motoru bunu kabul edip ürünleri dizinden düşürüyordu — üstelik
    // HTTP 200 döndüğü için hiçbir izleme sistemi alarm vermiyordu.
    //
    // Eksik bir site haritası yayınlamak, hiç yayınlamamaktan daha zararlı.
    // Hata fırlatıldığında Next.js 500 döndürüyor; Google bunu geçici sorun
    // sayıp eldeki haritayı koruyor.
    console.error('[sitemap] ürünler alınamadı:', error)
    throw new Error('Site haritası üretilemedi: ürünler okunamadı.', { cause: error })
  }

  return [...staticRoutes, ...brandRoutes, ...productRoutes, ...blogRoutes]
}
