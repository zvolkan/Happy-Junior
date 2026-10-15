'use client'

import Link from 'next/link'

/**
 * Yönetici paneli hata sınırı.
 *
 * Bu segmentte `error.tsx` yoktu; paneldeki bir veritabanı hatası kök hata
 * ekranını tetikliyor ve yönetici panelden tamamen düşüyordu. Artık hata panel
 * bağlamında gösteriliyor ve tekrar denenebiliyor.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 max-w-md w-full text-center">
        <h1 className="text-lg font-bold text-gray-900 mb-2">Bu ekran yüklenemedi</h1>
        <p className="text-sm text-gray-500 mb-6">
          İşlem sırasında bir hata oluştu. Tekrar deneyebilir ya da panele dönebilirsiniz.
        </p>
        {error.digest && (
          <p className="text-xs text-gray-400 font-mono mb-6">Hata kodu: {error.digest}</p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="btn-press px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-700"
          >
            Tekrar dene
          </button>
          <Link
            href="/admin"
            className="px-5 py-2.5 border border-gray-300 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50"
          >
            Panele dön
          </Link>
        </div>
      </div>
    </div>
  )
}
