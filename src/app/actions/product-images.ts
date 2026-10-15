'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { verifyAdminToken } from '@/lib/admin-auth'
import { deleteProductImage } from '@/lib/supabase-admin'

/**
 * Ürün görseli yönetimi (çoklu görsel).
 *
 * `ProductImage` modeli baştan beri birden fazla görseli destekliyordu ama
 * admin formu yalnızca TEK görsel yüklüyor, kaydederken de eskileri silip
 * yerine tek görsel koyuyordu. Gübre ve cihaz alıcısı ambalajı, etiketi,
 * analiz belgesini veya kurulumu göremiyordu.
 */

const ADMIN_COOKIE = 'admin_session'
const MAX_IMAGES = 8

async function requireAdmin(): Promise<void> {
  const cookieStore = await cookies()
  if (!(await verifyAdminToken(cookieStore.get(ADMIN_COOKIE)?.value))) {
    throw new Error('Yetkisiz erişim: admin oturumu gerekli')
  }
}

export interface ProductImageDto {
  id: number
  url: string
  altText: string | null
  sortOrder: number
  isPrimary: boolean
}

export type ImageActionResult =
  | { ok: true; images: ProductImageDto[] }
  | { ok: false; error: string }

async function listImages(productId: string): Promise<ProductImageDto[]> {
  return prisma.productImage.findMany({
    where: { productId },
    orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }, { id: 'asc' }],
    select: { id: true, url: true, altText: true, sortOrder: true, isPrimary: true },
  })
}

export async function getProductImages(productId: string): Promise<ProductImageDto[]> {
  await requireAdmin()
  return listImages(productId)
}

/** Yeni görsel ekler. İlk görsel otomatik olarak kapak olur. */
export async function addProductImage(
  productId: string,
  url: string,
  altText?: string,
): Promise<ImageActionResult> {
  await requireAdmin()

  const cleanUrl = url.trim()
  if (!cleanUrl) return { ok: false, error: 'Görsel adresi boş olamaz.' }
  if (cleanUrl.length > 500) return { ok: false, error: 'Görsel adresi çok uzun.' }
  // Şema doğrulaması: eskiden `javascript:` veya `data:` şemalı adres de kabul
  // ediliyordu. Yalnızca https ve site-içi mutlak yol geçerli.
  if (!/^(https:\/\/|\/)/i.test(cleanUrl) || /^\/\//.test(cleanUrl)) {
    return { ok: false, error: 'Geçersiz görsel adresi. https:// ile başlamalı.' }
  }

  try {
    const count = await prisma.productImage.count({ where: { productId } })
    if (count >= MAX_IMAGES) {
      return { ok: false, error: `Bir ürüne en fazla ${MAX_IMAGES} görsel eklenebilir.` }
    }

    // Aynı görsel iki kez eklenmesin
    const existing = await prisma.productImage.findFirst({
      where: { productId, url: cleanUrl },
      select: { id: true },
    })
    if (existing) return { ok: false, error: 'Bu görsel zaten ekli.' }

    await prisma.productImage.create({
      data: {
        productId,
        url: cleanUrl,
        altText: altText?.trim().slice(0, 255) || null,
        sortOrder: count,
        isPrimary: count === 0, // ilk görsel kapak
      },
    })

    revalidatePath('/admin/alb-tarim/urunler')
revalidatePath('/admin/alb-su-aritma/urunler')
    return { ok: true, images: await listImages(productId) }
  } catch (error) {
    console.error('[görsel] eklenemedi:', productId, error)
    return { ok: false, error: 'Görsel eklenemedi. Lütfen tekrar deneyin.' }
  }
}

/** Görseli siler. Kapak silinirse sıradaki görsel kapak olur. */
export async function removeProductImage(imageId: number): Promise<ImageActionResult> {
  await requireAdmin()

  try {
    const image = await prisma.productImage.findUnique({
      where: { id: imageId },
      select: { id: true, url: true, productId: true, isPrimary: true },
    })
    if (!image) return { ok: false, error: 'Görsel bulunamadı.' }

    await prisma.productImage.delete({ where: { id: imageId } })

    // Kapak silindiyse kalanlardan ilkini kapak yap
    if (image.isPrimary) {
      const next = await prisma.productImage.findFirst({
        where: { productId: image.productId },
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
        select: { id: true },
      })
      if (next) {
        await prisma.productImage.update({ where: { id: next.id }, data: { isPrimary: true } })
      }
    }

    // Supabase Storage'daki dosyayı da temizle (public/ içindekilere dokunma)
    if (image.url.includes('supabase')) {
      const fileName = image.url.split('/').pop()
      if (fileName) await deleteProductImage(fileName).catch(() => {})
    }

    revalidatePath('/admin/alb-tarim/urunler')
revalidatePath('/admin/alb-su-aritma/urunler')
    return { ok: true, images: await listImages(image.productId) }
  } catch (error) {
    console.error('[görsel] silinemedi:', imageId, error)
    return { ok: false, error: 'Görsel silinemedi.' }
  }
}

/** Kapak görselini değiştirir */
export async function setPrimaryImage(imageId: number): Promise<ImageActionResult> {
  await requireAdmin()

  try {
    const image = await prisma.productImage.findUnique({
      where: { id: imageId },
      select: { productId: true },
    })
    if (!image) return { ok: false, error: 'Görsel bulunamadı.' }

    await prisma.$transaction([
      prisma.productImage.updateMany({
        where: { productId: image.productId },
        data: { isPrimary: false },
      }),
      prisma.productImage.update({ where: { id: imageId }, data: { isPrimary: true } }),
    ])

    revalidatePath('/admin/alb-tarim/urunler')
revalidatePath('/admin/alb-su-aritma/urunler')
    return { ok: true, images: await listImages(image.productId) }
  } catch (error) {
    console.error('[görsel] kapak değiştirilemedi:', imageId, error)
    return { ok: false, error: 'Kapak görseli değiştirilemedi.' }
  }
}

/** Görselleri verilen sıraya göre yeniden dizer */
export async function reorderProductImages(
  productId: string,
  orderedIds: number[],
): Promise<ImageActionResult> {
  await requireAdmin()

  try {
    const owned = await prisma.productImage.findMany({
      where: { productId },
      select: { id: true },
    })
    const ownedIds = new Set(owned.map((i: { id: number }) => i.id))

    // Yalnızca bu ürüne ait id'ler kabul edilir
    const valid = orderedIds.filter((id) => ownedIds.has(id))
    if (valid.length === 0) return { ok: false, error: 'Geçersiz sıralama.' }

    await prisma.$transaction(
      valid.map((id, index) =>
        prisma.productImage.update({ where: { id }, data: { sortOrder: index } }),
      ),
    )

    revalidatePath('/admin/alb-tarim/urunler')
revalidatePath('/admin/alb-su-aritma/urunler')
    return { ok: true, images: await listImages(productId) }
  } catch (error) {
    console.error('[görsel] sıralanamadı:', productId, error)
    return { ok: false, error: 'Sıralama kaydedilemedi.' }
  }
}
