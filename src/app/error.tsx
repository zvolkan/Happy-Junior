'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import Icon from '@/components/ui/Icon'

/**
 * Genel hata sınırı.
 *
 * Eskiden hata durumunda kullanıcı Next.js'in ham hata ekranını görüyordu.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Hata detayı yalnızca sunucu loglarına — kullanıcıya teknik metin gösterilmez
    console.error('[hata sınırı]', error)
  }, [error])

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="text-center max-w-md">
        <Icon name="uyari" className="w-14 h-14 mx-auto mb-6 text-amber-500" />
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Bir şeyler ters gitti</h1>
        <p className="text-gray-500 leading-relaxed mb-8">
          Sayfa yüklenirken beklenmeyen bir hata oluştu. Tekrar denemek isterseniz aşağıdaki
          butonu kullanabilir, sorun devam ederse bizimle iletişime geçebilirsiniz.
        </p>

        <div className="flex flex-wrap gap-3 justify-center">
          <button
            onClick={reset}
            className="btn-press bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-semibold text-sm"
          >
            Tekrar Dene
          </button>
          <Link
            href="/"
            className="btn-press border border-gray-300 text-gray-700 px-6 py-3 rounded-xl font-semibold text-sm hover:bg-gray-50"
          >
            Ana Sayfaya Dön
          </Link>
        </div>

        {error.digest && (
          <p className="text-xs text-gray-300 mt-8 font-mono">Hata kodu: {error.digest}</p>
        )}
      </div>
    </div>
  )
}
