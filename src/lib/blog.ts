import { prisma } from '@/lib/db'

/**
 * Blog sorguları ve ortak tipler.
 *
 * `'use server'` dosyaları yalnızca async fonksiyon export edebildiği için
 * tipler ve senkron yardımcılar burada duruyor.
 */

export type BlogActionResult =
  | { ok: true; id: string; message: string }
  | { ok: false; error: string }

export interface BlogListItem {
  id: string
  title: string
  slug: string
  excerpt: string | null
  category: string | null
  coverImage: string | null
  author: string | null
  publishedAt: Date | null
}

/** Yayındaki yazılar — markaya göre */
export async function getPublishedPosts(brandKey: string, limit?: number): Promise<BlogListItem[]> {
  return prisma.blogPost.findMany({
    where: { isPublished: true, brand: { key: brandKey } },
    orderBy: { publishedAt: 'desc' },
    take: limit,
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      category: true,
      coverImage: true,
      author: true,
      publishedAt: true,
    },
  })
}

/** Tek yazı — yalnızca yayında olanlar */
export async function getPublishedPost(brandKey: string, slug: string) {
  return prisma.blogPost.findFirst({
    where: { slug, isPublished: true, brand: { key: brandKey } },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      content: true,
      category: true,
      coverImage: true,
      author: true,
      publishedAt: true,
      // Yapısal veride `dateModified` için gerekiyor: Google güncellenmiş
      // yazıyı ayırt edebilsin.
      updatedAt: true,
    },
  })
}

/** Blogda yayında yazı var mı — menü ve bağlantıları göstermek için */
export async function hasPublishedPosts(brandKey: string): Promise<boolean> {
  const count = await prisma.blogPost.count({
    where: { isPublished: true, brand: { key: brandKey } },
  })
  return count > 0
}

/** Okuma süresi tahmini (dakika) */
export function readingMinutes(content: string): number {
  const words = content.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).length
  return Math.max(1, Math.round(words / 200))
}
