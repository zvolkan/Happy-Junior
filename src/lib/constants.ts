import type { BrandConfig, BrandKey } from './types';
import { getSiteUrl } from './site-url';

// ─────────────────────────────────────────────────────────────────────────────
// MARKA YAPILANDIRMALARI
// .env.local'da NEXT_PUBLIC_BRAND değerini 'alb-tarim' veya 'alb-su-aritma'
// olarak ayarlayarak aktif markayı değiştirebilirsiniz.
// ─────────────────────────────────────────────────────────────────────────────

export const BRANDS: Record<BrandKey, BrandConfig> = {
  'alb-tarim': {
    key: 'alb-tarim',
    name: 'ALB Tarım',
    shortCode: 'AT',
    // Bulut + yaprak/el logosu. Kaynak, basılı logonun fotoğrafıydı; şeffaf
    // kenarları kırpıldı, kâğıt greni temizlendi ve 512 piksel genişliğe
    // indirildi. WebP seçildi çünkü aynı görüntü PNG olarak 115 KB, WebP
    // olarak 35 KB tutuyor ve logo neredeyse her sayfada yükleniyor.
    //
    // Oran YATAY (512×308) — Alb Su damlasının tam tersi. BrandLogo bunu
    // `object-contain` ile hallediyor; ölçüyü elle sabitlemeyin.
    logo: '/images/alb-tarim-logo.webp',
    logoAspect: { width: 512, height: 308 },
    tagline: 'Toprağınıza\nDeğer Katın',
    subtitle: 'Modern tarım teknolojileriyle',
    description:
      'Kendi formüllerimizle ürettiğimiz gübrelerle verimliliğinizi artıran çözümler sunuyoruz. Toprak ve yaprak analizine dayalı zirai danışmanlık veriyor, ürün seçiminde yardımcı oluyor, siparişinizi kargoyla adresinize gönderiyoruz.',
    badge: '2026 Yeni Sezon Ürünleri Mevcut',
    cta: { label: 'Ürünlerimizi İnceleyin', href: '/urunler' },
    ctaSecondary: { label: 'Ücretsiz Danışmanlık Al', href: '/iletisim' },
    whatsapp: {
      phone: process.env.NEXT_PUBLIC_WHATSAPP_ALB_TARIM ?? '905071781633',
      message: 'Merhaba! ALB Tarım ürünleri hakkında bilgi almak istiyorum.',
      tooltip: "ALB Tarım'a WhatsApp'tan yazın!",
    },
    // Aranabilir numara. Site genelinde ALB Tarım sayfalarında bu görünüyor;
    // daha önce bazı yerlerde Alb Su'nun numarası yazıyordu.
    telefon: process.env.NEXT_PUBLIC_TEL_ALB_TARIM ?? '905071781633',
    // Doğrulanabilir olmayan rakamlar kaldırıldı ("500+ Ürün Çeşidi" katalogda
    // 69 ürün varken yazıyordu; "15.000+ Mutlu Çiftçi" ölçülebilir değil).
    // Gerçek rakamlarınız olduğunda buraya yazın, site geneline yansır.
    stats: [
      { value: 'Anamur', label: 'Merkez' },
      { value: '81 İl', label: 'Kargo ile Teslimat' },
      { value: '11 Marka', label: 'Yetkili Tedarik' },
    ],
    nav: [
      {
        label: 'Ürünler',
        href: '/urunler',
        children: [
          { label: 'Bayırlıoğlu Tarım Ürünleri', href: '/urunler?kullanim=alb-tarim-urunleri' },
          { label: 'İthal Ürünler', href: '/urunler?kullanim=ithal-urunler' },
        ],
      },
      { label: 'Hizmetler', href: '/hizmetler' },
      // Sayfa iki marka için de yazılmıştı ama yalnızca ALB Su menüsündeydi;
      // ALB Tarım tarafında hiçbir bağlantısı yoktu.
      { label: 'Hizmet Alanlarımız', href: '/referanslar' },
      { label: 'Blog', href: '/blog' },
      { label: 'Hakkımızda', href: '/hakkimizda' },
      { label: 'İletişim', href: '/iletisim' },
    ],
    video: '/videos/tarim-hero-desktop.mp4',
    videoMobile: '/videos/tarim-hero-mobile.mp4',
    // ── Poster: videodan ÖNCE görünen kare ─────────────────────────────
    //
    // Bu alan `/images/tarim-hero.jpg` adresini gösteriyordu ama o dosya
    // depoda hiç YOKTU — 404 dönüyordu. Video `preload="none"` olduğu için
    // siteye giren herkes, video yüklenene kadar poster yerine boş degradeyi
    // görüyordu.
    //
    // Yeni poster videonun BİRİNCİ KARESİ. Bilerek öyle: başka bir sahneden
    // seçilseydi video başlarken görüntü sıçrardı. WebP, aynı kalitede
    // JPEG'in yaklaşık yarısı kadar yer tutuyor (139 KB / 208 KB).
    poster: '/images/tarim-hero.webp',
    colors: {
      primary: 'bg-green-600',
      primaryHover: 'hover:bg-green-500',
      primaryText: 'text-green-600',
      primaryLight: 'bg-green-50',
      primaryBorder: 'border-green-200',
      gradientOverlay: 'from-green-950/60 via-green-900/35 to-emerald-950/50',
      fallbackGradient: 'bg-gradient-to-br from-green-900 via-emerald-800 to-teal-900',
      logoBg: 'bg-green-600',
      accentPrimary:
        'bg-green-600 hover:bg-green-500 text-white shadow-green-600/30 focus:ring-green-500',
      accentSecondary:
        'border-2 border-green-400/60 text-white hover:bg-green-400/10 focus:ring-green-400',
      badgeStyle: 'bg-green-500/15 border border-green-400/30 text-green-300',
      statDivider: 'bg-green-500/40',
      navHover: 'hover:text-green-400',
      ring: 'focus:ring-green-500',
    },
  },

  'alb-su-aritma': {
    key: 'alb-su-aritma',
    name: 'Alb Su Teknolojileri',
    shortCode: 'AS',
    // Damla biçimli ALB logosu. Kenarındaki beyaz kontur sayesinde hem açık
    // hem koyu zeminde okunuyor, bu yüzden tek dosya her yerde kullanılıyor.
    // Oran dikey (694×969); yerleştirirken yüksekliği sabitleyip genişliği
    // serbest bırakın, aksi hâlde logo ezilir.
    logo: '/images/alb-su-logo.svg',
    logoAspect: { width: 694, height: 969 },
    tagline: 'Temiz suyun\nadresi',
    subtitle: "1977'den gelen ticaret geleneğiyle",
    description:
      'Eviniz için tezgah altı arıtma ve alkali su cihazları; iş yeriniz için arıtmalı su sebili ve endüstriyel sistemler. A.O. Smith yetkili bayii olarak Anamur ve çevre bölgede binlerce haneye, Türkiye genelinde ise kargoyla hizmet veriyoruz.',
    badge: 'A.O. Smith Yetkili Bayii',
    cta: { label: 'Ürünlerimizi İnceleyin', href: '/urunler' },
    ctaSecondary: { label: 'Ücretsiz Teklif Al', href: '/iletisim' },
    whatsapp: {
      phone: process.env.NEXT_PUBLIC_WHATSAPP_ALBSU ?? '905444142254',
      message: 'Merhaba! Alb Su Teknolojileri su arıtma sistemleri hakkında bilgi almak istiyorum.',
      tooltip: "Alb Su Teknolojileri'ne WhatsApp'tan yazın!",
    },
    telefon: process.env.NEXT_PUBLIC_TEL_ALBSU ?? '905444142254',
    // Üçü de doğrulanabilir: kuruluş yılı, yetkili bayilik ve teslimat ağı.
    // Önceki hâlinde "Ücretsiz Su Analizi" yazıyordu; o bir hizmet vaadi ve
    // doğrulanması gerekenler listesindeydi.
    stats: [
      { value: '1977', label: 'Yılından Beri' },
      { value: 'A.O. Smith', label: 'Yetkili Bayii' },
      { value: 'Türkiye', label: 'Geneli Teslimat' },
    ],
    nav: [
      {
        label: 'Tüm Ürünler',
        href: '/urunler',
        children: [
          { label: 'Tüm Ürünler', href: '/urunler' },
          { label: 'Eviniz İçin', href: '/urunler?kullanim=ev' },
          { label: 'İş Yeriniz İçin', href: '/urunler?kullanim=is-yeri' },
          { label: 'Arıtmalı Su Sebili', href: '/urunler?kullanim=is-yeri&kategori=su-sebili' },
          { label: 'Filtre & Membran', href: '/urunler?kullanim=yedek-parca&kategori=filtre' },
          { label: 'Endüstriyel Sistemler', href: '/urunler?kullanim=is-yeri&kategori=endustriyel' },
          { label: 'Yedek Parça & Aksesuar', href: '/urunler?kullanim=yedek-parca' },
        ],
      },
      { label: 'Servis', href: '/hizmetler' },
      { label: 'Hizmet Alanlarımız', href: '/referanslar' },
      // Blog ve Hakkımızda sayfaları iki marka için de yazılmış ve sitemap'te
      // Google'a bildiriliyordu, ama Alb Su menüsünde bağlantıları yoktu —
      // yani o sayfalara siteden ulaşmanın hiçbir yolu yoktu.
      { label: 'Blog', href: '/blog' },
      { label: 'Hakkımızda', href: '/hakkimizda' },
      { label: 'İletişim', href: '/iletisim' },
    ],
    video: '/videos/su-aritma-hero.mp4',
    poster: '/images/su-aritma-hero.jpg',
    colors: {
      primary: 'bg-blue-600',
      primaryHover: 'hover:bg-blue-500',
      primaryText: 'text-blue-600',
      primaryLight: 'bg-blue-50',
      primaryBorder: 'border-blue-200',
      gradientOverlay: 'from-blue-950/90 via-blue-900/70 to-cyan-950/80',
      fallbackGradient: 'bg-gradient-to-br from-blue-900 via-cyan-800 to-sky-900',
      logoBg: 'bg-blue-600',
      accentPrimary:
        'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30 focus:ring-blue-500',
      accentSecondary:
        'border-2 border-blue-400/60 text-white hover:bg-blue-400/10 focus:ring-blue-400',
      badgeStyle: 'bg-blue-500/15 border border-blue-400/30 text-blue-300',
      statDivider: 'bg-blue-500/40',
      navHover: 'hover:text-blue-400',
      ring: 'focus:ring-blue-500',
    },
  },
};

