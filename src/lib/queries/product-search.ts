import { prisma } from '@/lib/db'
import type { Product, Category, BrandKey } from '@/lib/types'

/**
 * Sunucu tarafı ürün arama, filtreleme ve sayfalama.
 *
 * Eskiden `getProductsByBrand` markanın TÜM ürünlerini (görsel, teknik özellik
 * ve etiket ilişkileriyle birlikte) tek seferde çekiyor, filtreleme ve sıralama
 * tarayıcıda yapılıyordu. Katalog birkaç yüz ürüne çıktığında liste sayfası
 * hem çok yavaşlıyor hem de veritabanını gereksiz yoruyordu.
 *
 * Artık her şey SQL tarafında: filtreler `WHERE`, sıralama `ORDER BY`,
 * sayfalama `LIMIT/OFFSET`. Liste görünümü için gereksiz ilişkiler (specs,
 * tags) hiç çekilmiyor.
 */

// Saf (veritabanından bağımsız) sabitler ayrı bir dosyaya taşındı:
// istemci bileşenleri buradan import edince Prisma + pg yığını tarayıcı
// paketine sürükleniyordu. Sunucu tarafındaki mevcut import'lar bozulmasın
// diye burada yeniden dışa veriliyorlar.
export {
  SORT_OPTIONS,
  PAGE_SIZE,
  type SortOption,
} from './product-search-options'
import { PAGE_SIZE, type SortOption } from './product-search-options'

export interface ProductSearchOptions {
  brandKey: BrandKey
  /** Kök kategori slug'ı (kullanim) — alt ağacın tamamı dahil edilir */
  rootSlug?: string
  /** Ürün tipi ADI — markalar arası ortak isimle filtreler (İthal ürünler için) */
  typeName?: string
  /** Geriye dönük: doğrudan kategori slug'ı */
  categorySlug?: string
  /** Serbest metin arama */
  search?: string
  /** Ürün markası (TİMAC AGRO, HAIFA vb.) */
  productBrand?: string
  minPrice?: number
  maxPrice?: number
  inStockOnly?: boolean
  sort?: SortOption
  page?: number
  pageSize?: number
}

export interface ProductSearchResult {
  products: Product[]
  total: number
  page: number
  pageCount: number
  /** Filtre arayüzünü beslemek için — mevcut markadaki tüm seçenekler */
  facets: {
    productBrands: string[]
    priceRange: { min: number; max: number }
  }
}

/** Liste görünümü için yeterli olan minimum ilişki seti */
const LIST_INCLUDE = {
  brand: { select: { key: true } },
  category: {
    select: { id: true, name: true, slug: true, icon: true, sortOrder: true, parentId: true },
  },
  // İlk iki görsel: kartta üzerine gelince ikinci fotoğrafa geçiliyor.
  images: {
    orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }] as { isPrimary?: 'desc'; sortOrder?: 'asc' }[],
    take: 2,
    select: { url: true, altText: true, isPrimary: true },
  },
} as const

type ListRow = {
  id: string
  name: string
  slug: string
  description: string | null
  shortDescription: string | null
  price: unknown
  salePrice: unknown
  sku: string | null
  unit: string
  stockQuantity: number
  isFeatured: boolean
  isActive: boolean
  rating: unknown
  reviewCount: number
  productBrand: string | null
  createdAt: Date
  updatedAt: Date
  brand: { key: string }
  category: {
    id: number
    name: string
    slug: string
    icon: string | null
    sortOrder: number
    parentId: number | null
  }
  images: { url: string; altText: string | null; isPrimary: boolean }[]
}

