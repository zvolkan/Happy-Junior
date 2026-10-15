import type { BrandKey } from './types'
import { ACTIVE_BRAND_KEY, BRAND } from './constants'

/**
 * Yönetim paneli kapsamı.
 *
 * ALB'de panel önce marka seçtiriyordu (ALB Tarım / Alb Su). Happy Junior'da tek
 * mağaza var; sorgular yine bir marka anahtarı istediği için kapsam sabit.
 */

export const KAPSAM: BrandKey = ACTIVE_BRAND_KEY

export type Kapsam = BrandKey
export type MarkaKapsam = BrandKey

/** Geriye dönük uyumluluk: kapsam her zaman bir markadır. */
export function markaMi(_kapsam: Kapsam): _kapsam is MarkaKapsam {
  return true
}

export function kapsamAdi(_kapsam?: Kapsam): string {
  return BRAND.name
}

export function kapsamRengi(_kapsam?: Kapsam) {
  return {
    metin: 'text-brand-700',
    arka: 'bg-brand-50',
    kenar: 'border-brand-200',
    dolgu: 'bg-brand-700',
    dolguHover: 'hover:bg-brand-800',
  }
}

export function kapsamYolu(_kapsam: Kapsam, alt = ''): string {
  return `/admin${alt}`
}
