import type { Metadata } from 'next'
import { BRAND } from '@/lib/constants'

/** Sayfa istemci bileşeni olduğu için metadata bu layout'ta duruyor. */
export const metadata: Metadata = {
  title: 'İletişim',
  description: `${BRAND.name} ile iletişime geçin: telefon, WhatsApp ve iletişim formu.`,
  alternates: { canonical: '/iletisim' },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
