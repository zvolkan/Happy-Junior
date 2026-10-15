import { IKON_ADLARI, type IconName } from '@/components/ui/Icon'

/**
 * Kategori ikonları — TEK KAYNAK.
 *
 * Kategori adresine (slug) bakılarak ikon seçilir: önce tam eşleşme, sonra
 * anahtar kelime. Hiçbiri tutmazsa `paket` düşer.
 *
 * TODO(tasarım): çocuk giyimine özel ikon seti (zıbın, elbise, ayakkabı…)
 * Icon.tsx'e eklendiğinde buradaki eşleşmeler güncellenecek.
 */

const ESLEME: Record<string, IconName> = {
  bebek: 'favori',
  'kiz-cocuk': 'gunes',
  'erkek-cocuk': 'yildiz',
  ayakkabi: 'kargo',
  'arac-gerec': 'bardak',
  oyuncak: 'odul',
}

const ANAHTARLAR: [RegExp, IconName][] = [
  [/bebek|zibin|tulum/, 'favori'],
  [/kiz|elbise/, 'gunes'],
  [/erkek/, 'yildiz'],
  [/ayakkabi|sandalet|bot|terlik/, 'kargo'],
  [/matara|biberon|beslenme|arac|gerec|aksesuar/, 'bardak'],
  [/oyuncak/, 'odul'],
]

/**
 * @param slug   Kategori adresi (örn. "kiz-cocuk-takimlar")
 * @param dbIcon Veritabanındaki `icon` değeri; geçerli bir ikon adıysa o kullanılır
 */
export function categoryIcon(slug: string | null | undefined, dbIcon?: string | null): IconName {
  if (dbIcon && IKON_ADLARI.has(dbIcon)) return dbIcon as IconName
  if (!slug) return 'paket'
  if (ESLEME[slug]) return ESLEME[slug]
  for (const [kalip, ikon] of ANAHTARLAR) {
    if (kalip.test(slug)) return ikon
  }
  return 'paket'
}
