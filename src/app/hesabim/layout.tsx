import type { Metadata } from 'next'

/**
 * Hesap bölümü ortak metadata'sı.
 *
 * `noindex` daha önce yalnızca iki alt sayfada (adreslerim, favorilerim)
 * tanımlıydı; `/hesabim` kendisi ve sipariş sayfaları açıkta kalıyordu.
 * Layout'a taşınarak bölümün tamamı kapsandı — yeni bir alt sayfa eklendiğinde
 * de kendiliğinden kapsanacak.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function HesabimLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
