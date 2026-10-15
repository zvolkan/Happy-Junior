import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sepetim',
  description: 'Sepetinizdeki ürünleri görüntüleyin ve siparişinizi tamamlayın.',
  robots: { index: false, follow: false },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
