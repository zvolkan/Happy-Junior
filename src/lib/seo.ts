import { BRANDS, COMPANY_NAME, SITE_CONFIG, KURULUS_YILI } from '@/lib/constants'
import type { BrandKey } from '@/lib/types'

/**
 * SEO yardımcıları — paylaşım görselleri ve yapısal veri.
 *
 * ── Neden tek dosya ─────────────────────────────────────────────────────────
 *
 * Yapısal veri üç ayrı dosyada elle yazılıyordu ve sonuç şuydu: kök düzende
 * `Organization` vardı ama adres bilgisi arama motorunun yerel işletme
 * kartına düşecek biçimde değildi; ürün ve blog sayfalarının `BreadcrumbList`
 * verisi vardı ama aynı kırıntı yolunu gösteren diğer on üç sayfanın yoktu;
 * `/hizmetler` sayfasında beş gerçek soru-cevap duruyordu ama hiçbiri
 * `FAQPage` olarak işaretlenmemişti.
 *
 * Buradaki fonksiyonlar o verinin TEK kaynağı. Sayfalar yalnızca çağırıyor.
 */

// ─── Paylaşım görselleri ─────────────────────────────────────────────────────

/**
 * Sosyal paylaşım kartları. 1200×630 — Facebook, WhatsApp, X ve LinkedIn'in
 * ortak beklediği oran.
 *
 * ── Neden dosya adı kuralı değil ────────────────────────────────────────────
 *
 * Next.js'in `opengraph-image.png` dosya adı kuralı bir rota segmentine bir
 * görsel bağlıyor. `[brand]` DİNAMİK bir segment: iki marka tek klasörü
 * paylaşıyor, yani dosya adı kuralıyla markaya özel görsel verilemiyor.
 * Bu yüzden görseller `public/og/` altında duruyor ve metadata'ya elle
 * bağlanıyor.
 */
const OG_BOYUT = { width: 1200, height: 630 }

const OG_GORSELLERI: Record<BrandKey | 'grup', string> = {
  grup: '/og/og-grup.png',
  'alb-tarim': '/og/og-alb-tarim.png',
  'alb-su-aritma': '/og/og-alb-su-aritma.png',
}

/** Verilen marka için (ya da grup için) OG görsel tanımı. */
export function ogGorseli(marka?: BrandKey) {
  const yol = OG_GORSELLERI[marka ?? 'grup']
  const ad = marka ? BRANDS[marka].name : COMPANY_NAME
  return [{ url: yol, ...OG_BOYUT, alt: `${ad} — ${SITE_CONFIG.url.replace(/^https?:\/\//, '')}` }]
}

/**
 * Bir sayfanın OG + Twitter bloğunu birlikte üretir.
 *
 * ── İkisi birden, çünkü ayrı ayrı yazılınca biri unutuluyor ─────────────────
 *
 * Sitede hiç `twitter` metadata'sı yoktu. Twitter/X, `twitter:card` yoksa
 * küçük bir kenar görseli basıyor; `summary_large_image` ile tam genişlik
 * kart çıkıyor. Aynı görselle iki satır fark yaratıyor.
 */
export function paylasimMetadata(opts: {
  title: string
  description: string
  url: string
  marka?: BrandKey
  /** Sayfaya özel görsel (ürün, blog kapağı). Verilirse marka kartının yerine geçer. */
  gorsel?: { url: string; alt?: string } | null
  type?: 'website' | 'article'
}) {
  const images = opts.gorsel
    ? [{ url: opts.gorsel.url, alt: opts.gorsel.alt ?? opts.title }]
    : ogGorseli(opts.marka)

  return {
    openGraph: {
      type: opts.type ?? ('website' as const),
      locale: 'tr_TR',
      siteName: COMPANY_NAME,
      title: opts.title,
      description: opts.description,
      url: opts.url,
      images,
    },
    twitter: {
      card: 'summary_large_image' as const,
      title: opts.title,
      description: opts.description,
      images,
    },
  }
}

// ─── Yapısal veri ────────────────────────────────────────────────────────────

const MUTLAK = (yol: string) => new URL(yol, SITE_CONFIG.url).toString()

