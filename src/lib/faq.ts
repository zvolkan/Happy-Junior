import { SITE_CONFIG, BRAND } from '@/lib/constants'
import type { BrandKey } from '@/lib/types'

/**
 * Sıkça sorulan sorular — TEK kaynak.
 *
 * Cevaplar hem ekranda görünüyor hem `FAQPage` yapısal verisine giriyor.
 * Google, yapısal veride sayfada GÖRÜNMEYEN bir cevap bulursa bunu ihlal
 * sayıyor; bu yüzden metin her zaman ekrandakiyle aynı kalmalı.
 *
 * TODO(müşteri): kargo firması, kargo süresi ve ücretsiz kargo sınırı
 * netleşince ilgili cevaplar güncellenecek.
 */

export interface SssMaddesi {
  question: string
  answer: string
}

export const GENEL_SSS: readonly SssMaddesi[] = [
  {
    question: 'Hangi ödeme yöntemleriyle sipariş verebilirim?',
    answer:
      'Siparişlerinizi havale/EFT ile ödeyebilirsiniz. Sipariş sonrasında IBAN bilgilerimiz ekranda ve e-postanızda gösterilir; açıklamaya sipariş numaranızı yazmanız yeterli. Kapıda ödeme seçeneğimiz bulunmuyor.',
  },
  {
    question: 'Ödememi yaptıktan sonra ne oluyor?',
    answer:
      'Ödemeniz hesabımıza geçtiğinde siparişiniz onaylanır ve hazırlanmaya başlar. Dekontunuzu WhatsApp’tan iletirseniz onay daha hızlı olur. 24 saat içinde ödemesi yapılmayan siparişler otomatik olarak iptal edilir.',
  },
  {
    question: 'Doğru bedeni nasıl seçerim?',
    answer:
      'Her ürün sayfasında yaş/beden seçenekleri yer alıyor. Emin olamadığınızda çocuğunuzun yaşını ve boyunu WhatsApp’tan yazın, size uygun bedeni birlikte seçelim.',
  },
  {
    question: 'Beden uymazsa değişim veya iade yapabilir miyim?',
    answer:
      'Evet. Teslimattan itibaren 14 gün içinde, etiketi sökülmemiş ve kullanılmamış ürünler için değişim veya iade talebinde bulunabilirsiniz. Talebinizi Hesabım → Siparişlerim bölümünden ya da WhatsApp’tan iletebilirsiniz.',
  },
  {
    question: 'Siparişimi mağazadan teslim alabilir miyim?',
    answer:
      'Anamur’daysanız siparişinizi mağazamızdan teslim alabilirsiniz. Ödeme adımında teslimat yöntemi olarak “Mağazadan teslim al” seçeneğini işaretlemeniz yeterli.',
  },
  {
    question: 'Size nasıl ulaşabilirim?',
    answer: `Mağazamız ${SITE_CONFIG.workingHours} saatlerinde açık. Bu saatlerin dışında WhatsApp’tan yazabilirsiniz; mesajınıza en kısa sürede dönüş yapıyoruz.`,
  },
]

/** Tam SSS listesi (marka parametresi eski imzayla uyum için duruyor). */
export function sssListesi(_marka?: BrandKey): readonly SssMaddesi[] {
  return GENEL_SSS
}

/** Bölüm başlığının altındaki açıklama cümlesi. */
export function sssAltBaslik(_marka?: BrandKey): string {
  return `${BRAND.name} hakkında en çok sorulanlar`
}
