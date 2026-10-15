/**
 * Sipariş iptalinin TEK KARAR NOKTASI.
 *
 * ── Neden ayrı bir dosya ────────────────────────────────────────────────────
 *
 * "Bu sipariş iptal edilebilir mi?" sorusuna üç yerde ayrı ayrı cevap
 * veriliyordu: müşterinin sipariş listesi, sipariş detayı ve `cancelOrder`
 * sunucu aksiyonu. Üçü de yalnızca `status`'a bakıyordu:
 *
 *     ['PENDING', 'CONFIRMED'].includes(order.status)
 *
 * Bu kontrol, iade süreci başlamış ama bitmemiş siparişi "iptal edilebilir"
 * sayıyordu. Gerçek hayatta yaşanan hata tam olarak buydu: iyzico'ya iptal
 * isteği gitti, para iade edildi, ama cevap yolda kayboldu (Cloudflare ile
 * iyzico arasındaki bilinen 522/525 sorunu). Kodumuz "iade başarısız" diye
 * siparişi eski durumuna döndürdü — sipariş yine CONFIRMED, yine `paid`.
 * Sonuç: iyzico panelinde sipariş iptal görünüyor, sitede müşteri hâlâ
 * "Siparişi İptal Et" düğmesini görüyor.
 *
 * Artık karar `status` ile `paymentStatus`'a birlikte bakıyor ve tek bir
 * yerden veriliyor. Üç çağrı noktası aynı fonksiyonu kullandığı için ileride
 * birinin güncellenip diğerlerinin unutulması mümkün değil.
 */

/**
 * Yönetici panelindeki "İade incelemesi" filtresinin değeri.
 *
 * Bir `OrderStatus` DEĞİL: ödeme durumuna göre filtreleyen sanal bir seçenek.
 * Aynı `?durum=` parametresini kullanıyor ki panelde ikinci bir filtre çubuğu
 * gerekmesin.
 *
 * Burada duruyor, `admin-orders.ts` içinde değil: o dosya `'use server'` ve
 * böyle bir dosyadan yalnızca async fonksiyon ihraç edilebiliyor. Sabit orada
 * dursa derleme "Only async functions are allowed to be exported" diye
 * patlıyor — çalışma anında değil, derlemede.
 */
export const IADE_INCELEME_FILTRESI = 'iade-inceleme'

/** Sipariş durumları — iptal yalnızca hazırlanmaya başlanmadan önce. */
const IPTAL_EDILEBILIR_DURUMLAR = ['PENDING', 'CONFIRMED']

/**
 * Para iadesi başlamış ya da bitmiş siparişlerin ödeme durumları.
 *
 * Bu durumlardan birinde İPTAL DÜĞMESİ GÖSTERİLMEZ. Gerekçe her biri için
 * ayrı:
 *
 *  - `refunding`        → iade şu an işleniyor. İkinci bir istek çift iade.
 *  - `refund_pending`   → iyzico'ya istek gitti, sonucu ÖĞRENEMEDİK. Yönetici
 *                         kontrol edecek. Müşteriye tekrar denetmek, parası
 *                         çoktan dönmüşken ikinci bir iade tetiklemek olur.
 *  - `refunded`         → bitti.
 *  - `partially_refunded` → kısmi iade yapılmış; kalanın iptali iade talebi
 *                         akışından geçmeli, tek tuşla değil.
 *  - `cancelled`        → ödemesiz sipariş zaten iptal edilmiş.
 */
export const IADE_SURECI_DURUMLARI = [
  'refunding',
  'refund_pending',
  'refunded',
  'partially_refunded',
  'cancelled',
]

/** İade süreci başlamış/bitmiş mi? */
export function iadeSurecindeMi(paymentStatus: string | null | undefined): boolean {
  return IADE_SURECI_DURUMLARI.includes(paymentStatus ?? '')
}

/**
 * Sonucu öğrenilemeyen bir iade var mı?
 *
 * Bu iki durumda müşteriye "iptal edilemez" demek yetmiyor; ne olduğunu da
 * söylemek gerekiyor. Aksi hâlde düğmenin kaybolması müşteriye hiçbir şey
 * anlatmıyor.
 */
export function iadeIsleniyorMu(paymentStatus: string | null | undefined): boolean {
  return paymentStatus === 'refunding' || paymentStatus === 'refund_pending'
}

/** Müşteri bu siparişi kendisi iptal edebilir mi? */
export function siparisIptalEdilebilir(order: {
  status: string
  paymentStatus?: string | null
}): boolean {
  if (!IPTAL_EDILEBILIR_DURUMLAR.includes(order.status)) return false
  if (iadeSurecindeMi(order.paymentStatus)) return false
  return true
}

/** İptal edilemiyorsa sebebi — müşteriye gösterilecek metin. */
export function iptalEngelSebebi(order: {
  status: string
  paymentStatus?: string | null
}): string | null {
  if (siparisIptalEdilebilir(order)) return null

  if (iadeIsleniyorMu(order.paymentStatus)) {
    return 'İptal talebiniz alındı ve ödeme iadeniz işleniyor. Sonuçlandığında ' +
      'sipariş durumunuz güncellenecek; ayrıca bir işlem yapmanıza gerek yok.'
  }

  if (!IPTAL_EDILEBILIR_DURUMLAR.includes(order.status)) {
    return 'Bu sipariş hazırlanmaya başlandığı için artık iptal edilemiyor.'
  }

  return null
}

/** Yönetici panelinde ödeme durumunun Türkçe karşılığı. */
export const ODEME_DURUM_ADI: Record<string, string> = {
  pending: 'Bekliyor',
  paid: 'Ödendi',
  failed: 'Başarısız',
  cancelled: 'İptal edildi',
  refunding: 'İade işleniyor',
  refund_pending: 'İADE SONUCU BELİRSİZ — kontrol edin',
  refunded: 'İade edildi',
  partially_refunded: 'Kısmi iade edildi',
}

export function odemeDurumAdi(paymentStatus: string | null | undefined): string {
  if (!paymentStatus) return '—'
  return ODEME_DURUM_ADI[paymentStatus] ?? paymentStatus
}
