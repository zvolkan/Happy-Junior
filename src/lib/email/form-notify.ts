import { sendEmailSafe, unquote } from './send'

/**
 * İletişim formu ve bayi başvurusu için yönetici bildirimi.
 *
 * Bu iki form mesajı yalnızca veritabanına yazıyordu; kimseye bildirim
 * gitmiyordu. `ADMIN_NOTIFY_EMAIL` altyapısı hazır olmasına rağmen
 * kullanılmıyordu. Yönetici paneli açıp mesajlar sayfasına bakmazsa müşteri
 * mesajı günlerce görülmüyordu — site ise "En kısa sürede sizinle iletişime
 * geçeceğiz" diyor.
 *
 * Sipariş bildirimleri gibi "ateşle ve unut": e-posta gönderilemezse form
 * kaydı yine geçerli, kullanıcıya hata gösterilmiyor.
 */

function kacir(v: string): string {
  return v
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function satirlar(alanlar: [string, string | null | undefined][]): string {
  return alanlar
    .filter(([, v]) => v && String(v).trim())
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 12px 6px 0;color:#6b7280;vertical-align:top;white-space:nowrap">${kacir(k)}</td>` +
        `<td style="padding:6px 0;color:#111827">${kacir(String(v)).replace(/\n/g, '<br>')}</td></tr>`,
    )
    .join('')
}

function govde(baslik: string, alanlar: [string, string | null | undefined][]): string {
  return `<div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;max-width:600px">
  <h2 style="font-size:18px;color:#111827;margin:0 0 16px">${kacir(baslik)}</h2>
  <table style="border-collapse:collapse;font-size:14px;width:100%">${satirlar(alanlar)}</table>
  <p style="margin-top:20px;font-size:12px;color:#9ca3af">
    Bu bildirim siteden otomatik gönderildi. Yanıtlarsanız doğrudan kişiye ulaşır.
  </p>
</div>`
}

function duzMetin(baslik: string, alanlar: [string, string | null | undefined][]): string {
  return (
    `${baslik}\n\n` +
    alanlar
      .filter(([, v]) => v && String(v).trim())
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n')
  )
}

function yoneticiAdresi(): string {
  return process.env.ADMIN_NOTIFY_EMAIL ? unquote(process.env.ADMIN_NOTIFY_EMAIL) : ''
}

export async function notifyContactMessage(veri: {
  firstName: string
  lastName: string
  email: string
  phone?: string | null
  subject?: string | null
  message: string
  brandKey?: string | null
}): Promise<void> {
  const to = yoneticiAdresi()
  if (!to) return

  try {
    const alanlar: [string, string | null | undefined][] = [
      ['Ad Soyad', `${veri.firstName} ${veri.lastName}`],
      ['E-posta', veri.email],
      ['Telefon', veri.phone],
      ['Konu', veri.subject],
      ['Marka', veri.brandKey],
      ['Mesaj', veri.message],
    ]
    const baslik = `Yeni iletişim mesajı — ${veri.firstName} ${veri.lastName}`

    await sendEmailSafe({
      to,
      subject: baslik,
      html: govde(baslik, alanlar),
      text: duzMetin(baslik, alanlar),
      // Yönetici doğrudan "yanıtla" diyebilsin
      replyTo: veri.email,
    })
  } catch (error) {
    console.error('[e-posta] iletişim bildirimi gönderilemedi:', error)
  }
}
