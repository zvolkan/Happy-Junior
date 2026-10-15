import type { Metadata } from 'next'
import { BRAND } from '@/lib/constants'
import { getCategoriesByBrand } from '@/lib/queries/categories'
import { searchProducts, PAGE_SIZE, type SortOption } from '@/lib/queries/product-search'
import UrunlerContent from './UrunlerContent'

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const VALID_SORTS: SortOption[] = ['featured', 'price-asc', 'price-desc', 'newest', 'name']

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sp = await searchParams
  const cfg = BRAND

  const page = Number(Array.isArray(sp.sayfa) ? sp.sayfa[0] : sp.sayfa) || 1
  const hasFilter = Boolean(sp.kullanim || sp.type || sp.arama || sp.marka || sp.min || sp.max)

  return {
    title: page > 1 ? `Ürünler — Sayfa ${page}` : 'Ürünler',
    description: `${cfg.name} ürün kataloğu`,
    alternates: { canonical: `/urunler` },
    // Filtreli ve sayfalı görünümler yinelenen içerik olarak indekslenmesin
    robots: hasFilter || page > 1 ? { index: false, follow: true } : { index: true, follow: true },
  }
}

export const dynamic = 'force-dynamic'

/** Tek değer al — dizi gelirse ilkini */
function one(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? ''
  return value ?? ''
}

function num(value: string | string[] | undefined): number | undefined {
  const raw = one(value)
  if (!raw) return undefined
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined
}

export default async function UrunlerPage({ searchParams }: Props) {
  const sp = await searchParams
  const brandKey = BRAND.key

  const sortParam = one(sp.sirala) as SortOption
  const sort = VALID_SORTS.includes(sortParam) ? sortParam : 'featured'

  // Filtreleme, sıralama ve sayfalama artık veritabanında yapılıyor —
  // eskiden markanın TÜM ürünleri çekilip tarayıcıda filtreleniyordu.
  const [result, categories] = await Promise.all([
    searchProducts({
      brandKey,
      rootSlug: one(sp.kullanim) || undefined,
      typeName: one(sp.type) || undefined,
      categorySlug: one(sp.kategori) || undefined,
      search: one(sp.arama) || undefined,
      productBrand: one(sp.marka) || undefined,
      minPrice: num(sp.min),
      maxPrice: num(sp.max),
      inStockOnly: one(sp.stokta) === '1',
      sort,
      page: Number(one(sp.sayfa)) || 1,
      pageSize: PAGE_SIZE,
    }),
    getCategoriesByBrand(brandKey),
  ])

  return (
    <UrunlerContent
      brandKey={brandKey}
      products={result.products}
      categories={categories}
      total={result.total}
      page={result.page}
      pageCount={result.pageCount}
      facets={result.facets}
      sort={sort}
    />
  )
}
