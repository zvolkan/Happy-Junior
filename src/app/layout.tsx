import type { Metadata } from 'next'
import { headers } from 'next/headers'
import '@fontsource-variable/bricolage-grotesque'
import '@fontsource-variable/nunito'
import './globals.css'
import '@/styles/animations.css'
import '@/styles/brand.css'
import { BRAND, SITE_CONFIG } from '@/lib/constants'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import WhatsAppButton from '@/components/layout/WhatsAppButton'
import PageTransition from '@/components/layout/PageTransition'
import ScrollProgress from '@/components/layout/ScrollProgress'
import CookieConsent from '@/components/layout/CookieConsent'
import ButonEfekti from '@/components/layout/ButonEfekti'
import { Toaster } from 'react-hot-toast'
import { jsonLdScript } from '@/lib/sanitize'
import { paylasimMetadata, yerelIsletmeVerisi, siteAramaVerisi } from '@/lib/seo'

// Yazı tipleri pakete gömülü (@fontsource). Türkçe harfler `latin-ext`
// alt kümesinde ve paketin varsayılan CSS'i bunu içeriyor; Google Fonts'a
// istek gitmiyor.

export const metadata: Metadata = {
  metadataBase: new URL(SITE_CONFIG.url),
  title: { template: `%s | ${BRAND.name}`, default: `${BRAND.name} — Bebek ve Çocuk Giyim, Anamur` },
  description: BRAND.description,
  keywords: ['happy junior', 'bebek giyim', 'çocuk giyim', 'bebek kıyafeti', 'çocuk ayakkabı', 'anamur', 'oyuncak'],
  // Paylaşım görseli ve Twitter kartı `src/lib/seo.ts`ten geliyor.
  ...paylasimMetadata({
    title: BRAND.name,
    description: BRAND.description,
    url: SITE_CONFIG.url,
  }),
  alternates: { canonical: '/' },
  robots: { index: true, follow: true },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const yonetimPaneli = ((await headers()).get('x-pathname') ?? '').startsWith('/admin')

  return (
    <html lang="tr">
      <body>
        {/* Klavye kullanıcıları için: sekme ile odaklanınca görünür olur */}
        <a
          href="#ana-icerik"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-gray-900 focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
        >
          Ana içeriğe atla
        </a>

        {/* Arama motorları için kurum bilgisi.
            NOT: Buraya CSP nonce'u KONMUYOR. `type="application/ld+json"`
            çalıştırılabilir bir script değil, bu yüzden CSP script-src onu
            engellemiyor (tarayıcıda doğrulandı: nonce'suz da ihlal yok).
            Nonce eklendiğinde ise tarayıcı yükleme sonrası nonce niteliğini
            temizlediği için React hidrasyon uyumsuzluğu uyarısı veriyordu. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript(yerelIsletmeVerisi()) }}
        />
        {/* Arama sonucunda site bağlantısının altına arama kutusu koyabilmesi
            için. Hedef adres gerçekten çalışan arama parametresi. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript(siteAramaVerisi()) }}
        />
        {/* Yönetici paneli mağaza kabuğunu kullanmıyor.
            Bu ayrım olmadan panelde sepet, arama, yasal
            künyeli altbilgi, WhatsApp butonu ve çerez bandı da görünüyordu;
            mobil panelde ekranın yarısını kaplıyordu. */}
        {yonetimPaneli ? (
          <main id="ana-icerik" tabIndex={-1}>
            {children}
          </main>
        ) : (
          <>
            <ScrollProgress />
            <Header />
            <main id="ana-icerik" tabIndex={-1}>
              <PageTransition>{children}</PageTransition>
            </main>
            <Footer />
            <WhatsAppButton />
            <CookieConsent />
            <ButonEfekti />
          </>
        )}
        <Toaster position="top-right" toastOptions={{ duration: 3000, style: { borderRadius: '12px', fontFamily: 'inherit', fontWeight: 600 } }} />
      </body>
    </html>
  )
}
