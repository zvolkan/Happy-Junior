'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BRAND } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { carrierTrackingUrl } from '@/lib/carrier'
import Icon from '@/components/ui/Icon'
import { trackOrder, type TrackingResult } from '@/app/actions/order-tracking'

/**
 * Ortak `carrierTrackingUrl` null kabul etmiyor; sayfa null gelebilen
 * alanlarla çalıştığı için ince bir sarmalayıcı kullanılıyor.
 *
 * Bu sayfada fonksiyonun tamamı kopyalanmıştı ve kopyada `encodeURIComponent`
 * yoktu — takip numarasında boşluk veya özel karakter olduğunda bozuk bağlantı
 * üretiyordu.
 */
function trackingUrlOf(carrier: string | null, code: string | null): string | null {
  if (!carrier || !code) return null
  return carrierTrackingUrl(carrier, code)
}

export default function SiparisTakibiPage() {
  const [orderNum, setOrderNum] = useState('')
  const [email, setEmail] = useState('')
  const [result, setResult] = useState<TrackingResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!orderNum.trim() || !email.trim()) {
      setError('Lütfen tüm alanları doldurun.')
      return
    }

    setError('')
    setLoading(true)
    setResult(null)

    // Gerçek sipariş sorgusu — eskiden burada sabit bir mock sonuç dönüyordu.
    // try/catch şart: istek hata verirse setLoading(false) hiç çalışmıyor,
    // buton kalıcı olarak "Sorgulanıyor…" durumunda kalıyordu.
    let response
    try {
      response = await trackOrder(orderNum, email)
    } catch {
      setLoading(false)
      setError('Sorgulama sırasında bir sorun oluştu. Lütfen tekrar deneyin.')
      return
    }

    setLoading(false)

    if (!response.ok) {
      setError(response.error)
      return
    }

    setResult(response.data)
  }

  const trackingUrl = result ? trackingUrlOf(result.carrier, result.trackingNo) : null

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-2xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900">Sipariş Takibi</h1>
          <p className="text-gray-500 mt-2 text-sm">
            Sipariş numaranızı ve siparişte kullandığınız e-posta adresini girerek durumu
            sorgulayabilirsiniz.
          </p>
        </div>

        {/* Sorgulama Formu */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="takip-siparisNo" className="block text-sm font-medium text-gray-700 mb-1.5">Sipariş No</label>
              <input
                type="text"
                id="takip-siparisNo"
                value={orderNum}
                onChange={(e) => setOrderNum(e.target.value)}
                placeholder="Örn. 2608074831"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition"
              />
            </div>
            <div>
              <label htmlFor="takip-email" className="block text-sm font-medium text-gray-700 mb-1.5">
                E-posta adresiniz
              </label>
              <input
                type="email"
                id="takip-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Siparişte kullandığınız e-posta"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className={cn(
              'btn-press w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white disabled:opacity-60 disabled:cursor-not-allowed',
              BRAND.colors.primary,
              BRAND.colors.primaryHover,
            )}
          >
            {loading ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Sorgulanıyor…
              </>
            ) : (
              <>
                <Icon name="arama" className="w-4 h-4" />
                Siparişi Sorgula
              </>
            )}
          </button>

          <p className="text-xs text-gray-400 text-center mt-4">
            Hesabınız varsa{' '}
            <Link href="/hesabim/siparislerim" className="underline hover:text-gray-600">
              Siparişlerim
            </Link>{' '}
            sayfasından tüm siparişlerinizi görebilirsiniz.
          </p>
        </form>

        {/* Sonuç */}
        {result && (
          <div className="bg-white rounded-2xl shadow-sm p-6 anim-fade-up">
            {/* Sipariş Bilgisi */}
            <div className="flex flex-wrap items-start justify-between gap-4 mb-6 pb-5 border-b border-gray-100">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Sipariş No</p>
                <p className="font-bold text-gray-900 font-mono text-sm">{result.orderNo}</p>
                <p className="text-xs text-gray-400 mt-1">{result.createdAt}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Durum</p>
                <p className={cn('font-semibold', BRAND.colors.primaryText)}>
                  {result.statusLabel}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 uppercase tracking-wide">Tutar</p>
                <p className="font-bold text-gray-900">{result.totalAmount}</p>
                <p className="text-xs text-gray-400 mt-1">{result.itemCount} ürün</p>
              </div>
            </div>

            {result.steps.length === 0 ? (
              <div className="text-center py-8">
                <Icon name="yasak" className="w-9 h-9 mx-auto mb-3 text-gray-300" />
                <p className="font-semibold text-gray-800">{result.statusLabel}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Bu sipariş için takip bilgisi bulunmuyor.
                </p>
              </div>
            ) : (
              <>
                {/* Timeline */}
                <h2 className="text-base font-bold text-gray-900 mb-6">Sipariş Durumu</h2>
                <div className="relative">
                  <div className="absolute left-5 top-4 bottom-4 w-px bg-gray-200" />

                  <div className="space-y-6">
                    {result.steps.map((step) => {
                      const isActive = step.id === result.activeStep
                      const isDone = step.done && !isActive

                      return (
                        <div key={step.id} className="relative flex items-start gap-4">
                          <div
                            className={cn(
                              'relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg border-2 transition-all duration-300',
                              isDone
                                ? `${BRAND.colors.primary} border-transparent text-white`
                                : isActive
                                  ? `bg-white ${BRAND.colors.primaryBorder} text-gray-800 shadow-md`
                                  : 'bg-gray-100 border-gray-200 text-gray-300',
                            )}
                          >
                            <Icon name={isDone ? 'onay' : step.icon} className="w-5 h-5" />
                          </div>

                          <div className="flex-1 pt-1.5">
                            <p
                              className={cn(
                                'font-semibold text-sm',
                                isDone
                                  ? 'text-gray-500'
                                  : isActive
                                    ? 'text-gray-900'
                                    : 'text-gray-300',
                              )}
                            >
                              {step.label}
                              {isActive && (
                                <span
                                  className={cn(
                                    'ml-2 text-xs font-bold px-2 py-0.5 rounded-full',
                                    BRAND.colors.primaryLight,
                                    BRAND.colors.primaryText,
                                  )}
                                >
                                  Aktif
                                </span>
                              )}
                            </p>
                            {step.date && (
                              <p className="text-xs text-gray-400 mt-0.5">{step.date}</p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Kargo takip bilgisi */}
                {result.trackingNo ? (
                  <div
                    className={cn(
                      'mt-8 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 border',
                      BRAND.colors.primaryLight,
                      BRAND.colors.primaryBorder,
                    )}
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {result.carrier ?? 'Kargo'} ile gönderildi
                      </p>
                      <p
                        className={cn(
                          'text-sm font-mono font-bold mt-0.5',
                          BRAND.colors.primaryText,
                        )}
                      >
                        {result.trackingNo}
                      </p>
                    </div>
                    {trackingUrl && (
                      <a
                        href={trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          'btn-press shrink-0 px-4 py-2 rounded-xl text-sm font-semibold text-white',
                          BRAND.colors.primary,
                          BRAND.colors.primaryHover,
                        )}
                      >
                        Takip Et →
                      </a>
                    )}
                  </div>
                ) : (
                  <p className="mt-8 text-sm text-gray-500 bg-gray-50 rounded-xl p-4">
                    Siparişiniz kargoya verildiğinde takip numarası burada görünecek.
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
