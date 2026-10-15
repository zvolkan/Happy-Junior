'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useCart } from '@/hooks/useCart'
import { useCartStore } from '@/store/cartStore'
import { formatPrice, cn } from '@/lib/utils'
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, ArrowLeft, Package } from 'lucide-react'
import { KARGO_LIMIT as CARGO_THRESHOLD, calculateTotals } from '@/lib/checkout'
import { getFreshCartData } from '@/app/actions/cart'
import BrandLogo from '@/components/ui/BrandLogo'

export default function SepetPage() {
  const { items, removeItem, updateQuantity, getTotalPrice } = useCart()
  const hasHydrated = useCartStore((s) => s.hasHydrated)
  const syncWithServer = useCartStore((s) => s.syncWithServer)
  const syncedRef = useRef(false)

  // Sepeti sunucudaki güncel fiyat/stok ile tazele.
  // Sepet localStorage'da kalıcı olduğu için fiyat değişse bile eski fiyat
  // gösteriliyordu; ödeme ekranında farklı tutar çıkıyordu.
  useEffect(() => {
    if (!hasHydrated || syncedRef.current) return

    const ids = useCartStore.getState().items.map((i) => i.product.id)
    if (ids.length === 0) return

    syncedRef.current = true

    getFreshCartData(ids)
      .then((fresh) => {
        if (fresh.length === 0) return
        const { removed, priceChanged } = syncWithServer(fresh)

        if (removed.length > 0) {
          toast.error(
            removed.length === 1
              ? `${removed[0]} artık satışta değil, sepetinizden çıkarıldı.`
              : `${removed.length} ürün artık satışta değil, sepetinizden çıkarıldı.`,
            { duration: 6000 },
          )
        }
        if (priceChanged.length > 0) {
          toast(
            priceChanged.length === 1
              ? `${priceChanged[0]} ürününün fiyatı güncellendi.`
              : `${priceChanged.length} üründe fiyat güncellendi.`,
            { icon: 'ℹ️', duration: 6000 },
          )
        }
      })
      .catch(() => {
        /* sessiz geç — sepet yine de kullanılabilir */
      })
  }, [hasHydrated, syncWithServer])

  // Tutar hesabı tek kaynaktan (src/lib/checkout.ts) — ödeme sayfası ve sipariş
  // detayı da aynı fonksiyonu kullanır, böylece rakamlar birbirini tutar.
  const { subtotal, shippingFee: cargoFee, total } = calculateTotals(getTotalPrice())

  // Ödeme tek marka üzerinden yapılıyor (iyzico işlemi tek satıcıya bağlanıyor).
  // Sepette iki markanın ürünü varsa müşteri ödeme adımında sunucudan hata
  // alıyor ama sepette hiçbir uyarı görmüyordu — çıkmaz sokak.
  const brandsInCart = Array.from(new Set(items.map((i) => i.product.brand)))
  const mixedBrands = brandsInCart.length > 1

  // Sepet, marka yollarının dışında olduğu için kök düzen burada varsayılan
  // markayı (ALB Tarım = yeşil) uyguluyor. Sepetin içindeki ürün Alb Su ise
  // renkleri o markaya çeviriyoruz; karışık sepette varsayılana bırakıyoruz.
  const sepetMarkasi =
    !mixedBrands && brandsInCart[0] === 'alb-su-aritma' ? 'alb-su-aritma' : undefined

  // localStorage okunana kadar iskelet göster — aksi hâlde sunucuda "Sepetiniz
  // boş" render edilip istemcide dolu sepete atlıyor (hydration uyumsuzluğu).
  if (!hasHydrated) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container-main">
          <div className="h-8 w-40 bg-gray-200 rounded-lg skeleton mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-32 bg-white rounded-2xl border border-gray-200 skeleton" />
              ))}
            </div>
            <div className="h-64 bg-white rounded-2xl border border-gray-200 skeleton" />
          </div>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      /*
        Boş sepet ekranı, ana sayfa hero'sunun karanlık zeminini ve cam marka
        kartlarını birebir kullanıyor.

        Önceki hâli doygun yeşil/mavi düğmelerdi ve logolar okunsun diye
        altlarına beyaz birer kutu konmuştu. Aynı çıkmaz hero'da da yaşanmıştı:
        ALB Tarım logosunun yaprağı yeşil, Alb Su damlası mavi — ikisi de kendi
        marka renginin üstünde kayboluyor. Çözüm orada da altlık eklemek değil,
        ZEMİNİ nötrleştirmek olmuştu. Burada da öyle: koyu zemin üzerinde renkli
        logolar kendiliğinden okunuyor, kutuya gerek kalmıyor ve göz almıyor.

        Marka rengi kaybolmuyor; kenarlık ve gölge fareyle üzerine gelindiğinde
        markanın rengine dönüyor.
      */
      <div className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden bg-neutral-950">
        {/* Hero ile aynı üç katmanlı zemin */}
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-950 via-neutral-900 to-stone-900" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(82,82,82,0.35),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(120,113,108,0.2),transparent_55%)]" />

        <div className="relative z-10 w-full max-w-2xl text-center py-16">
          <div className="w-20 h-20 rounded-full border border-white/10 bg-white/[0.06] flex items-center justify-center mx-auto mb-6">
            <ShoppingCart className="w-9 h-9 text-white/35" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Sepetiniz boş</h1>
          <p className="text-white/60 text-sm mb-8 max-w-sm mx-auto">
            Henüz sepetinize ürün eklemediniz. Alışverişe başlamak için ürünlerimize göz atın.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              href="/alb-tarim/urunler"
              className="arrow-slide group flex items-center gap-3.5 rounded-2xl border border-white/12 bg-white/[0.06] px-4 py-3.5 text-left backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-tarim-400/50 hover:bg-white/[0.1] hover:shadow-lg hover:shadow-tarim-500/15"
            >
              <BrandLogo brand="alb-tarim" boyut="md" className="icon-pop" />
              <span className="min-w-0 flex-1">
                <span className="block font-bold text-white leading-tight">
                  Bayırlıoğlu Tarım
                </span>
                <span className="mt-0.5 block truncate text-xs text-white/55">
                  Gübre · Zirai Danışmanlık
                </span>
              </span>
              <span className="arrow flex-shrink-0 text-white/40 transition-colors group-hover:text-white">
                →
              </span>
            </Link>

            <Link
              href="/alb-su-aritma/urunler"
              className="arrow-slide group flex items-center gap-3.5 rounded-2xl border border-white/12 bg-white/[0.06] px-4 py-3.5 text-left backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-albsu-400/50 hover:bg-white/[0.1] hover:shadow-lg hover:shadow-albsu-500/15"
            >
              <BrandLogo brand="alb-su-aritma" boyut="md" className="icon-pop" />
              <span className="min-w-0 flex-1">
                <span className="block font-bold text-white leading-tight">
                  Alb Su Teknolojileri
                </span>
                <span className="mt-0.5 block truncate text-xs text-white/55">
                  Su Arıtma · Klima · Yedek Parça
                </span>
              </span>
              <span className="arrow flex-shrink-0 text-white/40 transition-colors group-hover:text-white">
                →
              </span>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50" data-brand={sepetMarkasi}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Sepetim
            <span className="ml-2 text-base font-normal text-gray-400">
              ({items.length} ürün)
            </span>
          </h1>

          {mixedBrands && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm font-semibold text-amber-900">
                Sepetinizde iki farklı markanın ürünü var
              </p>
              <p className="text-sm text-amber-800 mt-1 leading-relaxed">
                ALB Tarım ve ALB Su Teknolojileri siparişleri ayrı ayrı
                tamamlanıyor. Ödemeye geçebilmek için bir markanın ürünlerini
                sepetten çıkarıp önce diğerini tamamlayın, sonra kalanlar için
                yeni sipariş verin.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => {
              const price = item.product.salePrice ?? item.product.price
              const lineTotal = price * item.quantity
              return (
                <div
                  key={item.product.id}
                  className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex gap-4"
                >
                  {/* Image placeholder */}
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-gray-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {item.product.images?.[0] ? (
                      <img
                        src={item.product.images[0].url}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="w-8 h-8 text-gray-300" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm truncate">
                          {item.product.name}
                        </h3>
                        {item.product.unit && (
                          <p className="text-xs text-gray-400 mt-0.5">{item.product.unit}</p>
                        )}
                        <p className="text-sm font-medium text-brand-600 mt-1">
                          {formatPrice(price)}
                          {item.product.salePrice && (
                            <span className="ml-2 text-xs text-gray-500 line-through font-normal">
                              {formatPrice(item.product.price)}
                            </span>
                          )}
                        </p>
                      </div>
                      <button
                        onClick={() => removeItem(item.product.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                        aria-label="Ürünü kaldır"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Quantity + Line total */}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-1 border border-gray-200 rounded-lg overflow-hidden">
                        <button
                          onClick={() =>
                            item.quantity > 1
                              ? updateQuantity(item.product.id, item.quantity - 1)
                              : removeItem(item.product.id)
                          }
                          className="p-2 hover:bg-gray-50 transition-colors"
                          aria-label="Azalt"
                        >
                          <Minus className="w-3.5 h-3.5 text-gray-600" />
                        </button>
                        <span className="px-3 text-sm font-semibold text-gray-900 min-w-[2rem] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            item.quantity < item.product.stock
                              ? updateQuantity(item.product.id, item.quantity + 1)
                              : undefined
                          }
                          disabled={item.quantity >= item.product.stock}
                          className="p-2 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          aria-label="Artır"
                        >
                          <Plus className="w-3.5 h-3.5 text-gray-600" />
                        </button>
                      </div>
                      <p className="text-sm font-bold text-gray-900">
                        {formatPrice(lineTotal)}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Continue shopping */}
            <div className="pt-2">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm text-brand-600 hover:text-brand-500 font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Alışverişe Devam Et
              </Link>
            </div>
          </div>

          {/* Order Summary */}
          <div className="space-y-4">
            {/* Summary */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <h3 className="text-base font-bold text-gray-900 mb-4">Sipariş Özeti</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Ara Toplam</span>
                  <span className="font-medium text-gray-900">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Kargo</span>
                  <span
                    className={cn(
                      'font-medium',
                      cargoFee === 0 ? 'text-green-600' : 'text-gray-900'
                    )}
                  >
                    {cargoFee === 0 ? 'Ücretsiz' : formatPrice(cargoFee)}
                  </span>
                </div>
                {subtotal < CARGO_THRESHOLD && (
                  <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700">
                    <span className="font-semibold">{formatPrice(CARGO_THRESHOLD - subtotal)}</span> daha ekleyin, kargo ücretsiz olsun!
                  </div>
                )}
                <div className="border-t border-gray-100 pt-3 flex justify-between items-baseline">
                  <div>
                    <span className="font-bold text-gray-900">Toplam</span>
                    <span className="block text-xs text-gray-400 font-normal">KDV dahil</span>
                  </div>
                  {/* Sabit mavi yerine marka rengi: ALB Tarım (yeşil) ürünü sepetteyken
                      de mavi çıkıyordu. */}
                  <span className="font-bold text-lg text-brand-600">{formatPrice(total)}</span>
                </div>
              </div>

              {mixedBrands ? (
                <button
                  type="button"
                  disabled
                  title="Sepetinizde iki farklı markanın ürünü var"
                  className="mt-5 w-full flex items-center justify-center gap-2 bg-gray-200 text-gray-500 font-semibold py-3 rounded-xl text-sm cursor-not-allowed"
                >
                  Siparişi Tamamla
                </button>
              ) : (
                <Link
                  href="/odeme"
                  className="mt-5 w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
                >
                  Siparişi Tamamla
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}

              <p className="text-xs text-gray-400 text-center mt-3">
                Güvenli ödeme ile korunan alışveriş
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
