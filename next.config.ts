import type { NextConfig } from 'next';
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';

/**
 * `next dev` sırasında Cloudflare bağlamalarını (Hyperdrive, Durable Object,
 * ASSETS …) yerel süreçte kullanılabilir kılar. Bu satır olmadan `npm run dev`
 * çalışırken `getCloudflareContext()` boş döner ve veritabanına gidilemez.
 *
 * ── Neden koşula alındı ─────────────────────────────────────────────────────
 *
 * "Üretim derlemesinde etkisi yoktur" diye yazmıştım; YANLIŞTI. Fonksiyonun
 * kendi içinde geliştirme/üretim ayrımı yok — yalnızca `AsyncLocalStorage`ın
 * global olup olmadığına bakıyor ve o `next build` sırasında da tanımlı. Yani
 * her üretim derlemesinde miniflare ayağa kalkıyor, Hyperdrive bağlaması için
 * yerel bir bağlantı dizesi arıyor ve bulamazsa derlemeyi düşürüyordu.
 *
 * Derlemenin çalışması için gerekli olmayan bu adım artık yalnızca
 * geliştirmede çalışıyor. `next build` NODE_ENV'i 'production' yapar,
 * `next dev` ise 'development'.
 */
if (process.env.NODE_ENV === 'development') {
  initOpenNextCloudflareForDev();
}

/**
 * ─── Derleme zamanı ortam değişkeni denetimi ────────────────────────────────
 *
 * `NEXT_PUBLIC_*` değişkenlerini Next.js DERLEME sırasında JavaScript paketinin
 * içine gömer; tarayıcı bunları çalışma zamanında hiçbir yerden okumaz.
 * Dolayısıyla `wrangler secret put` ve `wrangler.jsonc` → `vars` bu değerler
 * için YETERSİZDİR — ikisi de çalışma zamanı mekanizması.
 *
 * Bu değerler derleme ortamında tanımlı değilken derleme yine de BAŞARIYLA
 * tamamlanıyor, ama tarayıcıya `undefined` gömülmüş bir paket gidiyor ve site
 * ilk açılışta Supabase istemcisi kurulamadığı için tamamen boş ekran veriyor.
 * Sessiz başarısızlık en kötüsü; burada gürültülü hâle getiriyoruz.
 *
 * Cloudflare'de bunlar şuraya girilir:
 *   Workers & Pages → proje → Settings → Build → Variables and Secrets
 */
// NOT: `NEXT_PUBLIC_GOOGLE_CLIENT_ID` bilerek bu listede DEĞİL.
//
// Tanımlı değilse Google giriş bileşeni eski yönlendirmeli düğmeye düşüyor;
// kullanıcı yine giriş yapabiliyor, yalnızca onay ekranında `supabase.co`
// yazıyor. Yani eksikliği bir aksaklık, arıza değil — derlemeyi durdurmak
// orantısız olurdu.
const ZORUNLU_PUBLIC_DEGISKENLER = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_SITE_URL',
] as const;

// Kontrol YALNIZCA gerçek üretim derlemesinde çalışıyor.
//
// Koşul eskiden `NODE_ENV === 'production'` idi ve bu, derleme dışındaki
// komutlarda da doğru oluyordu: `next lint` bu yüzden hiç lint çalıştıramadan
// hata verip duruyordu. `NEXT_PHASE` değişkenini Next.js yalnızca derleme
// aşamasında `phase-production-build` yapıyor — aradığımız sinyal tam olarak bu.
if (
  process.env.NEXT_PHASE === 'phase-production-build' &&
  !process.env.SKIP_ENV_CHECK
) {
  const eksik = ZORUNLU_PUBLIC_DEGISKENLER.filter((ad) => !process.env[ad]?.trim());

  if (eksik.length > 0) {
    throw new Error(
      `\n\n[derleme durduruldu] Şu ortam değişkenleri derleme ortamında tanımlı değil:\n` +
        eksik.map((ad) => `  · ${ad}`).join('\n') +
        `\n\nBunlar NEXT_PUBLIC_ ile başladığı için derleme sırasında tarayıcı\n` +
        `paketine gömülür; wrangler secret / wrangler.jsonc vars ile verilemez.\n` +
        `Cloudflare'de: Settings → Build → Variables and Secrets.\n` +
        `Yerelde: .env.local dosyanız.\n\n` +
        `Bilerek atlamak isterseniz SKIP_ENV_CHECK=1 ile derleyin.\n`,
    );
  }
}

const nextConfig: NextConfig = {
  // Sürüm parmak izini gizle. Next.js varsayılan olarak her yanıta
  // `X-Powered-By: Next.js` ekliyor; bu başlık hiçbir işe yaramıyor ama
  // saldırgana hangi çatıyı taradığını söylüyor.
  poweredByHeader: false,

  // NOT: `serverExternalPackages: ['iyzipay']` kaldırıldı. iyzipay paketi
  // Workers'ta çalışamadığı için (kurulumunda fs.readdirSync + hesaplanan
  // yollu require var) kaldırıldı; iyzico artık src/lib/iyzico.ts içinde
  // doğrudan fetch ile çağrılıyor.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'aosmith.com.tr',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_BRAND: process.env.NEXT_PUBLIC_BRAND ?? 'alb-tarim',
  },

  /**
   * Güvenlik başlıkları.
   * Ödeme sayfası barındıran bir sitede clickjacking, MIME-sniffing ve
   * referer sızıntısı korumaları temel gerekliliktir.
   */
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
      {
        // Hesap ve ödeme sayfaları önbelleğe alınmasın
        source: '/(hesabim|sepet|odeme|admin)/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store, must-revalidate' }],
      },
    ]
  },
};

export default nextConfig;
