'use client'

import Link from 'next/link'

/**
 * Ödeme akışı hata sınırı.
 *
 * Bu segmentte `error.tsx` yoktu. Ödeme ekranındaki bir hatada kök hata ekranı
 * devreye giriyor ve müşteri parasının çekilip çekilmediğini anlayamıyordu.
 * Mesaj bilerek net: sipariş oluştuysa e-posta gider.
 */
export default function OdemeError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 max-w-md w-full text-center">
        <h1 className="text-lg font-bold text-gray-900 mb-2">Ödeme ekranı yüklenemedi</h1>
        <p className="text-sm text-gray-500 mb-2">
          Bu hata ödeme alınmadan önce oluştu; kartınızdan çekim yapılmadı.
        </p>
        <p className="text-sm text-gray-500 mb-6">
          Emin olmak isterseniz Hesabım &gt; Siparişlerim sayfasından kontrol edebilir ya da
          bizimle iletişime geçebilirsiniz.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="btn-press px-5 py-2.5 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-500"
          >
            Tekrar dene
          </button>
          <Link
            href="/sepet"
            className="px-5 py-2.5 border border-gray-300 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50"
          >
            Sepete dön
          </Link>
        </div>
      </div>
    </div>
  )
}
