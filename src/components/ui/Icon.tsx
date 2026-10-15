import { cn } from '@/lib/utils'

/**
 * İkon seti — TEK KAYNAK.
 *
 * Site genelinde ikon yerine emoji kullanılıyordu (📦, 🌾, 🚚, 🔬 …).
 * Emoji ikon değildir: her işletim sisteminde farklı çizilir, kurumsal
 * renkleri almaz, boyutu satır yüksekliğine bağlıdır ve bir kataloğun
 * yanında amatör durur. Ayrıca ekran okuyucular emojiyi ad olarak okur
 * ("paket kutusu"), bu da gereksiz gürültü yaratır.
 *
 * Buradaki ikonlar 24×24 çizgi (stroke) ikonlardır: rengi `currentColor`dan
 * alırlar, yani markanın yeşiline/mavisine kendiliğinden uyarlar.
 *
 * Kullanım:
 *   <Icon name="kargo" className="w-5 h-5 text-brand-600" />
 *
 * Yeni ikon eklerken: 24×24 kutu, yalnızca çizgi (dolgu yok), 1.75 kalınlık.
 */

export type IconName =
  | 'paket' | 'damla' | 'filiz' | 'kargo' | 'onay' | 'onay-daire' | 'telefon'
  | 'kullanici' | 'konum' | 'analiz' | 'cikis' | 'ev' | 'servis' | 'bina'
  | 'belge' | 'yenile' | 'traktor' | 'sepet' | 'uyari' | 'hedef' | 'kalite'
  | 'odul' | 'favori' | 'kapat' | 'fiyat' | 'eposta' | 'arama' | 'kilit'
  | 'fikir' | 'egitim' | 'saat' | 'garanti' | 'bardak' | 'gunes'
  | 'vizyon' | 'gida' | 'otel' | 'sera' | 'yazi' | 'yazar' | 'yildiz'
  | 'iklim' | 'fabrika' | 'yasak' | 'kalp-bos' | 'ok-sag'
  // Kategori ikonları (veritabanındaki emojilerin yerine)
  | 'alev' | 'dus' | 'temizlik' | 'fan' | 'fis' | 'civata'
  | 'dunya' | 'magaza' | 'toprak' | 'molekul' | 'zincir'
  | 'katman' | 'yaprak' | 'yosun'

interface Props {
  name: IconName
  className?: string
  /** Anlamı yazıyla da veriliyorsa true bırakın — ekran okuyucu tekrar etmesin */
  decorative?: boolean
  label?: string
}

