'use client'

import { getMyFavoriteIds } from '@/app/actions/favorites'

/**
 * Sayfadaki bütün favori butonlarının paylaştığı tek liste.
 *
 * Buton başına ayrı sorgu atmamak için istek bir kez yapılıp söz (promise)
 * saklanıyor. Ürün listesinde 24 kart varken 24 değil 1 istek gider.
 */

let sozu: Promise<Set<string>> | null = null
let kume: Set<string> | null = null

export function favorileriYukle(): Promise<Set<string>> {
  if (kume) return Promise.resolve(kume)
  if (!sozu) {
    sozu = getMyFavoriteIds()
      .then((ids) => {
        kume = new Set(ids)
        return kume
      })
      .catch(() => {
        // Hata durumunda boş küme; buton yine de çalışır
        sozu = null
        return new Set<string>()
      })
  }
  return sozu
}

/** Kullanıcı bir ürünü ekleyip çıkardığında önbelleği güncel tut */
export function favoriDurumunuYaz(productId: string, favori: boolean): void {
  if (!kume) return
  if (favori) kume.add(productId)
  else kume.delete(productId)
}
