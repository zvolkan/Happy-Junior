import sanitizeHtml from 'sanitize-html'

/**
 * Blog içeriği temizliği.
 *
 * Blog yazısının gövdesi `dangerouslySetInnerHTML` ile basılıyor ve form
 * kullanıcıya "istersen HTML de yazabilirsiniz" diyor. İçerik hiçbir yerde
 * filtrelenmiyordu: yazının içine konan bir `<script>` veya `<img onerror=...>`
 * siteyi ziyaret eden HERKESTE çalışırdı. İçeriği yalnızca yönetici girdiği
 * için "herkes yazabilir" durumu yok, ama iki gerçekçi yol var — admin
 * oturumunun ele geçirilmesi ve yöneticinin dışarıdan kopyaladığı HTML'i
 * farkında olmadan yapıştırması. Çalışan script `/hesabim` ve `/odeme` ile
 * aynı origin'de olduğu için oturum çerezlerine erişirdi.
 *
 * Temizlik hem YAZMA (veritabanına girmeden) hem OKUMA anında yapılıyor.
 * Okuma tarafı, bu düzeltmeden ÖNCE kaydedilmiş yazılar için gerekli.
 */

const AYARLAR: sanitizeHtml.IOptions = {
  allowedTags: [
    'p', 'br', 'hr',
    'h2', 'h3', 'h4',
    'strong', 'b', 'em', 'i', 'u', 's',
    'ul', 'ol', 'li',
    'blockquote', 'figure', 'figcaption',
    'a', 'img',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'span', 'div',
  ],
  allowedAttributes: {
    // target/rel de listede olmalı: transformTags bunları eklese bile
    // allowedAttributes filtresi listede olmayanı siliyor.
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
    // `class` SERBEST BIRAKILMIYOR, beyaz listeyle sınırlandırıldı.
    //
    // `style` zaten kabul edilmiyordu, ama Tailwind kullanan bir sitede serbest
    // `class` neredeyse aynı güce sahip: yazıya `<div class="fixed inset-0
    // z-50">` koyan biri, sayfanın tamamını kaplayan görünmez bir katman
    // oluşturup altındaki her tıklamayı yakalayabilir (tıklama hırsızlığı).
    // Blog yazarları yönetici olsa bile, hesabı ele geçirilen bir yazar bunu
    // yapabilir; ayrıca içerik veritabanından geliyor.
    //
    // İzin verilen sınıflar aşağıda `allowedClasses` ile tek tek sayılıyor.
    span: ['class'],
    div: ['class'],
    th: ['colspan', 'rowspan'],
    td: ['colspan', 'rowspan'],
  },
  /**
   * İzin verilen sınıf adları. Konumlandırma, boyut ve z-index içeren hiçbir
   * sınıf listede yok; yalnızca metin biçimlendirme.
   */
  allowedClasses: {
    span: [
      'font-bold', 'font-semibold', 'italic', 'underline',
      'text-sm', 'text-base', 'text-lg',
      'text-gray-500', 'text-gray-600', 'text-gray-700',
      'highlight', 'vurgu',
    ],
    div: ['not-prose', 'tablo-sarmal', 'uyari', 'bilgi'],
  },
  // Yalnızca güvenli şemalar. `javascript:`, `data:` ve `vbscript:` dışarıda.
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesByTag: { img: ['http', 'https'] },
  allowProtocolRelative: false,
  // İçeriği tamamen atılacak etiketler — metinleri de gitsin
  nonTextTags: ['style', 'script', 'textarea', 'option', 'noscript', 'iframe'],
  transformTags: {
    // Dış bağlantılar yeni sekmede ve referrer sızdırmadan açılsın
    a: (tagName, attribs) => {
      const href = attribs.href ?? ''
      const disLink = /^https?:\/\//i.test(href)

      if (disLink) {
        return {
          tagName,
          attribs: { ...attribs, target: '_blank', rel: 'noopener noreferrer nofollow' },
        }
      }

      // SİTE İÇİ bağlantılar da denetleniyor.
      //
      // Eskiden site içi bağlantılar olduğu gibi geçiyordu. Yazar kendi
      // `target="_blank"` etiketini yazdığında bağlantı yeni sekmede açılıyor
      // ama `rel` almıyordu — açılan sayfa `window.opener` üzerinden bizim
      // sekmemizi başka bir adrese yönlendirebiliyor (tabnabbing). Site içi
      // bağlantıda bile bu, saldırganın yazıya koyduğu bir adres olabilir.
      if (attribs.target) {
        return {
          tagName,
          attribs: { ...attribs, rel: attribs.rel || 'noopener noreferrer' },
        }
      }

      return { tagName, attribs }
    },
  },
}

/** Blog gövdesini güvenli HTML'e indirger. */
export function sanitizeBlogHtml(html: string): string {
  if (!html) return ''
  return sanitizeHtml(html, AYARLAR)
}

/**
 * `<script>` içine gömülecek JSON'u kaçırır.
 *
 * `JSON.stringify` eğik çizgiyi kaçırmaz; ürün adına `</script><script>...`
 * yazan biri tarayıcıya script bloğunu erken kapattırıp gerisini
 * çalıştırabilirdi. Satır ayırıcı karakterler de (U+2028/U+2029) JavaScript
 * ayrıştırıcısını bozduğu için kaçırılıyor.
 */
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}
