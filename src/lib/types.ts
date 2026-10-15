// ─────────────────────────────────────────────────────────────────────────────
// TEMEL TİPLER — Happy Junior E-Ticaret
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mağaza anahtarı. Kod ALB'nin çok markalı yapısından geldiği için bazı
 * fonksiyonlar hâlâ bir marka parametresi alıyor; Happy Junior'da tek değer var.
 */
export type BrandKey = 'happy-junior';

// ─── MARKA ───────────────────────────────────────────────────────────────────

export interface BrandColors {
  primary: string;
  primaryHover: string;
  primaryText: string;
  primaryLight: string;
  primaryBorder: string;
  gradientOverlay: string;  // Hero gradient sınıfı
  fallbackGradient: string; // Video yoksa arka plan
  logoBg: string;           // Logo arka planı
  accentPrimary: string;    // Birincil buton tam sınıfı
  accentSecondary: string;  // İkincil buton tam sınıfı
  badgeStyle: string;       // Hero badge sınıfı
  statDivider: string;      // İstatistik ayraç rengi
  navHover: string;         // Nav link hover sınıfı
  ring: string;             // Focus ring sınıfı
}

export interface BrandConfig {
  key: BrandKey;
  name: string;
  shortCode: string;
  /**
   * Markanın kendi logosu — `public/` altındaki yol.
   *
   * Tanımlıysa header, footer, ana sayfa kartları ve yönetim paneli bu görseli
   * kullanır. Tanımlı DEĞİLSE ilgili yerler eski davranışa, yani genel ikona
   * (filiz / damla) düşer. Böylece logosu henüz hazır olmayan bir marka
   * yüzünden hiçbir yer boş kalmaz.
   */
  logo?: string;
  /** Logonun doğal en/boy oranı — `logo` verildiyse gerekli. */
  logoAspect?: { width: number; height: number };
  tagline: string;
  subtitle: string;
  description: string;
  badge: string;
  cta: CtaConfig;
  ctaSecondary: CtaConfig;
  whatsapp: WhatsAppConfig;
  /**
   * Markanın aranabilir telefon numarası — YALNIZCA RAKAM, ülke koduyla
   * ("905071781633"). Görünen biçim `telefonGoster()` ile üretiliyor, böylece
   * numara tek yerde duruyor ve iki farklı sayfada iki farklı biçimde
   * yazılması ihtimali kalkıyor.
   *
   * WhatsApp numarasından ayrı tutuluyor: ikisi bugün aynı olsa da sabit hat
   * ya da ayrı bir satış hattı devreye girdiğinde yalnızca burası değişsin.
   */
  telefon: string;
  stats: StatItem[];
  nav: NavItem[];
  video: string;
  videoMobile?: string;
  poster: string;
  colors: BrandColors;
}

// ─── NAVİGASYON ──────────────────────────────────────────────────────────────

export interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
  icon?: string;
}

export interface CtaConfig {
  label: string;
  href: string;
}

// ─── ÜRÜN ────────────────────────────────────────────────────────────────────

export interface ProductImage {
  url: string;
  alt: string;
  isPrimary: boolean;
}

export interface ProductSpec {
  name: string;
  value: string;
  unit?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  salePrice?: number;
  images: ProductImage[];
  category: Category;
  brand: BrandKey;
  specs: ProductSpec[];
  stock: number;
  unit: string;
  isFeatured: boolean;
  isActive: boolean;
  rating: number;
  reviewCount: number;
  sku: string;
  productBrand?: string;   // Ürünün üretici markası (ör. Mudese)
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

// ─── KATEGORİ ────────────────────────────────────────────────────────────────

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;        // emoji veya icon adı
  image?: string;       // görsel URL — sonradan eklenecek
  brand: BrandKey;
  parentId?: number;    // dolu ise alt kategoridır
  sortOrder: number;
  productCount?: number;
  children?: Category[]; // getCategoriesWithChildren tarafından doldurulur
}

// ─── SEPET ───────────────────────────────────────────────────────────────────

export interface CartItem {
  product: Product;
  quantity: number;
}

// ─── SİPARİŞ DURUMU ──────────────────────────────────────────────────────────
//
// Not: Sipariş, kullanıcı, adres ve form tipleri buradan kaldırıldı; hepsi
// Prisma'dan geliyor ve buradaki elle yazılmış kopyaları hiçbir yerden
// import edilmiyordu (bazıları Prisma şemasıyla da uyuşmuyordu).

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

// ─── BLOG ────────────────────────────────────────────────────────────────────

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;   // görsel URL — sonradan eklenecek
  author: string;
  publishedAt: string;
  brand: BrandKey;
  tags?: string[];
  readTime?: number;    // dakika
}

// ─── HİZMET ──────────────────────────────────────────────────────────────────

export interface Service {
  id: number;
  title: string;
  description: string;
  icon: string;
  features: string[];
  brand: BrandKey;
  price?: string;       // 'Ücretsiz' | 'Fiyat almak için arayın' vs.
}

// ─── BAYİ BAŞVURU ────────────────────────────────────────────────────────────

export interface StatItem {
  value: string;
  label: string;
}

export interface WhatsAppConfig {
  phone: string;
  message: string;
  tooltip: string;
}

export interface Testimonial {
  id: number;
  name: string;
  location: string;
  role?: string;
  body: string;
  rating: number;
  image?: string;       // görsel URL — sonradan eklenecek
  brand: BrandKey;
}
