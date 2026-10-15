'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useCartStore } from '@/store/cartStore'
import { getFreshCartData } from '@/app/actions/cart'
import toast from 'react-hot-toast'
import Icon from '@/components/ui/Icon'
import { KARGO_LIMIT, TESLIMAT_SURESI, calculateTotals, etkinBirimFiyat } from '@/lib/checkout'
import { ON_BILGILENDIRME, MESAFELI_SATIS, CAYMA_HAKKI } from '@/lib/legal'

type SavedAddress = {
  id: string
  label: string
  fullName: string
  phone: string
  line1: string
  line2: string | null
  district: string
  city: string
  postalCode: string | null
  isDefault: boolean
}

type Props = {
  addresses: SavedAddress[]
}

function formatPrice(n: number) {
  return n.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
}

// ─────────────────────────────────────────────────────────────────────────────

export default function CheckoutClient({ addresses }: Props) {
  const items = useCartStore((s: { items: import('@/lib/types').CartItem[] }) => s.items)
  const cartHydrated = useCartStore((s: { hasHydrated: boolean }) => s.hasHydrated)
  const sepetiEsitle = useCartStore.getState().syncWithServer
  const esitlendiRef = useRef(false)

  // ── Ödeme ekranı da sepeti sunucuyla tazeliyor ───────────────────────────
  //
  // `/sepet` açılışta bunu yapıyordu, `/odeme` yapmıyordu: doğrudan
  // localStorage'daki kopyadan okuyordu. Sepet kalıcı olduğu için müşteri
  // ürünü haftalar önce eklemiş olabilir; o arada fiyat değişmiş, ürün
  // yayından kalkmış ya da stok tükenmiş olabilir. Müşteri ödeme ekranında
  // eski tutarı görüp devam ediyor, sunucu doğru tutarı hesaplıyor veya
  // 409 döndürüyordu — ekranla tahsilat ayrışıyordu.
  //
  // Sepet sayfasından geçilse bile ödeme ekranı ayrıca kontrol ediyor: iki
  // ekran arasında geçen süre de yeterince uzun olabilir.
  useEffect(() => {
    if (!cartHydrated || esitlendiRef.current) return

    const ids = useCartStore.getState().items.map((i) => i.product.id)
    if (ids.length === 0) return

    esitlendiRef.current = true

    getFreshCartData(ids)
      .then((fresh) => {
        if (fresh.length === 0) return
        const { removed, priceChanged } = sepetiEsitle(fresh)

        if (removed.length > 0) {
          toast.error(
            removed.length === 1
              ? `${removed[0]} artık satışta değil, sepetinizden çıkarıldı.`
              : `${removed.length} ürün artık satışta değil, sepetinizden çıkarıldı.`,
            { duration: 7000 },
          )
        }
        if (priceChanged.length > 0) {
          toast(
            priceChanged.length === 1
              ? `${priceChanged[0]} ürününün fiyatı güncellendi. Yeni tutarı onaylayın.`
              : `${priceChanged.length} üründe fiyat güncellendi. Yeni tutarı onaylayın.`,
            { icon: 'ℹ️', duration: 7000 },
          )
        }
      })
      .catch(() => {
        /* sessiz geç — sunucu zaten ödeme anında doğruluyor */
      })
  }, [cartHydrated, sepetiEsitle])
  // Sepet, ödeme başarılı sayfasında temizlenir (ClearCart bileşeni)

  const subtotalRaw = items.reduce(
    (sum: number, item: import('@/lib/types').CartItem) =>
      // `??` yerine ortak kural: sıfır indirimli fiyat geçerli sayılmamalı.
      // Aksi hâlde ekranda 0 TL görünüp sunucu tam fiyatı tahsil ediyordu.
      sum + etkinBirimFiyat(item.product.price, item.product.salePrice) * item.quantity,
    0
  )
  // Sepet, ödeme ve sunucu aynı hesabı kullanır
  const { subtotal, shippingFee: cargoFee, total } = calculateTotals(subtotalRaw)

  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? ''
  )
  const [contractApproved, setContractApproved] = useState(false)

  // Fatura bilgisi — e-arşiv fatura için zorunlu
  const [invoiceType, setInvoiceType] = useState<'bireysel' | 'kurumsal'>('bireysel')
  const [invoiceTitle, setInvoiceTitle] = useState('')
  const [invoiceTaxId, setInvoiceTaxId] = useState('')
  const [invoiceTaxOffice, setInvoiceTaxOffice] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)


  // Sepet localStorage'dan okunana kadar bekle — aksi hâlde sunucu "Sepetiniz
  // boş" render edip istemcide dolu sepete atlıyor (hydration uyumsuzluğu).
  if (!cartHydrated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-10 h-10 border-[3px] border-gray-200 border-t-gray-800 rounded-full animate-spin" />
      </div>
    )
  }

  // Empty cart guard
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <Icon name="sepet" className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Sepetiniz boş</h1>
          <p className="text-gray-500 text-sm mb-6">Ödeme yapabilmek için sepetinize ürün ekleyin.</p>
          <Link href="/" className="inline-block px-6 py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors">
            Alışverişe Devam Et
          </Link>
        </div>
      </div>
    )
  }

  const brandKey = items[0]?.product.brand ?? 'alb-tarim'

  const handleSubmit = async () => {
    setError(null)

    if (!selectedAddressId) {
      setError('Lütfen bir teslimat adresi seçin.')
      return
    }
    if (invoiceType === 'kurumsal') {
      if (invoiceTitle.trim().length < 2) {
        setError('Fatura için ticaret unvanı girin.')
        return
      }
      if (invoiceTaxId.replace(/\D/g, '').length !== 10) {
        setError('Vergi kimlik numarası 10 haneli olmalıdır.')
        return
      }
      if (invoiceTaxOffice.trim().length < 2) {
        setError('Vergi dairesi bilgisi girin.')
        return
      }
    } else if (invoiceTaxId && invoiceTaxId.replace(/\D/g, '').length !== 11) {
      setError('TC kimlik numarası 11 haneli olmalıdır.')
      return
    }

    if (!contractApproved) {
      setError('Devam etmek için sözleşmeleri onaylamanız gerekiyor.')
      return
    }

    const addr = addresses.find((a) => a.id === selectedAddressId)
    if (!addr) { setError('Adres bulunamadı.'); return }

    setLoading(true)

    try {
      const cartItems = items.map((item: import('@/lib/types').CartItem) => ({
        id: item.product.id,
        name: item.product.name,
        price: item.product.salePrice ?? item.product.price,
        quantity: item.quantity,
      }))

      const addressData = {
        savedAddressId: addr.id,
        fullName: addr.fullName,
        line1: addr.line1,
        line2: addr.line2 ?? undefined,
        district: addr.district,
        city: addr.city,
      }

      const res = await fetch('/api/odeme/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartItems,
          addressData,
          brandKey,
          contractApproved,
          invoice: {
            type: invoiceType,
            title: invoiceTitle,
            taxId: invoiceTaxId,
            taxOffice: invoiceTaxOffice,
          },
        }),
      })

      const data = (await res.json()) as { error?: string; token?: string }

      if (!res.ok) {
        setError(data.error ?? 'Ödeme başlatılamadı.')
        setLoading(false)
        return
      }

      // Ödeme sayfasına yönlendir (cart başarı sayfasında temizlenir)
      if (!data.token) {
        setError('Ödeme başlatılamadı, lütfen tekrar deneyin.')
        setLoading(false)
        return
      }

      window.location.href = `/api/odeme/form?token=${data.token}`
    } catch {
      setError('Bir hata oluştu, lütfen tekrar deneyin.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Ödeme</h1>
          <p className="text-gray-500 text-sm mt-0.5">Teslimat adresinizi seçin ve sözleşmeleri onaylayın.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* SOL */}
          <div className="lg:col-span-2 space-y-5">

            {/* Adres */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Teslimat Adresi</h2>

              {addresses.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-gray-400 text-sm mb-3">Kayıtlı adresiniz yok.</p>
                  <Link
                    href="/hesabim/adres-ekle"
                    className="inline-block px-5 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors"
                  >
                    Adres Ekle
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map((addr) => (
                    <label
                      key={addr.id}
                      htmlFor={`teslimat-adresi-${addr.id}`}
                      className={`flex gap-3 p-4 border-2 rounded-xl cursor-pointer transition-colors ${
                        selectedAddressId === addr.id
                          ? 'border-gray-900 bg-gray-50'
                          : 'border-gray-100 hover:border-gray-300'
                      }`}
                    >
                      <input
                        id={`teslimat-adresi-${addr.id}`}
                        type="radio"
                        name="savedAddress"
                        value={addr.id}
                        checked={selectedAddressId === addr.id}
                        onChange={() => setSelectedAddressId(addr.id)}
                        className="mt-0.5 accent-gray-900"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-semibold text-gray-900 text-sm">{addr.label}</span>
                          {addr.isDefault && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Varsayılan</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 break-words">{addr.fullName}</p>
                        <p className="text-sm text-gray-500 break-words">
                          {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}, {addr.district} / {addr.city}
                        </p>
                        <p className="text-sm text-gray-400 break-words">{addr.phone}</p>
                      </div>
                    </label>
                  ))}
                  <Link
                    href="/hesabim/adres-ekle"
                    className="inline-block text-sm text-blue-600 hover:text-blue-700 font-medium mt-1"
                  >
                    + Yeni adres ekle
                  </Link>
                </div>
              )}
            </div>

            {/* Fatura Bilgileri */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-1">Fatura Bilgileri</h2>
              <p className="text-xs text-gray-500 mb-5">
                Faturanız e-arşiv olarak düzenlenip e-posta adresinize gönderilir.
              </p>

              <div className="flex gap-2 mb-5">
                {(['bireysel', 'kurumsal'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setInvoiceType(type)}
                    className={`btn-press flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                      invoiceType === type
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    {type === 'bireysel' ? 'Bireysel' : 'Kurumsal'}
                  </button>
                ))}
              </div>

              {invoiceType === 'kurumsal' ? (
                <div className="space-y-3">
                  <div>
                    <label
                      htmlFor="invoiceTitle"
                      className="block text-sm font-medium text-gray-700 mb-1.5"
                    >
                      Ticaret Unvanı *
                    </label>
                    <input
                      id="invoiceTitle"
                      value={invoiceTitle}
                      onChange={(e) => setInvoiceTitle(e.target.value)}
                      placeholder="Örn: Yılmaz Tarım Ürünleri Ltd. Şti."
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="invoiceTaxId"
                        className="block text-sm font-medium text-gray-700 mb-1.5"
                      >
                        Vergi No (10 hane) *
                      </label>
                      <input
                        id="invoiceTaxId"
                        inputMode="numeric"
                        maxLength={10}
                        value={invoiceTaxId}
                        onChange={(e) => setInvoiceTaxId(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="invoiceTaxOffice"
                        className="block text-sm font-medium text-gray-700 mb-1.5"
                      >
                        Vergi Dairesi *
                      </label>
                      <input
                        id="invoiceTaxOffice"
                        value={invoiceTaxOffice}
                        onChange={(e) => setInvoiceTaxOffice(e.target.value)}
                        placeholder="Örn: Anamur"
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label
                    htmlFor="invoiceTckn"
                    className="block text-sm font-medium text-gray-700 mb-1.5"
                  >
                    TC Kimlik No{' '}
                    <span className="font-normal text-gray-400">(11 hane, isteğe bağlı)</span>
                  </label>
                  <input
                    id="invoiceTckn"
                    inputMode="numeric"
                    maxLength={11}
                    value={invoiceTaxId}
                    onChange={(e) => setInvoiceTaxId(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-400 mt-1.5">
                    Boş bırakırsanız fatura ad-soyad bilgisiyle düzenlenir.
                  </p>
                </div>
              )}
            </div>

            {/* Sözleşmeler */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-5">Sözleşmeler ve Formlar</h2>

              <div className="space-y-4">
                {/* Ön Bilgilendirme */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Ön Bilgilendirme Formu</h3>
                  <div className="h-36 overflow-y-auto border border-gray-200 rounded-xl p-3 text-xs text-gray-500 leading-relaxed whitespace-pre-line bg-gray-50">
                    {ON_BILGILENDIRME}
                  </div>
                </div>

                {/* Mesafeli Satış */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Mesafeli Satış Sözleşmesi</h3>
                  <div className="h-36 overflow-y-auto border border-gray-200 rounded-xl p-3 text-xs text-gray-500 leading-relaxed whitespace-pre-line bg-gray-50">
                    {MESAFELI_SATIS}
                  </div>
                </div>

                {/* Cayma Hakkı */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Cayma Hakkı</h3>
                  <div className="h-36 overflow-y-auto border border-gray-200 rounded-xl p-3 text-xs text-gray-500 leading-relaxed whitespace-pre-line bg-gray-50">
                    {CAYMA_HAKKI}
                  </div>
                </div>

                {/* Onay checkbox */}
                <label htmlFor="sozlesme-onay" className="flex items-start gap-3 cursor-pointer group mt-2">
                  <div className="relative mt-0.5 flex-shrink-0">
                    <input
                      id="sozlesme-onay"
                      type="checkbox"
                      checked={contractApproved}
                      onChange={(e) => setContractApproved(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      contractApproved ? 'bg-gray-900 border-gray-900' : 'border-gray-300 group-hover:border-gray-500'
                    }`}>
                      {contractApproved && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-sm text-gray-700 leading-relaxed">
                    <span className="font-semibold">Ön Bilgilendirme Koşulları</span>'nı ve{' '}
                    <span className="font-semibold">Mesafeli Satış Sözleşmesi</span>'ni okudum, onaylıyorum.
                  </span>
                </label>

                {/* Metinler yukarıdaki dar kutularda da duruyor ama sipariş
                    sonrası geri dönüp okunabilmesi için kalıcı bir sayfa şart. */}
                <p className="text-xs text-gray-400">
                  Sözleşmelerin tamamını{' '}
                  <Link
                    href="/mesafeli-satis-sozlesmesi"
                    target="_blank"
                    className="text-gray-600 underline hover:text-gray-900"
                  >
                    ayrı sayfada
                  </Link>{' '}
                  okuyabilir, dilerseniz yazdırabilirsiniz.
                </p>
              </div>
            </div>

            {/* Güvenlik notu
                Marka adı "İyzico" değil "iyzico" — iyzico kendi marka
                kılavuzunda her zaman küçük harfle yazılmasını istiyor ve üye
                işyeri incelemesinde bakılan ayrıntılardan biri bu.
                Logo, resmî paketten geldiği gibi kullanılıyor. */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 space-y-3">
              <div className="flex items-center gap-3 text-sm text-blue-700">
                <Icon name="kilit" className="w-5 h-5 flex-shrink-0" />
                <span>
                  Ödemeniz iyzico güvencesiyle, 3D Secure ve SSL şifreli bağlantı üzerinden
                  gerçekleşir. Kart bilgileriniz sitemizde saklanmaz.
                </span>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/odeme/iyzico-band-renkli.svg"
                alt="iyzico ile Öde — Mastercard, Visa, American Express ve troy kabul edilir"
                width={456}
                height={32}
                // Sabit yükseklik + max-w-full birlikte logoyu dar ekranda yatay
                // eziyor. Genişlik sabit, yükseklik serbest: oran her zaman korunur.
                className="w-[340px] max-w-full h-auto"
                loading="lazy"
              />
            </div>
          </div>

          {/* SAĞ — Özet */}
          <div>
            <div className="bg-white rounded-2xl border border-gray-200 p-6 sticky top-24">
              <h2 className="font-semibold text-gray-900 mb-4">Sipariş Özeti</h2>

              <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                {items.map((item: import('@/lib/types').CartItem) => {
                  const price = item.product.salePrice ?? item.product.price
                  return (
                    <div key={item.product.id} className="flex justify-between text-sm gap-2">
                      <span className="text-gray-600 truncate flex-1">
                        {item.product.name}
                        <span className="text-gray-400 ml-1">×{item.quantity}</span>
                      </span>
                      <span className="font-medium text-gray-900 whitespace-nowrap flex-shrink-0">
                        {formatPrice(price * item.quantity)}
                      </span>
                    </div>
                  )
                })}
              </div>

              <div className="border-t border-gray-100 pt-3 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Ara Toplam</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Kargo</span>
                  <span className={cargoFee === 0 ? 'text-green-600 font-medium' : ''}>
                    {cargoFee === 0 ? 'Ücretsiz' : formatPrice(cargoFee)}
                  </span>
                </div>
                {subtotal < KARGO_LIMIT && (
                  <p className="text-xs text-blue-600 bg-blue-50 rounded-lg px-2.5 py-1.5">
                    {formatPrice(KARGO_LIMIT - subtotal)} daha ekleyin, kargo ücretsiz!
                  </p>
                )}
                <div className="border-t border-gray-100 pt-2 flex justify-between">
                  <span className="font-bold text-gray-900">Toplam</span>
                  <span className="font-bold text-lg text-gray-900">{formatPrice(total)}</span>
                </div>
              </div>

              {error && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading || !contractApproved || addresses.length === 0}
                className="mt-5 w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gray-900 hover:bg-gray-700 text-white font-semibold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Ödeme Başlatılıyor…
                  </>
                ) : (
                  <>
                    <Icon name="kilit" className="w-4 h-4" />
                    Güvenli Ödemeye Geç
                  </>
                )}
              </button>

              {!contractApproved && (
                <p className="text-xs text-amber-600 text-center mt-2">
                  Ödeme için sözleşmeleri onaylayın
                </p>
              )}

              <p className="text-xs text-gray-400 text-center mt-2">
                İyzico güvencesiyle korunan ödeme
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
