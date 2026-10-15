/**
 * Admin oturum token'ı — HMAC-SHA256 ile imzalanır.
 *
 * Eskiden cookie sabit 'authenticated' metnini tutuyordu; bu değeri elle
 * tanımlayan herkes admin olabiliyordu. Artık token sunucu sırrıyla imzalı ve
 * son kullanma tarihli.
 *
 * Web Crypto API kullanır → hem Node (server action) hem Edge (middleware)
 * ortamında çalışır.
 */

const encoder = new TextEncoder()

/**
 * İmza anahtarı. Yoksa null döner → doğrulama her zaman başarısız olur
 * (fail-closed); "sır yoksa herkes admin" durumu asla oluşmaz.
 *
 * ÜRETİMDE `ADMIN_PASSWORD` YEDEĞİ YOK. Eskiden `ADMIN_SESSION_SECRET`
 * tanımlı değilse admin parolası HMAC anahtarı olarak kullanılıyordu. İki
 * sorunu vardı: (a) anahtarın entropisi insan seçimi bir parolanın entropisine
 * iniyordu, (b) parola herhangi bir yoldan sızarsa saldırgan hiç giriş
 * yapmadan geçerli oturum token'ı üretebiliyordu. Geliştirme ortamında yedek
 * korundu ki yerelde uğraştırmasın.
 *
 * Üretim sırrı: `openssl rand -base64 48`
 */
let sirUyarisiVerildi = false

function getSecret(): string | null {
  const özel = process.env.ADMIN_SESSION_SECRET?.trim()
  if (özel && özel.length > 0) return özel

  if (process.env.NODE_ENV === 'production') {
    if (!sirUyarisiVerildi) {
      sirUyarisiVerildi = true
      console.error(
        '[admin] ADMIN_SESSION_SECRET tanımlı değil. Admin girişi kapalı. ' +
          'Vercel ortam değişkenlerine `openssl rand -base64 48` çıktısını ekleyin.',
      )
    }
    return null
  }

  // Yalnızca geliştirme ortamı
  const yedek = process.env.ADMIN_PASSWORD?.trim()
  return yedek && yedek.length > 0 ? yedek : null
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlDecode(value: string): Uint8Array {
  const padding = value.length % 4 === 0 ? '' : '='.repeat(4 - (value.length % 4))
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/') + padding
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

async function sign(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data))
  return base64UrlEncode(new Uint8Array(signature))
}

/**
 * Sabit süreli karşılaştırma — zamanlama saldırılarına karşı.
 *
 * Uzunluk farkında erken dönüyor; imza karşılaştırmasında sorun değil (imzalar
 * hep aynı uzunlukta) ama parola karşılaştırmasında parolanın UZUNLUĞUNU
 * zamanlamayla sızdırabiliyordu. Parolalar için aşağıdaki `timingSafeEqualHash`
 * kullanılmalı: iki tarafı da SHA-256'dan geçirip sabit uzunlukta karşılaştırır,
 * böylece uzunluk kanalı tamamen kapanır.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

/** Uzunluk sızdırmayan karşılaştırma — parolalar için. */
export async function timingSafeEqualHash(a: string, b: string): Promise<boolean> {
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(a)),
    crypto.subtle.digest('SHA-256', encoder.encode(b)),
  ])
  const va = new Uint8Array(ha)
  const vb = new Uint8Array(hb)
  let diff = 0
  for (let i = 0; i < va.length; i++) diff |= va[i] ^ vb[i]
  return diff === 0
}

/** İmzalı oturum token'ı üretir. `maxAgeSeconds` kadar geçerlidir. */
export async function createAdminToken(maxAgeSeconds: number): Promise<string> {
  const secret = getSecret()
  if (!secret) throw new Error('ADMIN_SESSION_SECRET (veya ADMIN_PASSWORD) tanımlı değil')

  const nonce = base64UrlEncode(crypto.getRandomValues(new Uint8Array(12)))
  const payload = {
    v: 1,
    iat: Date.now(),
    exp: Date.now() + maxAgeSeconds * 1000,
    n: nonce,
  }
  const encoded = base64UrlEncode(encoder.encode(JSON.stringify(payload)))
  return `${encoded}.${await sign(encoded, secret)}`
}

/** Token geçerli ve süresi dolmamış mı? Sır tanımlı değilse daima false. */
export async function verifyAdminToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false

  const secret = getSecret()
  if (!secret) return false

  const parts = token.split('.')
  if (parts.length !== 2) return false

  const [encoded, signature] = parts

  let expected: string
  try {
    expected = await sign(encoded, secret)
  } catch {
    return false
  }
  if (!timingSafeEqual(signature, expected)) return false

  try {
    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(encoded)))
    if (typeof payload?.exp !== 'number') return false
    if (Date.now() > payload.exp) return false
    return true
  } catch {
    return false
  }
}
