import type { BrandKey } from './types'
import { BRANDS } from './constants'

/**
 * Yönetim panelinin marka kapsamı — TEK KAYNAK.
 *
 * Panel eskiden iki markanın kayıtlarını tek listede karıştırıyordu: sipariş
 * listesinde ALB Tarım ve Alb Su siparişleri iç içeydi, blog yazıları da öyle.
 * Artık panele girince önce marka seçiliyor, sonraki her ekran o markaya ait
 * kayıtları gösteriyor.
 *
 * Üçüncü bir kapsam var: `belirtilmemis`. Grup (Bayırlıoğlu) iletişim
 * formundan gelen mesajların markası boş kalıyor; bunlar hiçbir markanın
 * listesine düşmeyip kaybolmasın diye ayrı kapsamda toplanıyor.
 */

export const KAPSAMLAR = ['alb-tarim', 'alb-su-aritma', 'belirtilmemis'] as const

export type Kapsam = (typeof KAPSAMLAR)[number]

/** Marka kapsamları (belirtilmemiş hariç) */
export type MarkaKapsam = Exclude<Kapsam, 'belirtilmemis'>

export function gecerliKapsam(deger: string | undefined | null): Kapsam | null {
  return KAPSAMLAR.includes(deger as Kapsam) ? (deger as Kapsam) : null
}

/** `belirtilmemis` bir marka değil; marka gerektiren sorgularda ayırmak için */
export function markaMi(kapsam: Kapsam): kapsam is MarkaKapsam {
  return kapsam !== 'belirtilmemis'
}

export function kapsamAdi(kapsam: Kapsam): string {
  if (kapsam === 'belirtilmemis') return 'Belirtilmemiş'
  return BRANDS[kapsam as BrandKey].name
}

/** Sekme/başlık rengi — iki marka panelinin karışmaması için */
export function kapsamRengi(kapsam: Kapsam): {
  metin: string
  arka: string
  kenar: string
  dolgu: string
  dolguHover: string
} {
  if (kapsam === 'alb-tarim') {
    return {
      metin: 'text-green-700',
      arka: 'bg-green-50',
      kenar: 'border-green-200',
      dolgu: 'bg-green-700',
      dolguHover: 'hover:bg-green-800',
    }
  }
  if (kapsam === 'alb-su-aritma') {
    return {
      metin: 'text-blue-700',
      arka: 'bg-blue-50',
      kenar: 'border-blue-200',
      dolgu: 'bg-blue-700',
      dolguHover: 'hover:bg-blue-800',
    }
  }
  return {
    metin: 'text-gray-700',
    arka: 'bg-gray-50',
    kenar: 'border-gray-200',
    dolgu: 'bg-gray-800',
    dolguHover: 'hover:bg-gray-900',
  }
}

/**
 * Bayi başvurusu formunda "Her İkisi" seçeneği var; o başvurular iki markanın
 * listesinde de görünmeli, yoksa yalnızca birinde çıkıp diğerinde kaybolur.
 */
export const HER_IKISI = 'her-ikisi'

export function kapsamYolu(kapsam: Kapsam, alt = ''): string {
  return `/admin/${kapsam}${alt}`
}
