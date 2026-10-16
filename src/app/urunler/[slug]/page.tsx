import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import Breadcrumb from '@/components/ui/Breadcrumb'
import ProductImage from '@/components/product/ProductImage'
import ProductGallery from '@/components/product/ProductGallery'
import Icon from '@/components/ui/Icon'
import { BRAND, SITE_CONFIG } from '@/lib/constants'
import { getProductBySlug, getRelatedProducts } from '@/lib/queries/products'
import { shouldShowRating } from '@/lib/reviews'
import QuantityAddToCart from '@/components/product/QuantityAddToCart'
import FavoriteButton from '@/components/product/FavoriteButton'
import Reveal from '@/components/ui/Reveal'
import RevealGroup from '@/components/ui/RevealGroup'
import { KARGO_LIMIT, KARGO_UCRETI, TESLIMAT_SURESI } from '@/lib/checkout'
import { jsonLdScript } from '@/lib/sanitize'

interface Props {
  params: Promise<{ slug: string }>
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug, BRAND.key)

  if (!product) {
    return { title: 'Ürün bulunamadı', robots: { index: false, follow: false } }
  }

  const cfg = BRAND
  const price = product.salePrice ?? product.price
  const description =
    product.shortDescription?.trim() ||
    `${product.name} — ${cfg.name} güvencesiyle. ${price.toLocaleString('tr-TR')} ₺`
  const image = product.images.find((i) => i.isPrimary)?.url ?? product.images[0]?.url

  return {
    title: product.name,
    description: description.slice(0, 160),
    alternates: { canonical: `/urunler/${slug}` },
    openGraph: {
      type: 'website',
      title: product.name,
      description: description.slice(0, 200),
      images: image ? [{ url: image, alt: product.name }] : undefined,
    },
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params
  const brandKey = BRAND.key

  const product = await getProductBySlug(slug, brandKey)
  if (!product) notFound()

  const cfg = BRAND
  // Marka tonları <html data-brand="..."> üzerinden geliyor
  const accentText = 'text-brand-600'
  const badgeBg = 'bg-brand-100 text-brand-700'

  const displayPrice = product.salePrice ?? product.price
  const discount = product.salePrice
    ? Math.round((1 - product.salePrice / product.price) * 100)
    : null
  // Kapak önce gelsin; sorgu zaten isPrimary'e göre sıralıyor ama veri elle
  // düzenlenmişse (SQL, seed) sıra bozulabiliyor.
  const galleryImages = [...(product.images ?? [])].sort(
    (a, b) => Number(b.isPrimary) - Number(a.isPrimary),
  )

  const related = await getRelatedProducts(product.category.id, brandKey, slug)

  // Google'da fiyat/stok zengin sonucu için yapılandırılmış veri
  const primaryImage = product.images.find((i) => i.isPrimary)?.url ?? product.images[0]?.url
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.shortDescription || product.description || product.name,
    sku: product.sku || undefined,
    brand: { '@type': 'Brand', name: product.productBrand || cfg.name },
    category: product.category.name,
    ...(primaryImage ? { image: [primaryImage] } : {}),
    offers: {
      '@type': 'Offer',
      // `url` eksikti. Google, tekliften ürün sayfasına dönecek adresi
      // bulamayınca fiyat zengin sonucunu düşürüyor — fiyat ve stok verisi
      // doğru olduğu hâlde arama sonucunda görünmüyordu.
      url: new URL(`/urunler/${slug}`, SITE_CONFIG.url).toString(),
      priceCurrency: 'TRY',
      price: (product.salePrice ?? product.price).toFixed(2),
      availability:
        product.stock > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: BRAND.name },
    },
  }

  // ── Breadcrumb yapısal verisi ──────────────────────────────────────────
  //
  // Kırıntı yolu artık `<Breadcrumb>` bileşeninden: görünür yol ve yapısal
  // veri aynı diziden üretiliyor, biri değişip diğeri unutulamıyor.
  const kirintiAdimlari = [
    { label: 'Ana Sayfa', href: '/' },
    { label: 'Ürünler', href: `/urunler` },
    {
      label: product.category.name,
      href: `/urunler?kategori=${product.category.slug}`,
    },
    { label: product.name },
  ]

  return (
    <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonLdScript(productJsonLd) }}
    />
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100 py-4">
        <div className="container-main">
          <Breadcrumb adimlar={kirintiAdimlari} className="[&_li:last-child>span]:line-clamp-1" />
        </div>
      </div>

      <div className="container-main py-10">
        {/* ── Ürün Ana Bölüm ── */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            {/* Görseller */}
            <ProductGallery
              images={galleryImages}
              productName={product.name}
              badge={
                <>
                  {discount && (
                    <div className="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full z-10">
                      -%{discount}
                    </div>
                  )}
                  {product.isFeatured && !discount && (
                    <div className={`absolute top-4 right-4 text-xs font-bold px-3 py-1 rounded-full z-10 ${badgeBg}`}>
                      Öne Çıkan
                    </div>
                  )}
                </>
              }
            />

            {/* Bilgi */}
            <div className="p-4 sm:p-8 flex flex-col">
              <p className={`text-sm font-semibold uppercase tracking-wide ${accentText} mb-2`}>
                {product.category.name}
              </p>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight mb-1">
                {product.name}
              </h1>

              {/* Değerlendirme — gerçek yorum sistemi kurulana kadar gizli */}
              {shouldShowRating(product.reviewCount) && (
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Icon
                        key={i}
                        name="yildiz"
                        className={`w-4 h-4 ${i < Math.round(product.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-500">
                    {product.rating} ({product.reviewCount} değerlendirme)
                  </span>
                </div>
              )}

              {/* Fiyat */}
              <div className="flex items-end gap-3 mb-6 pb-6 border-b border-gray-100">
                <p className={`text-4xl font-black ${accentText}`}>
                  {displayPrice.toLocaleString('tr-TR')} ₺
                </p>
                {product.salePrice && (
                  <p className="text-gray-500 text-lg line-through mb-1">
                    {product.price.toLocaleString('tr-TR')} ₺
                  </p>
                )}
              </div>

              {/* Kısa Açıklama */}
              <p className="text-gray-600 leading-relaxed mb-6">
                {product.shortDescription}
              </p>

              {/* Teknik Özellikler (özet) */}
              {product.specs && product.specs.length > 0 && (
                <div className="mb-6 space-y-2">
                  {product.specs.slice(0, 4).map((s) => (
                    <div key={s.name} className="flex justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
                      <span className="text-gray-500">{s.name}</span>
                      <span className="font-semibold text-gray-900">
                        {s.value}{s.unit ? ` ${s.unit}` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* SKU & Stok */}
              <div className="flex items-center justify-between mb-6 text-sm">
                <span className="text-gray-400">SKU: {product.sku}</span>
                <span className={`flex items-center gap-1.5 font-medium ${product.stock > 10 ? 'text-green-600' : product.stock > 0 ? 'text-amber-600' : 'text-red-600'}`}>
                  <span className={`w-2 h-2 rounded-full ${product.stock > 10 ? 'bg-green-500' : product.stock > 0 ? 'bg-amber-500' : 'bg-red-500'}`} />
                  {product.stock > 10
                    ? `Stokta (${product.stock} ${product.unit})`
                    : product.stock > 0
                      ? `Son ${product.stock} ${product.unit}!`
                      : 'Stok tükendi'}
                </span>
              </div>

              {/* CTA Butonları */}
              {/* Kargo ve teslimat — müşteri sepete eklemeden önce bilmeli */}
              <div className="mb-5 text-sm text-gray-600 bg-gray-50 rounded-xl px-4 py-3 space-y-1">
                <p>
                  <Icon name="kargo" className="inline-block w-4 h-4 mr-1.5 align-text-bottom text-gray-400" />
                  Tahmini teslimat:{' '}
                  <span className="font-semibold text-gray-900">{TESLIMAT_SURESI}</span>
                </p>
                {/* Ayraçlı tek satır dar ekranda sarınca "·" yeni satırın
                    başında öksüz kalıyordu; iki ayrı cümleye bölündü. */}
                <p>
                  <Icon name="paket" className="inline-block w-4 h-4 mr-1.5 align-text-bottom text-gray-400" />
                  {KARGO_LIMIT} TL ve üzeri siparişlerde{' '}
                  <span className="font-semibold text-green-600">kargo ücretsiz</span>
                </p>
                <p className="text-gray-400">
                  Bu tutarın altında {KARGO_UCRETI.toLocaleString('tr-TR', {
                    minimumFractionDigits: 2,
                  })} TL kargo ücreti eklenir.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-auto">
                <QuantityAddToCart
                  product={product}
                  className="btn-sticker flex-1 py-3.5 px-6 text-lg"
                />
                <a
                  href={`https://wa.me/${cfg.whatsapp.phone}?text=${encodeURIComponent(`${cfg.whatsapp.message} Ürün: ${product.name}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-sticker btn-wa py-3.5 px-5"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  WhatsApp
                </a>
                <FavoriteButton productId={product.id} size="lg" className="self-center sm:self-auto" />
              </div>

              {/* Güvenceler */}
              <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-gray-100">
                {[
                  { icon: 'kargo' as const, text: '2-5 İş Günü Teslimat' },
                  { icon: 'yenile' as const, text: '14 Gün İade' },
                  { icon: 'kilit' as const, text: 'Güvenli Ödeme' },
                ].map((item) => (
                  <div key={item.text} className="text-center text-xs text-gray-500">
                    <Icon name={item.icon} className="w-5 h-5 mx-auto mb-1 text-gray-400" />
                    {item.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Detaylı Açıklama ── */}
        <Reveal>
        <div className="mt-8 bg-white rounded-2xl border border-gray-100 p-4 sm:p-8">
          <h2 className="text-lg font-black text-gray-900 mb-4">Ürün Detayları</h2>
          <p className="text-gray-600 leading-relaxed mb-6">{product.description}</p>

          {product.specs && product.specs.length > 0 && (
            <>
              <h3 className="text-base font-bold text-gray-900 mb-3">Teknik Özellikler</h3>
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                {product.specs.map((s, i) => (
                  <div
                    key={s.name}
                    className={`flex justify-between px-4 py-3 text-sm ${i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}
                  >
                    <span className="text-gray-500">{s.name}</span>
                    <span className="font-semibold text-gray-900">
                      {s.value}{s.unit ? ` ${s.unit}` : ''}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {product.tags && product.tags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
        </Reveal>

        {/* ── İlgili Ürünler ── */}
        {related.length > 0 && (
          <div className="mt-10">
            <Reveal>
              <h2 className="text-xl font-black text-gray-900 mb-6">Benzer Ürünler</h2>
            </Reveal>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <RevealGroup itemClassName="h-full">
              {related.map((p) => (
                <Link
                  key={p.slug}
                  href={`/urunler/${p.slug}`}
                  className="group block h-full bg-white rounded-2xl border border-gray-100 overflow-hidden hover-lift"
                >
                  <div className="img-zoom aspect-square bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-4xl relative overflow-hidden">
                    <ProductImage
                      src={p.images?.[0]?.url ?? ''}
                      alt={p.images?.[0]?.alt || p.name}
                      fill
                      className="img-zoom-target object-contain p-3"
                      sizes="200px"
                    />
                  </div>
                  <div className="p-3">
                    <p className="font-semibold text-gray-900 text-xs line-clamp-2 mb-1">{p.name}</p>
                    <p className={`font-black text-sm ${accentText}`}>
                      {(p.salePrice ?? p.price).toLocaleString('tr-TR')} ₺
                    </p>
                  </div>
                </Link>
              ))}
              </RevealGroup>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  )
}
