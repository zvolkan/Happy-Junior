/**
 * Kargo takip bağlantıları.
 *
 * Aynı eşleştirme üç yerde kopyalanmıştı (e-posta bildirimi, sipariş takibi
 * sayfası, sipariş detayı). Bir firma eklendiğinde üçünü birden güncellemek
 * gerekiyordu; tek kaynağa alındı.
 */
export function carrierTrackingUrl(carrier: string, code: string): string | null {
  const c = carrier.toLocaleLowerCase('tr')
  const q = encodeURIComponent(code)

  if (c.includes('yurtiçi') || c.includes('yurtici'))
    return `https://www.yurticikargo.com/tr/online-servisler/gonderi-sorgula?code=${q}`
  if (c.includes('aras')) return `https://kargotakip.araskargo.com.tr/mobil/sorgu.aspx?code=${q}`
  if (c.includes('mng')) return `https://kargotakip.mngkargo.com.tr/?takipNo=${q}`
  if (c.includes('ptt')) return `https://gonderitakip.ptt.gov.tr/Track/Verify?q=${q}`
  if (c.includes('sürat') || c.includes('surat'))
    return `https://www.suratkargo.com.tr/KargoTakip/?kargotakipno=${q}`
  if (c.includes('ups')) return `https://www.ups.com/track?tracknum=${q}`
  return null
}
