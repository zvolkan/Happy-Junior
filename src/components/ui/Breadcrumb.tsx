import Link from 'next/link'
import { jsonLdScript } from '@/lib/sanitize'
import { kirintiVerisi } from '@/lib/seo'

/**
 * Kırıntı yolu (breadcrumb) — görünür gezinme VE yapısal veri, birlikte.
 *
 * ── Neden bileşen oldu ──────────────────────────────────────────────────────
 *
 * Aynı işaretleme on beş sayfada elle tekrarlanıyordu. Sonuç iki ayrı kusur:
 *
 * 1. On beş kırıntının yalnızca İKİSİNİN `BreadcrumbList` yapısal verisi
 *    vardı (ürün detayı ve blog yazısı). Google arama sonucunda "Ana Sayfa ›
 *    Ürünler › Gübre" biçimindeki yolu bu veriden üretiyor; olmayan yerde
 *    çıplak adres gösteriyor.
 * 2. Hiçbirinde `aria-label` yoktu. Ekran okuyucu "gezinme" diyor ama hangi
 *    gezinme olduğunu söylemiyor; sayfada birden fazla `nav` varken bu
 *    bilgi olmadan ayırt edilemiyor.
 *
 * Artık görünür yol ile yapısal veri AYNI diziden üretiliyor; birinin
 * güncellenip diğerinin unutulması mümkün değil. Google, görünenle yapısal
 * verinin uyuşmamasını zaten ihlal sayıyor.
 *
 * ── Kullanım ────────────────────────────────────────────────────────────────
 *
 *   <Breadcrumb adimlar={[
 *     { label: 'Ana Sayfa', href: '/' },
 *     { label: 'Gizlilik ve Güvenlik' },     // son adım: href YOK
 *   ]} />
 *
 * Son adımın `href`'i verilmez: bulunulan sayfaya bağlantı vermek hem
 * gereksiz hem de yapısal veride hata sayılıyor.
 */

export interface KirintiAdimi {
  label: string
  /** Bulunulan sayfa (son adım) için verilmez. */
  href?: string
}

interface Props {
  adimlar: KirintiAdimi[]
  /** Koyu zemin üzerinde kullanılacaksa. */
  koyu?: boolean
  className?: string
}

export default function Breadcrumb({ adimlar, koyu = false, className = '' }: Props) {
  if (adimlar.length === 0) return null

  const metin = koyu ? 'text-white/60' : 'text-gray-400'
  const bagMetin = koyu ? 'hover:text-white' : 'hover:text-gray-600'
  const aktif = koyu ? 'text-white/90' : 'text-gray-600'

  return (
    <>
      <nav aria-label="Sayfa yolu" className={`text-sm ${metin} ${className}`}>
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {adimlar.map((adim, i) => {
            const sonuncu = i === adimlar.length - 1
            return (
              <li key={`${adim.label}-${i}`} className="flex items-center gap-x-2">
                {i > 0 && (
                  <span aria-hidden="true" className="select-none">
                    /
                  </span>
                )}
                {adim.href && !sonuncu ? (
                  <Link href={adim.href} className={`${bagMetin} transition-colors`}>
                    {adim.label}
                  </Link>
                ) : (
                  // `aria-current` ekran okuyucuya hangi adımın bulunulan
                  // sayfa olduğunu söylüyor; görsel olarak zaten bağlantısız.
                  <span aria-current={sonuncu ? 'page' : undefined} className={aktif}>
                    {adim.label}
                  </span>
                )}
              </li>
            )
          })}
        </ol>
      </nav>

      {/* Görünür yolun birebir karşılığı. Nonce konmuyor — gerekçe için
          bkz. src/app/layout.tsx içindeki ld+json notu. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(kirintiVerisi(adimlar)) }}
      />
    </>
  )
}