const P: Record<IconName, React.ReactNode> = {
  paket: (
    <>
      <path d="M21 8.5v7a1.5 1.5 0 0 1-.79 1.32l-7 3.82a1.5 1.5 0 0 1-1.42 0l-7-3.82A1.5 1.5 0 0 1 3 15.5v-7" />
      <path d="M3.4 7.6 12 3l8.6 4.6L12 12.2 3.4 7.6Z" />
      <path d="M12 12.2V21" />
    </>
  ),
  damla: <path d="M12 3s5.5 5.6 5.5 9.6a5.5 5.5 0 0 1-11 0C6.5 8.6 12 3 12 3Z" />,
  filiz: (
    <>
      <path d="M12 21v-8" />
      <path d="M12 13c0-3.3 2.4-6 5.5-6 0 3.3-2.4 6-5.5 6Z" />
      <path d="M12 15c0-2.8-2-5-4.5-5 0 2.8 2 5 4.5 5Z" />
    </>
  ),
  kargo: (
    <>
      <path d="M3 6.5h10v9H3z" />
      <path d="M13 9.5h4l3 3v3h-7z" />
      <circle cx="7" cy="17.5" r="1.8" />
      <circle cx="17" cy="17.5" r="1.8" />
    </>
  ),
  onay: <path d="M4.5 12.5 9.5 17.5 19.5 7" />,
  'onay-daire': (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.2 12.3 11 15l5-5.5" />
    </>
  ),
  telefon: (
    <path d="M6.2 3.5h3l1.4 3.6-1.9 1.4a11.5 11.5 0 0 0 5.3 5.3l1.4-1.9 3.6 1.4v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.2 5.7a2 2 0 0 1 2-2.2Z" />
  ),
  kullanici: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.8 20a7.3 7.3 0 0 1 14.4 0" />
    </>
  ),
  konum: (
    <>
      <path d="M12 21s6.5-5.6 6.5-11a6.5 6.5 0 1 0-13 0c0 5.4 6.5 11 6.5 11Z" />
      <circle cx="12" cy="10" r="2.4" />
    </>
  ),
  analiz: (
    <>
      <path d="M9.5 3v6.2L5 17.5A2 2 0 0 0 6.8 20.5h10.4A2 2 0 0 0 19 17.5l-4.5-8.3V3" />
      <path d="M8.5 3h7" />
      <path d="M7.4 14h9.2" />
    </>
  ),
  cikis: (
    <>
      <path d="M14 4.5H6.5A1.5 1.5 0 0 0 5 6v12a1.5 1.5 0 0 0 1.5 1.5H14" />
      <path d="M16.5 8.5 20 12l-3.5 3.5" />
      <path d="M20 12h-9" />
    </>
  ),
  ev: (
    <>
      <path d="M4 10.5 12 4l8 6.5" />
      <path d="M6 10v9.5h12V10" />
      <path d="M10 19.5v-5h4v5" />
    </>
  ),
  servis: (
    <>
      <path d="M15.2 4.6a4.2 4.2 0 0 0-5 5.4L4.6 15.6a2 2 0 1 0 2.8 2.8L13 12.8a4.2 4.2 0 0 0 5.4-5l-2.6 2.6-2.2-2.2 2.6-2.6Z" />
    </>
  ),
  bina: (
    <>
      <path d="M4.5 20.5V5.5A1 1 0 0 1 5.5 4.5h7a1 1 0 0 1 1 1v15" />
      <path d="M13.5 10.5h5a1 1 0 0 1 1 1v9" />
      <path d="M3 20.5h18" />
      <path d="M7.5 8h3M7.5 11.5h3M7.5 15h3M16 14h1M16 17h1" />
    </>
  ),
  belge: (
    <>
      <path d="M8 4.5H6.5a1.5 1.5 0 0 0-1.5 1.5v13a1.5 1.5 0 0 0 1.5 1.5h11a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H16" />
      <rect x="8" y="2.8" width="8" height="3.4" rx="1" />
      <path d="M8.5 11h7M8.5 14.5h7M8.5 18h4" />
    </>
  ),
  yenile: (
    <>
      <path d="M20 12a8 8 0 1 1-2.5-5.8" />
      <path d="M20 4v4.5h-4.5" />
    </>
  ),
  traktor: (
    <>
      <path d="M4 14.5V8.5h5l2 4h4" />
      <circle cx="7.5" cy="17" r="3" />
      <circle cx="17" cy="16" r="4" />
      <path d="M13 8.5h4v4" />
    </>
  ),
  sepet: (
    <>
      <path d="M3 4.5h2.2l2.4 10.4a1.5 1.5 0 0 0 1.5 1.1h7.6a1.5 1.5 0 0 0 1.5-1.1L20 8H6" />
      <circle cx="10" cy="20" r="1.4" />
      <circle cx="17" cy="20" r="1.4" />
    </>
  ),
  uyari: (
    <>
      <path d="M12 4.2 21 19.5H3L12 4.2Z" />
      <path d="M12 10v4" />
      <circle cx="12" cy="17" r=".6" fill="currentColor" stroke="none" />
    </>
  ),
  hedef: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r=".8" fill="currentColor" stroke="none" />
    </>
  ),
  kalite: (
    <>
      <path d="M12 3.5 5 8v8l7 4.5 7-4.5V8l-7-4.5Z" />
      <path d="M9 12l2.2 2.2L15.5 10" />
    </>
  ),
  odul: (
    <>
      <circle cx="12" cy="9" r="5.5" />
      <path d="M8.5 13.5 7 21l5-2.5L17 21l-1.5-7.5" />
    </>
  ),
  favori: (
    <path d="M12 20s-7.5-4.6-7.5-9.6a4.1 4.1 0 0 1 7.5-2.3 4.1 4.1 0 0 1 7.5 2.3C19.5 15.4 12 20 12 20Z" />
  ),
  'kalp-bos': (
    <path d="M12 20s-7.5-4.6-7.5-9.6a4.1 4.1 0 0 1 7.5-2.3 4.1 4.1 0 0 1 7.5 2.3C19.5 15.4 12 20 12 20Z" />
  ),
  kapat: <path d="M6 6l12 12M18 6 6 18" />,
  fiyat: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M14.5 9.2a2.8 2.8 0 0 0-2.5-1.2c-1.6 0-2.6.8-2.6 2 0 2.8 5.4 1.4 5.4 4.2 0 1.3-1.1 2.2-2.8 2.2a3 3 0 0 1-2.7-1.4" />
      <path d="M12 6.4v11.2" />
    </>
  ),
  eposta: (
    <>
      <rect x="3" y="5.5" width="18" height="13" rx="1.8" />
      <path d="m3.8 7 7.3 5.2a1.5 1.5 0 0 0 1.8 0L20.2 7" />
    </>
  ),
  arama: (
    <>
      <circle cx="10.8" cy="10.8" r="6.3" />
      <path d="m15.6 15.6 4.4 4.4" />
    </>
  ),
  kilit: (
    <>
      <rect x="4.5" y="10.5" width="15" height="9.5" rx="2" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    </>
  ),
  fikir: (
    <>
      <path d="M9 17h6" />
      <path d="M10 20h4" />
      <path d="M12 3.5a6 6 0 0 0-3.5 10.8V17h7v-2.7A6 6 0 0 0 12 3.5Z" />
    </>
  ),
  egitim: (
    <>
      <path d="M2.5 8.5 12 4.5l9.5 4-9.5 4-9.5-4Z" />
      <path d="M6.5 10.4V15c0 1.4 2.5 2.6 5.5 2.6s5.5-1.2 5.5-2.6v-4.6" />
      <path d="M21.5 8.5V14" />
    </>
  ),
  saat: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v5.2l3.2 2" />
    </>
  ),
  garanti: (
    <>
      <path d="M12 3.5 5 6.2v5.4c0 4.2 2.9 7.5 7 8.9 4.1-1.4 7-4.7 7-8.9V6.2L12 3.5Z" />
      <path d="M9.2 12.2 11.3 14.3 15 10.2" />
    </>
  ),
  bardak: (
    <>
      <path d="M5.5 7.5h11v6a5.5 5.5 0 0 1-11 0v-6Z" />
      <path d="M16.5 9h1.8a2.2 2.2 0 0 1 0 4.4h-1.8" />
      <path d="M4 20.5h14" />
    </>
  ),
  gunes: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.4 5.4l1.7 1.7M16.9 16.9l1.7 1.7M18.6 5.4l-1.7 1.7M7.1 16.9l-1.7 1.7" />
    </>
  ),
  vizyon: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  gida: (
    <>
      <path d="M5 3.5v6a2.5 2.5 0 0 0 5 0v-6" />
      <path d="M7.5 9.5V20.5" />
      <path d="M17.5 3.5c-1.7 0-3 2-3 4.5s1.3 4 3 4v8.5" />
    </>
  ),
  otel: (
    <>
      <path d="M3.5 20.5V9.5L12 4l8.5 5.5v11" />
      <path d="M2.5 20.5h19" />
      <path d="M9.5 20.5v-5h5v5" />
      <path d="M8 11h2M14 11h2" />
    </>
  ),
  sera: (
    <>
      <path d="M3 20.5V10L12 4l9 6v10.5" />
      <path d="M12 4v16.5" />
      <path d="M3 20.5h18" />
      <path d="M7.5 12.5v8M16.5 12.5v8" />
    </>
  ),
  yazi: (
    <>
      <rect x="4" y="3.5" width="16" height="17" rx="2" />
      <path d="M8 8.5h8M8 12h8M8 15.5h5" />
    </>
  ),
  yazar: (
    <>
      <path d="M4 20h4L19.2 8.8a2 2 0 0 0-2.8-2.8L5 17.2 4 20Z" />
      <path d="M15 7.5 17.5 10" />
    </>
  ),
  yildiz: (
    <path d="m12 4 2.5 5.1 5.6.8-4 4 1 5.6-5.1-2.7-5.1 2.7 1-5.6-4-4 5.6-.8L12 4Z" />
  ),
  iklim: (
    <>
      <path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9" />
      <path d="M9.4 5.2 12 3l2.6 2.2M9.4 18.8 12 21l2.6-2.2" />
    </>
  ),
  fabrika: (
    <>
      <path d="M3.5 20.5V11l5 3V11l5 3V8l6.5 3.6v8.9" />
      <path d="M2.5 20.5h19" />
      <path d="M17 15.5h1.5M13 15.5h1.5M9 15.5h1.5" />
    </>
  ),
  yasak: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m6.5 6.5 11 11" />
    </>
  ),
  'ok-sag': <path d="M5 12h13M13 7l5 5-5 5" />,
  alev: (
    <>
      <path d="M12 3s1 3-1.5 5.5S7 13 7 15a5 5 0 0 0 10 0c0-2-1.2-3.5-2.5-5" />
      <path d="M12 20a2.6 2.6 0 0 1-2.6-2.6c0-1.6 2.6-3.7 2.6-3.7s2.6 2.1 2.6 3.7A2.6 2.6 0 0 1 12 20Z" />
    </>
  ),
  dus: (
    <>
      <path d="M7 4.5h6a4 4 0 0 1 4 4v1" />
      <path d="M13 9.5h8" />
      <path d="M5.5 4.5h3" />
      <path d="M15 13v.01M17 15.5v.01M19 13v.01M16 18.5v.01M19.5 18v.01" />
    </>
  ),
  temizlik: (
    <>
      <path d="M14.5 3.5 9 9" />
      <path d="M11.5 6.5 17 12" />
      <path d="M5 20.5c0-3.5 1.5-6 3.5-7.5l3.5 3.5C10.5 18.5 8.5 20.5 5 20.5Z" />
      <path d="M14 8.5 20.5 15" />
    </>
  ),
  fan: (
    <>
      <circle cx="12" cy="12" r="2" />
      <path d="M12 10c0-3 1-6 3.5-6 2 0 2.5 2.5 0 4.2L12 10Z" />
      <path d="M14 12c3 0 6 1 6 3.5 0 2-2.5 2.5-4.2 0L14 12Z" />
      <path d="M10 14c0 3-1 6-3.5 6-2 0-2.5-2.5 0-4.2L10 14Z" />
      <path d="M10 12c-3 0-6-1-6-3.5 0-2 2.5-2.5 4.2 0L10 12Z" />
    </>
  ),
  fis: (
    <>
      <path d="M9 3.5v5M15 3.5v5" />
      <path d="M6.5 8.5h11v2.5a5.5 5.5 0 0 1-11 0V8.5Z" />
      <path d="M12 16.5v4" />
    </>
  ),
  civata: (
    <>
      <path d="M9 3.5h6l1.5 3.5-1.5 3H9l-1.5-3L9 3.5Z" />
      <path d="M10 10v10.5h4V10" />
      <path d="M10 13.5h4M10 17h4" />
    </>
  ),
  dunya: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17" />
      <path d="M12 3.5a13 13 0 0 1 0 17a13 13 0 0 1 0-17Z" />
    </>
  ),
  magaza: (
    <>
      <path d="M4 9.5h16v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-10Z" />
      <path d="M3 9.5 5 4.5h14l2 5" />
      <path d="M9.5 20.5v-6h5v6" />
    </>
  ),
  toprak: (
    <>
      <path d="M3 9.5h18" />
      <path d="M4 9.5v9a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-9" />
      <path d="M7.5 13h1.5M12 12.5h2M16.5 14.5H18M9 16.5h2M14.5 17H16" />
      <path d="M8 9.5 9.5 6M15 9.5 13.5 6" />
    </>
  ),
  molekul: (
    <>
      <circle cx="6" cy="17" r="2.4" />
      <circle cx="18" cy="17" r="2.4" />
      <circle cx="12" cy="6" r="2.4" />
      <path d="M10.7 8.1 7.3 14.9M13.3 8.1l3.4 6.8M8.4 17h7.2" />
    </>
  ),
  zincir: (
    <>
      <path d="M10 13.5a3.5 3.5 0 0 0 5 0l2.5-2.5a3.5 3.5 0 0 0-5-5L11 7.5" />
      <path d="M14 10.5a3.5 3.5 0 0 0-5 0L6.5 13a3.5 3.5 0 0 0 5 5l1.5-1.5" />
    </>
  ),
  // Toprak iyileştirici — toprak katmanları. `toprak` (saksı) ile aynı satırda
  // yan yana durduğu için bilerek farklı bir siluet.
  katman: (
    <>
      <path d="M3.5 7.5h17" />
      <path d="M3.5 12h17" />
      <path d="M3.5 16.5h17" />
      <path d="M8 4.2v2.6M13.5 3.6v3.2M17.5 4.6v2.2" />
      <path d="M7 14v1M11.5 13.8v1.4M16 14.2v.8M9.5 18.4v1.2M14.5 18.2v1.4" />
    </>
  ),
  // Yaprak gübreleri — tek yaprak, damarlı
  yaprak: (
    <>
      <path d="M20.5 3.5C11 3.5 5.5 7.6 5.5 14a6.5 6.5 0 0 0 6.5 6.5c6 0 8.5-6 8.5-17Z" />
      <path d="M9.2 17.6C11.2 12.2 14.6 8.4 19 6" />
    </>
  ),
  // Deniz yosunu ve organik gübreler — dalga üstünde yosun
  yosun: (
    <>
      <path d="M9.5 20.5c-2-2.6-2.8-5.6-2.4-9C7.5 8 9 5.6 11.5 3.5" />
      <path d="M11.5 12c1.6-.6 2.6-1.9 3-3.9M9 15.6c-1.5-.5-2.5-1.6-3-3.3M12 17.6c1.9-.5 3.2-1.7 3.9-3.6" />
      <path d="M3 20.5c1.5 0 1.5-1.4 3-1.4s1.5 1.4 3 1.4 1.5-1.4 3-1.4 1.5 1.4 3 1.4 1.5-1.4 3-1.4 1.5 1.4 3 1.4" />
    </>
  ),
}

/**
 * Var olan ikon adları. Veritabanından gelen serbest metinlerin (kategori
 * `icon` sütunu) gerçekten çizilebilir bir ikona karşılık gelip gelmediğini
 * doğrulamak için kullanılıyor — yoksa boşluk çizilirdi.
 */
export const IKON_ADLARI = new Set(Object.keys(P))

export default function Icon({ name, className, decorative = true, label }: Props) {
  const node = P[name]
  if (!node) return null

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('shrink-0', className)}
      aria-hidden={decorative ? true : undefined}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : label}
    >
      {node}
    </svg>
  )
}
