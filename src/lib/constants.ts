import type { BrandConfig, BrandKey } from './types';
import { getSiteUrl } from './site-url';

// ─────────────────────────────────────────────────────────────────────────────
// MAĞAZA YAPILANDIRMASI — TEK KAYNAK
//
// Kod ALB'nin (bayirlioglu.com) iki markalı yapısından geldi. Happy Junior'da
// tek mağaza var; `BRANDS` sözlüğü yalnızca eski imzaları bozmamak için duruyor.
// Yeni kodda doğrudan `BRAND` kullanın.
//
// "TODO(müşteri)" işaretli değerler müşteri görüşmesinde netleşecek.
// ─────────────────────────────────────────────────────────────────────────────

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP ?? '905434902708';

export const BRANDS: Record<BrandKey, BrandConfig> = {
  'happy-junior': {
    key: 'happy-junior',
    name: 'Happy Junior',
    shortCode: 'HJ',
    // TODO(müşteri): logo dosyası gelince `public/images/happy-junior-logo.png`
    // olarak ekleyip aşağıdaki iki satırı açın. Logo yokken BrandLogo yedek
    // ikonu gösterir.
    // logo: '/images/happy-junior-logo.png',
    // logoAspect: { width: 512, height: 512 },
    tagline: 'Minikler için\nözenle seçildi',
    subtitle: 'Anamur’dan Türkiye’nin her yerine',
    description:
      '0–15 yaş bebek ve çocuk giyimi, araç-gereç ve oyuncak. Sezonun yeni ürünlerini yaş ve bedene göre seçin, havale/EFT ile güvenle sipariş verin.',
    badge: 'Yeni Sezon Ürünleri',
    cta: { label: 'Alışverişe Başla', href: '/urunler' },
    ctaSecondary: { label: 'WhatsApp’tan Sor', href: `https://wa.me/${WHATSAPP}` },
    whatsapp: {
      phone: WHATSAPP,
      message: 'Merhaba! Happy Junior ürünleri hakkında bilgi almak istiyorum.',
      tooltip: 'WhatsApp’tan bize yazın!',
    },
    telefon: process.env.NEXT_PUBLIC_TEL ?? '905434902708',
    stats: [
      { value: '0–15', label: 'Yaş Grubu' },
      { value: 'Anamur', label: 'Mağaza' },
      { value: 'Havale/EFT', label: 'Güvenli Ödeme' },
    ],
    // Kategori adresleri veritabanındaki kategori slug'larıyla eşleşmeli
    // (bkz. prisma/seed.ts).
    nav: [
      {
        label: 'Ürünler',
        href: '/urunler',
        children: [
          { label: 'Bebek (0–24 ay)', href: '/urunler?kullanim=bebek' },
          { label: 'Kız Çocuk', href: '/urunler?kullanim=kiz-cocuk' },
          { label: 'Erkek Çocuk', href: '/urunler?kullanim=erkek-cocuk' },
          { label: 'Ayakkabı', href: '/urunler?kullanim=ayakkabi' },
          { label: 'Araç-Gereç & Aksesuar', href: '/urunler?kullanim=arac-gerec' },
          { label: 'Oyuncak', href: '/urunler?kullanim=oyuncak' },
        ],
      },
      { label: 'İndirim', href: '/urunler?indirim=1' },
      { label: 'Hakkımızda', href: '/hakkimizda' },
      { label: 'İletişim', href: '/iletisim' },
    ],
    // Ana sayfa videosu yok; hero poster görselini kullanıyor.
    video: '',
    poster: '/images/hero.webp',
    colors: {
      primary: 'bg-brand-600',
      primaryHover: 'hover:bg-brand-500',
      primaryText: 'text-brand-600',
      primaryLight: 'bg-brand-50',
      primaryBorder: 'border-brand-200',
      gradientOverlay: 'from-brand-900/60 via-brand-800/35 to-brand-900/50',
      fallbackGradient: 'bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800',
      logoBg: 'bg-brand-600',
      accentPrimary:
        'bg-brand-600 hover:bg-brand-500 text-white shadow-brand-600/30 focus:ring-brand-500',
      accentSecondary:
        'border-2 border-white/60 text-white hover:bg-white/10 focus:ring-white',
      badgeStyle: 'bg-white/15 border border-white/30 text-white',
      statDivider: 'bg-white/40',
      navHover: 'hover:text-brand-600',
      ring: 'focus:ring-brand-500',
    },
  },
};

