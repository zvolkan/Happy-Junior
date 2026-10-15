import type { Metadata } from 'next'
import { COMPANY_NAME } from '@/lib/constants'

export const metadata: Metadata = {
  // Düz metin başlık verilirse alt sayfalar (başarılı/başarısız/beklemede)
  // kök şablonu kaybediyor ve sekmede yalnızca "Ödeme Başarısız" yazıyordu.
  title: { default: 'Ödeme', template: `%s | ${COMPANY_NAME}` },
  description: 'Siparişinizi güvenle tamamlayın.',
  robots: { index: false, follow: false },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
