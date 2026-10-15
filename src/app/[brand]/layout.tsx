import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { BRANDS } from '@/lib/constants'
import { paylasimMetadata } from '@/lib/seo'
import type { BrandKey } from '@/lib/types'

const VALID_BRANDS: BrandKey[] = ['alb-tarim', 'alb-su-aritma']

interface BrandLayoutProps {
  children: React.ReactNode
  params: Promise<{ brand: string }>
}

export async function generateMetadata({ params }: BrandLayoutProps): Promise<Metadata> {
  const { brand } = await params
  if (!VALID_BRANDS.includes(brand as BrandKey)) return {}

  const cfg = BRANDS[brand as BrandKey]
  return {
    title: {
      default: cfg.name,
      template: `%s | ${cfg.name}`,
    },
    description: cfg.description,
    keywords: [cfg.name, 'Bayırlıoğlu', ...cfg.nav.map((n) => n.label)],
    alternates: { canonical: `/${brand}` },
    // ── Burada YALNIZCA `siteName` yazıyordu ve bu bir hataydı ──────────────
    //
    // Next.js `openGraph` nesnesini iç içe düzenler arasında BİRLEŞTİRMİYOR,
    // tamamen DEĞİŞTİRİYOR. Kök düzende tanımlı `type`, `locale`, `title` ve
    // `description` bu tek satır yüzünden `/[brand]` altındaki bütün
    // sayfalardan siliniyordu: marka ana sayfası, hakkımızda, hizmetler,
    // iletişim, referanslar, blog ve ürün listesi yalnızca bir siteName ile
    // paylaşılıyordu.
    ...paylasimMetadata({
      title: cfg.name,
      description: cfg.description,
      url: `/${brand}`,
      marka: brand as BrandKey,
    }),
  }
}

export async function generateStaticParams() {
  return VALID_BRANDS.map((brand) => ({ brand }))
}

export default async function BrandLayout({ children, params }: BrandLayoutProps) {
  const { brand } = await params

  if (!VALID_BRANDS.includes(brand as BrandKey)) {
    notFound()
  }

  return <>{children}</>
}
