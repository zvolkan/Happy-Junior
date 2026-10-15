import type { Metadata } from 'next'

// Sayfanın kendisi istemci bileşeni olduğu için metadata burada duruyor.
// Canonical gerekçesi için bkz. src/app/hakkimizda/page.tsx
export const metadata: Metadata = {
  alternates: { canonical: '/iletisim' },
  title: 'İletişim — Bayırlıoğlu',
  description: 'Sorularınız, önerileriniz ve hizmet talepleriniz için bize ulaşın. Anamur/Mersin merkezli Bayırlıoğlu iletişim bilgileri.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
