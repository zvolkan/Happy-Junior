import { prisma } from '@/lib/db'
import type { Prisma } from '@prisma/client'
import type { Product, Category, BrandKey } from '@/lib/types'

// ─── Prisma çıktısını uygulama tipine dönüştür ────────────────────────────────

const PRODUCT_INCLUDE = {
  brand: true,
  category: true,
  images: { orderBy: [{ isPrimary: 'desc' as const }, { sortOrder: 'asc' as const }] },
  specs: { orderBy: { sortOrder: 'asc' as const } },
  tags: { include: { tag: true } },
} satisfies Prisma.ProductInclude

type PrismaProduct = Prisma.ProductGetPayload<{ include: typeof PRODUCT_INCLUDE }>

function toProduct(p: PrismaProduct): Product {
  const category: Category = {
    id: p.category.id,
    name: p.category.name,
    slug: p.category.slug,
    icon: p.category.icon ?? undefined,
    brand: p.brand.key as BrandKey,
    sortOrder: p.category.sortOrder,
    description: p.category.description ?? undefined,
    image: p.category.imageUrl ?? undefined,
    // parentId dahil: alt kategori ürünleri UI'da parent'a göre filtrelenebilir
    parentId: p.category.parentId ?? undefined,
  }

  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description ?? '',
    shortDescription: p.shortDescription ?? '',
    price: Number(p.price),
    salePrice: p.salePrice ? Number(p.salePrice) : undefined,
    brand: p.brand.key as BrandKey,
    category,
    productBrand: p.productBrand ?? undefined,
    sku: p.sku ?? '',
    unit: p.unit,
    stock: p.stockQuantity,
    isFeatured: p.isFeatured,
    isActive: p.isActive,
    rating: Number(p.rating),
    reviewCount: p.reviewCount,
    images: p.images.map((img) => ({
      url: img.url,
      alt: img.altText ?? p.name,
      isPrimary: img.isPrimary,
    })),
    specs: p.specs.map((s) => ({
      name: s.specName,
      value: s.specValue,
      unit: s.specUnit ?? undefined,
    })),
    tags: p.tags.map((pt) => pt.tag.name),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }
}

// ─── Tek ürün sorgulama ───────────────────────────────────────────────────────

async function fetchOne(slug: string, brandKey: string) {
  return prisma.product.findFirst({
    where: { slug, brand: { key: brandKey }, isActive: true },
    include: PRODUCT_INCLUDE,
  })
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Marka'ya ait aktif ürünlerin tamamı */
export async function getProductsByBrand(brandKey: string): Promise<Product[]> {
  const rows = await prisma.product.findMany({
    where: { brand: { key: brandKey }, isActive: true },
    include: PRODUCT_INCLUDE,
    orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
  })
  return rows.map(toProduct)
}

/** Tek ürün: slug + marka anahtarıyla */
export async function getProductBySlug(slug: string, brandKey: string): Promise<Product | null> {
  const row = await fetchOne(slug, brandKey)
  return row ? toProduct(row) : null
}

/** Anasayfa için öne çıkan ürünler */
export async function getFeaturedProducts(brandKey: string, limit = 6): Promise<Product[]> {
  const rows = await prisma.product.findMany({
    where: { brand: { key: brandKey }, isActive: true, isFeatured: true },
    take: limit,
    include: PRODUCT_INCLUDE,
    orderBy: { createdAt: 'desc' },
  })
  return rows.map(toProduct)
}

/** Aynı kategorideki benzer ürünler (ürün detay sayfası için) */
export async function getRelatedProducts(
  categoryId: number,
  brandKey: string,
  excludeSlug: string,
  limit = 4,
): Promise<Product[]> {
  const rows = await prisma.product.findMany({
    where: {
      brand: { key: brandKey },
      categoryId,
      isActive: true,
      NOT: { slug: excludeSlug },
    },
    take: limit,
    include: PRODUCT_INCLUDE,
    orderBy: { isFeatured: 'desc' },
  })
  return rows.map(toProduct)
}
