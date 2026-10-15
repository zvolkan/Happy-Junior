import { SITE_CONFIG, BRANDS } from '@/lib/constants'
import type { BrandKey } from '@/lib/types'

/**
 * Sıkça sorulan sorular — TEK kaynak.
 *
 * ── Neden buraya taşındı ────────────────────────────────────────────────────
 *
 * Beş gerçek soru-cevap `src/app/hizmetler/page.tsx` içinde bir dizi olarak
 * duruyordu. İki sorun vardı:
 *
 * 1. Hiçbiri `FAQPage` olarak işaretlenmemişti. Google, işaretlenmiş SSS'leri
 *    arama sonucunun altında açılır sorular olarak gösterebiliyor; sonuç
 *    kartının kapladığı alan büyüyor. İçerik hazırken bunu kaçırmak,
 *    yazılmış ama yayınlanmamış içerik demek.
 * 2. Marka sayfalarında (`/alb-tarim/hizmetler`, `/alb-su-aritma/hizmetler`)
 *    SSS bölümü hiç yoktu — oysa müşterinin servis sorusu sorduğu yer orası.
 *
 * Artık üç sayfa da aynı diziden besleniyor.
 *
 * ── Cevapları değiştirirken ─────────────────────────────────────────────────
 *
 * Cevaplar hem ekranda görünüyor hem yapısal veriye giriyor. Google, yapısal
 * veride sayfada GÖRÜNMEYEN bir cevap bulursa bunu ihlal sayıyor. Yani
 * buradaki metin her zaman ekrandaki metinle aynı kalmalı — ikisini ayırmayın.
 */

export interface SssMaddesi {
  question: string
  answer: string
}

/** Her iki markada da geçerli olan sorular. */
export const GENEL_SSS: readonly SssMaddesi[] = [
  {
    question: 'Hizmet bölgeniz neresidir?',
    answer:
      "Dükkânımız Anamur'da. Ürünleri kargoyla Türkiye'nin 81 iline gönderiyoruz. Yerinde montaj, bakım ve teknik servis ise Anamur ve çevresinde veriliyor; diğer illerde telefonla destek oluyoruz.",
  },
  {
    question: 'Garanti süresi ne kadardır?',
    answer:
      'Kurulum ve montaj hizmetlerimizde minimum 1 yıl işçilik garantisi sunuyoruz. Ürün garantileri marka ve modele göre 2-5 yıl arasında değişmektedir.',
  },
  {
    question: 'Randevu ne kadar sürede alınabilir?',
    answer:
      'Genellikle 24-48 saat içinde randevu planlanmaktadır. Acil durumlar için öncelikli hizmet seçeneğimiz mevcuttur.',
  },
  {
    question: 'Fiyat teklifi nasıl alıyorum?',
    answer:
      'Telefon veya iletişim formu aracılığıyla bize ulaşmanız yeterlidir. Uzmanlarımız ihtiyaçlarınızı değerlendirerek ücretsiz fiyat teklifi sunar.',
  },
  {
    question: 'Teknik destek için ne yapmalıyım?',
    answer: `Telefon hattımız ${SITE_CONFIG.workingHours} saatlerinde açık. Bu saatlerin dışında WhatsApp'tan yazabilirsiniz; mesajınıza mesai başında dönüş yapıyoruz.`,
  },
]

/**
 * Markaya özel sorular.
 *
 * Genel listenin ÜSTÜNE ekleniyor: ziyaretçi marka sayfasına zaten belirli
 * bir ürün grubu için geliyor, en çok sorulan şey o gruba ait.
 */
const MARKA_SSS: Record<BrandKey, readonly SssMaddesi[]> = {
  'alb-tarim': [
    {
      question: 'Hangi gübreyi kullanacağıma nasıl karar veririm?',
      answer:
        'Toprak ve yaprak analizi sonucunuzu bize iletin, ürününüze ve dönemine uygun programı birlikte çıkaralım. Analiz yaptırmadıysanız ürün, arazi büyüklüğü ve sulama biçiminizi söylemeniz de bir başlangıç için yeterli; ücretsiz danışmanlık veriyoruz.',
    },
    {
      question: 'Gübre siparişi kargoya nasıl veriliyor?',
      answer:
        "Siparişler Anamur'daki depomuzdan çıkıyor ve Türkiye'nin 81 iline kargoyla gönderiliyor. Ağır ve hacimli ürünlerde kargo firması değişebilir; büyük tonajlı siparişler için önce bizi arayın, nakliyeyi birlikte planlayalım.",
    },
    {
      question: 'Zirai ilaç satıyor musunuz?',
      answer:
        'Hayır. Bitki koruma ürünlerinin (zirai ilaç) internetten satışı mevzuat gereği yapılamıyor. Sitede yalnızca gübre ve toprak düzenleyici ürünler satılıyor; ilaç için bayimizden yüz yüze bilgi alabilirsiniz.',
    },
  ],
  'alb-su-aritma': [
    {
      question: 'Su arıtma cihazının filtresi ne sıklıkla değişir?',
      answer:
        'Kullanım ve şebeke suyunun sertliğine göre değişiyor; genel kural, ön filtrelerin 6 ayda bir, membranın 2-3 yılda bir değişmesi. Kurulumunu yaptığımız cihazların bakım zamanı bizde kayıtlı, zamanı gelince biz arıyoruz.',
    },
    {
      question: 'A.O. Smith yetkili bayisi misiniz?',
      answer:
        "Evet. A.O. Smith bayiliğini 2019'da aldık; cihazların satışı, kurulumu, garanti kapsamındaki işlemleri ve yedek parça temini tarafımızdan yapılıyor.",
    },
    {
      question: 'Kurulum ücreti ayrıca alınıyor mu?',
      answer:
        'Anamur ve çevresinde standart tezgâh altı kurulumlarda montaj ücretsiz. Ek tesisat, ankastre musluk delme veya iş yeri ölçeğinde sistemlerde keşif sonrası fiyat veriliyor.',
    },
  ],
}

/** Markaya göre tam SSS listesi. Marka verilmezse yalnızca genel sorular. */
export function sssListesi(marka?: BrandKey): readonly SssMaddesi[] {
  if (!marka) return GENEL_SSS
  return [...MARKA_SSS[marka], ...GENEL_SSS]
}

/** Bölüm başlığının altındaki açıklama cümlesi. */
export function sssAltBaslik(marka?: BrandKey): string {
  if (!marka) return 'Merak ettiğiniz her şeyin cevabı burada'
  return `${BRANDS[marka].name} hakkında en çok sorulanlar`
}
