import type { Metadata } from 'next'
import Link from 'next/link'
import { BRAND } from '@/lib/constants'

/**
 * 404 sayfasının kendisi arama sonucunda çıkmamalı.
 *
 * Sayfa doğru durum kodunu (404) döndürse bile, `noindex` olmadan bazı
 * tarayıcı ve toplayıcılar bu adresi dizine alabiliyor; sonuçta "Sayfa
 * Bulunamadı" başlıklı bir kayıt siteyi temsil eder hâle geliyor.
 */
export const metadata: Metadata = {
  title: 'Sayfa Bulunamadı',
  robots: { index: false, follow: true },
}

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className={`text-9xl font-black ${BRAND.colors.primaryText} mb-4`}>404</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Sayfa Bulunamadı</h1>
        <p className="text-gray-500 mb-8">Aradığınız sayfa kaldırılmış, taşınmış veya hiç var olmamış olabilir.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className={`${BRAND.colors.accentPrimary} inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold transition-all duration-200`}>
            Ana Sayfaya Dön
          </Link>
          <Link href="/urunler" className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold border-2 border-gray-200 hover:border-gray-300 bg-white text-gray-700 transition-all duration-200">
            Ürünleri Gör
          </Link>
        </div>
      </div>
    </div>
  )
}
