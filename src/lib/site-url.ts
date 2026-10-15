/**
 * Sitenin genel adresi.
 *
 * Eskiden birden çok dosyada `?? 'https://bayirlioglu-6rv9.vercel.app'` şeklinde
 * bir Vercel önizleme adresi yedek olarak duruyordu; bu adres ödeme geri dönüş
 * URL'sine ve mesafeli satış sözleşmesi metnine de sızıyordu.
 *
 * Artık tek kaynak burası. Üretimde NEXT_PUBLIC_SITE_URL tanımlı değilse
 * uyarı verilir — sessizce yanlış alan adına düşmez.
 */

const FALLBACK_DEV = 'http://localhost:3000'

let warned = false

export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim()

  if (fromEnv) return fromEnv.replace(/\/+$/, '')

  if (process.env.NODE_ENV === 'production' && !warned) {
    warned = true
    console.error(
      '[config] NEXT_PUBLIC_SITE_URL tanımlı değil. Ödeme geri dönüşleri ve ' +
        'sözleşme metinleri yanlış adrese işaret edecek. Bu değişken DERLEME ' +
        'sırasında pakete gömülür; çalışma zamanı sırrı veya wrangler.jsonc ' +
        'vars girdisi tarayıcı tarafına ULAŞMAZ. Cloudflare panelinde ' +
        'Settings → Build → Build variables and secrets bölümüne ekleyin ve ' +
        'yeniden derleyin.',
    )
  }

  // Cloudflare'de VERCEL_URL diye bir değişken YOK ve karşılığı da yok.
  // Vercel'de bu yedek sessiz bir emniyet ağıydı; burada olmadığı için
  // NEXT_PUBLIC_SITE_URL gerçekten zorunlu. Tanımsızsa yukarıdaki hata log'a
  // düşer ve site geliştirme adresini yayınlar — bu kasıtlı: sessizce yanlış
  // çalışmaktansa gürültü çıkarsın.
  return FALLBACK_DEV
}