export const ACTIVE_BRAND_KEY: BrandKey = 'happy-junior';

export const BRAND = BRANDS[ACTIVE_BRAND_KEY];

/**
 * İşletmenin yasal unvanı — sözleşme, KVKK ve fatura metinlerinde kullanılır.
 * TODO(müşteri): vergi levhasındaki tam unvan yazılacak.
 */
export const COMPANY_NAME = 'Happy Junior';

// ─── GENEL SABİTLER ───────────────────────────────────────────────────────────

export const SITE_CONFIG = {
  name: BRAND.name,
  // `site-url.ts` tek kaynak; NEXT_PUBLIC_SITE_URL tanımsızsa üretimde uyarı basar.
  url: getSiteUrl(),
  // `NEXT_PUBLIC_` ile başladığı için DERLEME anında gömülür: Cloudflare'de
  // Settings → Build → Build variables bölümüne eklenmeli.
  phone: process.env.NEXT_PUBLIC_TEL_GOSTER ?? '+90 543 490 27 08',
  // TODO(müşteri): e-posta adresi
  email: 'info@happyjunioranamur.com',
  // TODO(müşteri): açık adres ve harita bağlantısı
  address: 'Anamur / Mersin',
  mapsUrl: '',
  // TODO(müşteri): çalışma saatleri
  workingHours: 'Pzt – Cmt: 09:00 – 20:00',
  // Yalnızca gerçekten var olan hesaplar (arama motoruna `sameAs` olarak gider).
  socialMedia: {
    instagram: 'https://www.instagram.com/happyjunior_anamur',
  },
};

/**
 * Havale/EFT ödeme bilgileri. Sipariş onay sayfasında ve e-postasında gösterilir.
 * Boş bırakılan hesaplar gösterilmez.
 * TODO(müşteri): banka adı, hesap sahibi ve IBAN.
 */
export const HAVALE_HESAPLARI: { banka: string; hesapSahibi: string; iban: string }[] = [
  // { banka: 'Ziraat Bankası', hesapSahibi: 'Ad Soyad', iban: 'TR00 0000 0000 0000 0000 0000 00' },
];

export const TURKISH_CITIES = [
  'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Aksaray', 'Amasya',
  'Ankara', 'Antalya', 'Ardahan', 'Artvin', 'Aydın', 'Balıkesir',
  'Bartın', 'Batman', 'Bayburt', 'Bilecik', 'Bingöl', 'Bitlis',
  'Bolu', 'Burdur', 'Bursa', 'Çanakkale', 'Çankırı', 'Çorum',
  'Denizli', 'Diyarbakır', 'Düzce', 'Edirne', 'Elazığ', 'Erzincan',
  'Erzurum', 'Eskişehir', 'Gaziantep', 'Giresun', 'Gümüşhane', 'Hakkari',
  'Hatay', 'Iğdır', 'Isparta', 'İstanbul', 'İzmir', 'Kahramanmaraş',
  'Karabük', 'Karaman', 'Kars', 'Kastamonu', 'Kayseri', 'Kırıkkale',
  'Kırklareli', 'Kırşehir', 'Kilis', 'Kocaeli', 'Konya', 'Kütahya',
  'Malatya', 'Manisa', 'Mardin', 'Mersin', 'Muğla', 'Muş',
  'Nevşehir', 'Niğde', 'Ordu', 'Osmaniye', 'Rize', 'Sakarya',
  'Samsun', 'Siirt', 'Sinop', 'Sivas', 'Şanlıurfa', 'Şırnak',
  'Tekirdağ', 'Tokat', 'Trabzon', 'Tunceli', 'Uşak', 'Van',
  'Yalova', 'Yozgat', 'Zonguldak',
];