// ─── BAYIRLIOĞLU (marka dışı sayfalar: landing, hakkımızda, bayi vb.) ───

export const GROUP_WHATSAPP = {
  phone: process.env.NEXT_PUBLIC_WHATSAPP_GROUP ?? '905444142254',
  message: 'Merhaba! Bayırlıoğlu hakkında bilgi almak istiyorum.',
  tooltip: "Bayırlıoğlu'na WhatsApp'tan yazın!",
};

// ─── AKTİF MARKA (env'den okur) ──────────────────────────────────────────────

export const ACTIVE_BRAND_KEY: BrandKey =
  (process.env.NEXT_PUBLIC_BRAND as BrandKey) ?? 'alb-tarim';

export const BRAND = BRANDS[ACTIVE_BRAND_KEY];

/**
 * Şirketin kendi adı — TEK KAYNAK.
 *
 * `BRAND.name` aktif MARKAYI verir (ALB Tarım veya Alb Su Teknolojileri).
 * Gizlilik politikası, kullanım koşulları ve mesafeli satış sözleşmesi gibi
 * metinler markaya değil ŞİRKETE ait olduğu için `BRAND.name` kullanmak
 * yanlıştı: gizlilik politikası "ALB Tarım olarak…" diye başlıyordu.
 *
 * Kurumsal/hukuki metinlerde bunu, marka sayfalarında `BRAND.name` kullanın.
 */
