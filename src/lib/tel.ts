/**
 * Telefon numarasından `tel:` bağlantısı üretir.
 *
 * ── Neden bir yardımcı ──────────────────────────────────────────────────────
 *
 * Sitede numaralar iki ayrı biçimde duruyor: `SITE_CONFIG.phone` insan için
 * yazılmış ("+90 544 414 22 54"), marka yapılandırmalarındaki `telefon` ise
 * çevirici için ("905071781633"). `href={`tel:${numara}`}` yazmak ilkinde
 * boşluklu bir bağlantı üretiyor; bazı Android çeviricileri boşluklu numarayı
 * olduğu gibi tuşlayıp hata veriyor.
 *
 * Burada numara rakamlara indiriliyor ve ülke kodu tamamlanıyor, böylece
 * hangi biçimde yazıldığından bağımsız olarak geçerli bir bağlantı çıkıyor.
 */
export function telHref(numara: string): string {
  const rakamlar = numara.replace(/\D/g, '')
  if (!rakamlar) return '#'

  // "0544..." → "90544..."  (yerel biçimde girilmiş numara)
  // "544..."  → "90544..."  (ülke kodu hiç yazılmamış)
  // "90544..." → olduğu gibi
  let tam = rakamlar
  if (tam.startsWith('0')) tam = '90' + tam.slice(1)
  else if (!tam.startsWith('90')) tam = '90' + tam

  return `tel:+${tam}`
}

/** Ekranda gösterilecek okunur biçim: +90 544 414 22 54 */
export function telGoster(numara: string): string {
  const r = numara.replace(/\D/g, '').replace(/^0/, '90')
  const t = r.startsWith('90') ? r.slice(2) : r
  if (t.length !== 10) return numara // beklenmedik biçim: olduğu gibi bırak
  return `+90 ${t.slice(0, 3)} ${t.slice(3, 6)} ${t.slice(6, 8)} ${t.slice(8)}`
}
