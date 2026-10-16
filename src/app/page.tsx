import type { Metadata } from 'next'
import Link from 'next/link'
import Icon, { type IconName } from '@/components/ui/Icon'
import { categoryIcon } from '@/lib/category-icon'
import { BRAND } from '@/lib/constants'
import { getPublishedPosts } from '@/lib/blog'
import BrandArtwork from '@/components/ui/BrandArtwork'
import { getFeaturedProducts } from '@/lib/queries/products'
import { getCategoriesByBrand } from '@/lib/queries/categories'
import BrandHeroSection from '@/components/home/BrandHeroSection'
import Reveal from '@/components/ui/Reveal'
import RevealGroup from '@/components/ui/RevealGroup'
import UrunKarti from '@/components/product/UrunKarti'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: { absolute: `${BRAND.name} — Bebek ve Çocuk Giyim, Anamur` },
  description: BRAND.description,
}

/** Ana sayfadaki güven şeridi — müşterinin sipariş öncesi en çok sorduğu dört konu. */
const GUVEN: { icon: IconName; title: string; desc: string }[] = [
  { icon: 'kilit', title: 'Havale/EFT ile güvenli ödeme', desc: 'IBAN bilgisi sipariş sonrası gösterilir' },
  { icon: 'kargo', title: 'Kargo ya da mağazadan teslim', desc: 'Anamur içi mağazadan teslim seçeneği' },
  { icon: 'yenile', title: 'Beden uymazsa 14 gün içinde değişim', desc: 'Beden uymazsa kolayca değiştirin' },
  { icon: 'telefon', title: 'Beden sorularına WhatsApp’tan cevap', desc: 'Beden ve ürün sorularınız için' },
]

/** Kategori kutularının zemin renkleri, sırayla */
const KUTU_RENKLERI = ['bg-brand-200', 'bg-sun', 'bg-aqua/60', 'bg-[#B9F0DD]', 'bg-[#D9CCFF]', 'bg-brand-100']

export default async function AnaSayfa() {
  const brandKey = BRAND.key
  const cfg = BRAND

  const [brandProducts, brandCategories, brandPosts] = await Promise.all([
    getFeaturedProducts(brandKey, 8),
    getCategoriesByBrand(brandKey),
    getPublishedPosts(brandKey, 3),
  ])

  return (
    <>
      <BrandHeroSection brandKey={brandKey} urunler={brandProducts} />

      {/* ── KAYAN ŞERİT: sipariş öncesi en çok sorulan dört konu ── */}
      <section aria-label="Alışveriş bilgileri" className="hj-marquee border-y-2 border-ink bg-sun py-3.5">
        <div className="hj-marquee-track">
          {[0, 1].map((tekrar) => (
            <ul key={tekrar} aria-hidden={tekrar === 1} className="flex shrink-0 items-center">
              {GUVEN.map((item) => (
                <li key={item.title} className="flex items-center gap-3 px-8 font-display text-lg font-bold text-ink whitespace-nowrap">
                  <Icon name={item.icon} className="h-6 w-6" />
                  {item.title}
                  <span className="ml-8 text-brand-600" aria-hidden="true">✦</span>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </section>

      {/* ── KATEGORİLER ── */}
      <section className="py-16 sm:py-20">
        <div className="container-main">
          <div className="mb-8 flex items-end justify-between gap-4">
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-ink">Ne arıyorsunuz?</h2>
            <Link href="/urunler" className="hidden sm:inline font-bold text-brand-700 underline decoration-2 underline-offset-4 hover:text-brand-600">
              Tüm ürünler
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {brandCategories
              .filter((c) => !c.parentId)
              .slice(0, 6)
              .map((cat, i) => (
                <Link
                  key={cat.slug}
                  href={`/urunler?kullanim=${cat.slug}`}
                  className={`hj-wiggle-parent hj-card group flex flex-col items-start justify-between gap-6 rounded-[26px] border-2 border-ink p-5 min-h-[150px] ${KUTU_RENKLERI[i % KUTU_RENKLERI.length]}`}
                >
                  <span className="hj-wiggle inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white border-2 border-ink">
                    <Icon name={categoryIcon(cat.slug, cat.icon)} className="h-6 w-6 text-ink" />
                  </span>
                  <span className="font-display text-lg font-bold leading-tight text-ink">{cat.name}</span>
                </Link>
              ))}
          </div>
        </div>
      </section>

      {/* ── ÖNE ÇIKAN ÜRÜNLER ── */}
      {brandProducts.length > 0 && (
        <section className="pb-20">
          <div className="container-main">
            <div className="mb-8 flex items-end justify-between gap-4">
              <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-ink">Bu sezon öne çıkanlar</h2>
              <Link href="/urunler" className="hidden sm:inline font-bold text-brand-700 underline decoration-2 underline-offset-4 hover:text-brand-600">
                Hepsini gör
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
              {brandProducts.map((product, i) => (
                <UrunKarti key={product.slug} urun={product} sira={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── BLOG ── */}
      {brandPosts.length > 0 && (
        <section className="py-16 bg-white border-t-2 border-ink/5">
          <div className="container-main">
            <Reveal>
              <div className="flex items-center justify-between mb-10">
                <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-ink">Anne-baba köşesi</h2>
                <Link href={`/blog`} className="hidden sm:block text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors arrow-slide">
                  Tüm Yazılar <span className="arrow">→</span>
                </Link>
              </div>
            </Reveal>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <RevealGroup itemClassName="h-full">
              {brandPosts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group block h-full bg-white rounded-2xl border border-gray-100 overflow-hidden hover-lift"
                >
                  <div className="img-zoom aspect-[16/9] relative overflow-hidden bg-gray-100">
                    {post.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="img-zoom-target absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <BrandArtwork variant="blog" className="absolute inset-0 w-full h-full" />
                    )}
                  </div>
                  <div className="p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide mb-2 text-brand-600">
                      {post.category ?? ''}
                    </p>
                    <h3 className="font-bold text-gray-900 leading-snug mb-2 group-hover:text-gray-700 transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-gray-500 text-sm line-clamp-2">{post.excerpt}</p>
                    <p className="text-gray-400 text-xs mt-3">
                      {new Date(post.publishedAt ?? new Date()).toLocaleDateString('tr-TR', {
                        day: 'numeric', month: 'long', year: 'numeric',
                      })}
                    </p>
                  </div>
                </Link>
              ))}
              </RevealGroup>
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ── */}
      <section className="py-20 brand-surface">
        <div className="container-main text-center">
          <Reveal>
            <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-white mb-4">
              Beden mi soracaksınız?
            </h2>
            <p className="text-white/70 mb-8 max-w-lg mx-auto">
              Çocuğunuzun yaşını ve boyunu yazın, size uygun bedeni birlikte seçelim.
            </p>
          </Reveal>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href={`/iletisim`}
              className="btn-sticker btn-acik on-dark px-8 py-3.5"
            >
              İletişime geç
            </Link>
            <a
              href={`https://wa.me/${cfg.whatsapp.phone}?text=${encodeURIComponent(cfg.whatsapp.message)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-sticker btn-wa px-8 py-3.5"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
