import { IKON_ADLARI, type IconName } from '@/components/ui/Icon'

/**
 * Kategori ikonları — TEK KAYNAK.
 *
 * Kategorilerin ikonu veritabanında (`categories.icon`) emoji olarak
 * duruyordu: 🌿, 💧, 🧪, 🪨, ❄️, 🔌 … Site genelindeki emoji temizliği bunları
 * yakalayamadı, çünkü koddan değil veriden geliyorlar. Burada kategori
 * adresine (slug) bakılarak gerçek ikona çevriliyor; veritabanına dokunmak
 * gerekmiyor.
 *
 * ÜÇ AŞAMALI ÇÖZÜMLEME
 *
 * 1. Tam eşleşme (`ESLEME`).
 * 2. Ön ek atılıp tekrar denenir. Kategoriler zaman içinde `alb-` ve `ithal-`
 *    ön ekleriyle ikiye ayrılmış (`alb-taban-gubresi`, `ithal-taban-gubresi`);
 *    ilk sürümde bu ön ekler hesaba katılmadığı için ALB Tarım tarafındaki
 *    filtrelerin HEPSİ yedek ikona düşüyordu.
 * 3. Anahtar kelime. Yeni bir kategori eklendiğinde (örn. `alb-sivi-gubre-2`)
 *    listeye yazılmasa bile adında "gubre" geçtiği için doğru ikonu alır.
 *
 * Hiçbiri tutmazsa `paket` düşer — boşluk görünmez.
 */

const ESLEME: Record<string, IconName> = {
  // ── Kök kategoriler ────────────────────────────────────────────────────
  'alb-tarim-urunleri': 'filiz',
  'ithal-urunler': 'dunya',
  'toptanci-olunanlar': 'magaza',
  'bayilik-olunanlar': 'magaza',
  ev: 'ev',
  'is-yeri': 'bina',
  'kucuk-ev-aletleri': 'fis',
  'yedek-parca': 'servis',

  // ── Tarım ürün tipleri ─────────────────────────────────────────────────
  // Bu altı kategori ürün listesinde YAN YANA rozet olarak çıkıyor; her birine
  // ayrı ikon verilmesi şart, yoksa filtre satırı tek tip görünüyor.
  gubreler: 'filiz',
  'taban-gubresi': 'toprak',
  'toprak-iyilestirici': 'katman',
  toprak: 'toprak',
  'damla-sulama-gubreleri': 'damla',
  'yaprak-gubreleri': 'yaprak',
  'mikro-elementler': 'analiz',
  'sivi-gubreler-amino': 'molekul',
  'deniz-yosunu-organik': 'yosun',
  'diger-ithal-urunler': 'paket',
  sulama: 'damla',
  ilac: 'analiz',

  // ── Tedarikçi markaları ────────────────────────────────────────────────
  'timac-agro': 'fabrika',
  bazachem: 'kalite',
  'haifa-cal': 'kalite',
  stoller: 'kalite',
  'atlantica-agricola': 'kalite',
  unittar: 'kalite',
  'lances-link': 'zincir',
  lebosol: 'molekul',
  tamagro: 'kalite',

  // ── Su teknolojileri ───────────────────────────────────────────────────
  'ev-su-aritma': 'damla',
  'ev-su-yumusatma': 'damla',
  'is-yeri-yumusatma': 'damla',
  'ev-su-isitici': 'alev',
  'ticari-boiler': 'alev',
  'su-sebili': 'dus',
  'ev-su-sebili': 'bardak',
  endustriyel: 'fabrika',
  filtre: 'civata',
  klima: 'iklim',
  vantilator: 'fan',
  temizlik: 'temizlik',
  supurge: 'temizlik',
  'basincli-yikayici': 'temizlik',
  'hava-temizleyici': 'iklim',
}

/** Kategoriler zamanla bu ön eklerle ikiye ayrıldı; ikon aynı kalmalı */
const ON_EKLER = ['alb-', 'ithal-', 'ev-', 'is-yeri-']

/** Listede olmayan kategoriler için ad tabanlı tahmin (sıra önemli) */
const ANAHTARLAR: [RegExp, IconName][] = [
  [/isitici|boiler|sofben|kombi/, 'alev'],
  [/sebil/, 'dus'],
  [/klima/, 'iklim'],
  [/vantilator|fan/, 'fan'],
  [/temizlik|supurge|yikayici|basincli/, 'temizlik'],
  [/filtre|membran/, 'civata'],
  [/endustriyel|fabrika/, 'fabrika'],
  [/amino|molekul/, 'molekul'],
  [/element|ilac|analiz|kimya/, 'analiz'],
  [/yosun|deniz|alg/, 'yosun'],
  [/iyilestirici|katman|kompost|humik/, 'katman'],
  [/toprak/, 'toprak'],
  [/yaprak|foliar/, 'yaprak'],
  [/gubre|organik|tohum|fide/, 'filiz'],
  [/su|sulama|yumusatma|aritma|damla/, 'damla'],
  [/parca|aksesuar|yedek/, 'servis'],
  [/aletleri|elektronik/, 'fis'],
]

/**
 * Kategori için ikon adı döndürür.
 *
 * @param slug   Kategori adresi (örn. "alb-damla-sulama-gubreleri")
 * @param dbIcon Veritabanındaki `icon` değeri; ileride ikon adı tutarsa kullanılır
 */
export function categoryIcon(
  slug: string | null | undefined,
  dbIcon?: string | null,
): IconName {
  // Veritabanına emoji değil GEÇERLİ bir ikon adı yazılmışsa ona öncelik ver.
  // Listede olmayan bir ad (örn. "leaf") kabul edilirse ikon hiç çizilmez,
  // rozette boşluk kalır; o yüzden burada doğrulanıyor.
  if (dbIcon && IKON_ADLARI.has(dbIcon)) return dbIcon as IconName

  if (!slug) return 'paket'

  if (ESLEME[slug]) return ESLEME[slug]

  for (const on of ON_EKLER) {
    if (slug.startsWith(on)) {
      const kalan = slug.slice(on.length)
      if (ESLEME[kalan]) return ESLEME[kalan]
    }
  }

  for (const [kalip, ikon] of ANAHTARLAR) {
    if (kalip.test(slug)) return ikon
  }

  return 'paket'
}
