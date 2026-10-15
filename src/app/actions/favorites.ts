'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'

/**
 * Favoriler.
 *
 * Eskiden ProductCard'daki kalp yalnızca `useState` ile çalışıyordu; sayfa
 * yenilenince kayboluyordu ve /hesabim/favorilerim herkese aynı 3 sahte ürünü
 * gösteriyordu. Artık Favorite tablosuna yazılıyor.
 */

async function getUserId(): Promise<string | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user?.id ?? null
}

export type ToggleFavoriteResult =
  | { ok: true; isFavorite: boolean }
  | { ok: false; reason: 'auth' | 'error' }

/** Favoriye ekler veya çıkarır. Dönen değer son durumu bildirir. */
export async function toggleFavorite(productId: string): Promise<ToggleFavoriteResult> {
  const userId = await getUserId()
  if (!userId) return { ok: false, reason: 'auth' }

  if (!productId || typeof productId !== 'string') {
    return { ok: false, reason: 'error' }
  }

  try {
    const existing = await prisma.favorite.findUnique({
      where: { userId_productId: { userId, productId } },
      select: { id: true },
    })

    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } })
      revalidatePath('/hesabim/favorilerim')
      return { ok: true, isFavorite: false }
    }

    // Ürün gerçekten var mı?
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    })
    if (!product) return { ok: false, reason: 'error' }

    await prisma.favorite.create({ data: { userId, productId } })
    revalidatePath('/hesabim/favorilerim')
    return { ok: true, isFavorite: true }
  } catch (error) {
    console.error('[favorites] toggle hatası:', error)
    return { ok: false, reason: 'error' }
  }
}

/** Favoriden çıkarır (favoriler sayfasındaki "kaldır" butonu için) */
export async function removeFavorite(productId: string): Promise<{ ok: boolean }> {
  const userId = await getUserId()
  if (!userId) return { ok: false }

  try {
    await prisma.favorite.deleteMany({ where: { userId, productId } })
    revalidatePath('/hesabim/favorilerim')
    return { ok: true }
  } catch (error) {
    console.error('[favorites] silme hatası:', error)
    return { ok: false }
  }
}

/** Kullanıcının favori ürün id'leri — kart listelerinde kalbi dolu göstermek için */
// ─── Kullanılmayan favori sorguları KALDIRILDI ───────────────────────────────
//
// `getFavoriteIds` ve `getFavoriteProducts` çağrılmıyordu; favoriler sayfası
// Prisma'yı doğrudan kullanıyor.

/**
 * Giriş yapmış kullanıcının favori ürün kimlikleri.
 *
 * Buton eskiden her zaman `initial = false` ile başlıyordu ve iki kullanım
 * yerinin ikisi de bu prop'u geçmiyordu; ürün sorgularında favori bilgisi hiç
 * okunmuyordu. Sonuç: zaten favorilenmiş ürünün kalbi BOŞ görünüyor, kullanıcı
 * "ekleyeyim" diye basınca `toggleFavorite` mevcut kaydı SİLİYORDU. Kullanıcıya
 * buton bozukmuş gibi geliyor ve favorisi sessizce kayboluyordu.
 *
 * Sayfadaki bütün butonlar bu listeyi bir kez çekip paylaşıyor (bkz.
 * `FavoriteButton`), yani ürün başına ek sorgu yok.
 *
 * Yalnızca oturumdaki kullanıcının verisini döner; kimlik dışarıdan alınmaz.
 */
export async function getMyFavoriteIds(): Promise<string[]> {
  const userId = await getUserId()
  if (!userId) return []

  try {
    const rows = await prisma.favorite.findMany({
      where: { userId },
      select: { productId: true },
      take: 500,
    })
    return rows.map((r: { productId: string }) => r.productId)
  } catch (error) {
    console.error('[favorites] liste alınamadı:', error)
    return []
  }
}
