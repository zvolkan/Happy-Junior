import type { Metadata } from 'next'

const GECERLI_MARKALAR = ['alb-tarim', 'alb-su-aritma'] as const
const MARKA_ADI: Record<string, string> = {
  'alb-tarim': 'ALB Tarım',
  'alb-su-aritma': 'Alb Su Teknolojileri',
}

/**
 * Sayfa istemci bileşeni olduğu için metadata bu layout'ta duruyor.
 *
 * Canonical eklendi: /iletisim, /alb-tarim/iletisim ve /alb-su-aritma/iletisim
 * üç ayrı adres ve üçü de indekslenebilir durumdaydı. İçerikleri farklı
 * (kök sayfa grup, bunlar marka), ama canonical yokken arama motoru hangisinin
 * asıl olduğunu kendi kararıyla seçip diğerlerini dizinden düşürüyordu.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ brand: string }>
}): Promise<Metadata> {
  const { brand } = await params
  if (!GECERLI_MARKALAR.includes(brand as (typeof GECERLI_MARKALAR)[number])) return {}

  const ad = MARKA_ADI[brand]
  return {
    title: `İletişim — ${ad}`,
    description: `${ad} ile iletişime geçin: telefon, WhatsApp ve iletişim formu.`,
    alternates: { canonical: `/${brand}/iletisim` },
  }
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
