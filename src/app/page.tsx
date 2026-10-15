import type { Metadata } from 'next'
import Image from 'next/image'
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

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: { absolute: `${BRAND.name} — Bebek ve Çocuk Giyim, Anamur` },
  description: BRAND.description,
}

/** Ana sayfadaki güven şeridi — müşterinin sipariş öncesi en çok sorduğu dört konu. */
const GUVEN: { icon: IconName; title: string; desc: string }[] = [
  { icon: 'kilit', title: 'Havale/EFT ile ödeme', desc: 'IBAN bilgisi sipariş sonrası gösterilir' },
  { icon: 'kargo', title: 'Kargo ile teslimat', desc: 'Anamur içi mağazadan teslim seçeneği' },
  { icon: 'yenile', title: '14 gün değişim/iade', desc: 'Beden uymazsa kolayca değiştirin' },
  { icon: 'telefon', title: 'WhatsApp destek', desc: 'Beden ve ürün sorularınız için' },
]

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
      <BrandHeroSection brandKey={brandKey} />

      {/* ── GÜVEN ŞERİDİ ── */}
      <section className="py-6 bg-white border-b border-gray-100">
        <div className="container-main">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-4">
            <RevealGroup itemClassName="h-full" variant="scale">
              {GUVEN.map((item) => (
                <div key={item.title} className="flex items-center gap-3 px-3 sm:px-5 h-full">
                  <Icon name={item.icon} className="w-7 h-7 shrink-0 text-brand-600" />
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{item.title}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </RevealGroup>
          </div>
        </div>
      </section>

      {/* ── KATEGORİLER ── */}
      <section className="py-16 bg-white">
        <div className="container-main">
          <Reveal>
            <div className="flex items-center justify-between mb-10">
              <div>
                <p className="font-bold uppercase text-sm tracking-widest mb-1 text-brand-400">Kategori</p>
                <h2 className="text-2xl sm:text-3xl font-black text-gray-900 rule-under">Ürün Kategorileri</h2>
              </div>
              <Link href={`/urunler`} className="hidden sm:block text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors arrow-slide">
                Tüm Ürünler <span className="arrow">→</span>
              </Link>
            </div>
          </Reveal>

          {/* Sadece kök (root) kategoriler gösterilir — alt kategoriler değil */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <RevealGroup itemClassName="h-full">
            {brandCategories
              .filter((c) => !c.parentId)
              .slice(0, 8)
              .map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/urunler?kullanim=${cat.slug}`}
                  className="group relative block h-full border border-brand-100 brand-surface-soft rounded-2xl p-5 hover-lift overflow-hidden"
                >
                  {/* Kayan alt aksan çizgisi */}
                  <span className="absolute bottom-0 inset-x-0 h-0.5 bg-brand-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-b-2xl" />

                  <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center mb-3 icon-pop group-hover:shadow-lg">
                    <Icon name={categoryIcon(cat.slug, cat.icon)} className="w-5 h-5" />
                  </div>
                  <p className="font-bold text-gray-900 text-sm leading-tight">{cat.name}</p>
                  {cat.productCount !== undefined && cat.productCount > 0 && (
                    <p className="text-gray-400 text-xs mt-1">{cat.productCount} ürün</p>
                  )}
                </Link>
              ))}
            </RevealGroup>
          </div>
        </div>
      </section>

      {/* ── ÖNE ÇIKAN ÜRÜNLER ── */}
      {brandProducts.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="container-main">
            <Reveal>
              <div className="flex items-center justify-between mb-10">
                <div>
                  <p className="font-bold uppercase text-sm tracking-widest mb-1 text-brand-400">Seçili Ürünler</p>
                  <h2 className="text-2xl sm:text-3xl font-black text-gray-900 rule-under">Öne Çıkan Ürünler</h2>
                </div>
                <Link href={`/urunler`} className="hidden sm:block text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors arrow-slide">
                  Tümünü Gör <span className="arrow">→</span>
                </Link>
              </div>
            </Reveal>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <RevealGroup itemClassName="h-full">
              {brandProducts.map((product) => {
                const displayPrice = product.salePrice ?? product.price
                return (
                  <Link
                    key={product.slug}
                    href={`/urunler/${product.slug}`}
                    className="group block h-full bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-gray-200 hover-lift"
                  >
                    <div className="aspect-[4/5] bg-gray-100 relative overflow-hidden">
                      {product.images[0] ? (
                        <Image
                          src={product.images[0].url}
                          alt={product.images[0].alt || product.name}
                          fill
                          sizes="(max-width: 768px) 50vw, 25vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                          <Icon name="paket" className="w-10 h-10 text-gray-300" />
                        </div>
                      )}

                      {product.salePrice && (
                        <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full z-10">
                          İndirim
                        </span>
                      )}

                      {/* Quick-view overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-end justify-center pb-3">
                        <span className="bg-white/95 text-gray-900 text-[10px] font-bold px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-lg tracking-widest">
                          İNCELE →
                        </span>
                      </div>
                    </div>

                    <div className="p-3">
                      <p className="text-gray-900 font-semibold text-xs leading-tight line-clamp-2 mb-1">{product.name}</p>
                      <p className="text-gray-400 text-[10px] mb-2">{product.category.name}</p>
                      <div className="flex items-center justify-between">
                        <p className="font-black text-sm text-brand-600">
                          {displayPrice.toLocaleString('tr-TR')} ₺
                        </p>
                        {product.salePrice && (
                          <p className="text-gray-500 text-[10px] line-through">
                            {product.price.toLocaleString('tr-TR')} ₺
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
              </RevealGroup>
            </div>
          </div>
        </section>
      )}

      {/* ── BLOG ── */}
      {brandPosts.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="container-main">
            <Reveal>
              <div className="flex items-center justify-between mb-10">
                <div>
                  <p className="font-bold uppercase text-sm tracking-widest mb-1 text-brand-400">Blog</p>
                  <h2 className="text-2xl sm:text-3xl font-black text-gray-900 rule-under">Son Yazılar</h2>
                </div>
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
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-4">
              Beden mi soracaksınız?
            </h2>
            <p className="text-white/70 mb-8 max-w-lg mx-auto">
              Çocuğunuzun yaşını ve boyunu yazın, size uygun bedeni birlikte seçelim.
            </p>
          </Reveal>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href={`/iletisim`}
              className="bg-brand-600 hover:bg-brand-500 text-white px-8 py-3.5 rounded-xl font-semibold transition-colors shadow-lg btn-press"
            >
              İletişime Geç
            </Link>
            <a
              href={`https://wa.me/${cfg.whatsapp.phone}?text=${encodeURIComponent(cfg.whatsapp.message)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#25D366] hover:bg-[#1aad50] text-white px-8 py-3.5 rounded-xl font-semibold transition-colors shadow-lg flex items-center gap-2 btn-press"
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
