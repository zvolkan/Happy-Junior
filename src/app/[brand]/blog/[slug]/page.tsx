import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import Breadcrumb from '@/components/ui/Breadcrumb'
import { getSiteUrl } from '@/lib/site-url'
import { BRANDS } from '@/lib/constants'
import { getPublishedPost, getPublishedPosts, readingMinutes } from '@/lib/blog'
import BrandArtwork from '@/components/ui/BrandArtwork'
import Icon from '@/components/ui/Icon'
import type { BrandKey } from '@/lib/types'
import { sanitizeBlogHtml, jsonLdScript } from '@/lib/sanitize'

interface Props {
  params: Promise<{ brand: string; slug: string }>
}

// Yazılar veritabanından geliyor ve yönetim panelinden anında
// değiştirilebiliyor; bu yüzden statik üretilmiyor.
export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, brand } = await params
  const post = await getPublishedPost(brand, slug)
  if (!post) return { title: 'Yazı bulunamadı', robots: { index: false, follow: false } }
  return {
    title: post.title,
    description: post.excerpt ?? undefined,
    alternates: { canonical: `/${brand}/blog/${slug}` },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.excerpt ?? undefined,
      images: post.coverImage ? [{ url: post.coverImage, alt: post.title }] : undefined,
    },
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { brand, slug } = await params
  const brandKey = brand as BrandKey
  const post = await getPublishedPost(brandKey, slug)
  if (!post) notFound()

  const cfg = BRANDS[brandKey] ?? BRANDS['alb-tarim']
  const okumaDakika = readingMinutes(post.content)

  const related = (await getPublishedPosts(brandKey, 4))
    .filter((p) => p.slug !== slug)
    .slice(0, 3)

  // ── BlogPosting + BreadcrumbList yapısal verisi ────────────────────────
  //
  // Blog yazılarında hiç yapılandırılmış veri yoktu. `BlogPosting` arama
  // sonucunda yazar, tarih ve başlığın doğru okunmasını sağlıyor; breadcrumb
  // da ham URL yerine adres yolunu gösteriyor.
  //
  // `dateModified` bilerek `updatedAt`ten geliyor: Google güncellenmiş
  // içeriği ayırt edebilsin diye. Yoksa yayın tarihi kullanılıyor.
  const siteUrl = getSiteUrl()
  const yaziAdresi = `${siteUrl}/${brandKey}/blog/${slug}`
  const yayinTarihi = (post.publishedAt ?? new Date()).toISOString()

  const blogJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt || post.title,
    ...(post.coverImage ? { image: [post.coverImage] } : {}),
    datePublished: yayinTarihi,
    dateModified: (post.updatedAt ?? post.publishedAt ?? new Date()).toISOString(),
    author: { '@type': 'Person', name: post.author || 'Bayırlıoğlu' },
    publisher: { '@type': 'Organization', name: 'Bayırlıoğlu' },
    mainEntityOfPage: { '@type': 'WebPage', '@id': yaziAdresi },
    ...(post.category ? { articleSection: post.category } : {}),
  }

  // Görünür yol ve yapısal veri tek diziden — bkz. components/ui/Breadcrumb
  const kirintiAdimlari = [
    { label: 'Ana Sayfa', href: '/' },
    { label: cfg.name, href: `/${brandKey}` },
    { label: 'Blog', href: `/${brandKey}/blog` },
    { label: post.title },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(blogJsonLd) }}
      />
      {/* Hero */}
      <div className="brand-surface py-16">
        <div className="container-main max-w-3xl">
          <Breadcrumb
            koyu
            adimlar={kirintiAdimlari}
            className="mb-6 [&_li:last-child>span]:line-clamp-1"
          />
          {post.category && (
            <div className="flex flex-wrap gap-2 mb-5">
              <span className="inline-block text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full bg-brand-100 text-brand-700">
                {post.category}
              </span>
            </div>
          )}
          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-5">
            {post.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-white/50">
            <span className="inline-flex items-center gap-1.5"><Icon name="yazar" className="w-4 h-4" /> {post.author}</span>
            <span>·</span>
            <span>
              {new Date(post.publishedAt ?? new Date()).toLocaleDateString('tr-TR', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            </span>
            {okumaDakika > 0 && (
              <>
                <span>·</span>
                <span className="inline-flex items-center gap-1.5"><Icon name="saat" className="w-4 h-4" /> {okumaDakika} dk okuma</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* İçerik */}
      <div className="container-main py-12 max-w-3xl">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 sm:p-8 md:p-12">
          <div className="aspect-[16/9] rounded-2xl overflow-hidden mb-10 relative bg-gray-100">
            {post.coverImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.coverImage}
                alt={post.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <BrandArtwork variant="blog" className="absolute inset-0 w-full h-full" />
            )}
          </div>

          {/* Özet */}
          <p className="text-xl text-gray-600 leading-relaxed font-medium border-l-4 border-gray-200 pl-5 mb-8 italic">
            {post.excerpt}
          </p>

          {/* İçerik */}
          <div className="prose prose-gray max-w-none text-gray-700 leading-relaxed">
            {/* İkinci temizlik katmanı: bu düzeltmeden ÖNCE kaydedilmiş
                yazılar veritabanında filtrelenmemiş HTML taşıyor olabilir. */}
            <div dangerouslySetInnerHTML={{ __html: sanitizeBlogHtml(post.content) }} />
          </div>

          {/* Kategori */}
          {post.category && (
            <div className="mt-8 pt-6 border-t border-gray-100">
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-3">
                Kategori
              </p>
              <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                #{post.category}
              </span>
            </div>
          )}

          {/* Alt navigasyon */}
          <div className="mt-8 pt-6 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
            <Link
              href={`/${brandKey}/blog`}
              className="text-sm font-semibold text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors"
            >
              ← Tüm Yazılar
            </Link>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                  `${post.title} — ${getSiteUrl()}/${brandKey}/blog/${post.slug}`,
                )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm font-semibold bg-[#25D366] text-white px-4 py-2 rounded-xl hover:bg-[#1aad50] transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Paylaş
            </a>
          </div>
        </div>

        {/* İlgili Yazılar */}
        {related.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-black text-gray-900 mb-6">Diğer Yazılar</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {related.map((p) => (
                <Link
                  key={p.slug}
                  href={`/${brandKey}/blog/${p.slug}`}
                  className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover-lift"
                >
                  <div className="aspect-[16/9] relative overflow-hidden bg-gray-100">
                    {p.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.coverImage}
                        alt={p.title}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <BrandArtwork variant="blog" className="absolute inset-0 w-full h-full" />
                    )}
                  </div>
                  <div className="p-4">
                    <p className="font-bold text-gray-900 text-sm line-clamp-2 group-hover:text-gray-700 transition-colors">
                      {p.title}
                    </p>
                    {p.category && <p className="text-gray-400 text-xs mt-2">{p.category}</p>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
