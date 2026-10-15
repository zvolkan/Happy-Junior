import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Ödeme Başarısız',
  robots: { index: false, follow: false },
}

const HATA_MESAJLARI: Record<string, string> = {
  token: 'Ödeme oturumu geçersiz veya süresi dolmuş.',
  siparis: 'Sipariş bilgisi bulunamadı.',
  odeme: 'Ödeme işlemi başarısız. Kart bilgilerinizi kontrol ederek tekrar deneyebilirsiniz.',
  sistem: 'Ödeme sistemiyle iletişim kurulamadı. Lütfen daha sonra tekrar deneyin.',
}

type Props = {
  searchParams: Promise<{ hata?: string }>
}

export default async function BasarisizPage({ searchParams }: Props) {
  const { hata } = await searchParams
  const message = (hata && HATA_MESAJLARI[hata]) ?? 'Ödeme işlemi tamamlanamadı.'

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 max-w-md w-full text-center">

        {/* X icon */}
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Ödeme Başarısız
        </h1>
        <p className="text-gray-500 text-sm mb-6">
          {message}
        </p>

        <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm text-amber-700 mb-8 text-left">
          <p className="font-semibold mb-1">Sık karşılaşılan nedenler:</p>
          <ul className="space-y-1 list-disc list-outside pl-5 text-amber-600 marker:text-amber-400">
            <li>Yetersiz bakiye</li>
            <li>3D Secure onayının verilmemesi</li>
            <li>Kart limitinin aşılması</li>
            <li>İnternet alışverişlerine kapalı kart</li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/sepet"
            className="flex-1 py-3 rounded-xl bg-gray-900 hover:bg-gray-700 text-white font-semibold text-sm text-center transition-colors"
          >
            Tekrar Dene
          </Link>
          <Link
            href="/"
            className="flex-1 py-3 rounded-xl border border-gray-200 hover:border-gray-400 text-gray-700 font-semibold text-sm text-center transition-colors"
          >
            Ana Sayfaya Dön
          </Link>
        </div>

        <p className="text-xs text-gray-400 mt-6">
          Sorun devam ederse{' '}
          <Link href="/iletisim" className="text-blue-600 hover:underline">
            bizimle iletişime geçin
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
