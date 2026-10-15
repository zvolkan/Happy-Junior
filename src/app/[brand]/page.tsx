import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import Icon from '@/components/ui/Icon'
import { categoryIcon } from '@/lib/category-icon'
import { BRANDS, SITE_CONFIG } from '@/lib/constants'
import { TESLIMAT_SURESI } from '@/lib/checkout'
import { getPublishedPosts } from '@/lib/blog'
import BrandArtwork from '@/components/ui/BrandArtwork'
import { getFeaturedProducts } from '@/lib/queries/products'
import { getCategoriesByBrand } from '@/lib/queries/categories'
import type { BrandKey } from '@/lib/types'
import BrandHeroSection from '@/components/home/BrandHeroSection'
import Reveal from '@/components/ui/Reveal'
import RevealGroup from '@/components/ui/RevealGroup'

export const dynamic = 'force-dynamic'

const VALID_BRANDS: BrandKey[] = ['alb-tarim', 'alb-su-aritma']

interface Props {
  params: Promise<{ brand: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { brand } = await params
  if (!VALID_BRANDS.includes(brand as BrandKey)) return {}
  const cfg = BRANDS[brand as BrandKey]
  return {
    title: cfg.name,
    description: cfg.description,
  }
}

export async function generateStaticParams() {
  return VALID_BRANDS.map((brand) => ({ brand }))
}

export default async function BrandHomePage({ params }: Props) {
  const { brand } = await params
  if (!VALID_BRANDS.includes(brand as BrandKey)) notFound()

  const brandKey = brand as BrandKey
  const cfg = BRANDS[brandKey]

  // Renk artık brand-* sınıflarından geliyor; bu bayrak yalnızca markaya özel
  // bölümleri ve metinleri seçmek için duruyor
  const isAlbSu = brandKey === 'alb-su-aritma'
  const [brandProducts, brandCategories] = await Promise.all([
    getFeaturedProducts(brandKey, 6),
    getCategoriesByBrand(brandKey),
  ])
  // Yayındaki son üç yazı; hiç yoksa blog bölümü render edilmiyor.
  const brandPosts = await getPublishedPosts(brandKey, 3)

  return (
    <>
      {/* ── HERO (video arka plan) ── */}
      <BrandHeroSection brandKey={brandKey} />

      {/* ── GÜVEN ROZETLERİ (Alb Su) ── */}
      {isAlbSu && (
        <section className="py-7 bg-white border-b border-gray-100">
          <div className="container-main">
            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
              <RevealGroup itemClassName="h-full" variant="scale">
              {[
                // Üçü de doğrulanabilir bilgi. Önceki hâlinde "NSF onaylı",
                // "sertifikalı teknisyenler" ve "aynı gün kurulum" yazıyordu;
                // üçü de belgelenmemiş iddialardı.
                {
                  icon: 'saat' as const,
                  title: "1977'den Beri",
                  desc: 'Anamur\'da kurulan bir ticaret geleneğinin devamıyız',
                },
                {
                  icon: 'odul' as const,
                  title: 'A.O. Smith Yetkili Bayii',
                  desc: 'Evsel ve endüstriyel su arıtma sistemlerinde yetkili satış noktası',
                },
                {
                  icon: 'kargo' as const,
                  title: 'Türkiye Geneli Teslimat',
                  desc: 'Anamur ve çevresinde yerinde montaj, diğer illere kargoyla',
                },
              ].map((item) => (
                <div key={item.title} className="flex items-center gap-4 px-6 py-4 h-full">
                  <Icon name={item.icon} className="w-8 h-8 shrink-0 text-brand-600" />
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
      )}

      {/* ── KATEGORİLER ── */}
      <section className="py-16 bg-white">
        <div className="container-main">
          <Reveal>
            <div className="flex items-center justify-between mb-10">
              <div>
                <p className="font-bold uppercase text-sm tracking-widest mb-1 text-brand-400">Kategori</p>
                <h2 className="text-2xl sm:text-3xl font-black text-gray-900 rule-under">Ürün Kategorileri</h2>
              </div>
              <Link href={`/${brandKey}/urunler`} className="hidden sm:block text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors arrow-slide">
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
                  href={`/${brandKey}/urunler?kullanim=${cat.slug}`}
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

      {/* ── KULLANIM ALANLARI (Alb Su) ── */}
      {isAlbSu && (
        <section className="py-16 bg-brand-900">
          <div className="container-main">
            <Reveal>
              <div className="text-center mb-10">
                <p className="font-bold uppercase text-sm tracking-widest mb-2 text-brand-400">
                  Kullanım Alanları
                </p>
                <h2 className="text-2xl sm:text-3xl font-black text-white">
                  Her Yerde Temiz Su
                </h2>
              </div>
            </Reveal>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <RevealGroup itemClassName="h-full">
              {[
                {
                  icon: 'ev' as const,
                  title: 'Evinizde',
                  desc: 'Tezgah altı RO ve alkali su cihazlarıyla aile sağlığınızı koruyun. Çay, kahve ve yemeklerinizde farkı hissedeceksiniz.',
                  href: `/${brandKey}/urunler?kullanim=ev`,
                  cta: 'Ev Tipi Ürünler',
                },
                {
                  icon: 'bardak' as const,
                  title: 'Cafe & Restoranda',
                  desc: 'Yoğun su tüketiminde kalite + tasarruf. Cafe, restoran, pastane ve çay ocakları için yüksek kapasiteli çözümler.',
                  href: `/${brandKey}/urunler?kullanim=is-yeri`,
                  cta: 'İş Yeri Çözümleri',
                },
                {
                  icon: 'bina' as const,
                  title: 'Ofisinizde',
                  desc: 'Arıtmalı su sebilleriyle çalışanlarınıza sağlıklı su sunun. Pratik, ekonomik ve her bütçeye uygun çözümler.',
                  href: `/${brandKey}/urunler?kullanim=is-yeri&kategori=su-sebili`,
                  cta: 'Arıtmalı Su Sebilleri',
                },
              ].map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className="group bg-white/5 border border-white/10 rounded-2xl p-7 hover:bg-white/12 hover:border-white/20 hover-lift flex flex-col h-full"
                >
                  <Icon name={item.icon} className="w-9 h-9 mb-4 text-brand-600" />
                  <h3 className="text-xl font-black text-white mb-2">{item.title}</h3>
                  <p className="text-white/60 text-sm leading-relaxed mb-5 flex-1">{item.desc}</p>
                  <span className="text-brand-400 text-sm font-semibold group-hover:text-brand-accent transition-colors arrow-slide">
                    {item.cta} <span className="arrow">→</span>
                  </span>
                </Link>
              ))}
              </RevealGroup>
            </div>
          </div>
        </section>
      )}

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
                <Link href={`/${brandKey}/urunler`} className="hidden sm:block text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors arrow-slide">
                  Tümünü Gör <span className="arrow">→</span>
                </Link>
              </div>
            </Reveal>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <RevealGroup itemClassName="h-full">
              {brandProducts.map((product) => {
                const displayPrice = product.salePrice ?? product.price
                return (
                  <Link
                    key={product.slug}
                    href={`/${brandKey}/urunler/${product.slug}`}
                    className="group block h-full bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-gray-200 hover-lift"
                  >
                    <div className="aspect-square bg-gray-100 relative overflow-hidden">
                      {product.images[0] ? (
                        <Image
                          src={product.images[0].url}
                          alt={product.images[0].alt || product.name}
                          fill
                          sizes="(max-width: 768px) 50vw, 17vw"
                          className="object-contain p-2 transition-transform duration-500 group-hover:scale-110"
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

      {/* ── NEDEN BİZ ── */}
      <section className="py-16 bg-white">
        <div className="container-main">
          <Reveal>
            <div className="text-center mb-12">
              <p className="font-bold uppercase text-sm tracking-widest mb-2 text-brand-400">Avantajlar</p>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 rule-under rule-center">Neden {cfg.name}?</h2>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <RevealGroup itemClassName="h-full">
            {(isAlbSu
              ? [
                  { icon: 'odul' as const, title: 'Yetkili Bayilik', desc: 'A.O. Smith ürünlerinde yetkili satış ve servis noktasıyız.' },
                  { icon: 'servis' as const, title: 'Kendi Ekibimiz', desc: 'Kurulumu da bakımı da kendi ekibimiz yapıyor.' },
                  { icon: 'telefon' as const, title: 'Teknik Destek', desc: `${SITE_CONFIG.workingHours} saatlerinde bize ulaşabilirsiniz.` },
                  { icon: 'garanti' as const, title: 'Garanti', desc: 'Ürün garantisi markaya ve modele göre 2 ile 5 yıl arasında değişir.' },
                ]
              : [
                  { icon: 'filiz' as const, title: 'Geniş Gübre Seçeneği', desc: 'Tarla, sera ve bahçe için taban, damla ve yaprak gübreleri bir arada.' },
                  { icon: 'traktor' as const, title: 'Saha Danışmanlık', desc: 'Uzman agronomlarımız tarlada yanınızda.' },
                  { icon: 'kargo' as const, title: 'Hızlı Teslimat', desc: `81 ile ${TESLIMAT_SURESI} içinde teslimat.` },
                  { icon: 'fiyat' as const, title: 'Uygun Fiyat', desc: 'Çiftçi dostu fiyatlarla kaliteli ürünler.' },
                ]
            ).map((item) => (
              <div key={item.title} className="group h-full text-center p-6 rounded-2xl border border-gray-100 hover:border-gray-200 hover-lift">
                <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center mb-4 mx-auto icon-pop group-hover:shadow-md">
                  <Icon name={item.icon} className="w-7 h-7 text-brand-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
            </RevealGroup>
          </div>
        </div>
      </section>

      {/* ── ENDÜSTRİYEL ÇÖZÜMLER (sadece Alb Su) ── */}
      {isAlbSu && (
        <section className="py-16 bg-gray-50">
          <div className="container-main">
            <Reveal>
              <div className="text-center mb-12">
                <p className="font-bold uppercase text-sm tracking-widest mb-2 text-brand-600">
                  Endüstriyel & Ticari
                </p>
                <h2 className="text-2xl sm:text-3xl font-black text-gray-900">
                  Endüstriyel Su Arıtma Çözümleri
                </h2>
                <p className="text-gray-500 mt-3 max-w-2xl mx-auto">
                  Fabrika, hastane, otel, okul ve ticari tesisler için yüksek kapasiteli,
                  kesintisiz ve enerji verimli su arıtma sistemleri tasarlıyoruz.
                </p>
              </div>
            </Reveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              <RevealGroup itemClassName="h-full">
              {[
                {
                  icon: 'fabrika' as const,
                  title: 'Endüstriyel RO Sistemleri',
                  desc: "500 lt/saat'ten 50.000 lt/saate kadar yüksek kapasiteli ters osmoz sistemleri. Üretim hattı, kazan suyu, proses suyu uygulamaları.",
                  tags: ['Fabrika', 'Üretim Tesisi'],
                },
                {
                  icon: 'kalite' as const,
                  title: 'Su Yumuşatma Sistemleri',
                  desc: 'İyon değiştirici reçine teknolojisi ile sertliği sıfıra indirin. Kazan ömrünü uzatın, kireç sorunundan kalıcı olarak kurtulun.',
                  tags: ['Otel', 'Sanayi'],
                },
                {
                  icon: 'analiz' as const,
                  title: 'Alkali İyonize Su Sistemleri',
                  desc: 'pH 8-10 aralığında alkali su üretimi. Bireysel ve ticari kullanım için farklı kapasitelerde cihaz seçenekleri.',
                  tags: ['Sağlık Klinik', 'Cafe & Restoran'],
                },
                {
                  icon: 'analiz' as const,
                  title: 'Demineralizasyon Üniteleri',
                  desc: 'Tıbbi, laboratuvar ve elektronik üretim için 0 TDS saf su üretimi. Kapasiteye göre proje bazlı tasarlanır.',
                  tags: ['Hastane', 'Laboratuvar'],
                },
                {
                  icon: 'gunes' as const,
                  title: 'UV Sterilizasyon Sistemleri',
                  desc: 'Kimyasal kullanmadan bakteriyolojik arıtma. İçme suyu, yüzme havuzu ve gıda üretim uygulamaları için.',
                  tags: ['Gıda', 'Havuz'],
                },
                {
                  icon: 'servis' as const,
                  title: 'Periyodik Bakım Kontratı',
                  desc: 'Yıllık veya 6 aylık bakım paketleriyle sisteminiz sürekli verimli çalışır. Filtre değişimi, dezenfeksiyon ve teknik kontrol.',
                  tags: ['Tüm Sektörler'],
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="group h-full bg-white rounded-2xl border border-brand-100 p-6 hover:border-brand-200 hover-lift"
                >
                  <div className="w-12 h-12 rounded-xl bg-brand-600 text-white flex items-center justify-center mb-4 icon-pop">
                    <Icon name={item.icon} className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">{item.desc}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {item.tags.map((tag) => (
                      <span key={tag} className="bg-brand-50 text-brand-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              </RevealGroup>
            </div>
            <div className="text-center">
              <Link
                href="/alb-su-aritma/iletisim"
                className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white px-7 py-3.5 rounded-xl font-semibold transition-colors shadow-lg btn-press arrow-slide"
              >
                Endüstriyel Teklif Al <span className="arrow">→</span>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── ÜCRETSİZ SU ANALİZİ (sadece Alb Su) ── */}
      {isAlbSu && (
        <section className="py-12 bg-white">
          <div className="container-main">
            <Reveal variant="scale">
            <div className="brand-surface gradient-pan rounded-3xl p-8 sm:p-12 text-center text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
              <div className="relative">
                <Icon name="analiz" className="w-12 h-12 mx-auto mb-4 float-soft" />
                <h3 className="text-2xl sm:text-3xl font-black mb-3">Ücretsiz Su Analizi</h3>
                <p className="text-white/80 text-base mb-6 max-w-xl mx-auto">
                  Evinizin veya işyerinizin suyunu ücretsiz analiz ediyoruz.
                  Sertlik, klor, bakteri ve mineral değerlerini ölçüp size özel sistem öneriyoruz.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/alb-su-aritma/iletisim"
                    className="bg-white text-brand-700 px-7 py-3 rounded-xl font-semibold hover:bg-brand-50 transition-colors btn-press"
                  >
                    Analiz Randevusu Al
                  </Link>
                  <Link
                    href="/alb-su-aritma/referanslar"
                    className="border-2 border-white text-white px-7 py-3 rounded-xl font-semibold hover:bg-white/10 transition-colors btn-press"
                  >
                    Hizmet Alanlarımızı Gör
                  </Link>
                </div>
              </div>
            </div>
            </Reveal>
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
                <Link href={`/${brandKey}/blog`} className="hidden sm:block text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors arrow-slide">
                  Tüm Yazılar <span className="arrow">→</span>
                </Link>
              </div>
            </Reveal>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <RevealGroup itemClassName="h-full">
              {brandPosts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/${brandKey}/blog/${post.slug}`}
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
              {isAlbSu ? 'Suyunuz için doğru sistemi birlikte seçelim' : 'Veriminizi Artırmaya Hazır mısınız?'}
            </h2>
            <p className="text-white/70 mb-8 max-w-lg mx-auto">
              {isAlbSu
                ? 'Ücretsiz su analizi, keşif ve montaj için hemen iletişime geçin.'
                : 'Ücretsiz tarım danışmanlığı için hemen iletişime geçin.'}
            </p>
          </Reveal>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href={`/${brandKey}/iletisim`}
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
