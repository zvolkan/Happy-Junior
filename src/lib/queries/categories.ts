import { prisma } from '@/lib/db'
import type { Category, BrandKey } from '@/lib/types'

function toCategory(c: {
  id: number
  name: string
  slug: string
  description: string | null
  icon: string | null
  imageUrl: string | null
  sortOrder: number
  parentId: number | null
  brand: { key: string }
  _count?: { products: number }
}): Category {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description ?? undefined,
    icon: c.icon ?? undefined,
    image: c.imageUrl ?? undefined,
    brand: c.brand.key as BrandKey,
    parentId: c.parentId ?? undefined,
    sortOrder: c.sortOrder,
    productCount: c._count?.products,
  }
}

/**
 * Marka'ya ait tüm aktif kategoriler (düz liste — hem parent hem child).
 * parentId alanı dahil edilir; UI tarafı hiyerarşiyi buradan çıkarır.
 */
export async function getCategoriesByBrand(brandKey: string): Promise<Category[]> {
  const rows = await prisma.category.findMany({
    where: { brand: { key: brandKey }, isActive: true },
    include: {
      brand: true,
      _count: {
        select: { products: { where: { isActive: true } } },
      },
    },
    orderBy: { sortOrder: 'asc' },
  })
  return rows.map(toCategory)
}

/**
 * Parent-child hiyerarşisi ile kategori listesi.
 * Sadece kök (parentId null) kategoriler döner; her birinin children alanı dolu olur.
 */
export async function getCategoriesWithChildren(brandKey: string): Promise<Category[]> {
  const rows = await prisma.category.findMany({
    where: { brand: { key: brandKey }, isActive: true, parentId: null },
    include: {
      brand: true,
      _count: { select: { products: { where: { isActive: true } } } },
      children: {
        where: { isActive: true },
        include: {
          brand: true,
          _count: { select: { products: { where: { isActive: true } } } },
        },
        orderBy: { sortOrder: 'asc' },
      },
    },
    orderBy: { sortOrder: 'asc' },
  })

  return rows.map((r) => ({
    ...toCategory(r),
    children: r.children.map((c) => toCategory(c as typeof r)),
  }))
}
