
/**
 * E-posta gönderimi.
 *
 * Projede hiçbir e-posta gönderilmiyordu: müşteri ödeme yaptıktan sonra yazılı
 * hiçbir teyit almıyordu (Mesafeli Sözleşmeler Yönetmeliği teyit gönderimini
 * zorunlu tutar), kargo bildirimi de yoktu.
 *
 * Resend'in REST API'si doğrudan `fetch` ile çağrılıyor — yeni bir npm paketi
 * kurmaya gerek yok.
 *
 * TASARIM KURALI: E-posta gönderimi ASLA sipariş akışını bozmaz. Anahtar
 * tanımlı değilse veya sağlayıcı hata verirse yalnızca log'a yazılır; çağıran
 * kod etkilenmez.
 */

const RESEND_ENDPOINT = 'https://api.resend.com/emails'

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
  /** Düz metin karşılığı — spam puanını düşürür */
  text?: string
  replyTo?: string
}

export type SendEmailResult =
  | { ok: true; id: string | null }
  | { ok: false; reason: 'not-configured' | 'error'; detail?: string }

/**
 * Ortam değişkenlerinden gelen sarmalayıcı tırnakları temizler.
 *
 * `.env` dosyasında boşluk içeren değerler tırnak içine alınır
 * (`EMAIL_FROM="Ad Soyad <a@b.com>"`) ve dosya okunurken tırnaklar ayıklanır.
 * Vercel panelinde ise değer ne yazılmışsa aynen saklanır — tırnaklar da dahil.
 * Aynı satır panele yapıştırılınca gönderen adresi tırnaklı kalıyor ve Resend
 * "invalid from field" diyerek reddediyor. Bu yüzden burada da temizliyoruz.
 */
export function unquote(value: string): string {
  const trimmed = value.trim()
  if (trimmed.length >= 2) {
    const first = trimmed[0]
    const last = trimmed[trimmed.length - 1]
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      return trimmed.slice(1, -1).trim()
    }
  }
  return trimmed
}

function getConfig() {
  const apiKey = process.env.RESEND_API_KEY ? unquote(process.env.RESEND_API_KEY) : ''
  const from = process.env.EMAIL_FROM ? unquote(process.env.EMAIL_FROM) : ''
  if (!apiKey || !from) return null
  return { apiKey, from }
}

export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const config = getConfig()

  if (!config) {
    // Yapılandırma yoksa sessizce geç — ama neyin gönderilemediğini logla
    console.warn(
      `[e-posta] RESEND_API_KEY/EMAIL_FROM tanımlı değil, gönderilemedi: "${options.subject}" → ${
        Array.isArray(options.to) ? options.to.join(', ') : options.to
      }`,
    )
    return { ok: false, reason: 'not-configured' }
  }

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: config.from,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.html,
        ...(options.text ? { text: options.text } : {}),
        ...(options.replyTo ? { reply_to: options.replyTo } : {}),
      }),
      // Yavaş sağlayıcı sipariş akışını kilitlemesin
      signal: AbortSignal.timeout(10_000),
    })

    if (!response.ok) {
      const detail = await response.text().catch(() => '')
      // `from` ve `to` da loglanır: Resend'in en sık verdiği iki hata
      // (doğrulanmamış alan adı / test modunda başka adrese gönderim)
      // yalnızca bu iki değere bakılarak teşhis edilebiliyor.
      console.error(
        '[e-posta] gönderim başarısız:',
        response.status,
        `from=${config.from}`,
        `to=${Array.isArray(options.to) ? options.to.join(',') : options.to}`,
        detail.slice(0, 500),
      )
      return { ok: false, reason: 'error', detail: detail.slice(0, 300) || `HTTP ${response.status}` }
    }

    const data = (await response.json().catch(() => ({}))) as { id?: string }
    return { ok: true, id: data.id ?? null }
  } catch (error) {
    console.error('[e-posta] gönderim hatası:', error)
    return { ok: false, reason: 'error', detail: String(error) }
  }
}

/**
 * Hata durumunda çağıranı etkilemeyen sarmalayıcı.
 * Sipariş onayı gibi kritik akışlarda bunu kullanın.
 */
export function sendEmailSafe(options: SendEmailOptions): Promise<SendEmailResult> {
  return sendEmail(options).catch((error) => {
    console.error('[e-posta] beklenmeyen hata:', error)
    return { ok: false, reason: 'error' as const }
  })
}