export const COMPANY_NAME = 'Bayırlıoğlu';

/**
 * Kuruluş — TEK KAYNAK.
 *
 * Şirket 1977'de, "Bayırlıoğlu" lakabıyla tanınan Durmuş Ali Bulut tarafından
 * kuruldu. Lakap zamanla şirketin adı oldu.
 *
 * `KURULUS_YILI` arama motoruna verilen yapısal veride (foundingDate),
 * `KURULUS_ANLATIM` ise metinlerin içinde kullanılıyor. İkisi de tek yerden
 * geldiği için yıl değişirse burayı değiştirmek yeterli.
 */
export const KURULUS_YILI = 1977;
export const KURULUS_ANLATIM = "1977'den bu yana";

/** Kurucunun adı — hakkımızda metinlerinde geçiyor */
export const KURUCU = 'Durmuş Ali Bulut';

/** Alb Su markasının kuruluş yılı (ALB Tarım şirketin kendisiyle yaşıt) */
export const ALBSU_KURULUS_YILI = 2014;

// ─── GENEL SABİTLER ───────────────────────────────────────────────────────────

export const SITE_CONFIG = {
  name: BRAND.name,
  // `site-url.ts` tek kaynak: NEXT_PUBLIC_SITE_URL yoksa VERCEL_URL'e düşer ve
  // üretimde uyarı basar. Burada doğrudan `?? 'http://localhost:3000'` yazılıydı
  // ve o yedek sessizdi — değişken unutulduğunda site çökmüyor, sitemap'i,
  // robots.txt'i, OG önizlemelerini ve mesafeli satış sözleşmesini localhost
  // adresiyle yayınlıyordu.
  url: getSiteUrl(),
  // ── Grup geneli telefon ────────────────────────────────────────────────
  //
  // Diğer beş numaranın (iki marka × WhatsApp/tel + grup WhatsApp) ortam
  // değişkeni varken bunun yoktu — oysa yasal künyede, yapısal veride ve
  // grup iletişim/hizmetler sayfalarında görünen numara bu.
  //
  // DİKKAT: varsayılan değer Alb Su'nun hattı. Grup çağrılarının ALB Tarım
  // hattına düşmesini istiyorsanız `NEXT_PUBLIC_TEL_GRUP` tanımlayın.
  // `NEXT_PUBLIC_` ile başladığı için DERLEME anında gömülür: Cloudflare'de
  // Settings → Build → Build variables bölümüne eklenmeli, çalışma zamanı
  // sırrı olarak eklenirse tarayıcıya ulaşmaz.
  phone: process.env.NEXT_PUBLIC_TEL_GRUP ?? '+90 544 414 22 54',
  email: 'info@bayirlioglu.com',
  address:
    'SAÇKAN KAVŞAĞI DOĞUSU SAVCI-ŞOK MARKET YANI, Yeşilyurt, Akdeniz Cd. NO:20/22, 33640 Anamur/Mersin',
  mapsUrl:
    'https://www.google.com/maps/place//data=!4m2!3m1!1s0x14dc3d918f947551:0x35f4224c2a7044c3?sa=X&ved=1t:8290&ictx=111',
  workingHours: 'Pzt – Cmt: 08:30 – 19:00',
  // Yalnızca gerçekten var olan hesaplar. Burası arama motoruna verilen
  // `sameAs` listesini besliyor; olmayan bir profili buraya yazmak Google'a
  // yanlış kurum eşleştirmesi yaptırır. Facebook / X / YouTube hesabı
  // açılırsa buraya eklenmesi yeterli, footer ayrıca güncellenmeli.
  socialMedia: {
    instagramTarim: 'https://www.instagram.com/alb.tarim',
    instagramSu: 'https://www.instagram.com/albsuteknolojileri',
  },
};

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
