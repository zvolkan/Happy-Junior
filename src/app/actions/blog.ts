'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import { verifyAdminToken } from '@/lib/admin-auth'
import { sanitizeBlogHtml } from '@/lib/sanitize'
import { slugify } from '@/lib/utils'
import type { BlogActionResult } from '@/lib/blog'

/**
 * Blog yazısı yönetimi.
 *
 * Blog içerikleri örnek veriden geliyordu ve gövdeleri boştu
 * (`<!-- Makale içeriği sonradan eklenecek -->`). Yönetim ekranı olmadığı için
 * yayına alınamıyordu; menüden de bu yüzden kaldırılmıştı.
 */

const ADMIN_COOKIE = 'admin_session'

async function requireAdmin(): Promise<void> {
  const cookieStore = await cookies()
  if (!(await verifyAdminToken(cookieStore.get(ADMIN_COOKIE)?.value))) {
    throw new Error('Yetkisiz erişim: admin oturumu gerekli')
  }
}

function parseForm(formData: FormData) {
  const text = (key: string, max: number) =>
    ((formData.get(key) as string | null) ?? '').trim().slice(0, max)

  const title = text('title', 200)
  // Gövde HTML kabul ediyor; veritabanına GİRMEDEN beyaz listeye indirgeniyor.
  // Uzunluk sınırı temizlikten SONRA uygulanıyor ki kırpma yarım etiket bırakmasın.
  const content = sanitizeBlogHtml(
    ((formData.get('content') as string | null) ?? '').trim(),
  ).slice(0, 60_000)
  const rawSlug = text('slug', 220)

  if (title.length < 3) throw new Error('Başlık en az 3 karakter olmalıdır.')
  if (content.length < 20) throw new Error('İçerik en az 20 karakter olmalıdır.')

  const brandId = Number(formData.get('brandId'))
  if (!Number.isInteger(brandId) || brandId <= 0) throw new Error('Marka seçilmedi.')

  const isPublished = formData.get('isPublished') === 'true'

  return {
    brandId,
    title,
    slug: slugify(rawSlug || title).slice(0, 220),
    excerpt: text('excerpt', 500) || null,
    content,
    category: text('category', 80) || null,
    coverImage: text('coverImage', 500) || null,
    author: text('author', 120) || null,
    isPublished,
    // Yayına ilk alındığı an tarih damgası; taslağa çekilirse korunur
    publishedAt: isPublished ? new Date() : null,
  }
}

function friendlyError(error: unknown): string {
  const message = error instanceof Error ? error.message : ''
  if (message.includes('Unique constraint') || message.includes('slug')) {
    return 'Bu adres (slug) başka bir yazıda kullanılıyor. Farklı bir başlık veya adres girin.'
  }
  return message || 'İşlem tamamlanamadı.'
}

// ─── Liste / tekil ───────────────────────────────────────────────────────────

export async function getBlogPostsForAdmin(brandKey?: string) {
  await requireAdmin()

  return prisma.blogPost.findMany({
    where: brandKey ? { brand: { key: brandKey } } : undefined,
    orderBy: [{ isPublished: 'asc' }, { updatedAt: 'desc' }],
    select: {
      id: true,
      title: true,
      slug: true,
      category: true,
      isPublished: true,
      publishedAt: true,
      updatedAt: true,
      brand: { select: { key: true, name: true } },
    },
  })
}

export async function getBlogPostForEdit(id: string) {
  await requireAdmin()
  return prisma.blogPost.findUnique({ where: { id } })
}

// ─── Oluştur / güncelle / sil ────────────────────────────────────────────────

export async function createBlogPost(formData: FormData): Promise<BlogActionResult> {
  await requireAdmin()

  try {
    const data = parseForm(formData)
    const post = await prisma.blogPost.create({ data, select: { id: true } })

    revalidatePath('/admin/alb-tarim/blog')
revalidatePath('/admin/alb-su-aritma/blog')
    revalidatePath('/alb-tarim/blog')
    revalidatePath('/alb-su-aritma/blog')

    return { ok: true, id: post.id, message: 'Yazı oluşturuldu.' }
  } catch (error) {
    console.error('[blog] oluşturulamadı:', error)
    return { ok: false, error: friendlyError(error) }
  }
}

export async function updateBlogPost(id: string, formData: FormData): Promise<BlogActionResult> {
  await requireAdmin()

  try {
    const data = parseForm(formData)

    // Daha önce yayınlanmışsa ilk yayın tarihini koru
    const existing = await prisma.blogPost.findUnique({
      where: { id },
      select: { publishedAt: true },
    })

    await prisma.blogPost.update({
      where: { id },
      data: {
        ...data,
        publishedAt: data.isPublished ? (existing?.publishedAt ?? new Date()) : null,
      },
    })

    revalidatePath('/admin/alb-tarim/blog')
revalidatePath('/admin/alb-su-aritma/blog')
    revalidatePath('/alb-tarim/blog')
    revalidatePath('/alb-su-aritma/blog')

    return { ok: true, id, message: 'Yazı güncellendi.' }
  } catch (error) {
    console.error('[blog] güncellenemedi:', id, error)
    return { ok: false, error: friendlyError(error) }
  }
}

export async function deleteBlogPost(id: string): Promise<BlogActionResult> {
  await requireAdmin()

  try {
    await prisma.blogPost.delete({ where: { id } })

    revalidatePath('/admin/alb-tarim/blog')
revalidatePath('/admin/alb-su-aritma/blog')
    revalidatePath('/alb-tarim/blog')
    revalidatePath('/alb-su-aritma/blog')

    return { ok: true, id, message: 'Yazı silindi.' }
  } catch (error) {
    console.error('[blog] silinemedi:', id, error)
    return { ok: false, error: friendlyError(error) }
  }
}

/** Yayın durumunu tersine çevirir (liste ekranındaki hızlı düğme) */
export async function toggleBlogPublished(id: string): Promise<BlogActionResult> {
  await requireAdmin()

  try {
    const post = await prisma.blogPost.findUnique({
      where: { id },
      select: { isPublished: true, publishedAt: true },
    })
    if (!post) return { ok: false, error: 'Yazı bulunamadı.' }

    const next = !post.isPublished
    await prisma.blogPost.update({
      where: { id },
      data: {
        isPublished: next,
        publishedAt: next ? (post.publishedAt ?? new Date()) : null,
      },
    })

    revalidatePath('/admin/alb-tarim/blog')
revalidatePath('/admin/alb-su-aritma/blog')
    revalidatePath('/alb-tarim/blog')
    revalidatePath('/alb-su-aritma/blog')

    return { ok: true, id, message: next ? 'Yazı yayına alındı.' : 'Yazı taslağa çekildi.' }
  } catch (error) {
    console.error('[blog] durum değiştirilemedi:', id, error)
    return { ok: false, error: friendlyError(error) }
  }
}