function toListProduct(row: ListRow): Product {
  const category: Category = {
    id: row.category.id,
    name: row.category.name,
    slug: row.category.slug,
    icon: row.category.icon ?? undefined,
    brand: row.brand.key as BrandKey,
    sortOrder: row.category.sortOrder,
    parentId: row.category.parentId ?? undefined,
  }

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? '',
    shortDescription: row.shortDescription ?? '',
    price: Number(row.price),
    salePrice: row.salePrice != null ? Number(row.salePrice) : undefined,
    brand: row.brand.key as BrandKey,
    category,
    productBrand: row.productBrand ?? undefined,
    sku: row.sku ?? '',
    unit: row.unit,
    stock: row.stockQuantity,
    isFeatured: row.isFeatured,
    isActive: row.isActive,
    rating: Number(row.rating),
    reviewCount: row.reviewCount,
    images: row.images.map((img) => ({
      url: img.url,
      alt: img.altText ?? row.name,
      isPrimary: img.isPrimary,
    })),
    specs: [],
    tags: [],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

/** Bir kök kategorinin tüm alt kategorilerinin id'lerini toplar (3 seviye) */
async function collectDescendantIds(rootSlug: string, brandKey: string): Promise<number[] | null> {
  const all = await prisma.category.findMany({
    where: { brand: { key: brandKey }, isActive: true },
    select: { id: true, slug: true, parentId: true },
  })

  const root = all.find((c: { slug: string }) => c.slug === rootSlug)
  if (!root) return null

  const ids = new Set<number>([root.id])
  let grew = true

  // Derinlik sınırsız — ağaç büyüse de çalışır
  while (grew) {
    grew = false
    for (const cat of all) {
      if (cat.parentId != null && ids.has(cat.parentId) && !ids.has(cat.id)) {
        ids.add(cat.id)
        grew = true
      }
    }
  }

  return [...ids]
}

function buildOrderBy(sort: SortOption) {
  switch (sort) {
    // Sıralama ETKİN fiyata göre: indirimli fiyat varsa o, yoksa liste fiyatı.
    // Eskiden `price` kullanılıyordu ve müşteri "ucuzdan pahalıya" seçtiğinde
    // ekranda indirimli fiyatlar yazan ama liste fiyatına göre sıralanmış bir
    // liste görüyordu — kartların üzerindeki rakamlar sırasız görünüyordu.
    case 'price-asc':
      return [{ effectivePrice: 'asc' as const }]
    case 'price-desc':
      return [{ effectivePrice: 'desc' as const }]
    case 'newest':
      return [{ createdAt: 'desc' as const }]
    case 'name':
      return [{ name: 'asc' as const }]
    default:
      return [{ isFeatured: 'desc' as const }, { createdAt: 'desc' as const }]
  }
}

export async function searchProducts(
  options: ProductSearchOptions,
): Promise<ProductSearchResult> {
  const {
    brandKey,
    rootSlug,
    typeName,
    categorySlug,
    search,
    productBrand,
    minPrice,
    maxPrice,
    inStockOnly,
    sort = 'featured',
    page = 1,
    pageSize = PAGE_SIZE,
  } = options

  // Üst sınır eklendi: `?sayfa=999999999` devasa bir OFFSET üretiyordu.
  const safePage = Math.min(1000, Math.max(1, Math.floor(page)))
  const safePageSize = Math.min(96, Math.max(1, Math.floor(pageSize)))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { brand: { key: brandKey }, isActive: true }

  // Kök kategori → alt ağacın tamamı
  if (rootSlug) {
    const ids = await collectDescendantIds(rootSlug, brandKey)
    if (ids && ids.length > 0) where.categoryId = { in: ids }
  }

  // Ürün tipi adı (markalar arası) — kök filtresiyle birlikte çalışır
  if (typeName) {
    where.category = { ...(where.category ?? {}), name: typeName }
  } else if (categorySlug) {
    where.category = { ...(where.category ?? {}), slug: categorySlug }
  }

  if (productBrand) {
    where.productBrand = { equals: productBrand, mode: 'insensitive' }
  }

  if (inStockOnly) {
    where.stockQuantity = { gt: 0 }
  }

  if (typeof minPrice === 'number' || typeof maxPrice === 'number') {
    // Filtre de etkin fiyata bakıyor. `price` ile çalışırken, liste fiyatı
    // 600 TL / satış fiyatı 450 TL olan bir ürün "0–500 TL" aralığında
    // görünmüyordu; müşterinin ödeyeceği tutar aralığa giriyor olmasına rağmen.
    where.effectivePrice = {
      ...(typeof minPrice === 'number' ? { gte: minPrice } : {}),
      ...(typeof maxPrice === 'number' ? { lte: maxPrice } : {}),
    }
  }

  // Terim uzunluğu sınırlandı: sınırsız uzunlukta bir arama, beş TEXT
  // sütununda indekssiz `ILIKE '%...%'` taramasına yol açıyordu.
  const term = search?.trim().slice(0, 100)
  if (term) {
    where.OR = [
      { name: { contains: term, mode: 'insensitive' } },
      { shortDescription: { contains: term, mode: 'insensitive' } },
      { description: { contains: term, mode: 'insensitive' } },
      { sku: { contains: term, mode: 'insensitive' } },
      { productBrand: { contains: term, mode: 'insensitive' } },
    ]
  }

  const [rows, total, brandRows, priceAgg] = await Promise.all([
    prisma.product.findMany({
      where,
      include: LIST_INCLUDE,
      orderBy: buildOrderBy(sort),
      skip: (safePage - 1) * safePageSize,
      take: safePageSize,
    }),
    prisma.product.count({ where }),
    // Filtre arayüzü için marka listesi — filtrelerden bağımsız, markanın tamamı
    prisma.product.findMany({
      where: { brand: { key: brandKey }, isActive: true, productBrand: { not: null } },
      select: { productBrand: true },
      distinct: ['productBrand'],
      orderBy: { productBrand: 'asc' },
    }),
    prisma.product.aggregate({
      where: { brand: { key: brandKey }, isActive: true },
      // Kaydırıcının alt ve üst sınırı da etkin fiyattan; aksi hâlde alt sınır
      // gerçekte satılan en ucuz üründen yüksek çıkıyordu.
      _min: { effectivePrice: true },
      _max: { effectivePrice: true },
    }),
  ])

  return {
    products: (rows as ListRow[]).map(toListProduct),
    total,
    page: safePage,
    pageCount: Math.max(1, Math.ceil(total / safePageSize)),
    facets: {
      productBrands: brandRows
        .map((r: { productBrand: string | null }) => r.productBrand)
        .filter((v: string | null): v is string => Boolean(v))
        .sort((a: string, b: string) => a.localeCompare(b, 'tr')),
      priceRange: {
        min: Math.floor(Number(priceAgg._min.effectivePrice ?? 0)),
        max: Math.ceil(Number(priceAgg._max.effectivePrice ?? 0)),
      },
    },
  }
}
