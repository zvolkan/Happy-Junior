'use client'

import Link from 'next/link'

/**
 * Hesap bölümü hata sınırı.
 *
 * Bu segmentte `error.tsx` yoktu; örneğin sipariş listesi yüklenemediğinde kök
 * hata ekranı devreye girip TÜM sayfayı (kenar menüsü dahil) değiştiriyor,
 * kullanıcı hesap bağlamını kaybediyordu.
 */
export default function HesabimError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
      <h1 className="text-lg font-bold text-gray-900 mb-2">Bu bölüm yüklenemedi</h1>
      <p className="text-sm text-gray-500 mb-6">
        Bilgileriniz güvende. Lütfen tekrar deneyin; sorun sürerse bizimle iletişime geçin.
      </p>
      {error.digest && (
        <p className="text-xs text-gray-400 font-mono mb-6">Hata kodu: {error.digest}</p>
      )}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={reset}
          className="btn-press px-5 py-2.5 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-500"
        >
          Tekrar dene
        </button>
        <Link
          href="/hesabim"
          className="px-5 py-2.5 border border-gray-300 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50"
        >
          Hesabıma dön
        </Link>
      </div>
    </div>
  )
}
