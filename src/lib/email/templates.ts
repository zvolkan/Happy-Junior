import { SITE_CONFIG } from '@/lib/constants'
import { getSiteUrl } from '@/lib/site-url'

/**
 * E-posta şablonları.
 *
 * Tablo tabanlı düzen kullanılıyor — Outlook ve Gmail dahil tüm istemcilerde
 * güvenilir şekilde render edilen tek yöntem. Flexbox/grid e-postada çalışmaz.
 */

function money(value: number): string {
  return value.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function layout(title: string, bodyHtml: string): string {
  const siteUrl = getSiteUrl()
  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#18181b;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e4e4e7;">

        <!-- TODO: logo PNG gelince buraya img etiketi konacak. Logo neden SVG değil PNG:
             Gmail ve Outlook e-postada SVG göstermiyor, görsel sessizce boş
             çıkardı. Bu yüzden aynı logonun PNG sürümü kullanılıyor (beyaz,
             şeffaf zeminli — arkasındaki koyu hücre görünüyor).
             Adres MUTLAK olmalı: e-posta istemcisi siteyi tanımaz.
             Görselleri engelleyen istemciler için alt metni marka adı, yani
             görsel yüklenmese bile başlık okunur kalıyor.
             DİKKAT: bu blok bir şablon dizesinin (template literal) içinde;
             yorum metninde ters tırnak KULLANMAYIN, dizeyi kapatır. -->
        <tr><td style="background:#52392a;padding:18px 28px;">
          <span style="font-family:Arial,sans-serif;font-size:22px;font-weight:800;color:#ffffff;">Happy Junior</span>
        </td></tr>

        <tr><td style="padding:28px;">
          ${bodyHtml}
        </td></tr>

        <tr><td style="background:#fafafa;border-top:1px solid #e4e4e7;padding:20px 28px;">
          <p style="margin:0 0 6px;font-size:12px;color:#71717a;line-height:1.6;">
            ${escapeHtml(SITE_CONFIG.address)}
          </p>
          <p style="margin:0;font-size:12px;color:#71717a;">
            <a href="${siteUrl}" style="color:#3f3f46;text-decoration:none;">${escapeHtml(
              siteUrl.replace(/^https?:\/\//, ''),
            )}</a>
            &nbsp;·&nbsp; ${escapeHtml(SITE_CONFIG.phone)}
            &nbsp;·&nbsp; ${escapeHtml(SITE_CONFIG.email)}
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function button(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0;">
    <tr><td style="background:#18181b;border-radius:12px;">
      <a href="${href}" style="display:inline-block;padding:12px 24px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">${escapeHtml(
        label,
      )}</a>
    </td></tr>
  </table>`
}

export interface OrderEmailItem {
  name: string
  quantity: number
  unit: string
  totalPrice: number
}

export interface OrderEmailData {
  /** Veritabanı kimliği — yalnızca admin panel bağlantısı için */
  orderId: string
  /** Marka anahtarı — panel marka bazlı olduğu için admin bağlantısında gerekli */
  brandKey?: string
  /** Müşteriye gösterilen sipariş numarası (yalnızca rakam) */
  orderNo: string
  customerName: string
  items: OrderEmailItem[]
  subtotal: number
  shippingFee: number
  total: number
  shipFullName: string
  shipPhone: string
  shipLine1: string
  shipLine2?: string | null
  shipDistrict: string
  shipCity: string
}

function itemRows(items: OrderEmailItem[]): string {
  return items
    .map(
      (item) => `<tr>
        <td style="padding:10px 0;border-bottom:1px solid #f4f4f5;font-size:14px;">
          ${escapeHtml(item.name)}
          <span style="display:block;color:#a1a1aa;font-size:12px;margin-top:2px;">
            ${item.quantity} ${escapeHtml(item.unit)}
          </span>
        </td>
        <td align="right" style="padding:10px 0;border-bottom:1px solid #f4f4f5;font-size:14px;white-space:nowrap;">
          ${money(item.totalPrice)}
        </td>
      </tr>`,
    )
    .join('')
}

function totalsRows(data: OrderEmailData): string {
  return `
    <tr>
      <td style="padding:10px 0 4px;font-size:14px;color:#71717a;">Ara Toplam</td>
      <td align="right" style="padding:10px 0 4px;font-size:14px;">${money(data.subtotal)}</td>
    </tr>
    <tr>
      <td style="padding:4px 0;font-size:14px;color:#71717a;">Kargo</td>
      <td align="right" style="padding:4px 0;font-size:14px;">${
        data.shippingFee === 0 ? 'Ücretsiz' : money(data.shippingFee)
      }</td>
    </tr>
    <tr>
      <td style="padding:12px 0 0;border-top:2px solid #18181b;font-size:15px;font-weight:700;">
        Toplam <span style="font-weight:400;color:#a1a1aa;font-size:12px;">(KDV dahil)</span>
      </td>
      <td align="right" style="padding:12px 0 0;border-top:2px solid #18181b;font-size:16px;font-weight:700;">
        ${money(data.total)}
      </td>
    </tr>`
}

function addressBlock(data: OrderEmailData): string {
  return `<div style="background:#fafafa;border-radius:12px;padding:16px;margin-top:24px;">
    <p style="margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:#a1a1aa;font-weight:600;">
      Teslimat Adresi
    </p>
    <p style="margin:0;font-size:14px;line-height:1.7;color:#3f3f46;">
      ${escapeHtml(data.shipFullName)}<br />
      ${escapeHtml(data.shipPhone)}<br />
      ${escapeHtml(data.shipLine1)}${data.shipLine2 ? ', ' + escapeHtml(data.shipLine2) : ''}<br />
      ${escapeHtml(data.shipDistrict)} / ${escapeHtml(data.shipCity)}
    </p>
  </div>`
}

// ─── 1. Sipariş onayı ────────────────────────────────────────────────────────

export function orderConfirmationEmail(data: OrderEmailData) {
  const siteUrl = getSiteUrl()

  const html = layout(
    'Siparişiniz Alındı',
    `
    <p style="margin:0 0 6px;font-size:20px;font-weight:700;">Siparişiniz alındı</p>
    <p style="margin:0 0 20px;font-size:14px;color:#52525b;line-height:1.7;">
      Merhaba ${escapeHtml(data.customerName)}, ödemeniz başarıyla tamamlandı.
      Siparişiniz hazırlanmaya alındı; kargoya verildiğinde takip numarasını
      e-posta ile göndereceğiz.
    </p>

    <p style="margin:0 0 4px;font-size:12px;color:#a1a1aa;">SİPARİŞ NUMARASI</p>
    <p style="margin:0 0 20px;font-family:ui-monospace,Menlo,monospace;font-size:14px;font-weight:600;">
      ${escapeHtml(data.orderNo)}
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${itemRows(data.items)}
      ${totalsRows(data)}
    </table>

    ${addressBlock(data)}
    ${button(`${siteUrl}/hesabim/siparislerim`, 'Siparişimi Görüntüle')}

    <p style="margin:16px 0 0;font-size:12px;color:#a1a1aa;line-height:1.7;">
      Cayma hakkınız ve iade koşulları için
      <a href="${siteUrl}/iade-politikasi" style="color:#3f3f46;">iade politikamıza</a>
      göz atabilirsiniz.
    </p>
  `,
  )

  const text = [
    `Siparişiniz alındı — ${data.orderNo}`,
    '',
    ...data.items.map((i) => `${i.name} × ${i.quantity} ${i.unit} — ${money(i.totalPrice)}`),
    '',
    `Ara toplam: ${money(data.subtotal)}`,
    `Kargo: ${data.shippingFee === 0 ? 'Ücretsiz' : money(data.shippingFee)}`,
    `Toplam: ${money(data.total)} (KDV dahil)`,
    '',
    `Siparişleriniz: ${siteUrl}/hesabim/siparislerim`,
  ].join('\n')

  return { subject: `Siparişiniz alındı — ${data.orderNo}`, html, text }
}

// ─── 2. Kargo bildirimi ──────────────────────────────────────────────────────

export function orderShippedEmail(params: {
  orderNo: string
  customerName: string
  carrier: string
  trackingNumber: string
  trackingUrl?: string | null
}) {
  const siteUrl = getSiteUrl()

  const html = layout(
    'Siparişiniz Kargoya Verildi',
    `
    <p style="margin:0 0 6px;font-size:20px;font-weight:700;">Siparişiniz yola çıktı</p>
    <p style="margin:0 0 20px;font-size:14px;color:#52525b;line-height:1.7;">
      Merhaba ${escapeHtml(params.customerName)}, siparişiniz kargoya teslim edildi.
    </p>

    <div style="background:#fafafa;border-radius:12px;padding:16px;">
      <p style="margin:0 0 6px;font-size:12px;color:#a1a1aa;">KARGO FİRMASI</p>
      <p style="margin:0 0 14px;font-size:15px;font-weight:600;">${escapeHtml(params.carrier)}</p>
      <p style="margin:0 0 6px;font-size:12px;color:#a1a1aa;">TAKİP NUMARASI</p>
      <p style="margin:0;font-family:ui-monospace,Menlo,monospace;font-size:15px;font-weight:700;">
        ${escapeHtml(params.trackingNumber)}
      </p>
    </div>

    ${
      params.trackingUrl
        ? button(params.trackingUrl, 'Kargoyu Takip Et')
        : button(`${siteUrl}/siparis-takibi`, 'Sipariş Takibi')
    }

    <p style="margin:16px 0 0;font-size:12px;color:#a1a1aa;">
      Sipariş No: ${escapeHtml(params.orderNo)}
    </p>
  `,
  )

  const text = [
    'Siparişiniz kargoya verildi.',
    `Kargo firması: ${params.carrier}`,
    `Takip numarası: ${params.trackingNumber}`,
    params.trackingUrl ? `Takip: ${params.trackingUrl}` : `${siteUrl}/siparis-takibi`,
    `Sipariş No: ${params.orderNo}`,
  ].join('\n')

  return { subject: 'Siparişiniz kargoya verildi', html, text }
}

// ─── 2b. Teslim edildi ───────────────────────────────────────────────────────

/**
 * Teslimat teyidi.
 *
 * Cayma hakkı süresi teslim tarihinden itibaren işlediği için bu e-posta aynı
 * zamanda sürenin başladığının yazılı bildirimi oluyor.
 */
export function orderDeliveredEmail(params: { orderNo: string; customerName: string }) {
  const siteUrl = getSiteUrl()

  const html = layout(
    'Siparişiniz Teslim Edildi',
    `
    <p style="margin:0 0 6px;font-size:20px;font-weight:700;">Siparişiniz teslim edildi</p>
    <p style="margin:0 0 20px;font-size:14px;color:#52525b;line-height:1.7;">
      Merhaba ${escapeHtml(params.customerName)}, ${escapeHtml(
        params.orderNo,
      )} numaralı siparişiniz teslim edildi. Bizi tercih ettiğiniz için teşekkür ederiz.
    </p>

    <div style="background:#fafafa;border-radius:12px;padding:16px;">
      <p style="margin:0;font-size:14px;color:#52525b;line-height:1.7;">
        Üründe bir sorun varsa veya cayma hakkınızı kullanmak isterseniz,
        <strong>teslim tarihinden itibaren 14 gün</strong> içinde
        <a href="mailto:${SITE_CONFIG.email}" style="color:#2563eb;">${SITE_CONFIG.email}</a>
        adresinden veya ${escapeHtml(SITE_CONFIG.phone)} numarasından bize ulaşabilirsiniz.
      </p>
    </div>

    ${button(`${siteUrl}/hesabim/siparislerim`, 'Siparişlerim')}
  `,
  )

  const text = [
    `${params.orderNo} numaralı siparişiniz teslim edildi.`,
    'Cayma hakkınızı teslim tarihinden itibaren 14 gün içinde kullanabilirsiniz.',
    `İletişim: ${SITE_CONFIG.email} — ${SITE_CONFIG.phone}`,
  ].join('\n')

  return { subject: 'Siparişiniz teslim edildi', html, text }
}

// ─── 2b-2. E-fatura hazır ────────────────────────────────────────────────────

/**
 * Fatura PDF'i siparişe yüklendiğinde gider.
 *
 * PDF e-postaya EK olarak konmuyor: fatura ad, adres ve TCKN/VKN taşıyor ve
 * e-posta şifresiz bir kanal. Bunun yerine müşteri kendi hesabından, kimliği
 * doğrulanarak indiriyor.
 */
export function invoiceReadyEmail(params: {
  orderNo: string
  customerName: string
  invoiceNo?: string | null
  orderId: string
}) {
  const siteUrl = getSiteUrl()

  const html = layout(
    'Faturanız Hazır',
    `
    <p style="margin:0 0 6px;font-size:20px;font-weight:700;">Faturanız hazır</p>
    <p style="margin:0 0 20px;font-size:14px;color:#52525b;line-height:1.7;">
      Merhaba ${escapeHtml(params.customerName)}, ${escapeHtml(
        params.orderNo,
      )} numaralı siparişinizin faturası düzenlendi.${
        params.invoiceNo
          ? ` Fatura numarası: <strong>${escapeHtml(params.invoiceNo)}</strong>.`
          : ''
      }
    </p>

    <div style="background:#fafafa;border-radius:12px;padding:16px;">
      <p style="margin:0;font-size:14px;color:#52525b;line-height:1.7;">
        Faturanızı hesabınızdaki sipariş detayından PDF olarak indirebilirsiniz.
        Güvenliğiniz için faturayı e-postaya eklemiyoruz; indirme, hesabınıza
        giriş yaptıktan sonra yapılır.
      </p>
    </div>

    ${button(`${siteUrl}/hesabim/siparislerim/${params.orderId}`, 'Faturayı İndir')}
  `,
  )

  const text = [
    `${params.orderNo} numaralı siparişinizin faturası hazır.`,
    params.invoiceNo ? `Fatura no: ${params.invoiceNo}` : '',
    `İndirmek için: ${siteUrl}/hesabim/siparislerim/${params.orderId}`,
    `İletişim: ${SITE_CONFIG.email} — ${SITE_CONFIG.phone}`,
  ]
    .filter(Boolean)
    .join('\n')

  return { subject: `Faturanız hazır — ${params.orderNo}`, html, text }
}

// ─── 2c. Ödeme alınmadan iptal ───────────────────────────────────────────────

/**
 * Ödemesi alınmamış (PENDING) siparişin iptali. Para iadesi söz konusu
 * olmadığı için `orderRefundedEmail` yerine bu kullanılır — müşteriye
 * olmayan bir iadeyi beklemesini söylememek önemli.
 */
export function orderCancelledEmail(params: {
  orderNo: string
  customerName: string
  reason?: string
}) {
  const siteUrl = getSiteUrl()

  const html = layout(
    'Siparişiniz İptal Edildi',
    `
    <p style="margin:0 0 6px;font-size:20px;font-weight:700;">Siparişiniz iptal edildi</p>
    <p style="margin:0 0 20px;font-size:14px;color:#52525b;line-height:1.7;">
      Merhaba ${escapeHtml(params.customerName)}, ${escapeHtml(
        params.orderNo,
      )} numaralı siparişiniz iptal edildi.
    </p>

    <div style="background:#fafafa;border-radius:12px;padding:16px;">
      <p style="margin:0;font-size:14px;color:#52525b;line-height:1.7;">
        Bu sipariş için tahsil edilmiş bir ödeme bulunmuyor, dolayısıyla iade
        yapılmasına gerek yok. Bir yanlışlık olduğunu düşünüyorsanız bize
        ulaşın.
      </p>
    </div>

    ${params.reason ? `<p style="margin:16px 0 0;font-size:13px;color:#71717a;">Not: ${escapeHtml(params.reason)}</p>` : ''}

    ${button(`${siteUrl}/hesabim/siparislerim`, 'Siparişlerim')}
  `,
  )

  const text = [
    `${params.orderNo} numaralı siparişiniz iptal edildi.`,
    'Bu sipariş için tahsil edilmiş bir ödeme bulunmuyor.',
    `İletişim: ${SITE_CONFIG.email}`,
  ].join('\n')

  return { subject: 'Siparişiniz iptal edildi', html, text }
}

// ─── 3. İptal / iade ─────────────────────────────────────────────────────────

export function orderRefundedEmail(params: {
  orderNo: string
  customerName: string
  amount: number
  reason?: string
}) {
  const html = layout(
    'Siparişiniz İptal Edildi',
    `
    <p style="margin:0 0 6px;font-size:20px;font-weight:700;">Siparişiniz iptal edildi</p>
    <p style="margin:0 0 20px;font-size:14px;color:#52525b;line-height:1.7;">
      Merhaba ${escapeHtml(params.customerName)}, ${escapeHtml(
        params.orderNo,
      )} numaralı siparişiniz iptal edildi ve
      <strong>${money(params.amount)}</strong> tutarındaki ödemeniz iade işlemine alındı.
    </p>

    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:16px;">
      <p style="margin:0;font-size:14px;color:#92400e;line-height:1.7;">
        İade tutarının kartınıza yansıması bankanıza bağlı olarak
        <strong>1-7 iş günü</strong> sürebilir.
      </p>
    </div>

    ${params.reason ? `<p style="margin:16px 0 0;font-size:13px;color:#71717a;">Not: ${escapeHtml(params.reason)}</p>` : ''}
  `,
  )

  const text = [
    `${params.orderNo} numaralı siparişiniz iptal edildi.`,
    `İade tutarı: ${money(params.amount)}`,
    'Kartınıza yansıması 1-7 iş günü sürebilir.',
  ].join('\n')

  return { subject: 'Siparişiniz iptal edildi', html, text }
}

// ─── 4. Yöneticiye yeni sipariş bildirimi ────────────────────────────────────

export function adminNewOrderEmail(data: OrderEmailData) {
  const siteUrl = getSiteUrl()

  const html = layout(
    'Yeni Sipariş',
    `
    <p style="margin:0 0 6px;font-size:20px;font-weight:700;">Yeni sipariş geldi</p>
    <p style="margin:0 0 20px;font-size:14px;color:#52525b;">
      ${escapeHtml(data.customerName)} — <strong>${money(data.total)}</strong>
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${itemRows(data.items)}
    </table>

    ${addressBlock(data)}
    ${button(
      `${siteUrl}/admin/siparisler/${data.orderId}`,
      'Siparişi Aç',
    )}
  `,
  )

  return {
    subject: `Yeni sipariş: ${money(data.total)} — ${data.customerName}`,
    html,
    text: `Yeni sipariş ${data.orderNo} — ${money(data.total)} — ${data.customerName}`,
  }
}

// ─── 5. İade talebi ──────────────────────────────────────────────────────────

export function returnRequestedEmail(params: {
  orderNo: string
  customerName: string
  itemNames: string[]
}) {
  const siteUrl = getSiteUrl()

  const html = layout(
    'İade Talebiniz Alındı',
    `
    <p style="margin:0 0 6px;font-size:20px;font-weight:700;">İade talebiniz alındı</p>
    <p style="margin:0 0 20px;font-size:14px;color:#52525b;line-height:1.7;">
      Merhaba ${escapeHtml(params.customerName)}, ${escapeHtml(
        params.orderNo,
      )} numaralı siparişiniz için iade talebinizi aldık.
    </p>

    <div style="background:#fafafa;border-radius:12px;padding:16px;">
      <p style="margin:0 0 8px;font-size:12px;color:#a1a1aa;">İADE EDİLECEK ÜRÜNLER</p>
      ${params.itemNames
        .map(
          (name) =>
            `<p style="margin:0 0 4px;font-size:14px;color:#3f3f46;">• ${escapeHtml(name)}</p>`,
        )
        .join('')}
    </div>

    <p style="margin:16px 0 0;font-size:14px;color:#52525b;line-height:1.7;">
      Talebinizi en kısa sürede değerlendirip size dönüş yapacağız. Onaylandığında
      ürünü nasıl göndereceğinizi ayrıca bildireceğiz. <strong>Ürünü şimdilik
      göndermeyin.</strong>
    </p>

    ${button(`${siteUrl}/hesabim/siparislerim`, 'Siparişlerim')}
  `,
  )

  const text = [
    `${params.orderNo} numaralı sipariş için iade talebiniz alındı.`,
    `Ürünler: ${params.itemNames.join(', ')}`,
    'Onaylandığında ürünü nasıl göndereceğinizi bildireceğiz. Şimdilik göndermeyin.',
  ].join('\n')

  return { subject: 'İade talebiniz alındı', html, text }
}

export function returnDecisionEmail(params: {
  orderNo: string
  customerName: string
  approved: boolean
  adminNote?: string | null
}) {
  const siteUrl = getSiteUrl()

  const body = params.approved
    ? `
    <p style="margin:0 0 6px;font-size:20px;font-weight:700;">İade talebiniz onaylandı</p>
    <p style="margin:0 0 20px;font-size:14px;color:#52525b;line-height:1.7;">
      Merhaba ${escapeHtml(params.customerName)}, ${escapeHtml(
        params.orderNo,
      )} numaralı siparişinize ait iade talebiniz onaylandı.
    </p>

    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px;">
      <p style="margin:0 0 10px;font-size:14px;color:#166534;line-height:1.7;">
        <strong>Ürünü şu adrese gönderin:</strong><br />
        ${escapeHtml(SITE_CONFIG.address)}
      </p>
      <p style="margin:0;font-size:14px;color:#166534;line-height:1.7;">
        Ürün elimize ulaşıp kontrol edildikten sonra ödemeniz iade edilecek.
        Kartınıza yansıması bankanıza bağlı olarak 1-7 iş günü sürebilir.
      </p>
    </div>
  `
    : `
    <p style="margin:0 0 6px;font-size:20px;font-weight:700;">İade talebiniz hakkında</p>
    <p style="margin:0 0 20px;font-size:14px;color:#52525b;line-height:1.7;">
      Merhaba ${escapeHtml(params.customerName)}, ${escapeHtml(
        params.orderNo,
      )} numaralı siparişinize ait iade talebinizi maalesef karşılayamıyoruz.
    </p>
  `

  const html = layout(
    params.approved ? 'İade Talebiniz Onaylandı' : 'İade Talebiniz Hakkında',
    `
    ${body}
    ${
      params.adminNote
        ? `<div style="background:#fafafa;border-radius:12px;padding:16px;margin-top:16px;">
             <p style="margin:0 0 6px;font-size:12px;color:#a1a1aa;">AÇIKLAMA</p>
             <p style="margin:0;font-size:14px;color:#3f3f46;line-height:1.7;">${escapeHtml(
               params.adminNote,
             )}</p>
           </div>`
        : ''
    }
    <p style="margin:16px 0 0;font-size:13px;color:#71717a;line-height:1.7;">
      Sorularınız için <a href="mailto:${SITE_CONFIG.email}" style="color:#2563eb;">${
        SITE_CONFIG.email
      }</a> adresinden veya ${escapeHtml(SITE_CONFIG.phone)} numarasından bize ulaşabilirsiniz.
    </p>
    ${button(`${siteUrl}/hesabim/siparislerim`, 'Siparişlerim')}
  `,
  )

  const text = [
    params.approved
      ? `${params.orderNo} numaralı sipariş için iade talebiniz onaylandı.`
      : `${params.orderNo} numaralı sipariş için iade talebiniz karşılanamadı.`,
    params.approved ? `Ürünü şu adrese gönderin: ${SITE_CONFIG.address}` : '',
    params.adminNote ? `Açıklama: ${params.adminNote}` : '',
    `İletişim: ${SITE_CONFIG.email} — ${SITE_CONFIG.phone}`,
  ]
    .filter(Boolean)
    .join('\n')

  return {
    subject: params.approved ? 'İade talebiniz onaylandı' : 'İade talebiniz hakkında',
    html,
    text,
  }
}

export function adminReturnRequestEmail(params: {
  orderNo: string
  customerName: string
  customerEmail: string
  reason: string
  itemNames: string[]
  /** Panel marka bazlı; iade listesi markanın altında */
  brandKey?: string
}) {
  const siteUrl = getSiteUrl()
  const iadeYolu = `${siteUrl}/admin/iadeler`

  const html = layout(
    'Yeni İade Talebi',
    `
    <p style="margin:0 0 6px;font-size:20px;font-weight:700;">Yeni iade talebi</p>
    <p style="margin:0 0 16px;font-size:14px;color:#52525b;line-height:1.7;">
      <strong>${escapeHtml(params.customerName)}</strong> (${escapeHtml(
        params.customerEmail,
      )}) — sipariş ${escapeHtml(params.orderNo)}
    </p>

    <div style="background:#fafafa;border-radius:12px;padding:16px;">
      <p style="margin:0 0 8px;font-size:12px;color:#a1a1aa;">ÜRÜNLER</p>
      ${params.itemNames
        .map(
          (name) =>
            `<p style="margin:0 0 4px;font-size:14px;color:#3f3f46;">• ${escapeHtml(name)}</p>`,
        )
        .join('')}
      <p style="margin:12px 0 6px;font-size:12px;color:#a1a1aa;">GEREKÇE</p>
      <p style="margin:0;font-size:14px;color:#3f3f46;line-height:1.7;">${escapeHtml(
        params.reason,
      )}</p>
    </div>

    ${button(iadeYolu, 'İade Taleplerini Aç')}
  `,
  )

  const text = [
    `Yeni iade talebi — sipariş ${params.orderNo}`,
    `Müşteri: ${params.customerName} (${params.customerEmail})`,
    `Ürünler: ${params.itemNames.join(', ')}`,
    `Gerekçe: ${params.reason}`,
    iadeYolu,
  ].join('\n')

  return { subject: `Yeni iade talebi — ${params.orderNo}`, html, text }
}
