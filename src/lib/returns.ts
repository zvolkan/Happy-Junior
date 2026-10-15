/**
 * İade (cayma hakkı) yardımcıları.
 *
 * Bunlar `actions/returns.ts` içindeydi ama `'use server'` dosyaları yalnızca
 * async fonksiyon export edebiliyor; sabitler ve senkron yardımcılar derlemeyi
 * kırıyordu. Buraya taşındı.
 */

/** Cayma hakkı süresi — Mesafeli Sözleşmeler Yönetmeliği md. 9 */
export const CAYMA_GUN = 14

export type ReturnActionResult = { ok: true; message: string } | { ok: false; error: string }

/** Kalan cayma hakkı gün sayısı. Süre dolduysa 0. */
export function remainingReturnDays(deliveredAt: Date | null): number {
  if (!deliveredAt) return 0
  const elapsed = (Date.now() - new Date(deliveredAt).getTime()) / 86_400_000
  return Math.max(0, Math.ceil(CAYMA_GUN - elapsed))
}