/**
 * Yerel işletme kaydı.
 *
 * ── Neden `Organization` değil `LocalBusiness` ──────────────────────────────
 *
 * `Organization` bir kurumu tanımlar; `LocalBusiness` onun ALTINDA, fiziksel
 * adresi, çalışma saati ve haritası olan bir işletmeyi tanımlar. Google'ın
 * "yakınımdaki" aramalarında ve bilgi panelinde değerlendirdiği tip bu.
 * Anamur'da dükkânı olan bir işletme için doğru tip `LocalBusiness`.
 *
 * `geo` (enlem/boylam) bilerek YOK: elimizde doğrulanmış koordinat yok ve
 * yanlış koordinat, işletmeyi haritada başka bir yere koymak demek —
 * koordinat vermemekten kötü. Koordinat öğrenildiğinde buraya eklenmeli.
 */
export function yerelIsletmeVerisi() {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': MUTLAK('/#isletme'),
    name: COMPANY_NAME,
    description: BRANDS['alb-tarim'].description,
    url: SITE_CONFIG.url,
    logo: MUTLAK('/og/og-grup.png'),
    image: MUTLAK('/og/og-grup.png'),
    email: SITE_CONFIG.email,
    telephone: SITE_CONFIG.phone,
    foundingDate: String(KURULUS_YILI),
    priceRange: '₺₺',
    currenciesAccepted: 'TRY',
    areaServed: { '@type': 'Country', name: 'Türkiye' },
    address: {
      '@type': 'PostalAddress',
      streetAddress: SITE_CONFIG.address,
      addressLocality: 'Anamur',
      addressRegion: 'Mersin',
      postalCode: '33640',
      addressCountry: 'TR',
    },
    hasMap: SITE_CONFIG.mapsUrl,
    openingHoursSpecification: calismaSaatleri(),
    sameAs: Object.values(SITE_CONFIG.socialMedia),
  }
}

/**
 * `SITE_CONFIG.workingHours` ("Pzt – Cmt: 08:30 – 19:00") metnini yapısal
 * veriye çevirir.
 *
 * Metin elle yazıldığı için biçimi değişebilir; ayrıştırılamazsa alan hiç
 * yazılmıyor. Yanlış saat yayınlamaktansa saat yayınlamamak iyidir —
 * müşteri kapalı dükkâna gelmez.
 */
function calismaSaatleri() {
  const m = SITE_CONFIG.workingHours.match(/(\d{1,2}[:.]\d{2})\s*[–-]\s*(\d{1,2}[:.]\d{2})/)
  if (!m) return undefined
  const ac = m[1].replace('.', ':')
  const kapa = m[2].replace('.', ':')
  return [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      opens: ac,
      closes: kapa,
    },
  ]
}

/**
 * Site genelinde arama kutusu.
 *
 * Google, bu veriyi gördüğünde sonuç sayfasındaki site bağlantısının altına
 * doğrudan bir arama kutusu koyabiliyor. Katalog sitelerinde tıklamayı
 * ölçülebilir biçimde artırıyor ve bedeli tek bir JSON bloğu.
 *
 * Yol `/alb-tarim/urunler?ara=` — gerçekten çalışan arama parametresi bu.
 * Çalışmayan bir yol vermek, Google'a kırık bir kutu göstertmek olur.
 */
export function siteAramaVerisi() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': MUTLAK('/#site'),
    name: COMPANY_NAME,
    url: SITE_CONFIG.url,
    inLanguage: 'tr-TR',
    publisher: { '@id': MUTLAK('/#isletme') },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: MUTLAK('/alb-tarim/urunler?ara={search_term_string}'),
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

/** Sıkça sorulan sorular. */
export function sssVerisi(sorular: ReadonlyArray<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: sorular.map((s) => ({
      '@type': 'Question',
      name: s.question,
      acceptedAnswer: { '@type': 'Answer', text: s.answer },
    })),
  }
}

/** Kırıntı yolu — görünür kırıntıyla AYNI adımlardan üretilir. */
export function kirintiVerisi(adimlar: ReadonlyArray<{ label: string; href?: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: adimlar.map((a, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: a.label,
      // Son adımın (bulunulan sayfa) `item`'ı olmaz; Google bunu bekliyor.
      ...(a.href ? { item: MUTLAK(a.href) } : {}),
    })),
  }
}
