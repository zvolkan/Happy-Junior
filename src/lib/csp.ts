/**
 * Content-Security-Policy.
 *
 * Sitede CSP hiç tanımlı değildi. Diğer beş güvenlik başlığı (X-Frame-Options,
 * nosniff, Referrer-Policy, Permissions-Policy, HSTS) `next.config.ts`'te
 * duruyordu ama CSP yoktu — yani sayfaya bir şekilde script enjekte edildiğinde
 * ikinci savunma hattı yoktu. Kart bilgisi girilen bir sitede bu, enjekte edilen
 * script'in form alanlarını dinlemesine ("formjacking") karşı en önemli katman.
 *
 * Nonce tabanlı: her istek için rastgele bir değer üretilir, sayfadaki meşru
 * satır-içi script'ler o değeri taşır, taşımayan hiçbir script çalışmaz.
 * `strict-dynamic` sayesinde nonce'lu script'in yüklediği alt script'ler de
 * güvenilir sayılır — Next.js'in kendi yükleyicisi böyle çalışıyor.
 *
 * ACİL DURUM ANAHTARI: bir şey bozulursa Vercel'e `CSP_REPORT_ONLY=true`
 * ekleyin. O zaman politika "Report-Only" olarak gönderilir — tarayıcı konsola
 * ihlalleri yazar ama hiçbir şeyi engellemez. Neyin eksik olduğunu görüp
 * politikayı düzelttikten sonra değişkeni kaldırın.
 */

export function generateNonce(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  // btoa Edge runtime'da var; base64 nonce CSP için geçerli bir değer
  return btoa(String.fromCharCode(...bytes))
}

export function buildCsp(nonce: string, isDev: boolean): string {
  const directives: string[] = [
    `default-src 'self'`,

    // 'strict-dynamic' varken host listeleri yok sayılır; `https:` yalnızca
    // strict-dynamic'i desteklemeyen eski tarayıcılar için yedek.
    // Geliştirmede Next.js HMR eval kullandığı için 'unsafe-eval' şart.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https:${isDev ? " 'unsafe-eval'" : ''}`,

    // React satır-içi `style` prop'u ve Tailwind'in enjekte ettiği stiller
    // için 'unsafe-inline' gerekiyor. Stil enjeksiyonu script'e göre çok daha
    // düşük riskli.
    `style-src 'self' 'unsafe-inline'`,

    // googleusercontent: Google giriş penceresindeki hesap avatarları.
    `img-src 'self' data: blob: https://*.supabase.co https://aosmith.com.tr https://*.googleusercontent.com`,
    `font-src 'self' data:`,
    `media-src 'self'`,

    // Supabase auth/storage çağrıları. Geliştirmede HMR websocket'i eklenir.
    // accounts.google.com: Google ile giriş, kimlik jetonunu almak için
    // kendi uçlarına istek atıyor.
    `connect-src 'self' https://*.supabase.co https://accounts.google.com${isDev ? ' ws: wss:' : ''}`,

    // iyzico 3D Secure akışı çerçeve içinde açılabiliyor.
    // accounts.google.com ŞART: Google'ın giriş penceresi bir iframe
    // içinde açılıyor ve bu satır olmadan sessizce hiç açılmıyor —
    // konsolda da belirgin bir hata görünmüyor.
    `frame-src 'self' https://*.iyzipay.com https://*.iyzico.com https://accounts.google.com`,

    // Formlar yalnızca kendi sitemize ve iyzico'ya gönderilebilir
    `form-action 'self' https://*.iyzipay.com https://*.iyzico.com`,

    `frame-ancestors 'self'`,
    `base-uri 'self'`,
    `object-src 'none'`,
  ]

  if (!isDev) directives.push('upgrade-insecure-requests')

  return directives.join('; ')
}

export function cspHeaderName(): string {
  return process.env.CSP_REPORT_ONLY === 'true'
    ? 'Content-Security-Policy-Report-Only'
    : 'Content-Security-Policy'
}
