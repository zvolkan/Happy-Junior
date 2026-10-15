import type { Metadata } from 'next'
import Link from 'next/link'
import { SATICI } from '@/lib/legal'

export const metadata: Metadata = {
  title: 'İptal ve İade Koşulları',
  description:
    'Happy Junior iptal, iade, cayma hakkı ve tüketici hakları koşulları. Mesafeli Sözleşmeler Yönetmeliği kapsamında hazırlanmıştır.',
  alternates: { canonical: '/iade-politikasi' },
}

/**
 * İPTAL VE İADE KOŞULLARI
 *
 * ── Neden yeniden yazıldı ───────────────────────────────────────────────────
 *
 * Eski sayfa altı kısa paragraftı ve Mesafeli Satış Sözleşmesi'yle ÇELİŞİYORDU:
 *
 *   · "5 iş günü içinde ödeme iadesi" diyordu, sözleşme ise yasal süre olan
 *     14 günü taahhüt ediyor. İki farklı taahhüt, uyuşmazlıkta aleyhe delil.
 *   · İletişim için `iade@bayirlioglu.com` ve +90 507 178 16 33 yazıyordu;
 *     künyedeki ve sözleşmedeki adres/telefon farklıydı. Ödeme kuruluşu
 *     incelemesinde ilk bakılan şeylerden biri sayfalar arası tutarlılıktır.
 *   · Cayma hakkının kullanılamayacağı hâller (Yönetmelik m.15) hiç yoktu.
 *   · Temerrüt, mücbir sebep ve yetkisiz kart kullanımı başlıkları yoktu.
 *
 * Artık iletişim bilgileri `SATICI` nesnesinden geliyor — künye, sözleşme ve
 * bu sayfa tek kaynaktan besleniyor, biri değişince üçü birden değişiyor.
 *
 * Metin, Mesafeli Satış Sözleşmesi'nin (src/lib/legal.ts → MESAFELI_SATIS)
 * özeti niteliğindedir ve onunla çelişmemelidir. Sözleşmeyi değiştirirseniz
 * burayı da gözden geçirin.
 */

const sections: { title: string; content: string }[] = [
  {
    title: '1. Genel',
    content:
      'İşbu koşullar, 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümlerine tabidir. Site üzerinden sipariş veren Alıcı, bu koşulları kabul etmiş sayılır. Burada yer alan hükümler, sipariş sırasında onayladığınız Mesafeli Satış Sözleşmesi\'nin özeti niteliğindedir; bir uyuşmazlık hâlinde sözleşme metni esas alınır.',
  },
  {
    title: '2. Cayma hakkı',
    content:
      'Ürünü teslim aldığınız tarihten itibaren 14 (on dört) gün içinde, hiçbir gerekçe göstermeksizin ve cezai şart ödemeksizin sözleşmeden cayabilirsiniz.\n\nSürenin başlangıcında; ayrı ayrı teslim edilen mallarda son malın, birden fazla parçadan oluşan mallarda son parçanın teslim alındığı gün esas alınır. Kurulum gerektiren su arıtma sistemlerinde teslim tarihi, montajın tamamlandığı tarihtir.',
  },
  {
    title: '3. Cayma hakkının kullanımı',
    content:
      'İade talebinizi "Hesabım > Siparişlerim > Sipariş Detayı" adımlarını izleyerek oluşturabilirsiniz. Dilerseniz aynı bildirimi e-posta veya telefonla da yapabilirsiniz.\n\nTalebiniz onaylandığında ürünü nasıl göndereceğiniz size bildirilir; onay gelmeden ürünü kargoya vermeyin. Bildirimden itibaren 10 (on) gün içinde ürünü göndermeniz gerekir.',
  },
  {
    title: '4. İade edilecek ürünün durumu',
    content:
      'Ürünün satılabilirliğine zarar gelmemiş olması; kutusu, ambalajı, varsa standart aksesuarları ve faturasıyla birlikte gönderilmesi gerekir. Ürünün kullanılmasından kaynaklanan değer kaybından Alıcı sorumludur; ancak malın olağan muayenesi için gereken kullanım bu kapsamda değildir.',
  },
  {
    title: '5. İade kargo bedeli',
    content:
      'Cayma hakkı kapsamındaki iadelerde kargo bedeli Satıcı\'ya aittir. Ürünü, Satıcı\'nın anlaşmalı olduğu kargo firmasıyla karşı ödemeli gönderdiğinizde herhangi bir ücret ödemezsiniz. Anlaşmalı firma dışında bir kargo tercih etmeniz hâlinde bedel size ait olur.',
  },
  {
    title: '6. Geri ödeme',
    content:
      'Cayma bildiriminizin bize ulaşmasından itibaren en geç 14 (on dört) gün içinde, kargo bedeli dahil ödediğiniz tüm tutar, ödeme yaparken kullandığınız araca tek seferde iade edilir. Uygulamada iade işlemini genellikle ürün elimize ulaştıktan sonraki birkaç iş günü içinde başlatıyoruz.\n\nKredi kartı iadelerinde bedelin bankaya aktarılmasından sonra hesabınıza yansıma süresi tamamen bankanızın işleyişine bağlıdır ve tarafımızdan müdahale edilemez.',
  },
  {
    title: '7. Cayma hakkının kullanılamayacağı ürünler',
    content:
      'Mesafeli Sözleşmeler Yönetmeliği\'nin 15. maddesi uyarınca aşağıdaki ürünlerde cayma hakkı kullanılamaz:\n\n• İsteğiniz veya kişisel ihtiyaçlarınız doğrultusunda hazırlanan, siparişe özel üretilen ürünler.\n• Çabuk bozulabilen veya son kullanma tarihi geçebilecek ürünler.\n• Ambalajı, bandı, mührü açıldıktan sonra iadesi sağlık ve hijyen açısından uygun olmayan ürünler — kullanılmış su filtresi ve membran gibi.\n• Teslimden sonra başka ürünlerle karışan ve doğası gereği ayrıştırılamayan ürünler.\n• Cayma süresi dolmadan, onayınızla ifasına başlanan hizmetler — talebinizle 14 gün dolmadan yapılan montaj ve kurulum dahil.\n\nBu istisnalar, ürünün ayıplı çıkması hâlinde Kanun\'dan doğan haklarınızı (onarım, değişim, bedel indirimi, sözleşmeden dönme) ortadan kaldırmaz.',
  },
  {
    title: '8. Ayıplı, hasarlı veya yanlış ürün',
    content:
      'Ürünü teslim aldığınız anda kontrol etmeniz; hasarlı ya da ayıplı gördüğünüz ürünü kargo görevlisinden teslim almayarak kargo firmasına tutanak tutturmanız gerekir.\n\nYanlış veya hasarlı ürün tesliminde bize ulaşın; ürün tarafımızca değiştirilir veya bedeli iade edilir. Bu durumda gidiş-dönüş kargo bedeli Satıcı\'ya aittir. Ayıplı mal hükümlerine dayalı haklarınız, tutanak tutulmamış olsa dahi ortadan kalkmaz.',
  },
  {
    title: '9. Garanti kapsamındaki arızalar',
    content:
      'Garanti kapsamındaki arızalarda ürün yetkili servisimize yönlendirilir. Yasal azami onarım süresi 20 iş günüdür. Onarım mümkün değilse ürün değişimi veya bedel iadesi yapılır. Garanti süresi içinde arızalanan üründe geçen onarım süresi, garanti süresine eklenir.',
  },
  {
    title: '10. Siparişin iptali ve tedarik edilememesi',
    content:
      'Ödemesi tamamlanmamış siparişleri dilediğiniz an iptal edebilirsiniz. Ödemesi alınmış bir siparişi kargoya verilmeden önce iptal etmek isterseniz bize ulaşın.\n\nSipariş konusu ürünün tedarikinin imkânsızlaşması hâlinde durum size bildirilir ve ödediğiniz bedel bildirimden itibaren 14 gün içinde iade edilir. Kabul etmeniz hâlinde eşit kalite ve fiyatta farklı bir ürün tedarik edilebilir.',
  },
  {
    title: '11. Mücbir sebep',
    content:
      'Olağanüstü hava koşulları, ulaşımın kesilmesi ve benzeri, tarafların kontrolü dışındaki nedenlerle ürün süresinde teslim edilemezse durum size bildirilir. Bu hâlde siparişi iptal edebilirsiniz; iptal hâlinde ödenen bedel 14 gün içinde iade edilir.',
  },
  {
    title: '12. Kredi kartının yetkisiz kullanımı',
    content:
      'Ürünün tesliminden sonra kredi kartınızın, kusurunuz olmaksızın yetkisiz kişilerce hukuka aykırı biçimde kullanıldığı tespit edilir ve ilgili banka ürün bedelini Satıcı\'ya ödemezse, size teslim edilmiş ürünün 3 (üç) gün içinde Satıcı\'ya iadesi gerekir. Bu durumda iade masrafı Satıcı\'ya aittir.',
  },
  {
    title: '13. Temerrüt',
    content:
      'Kredi kartıyla yapılan ödemelerde temerrüde düşülmesi hâlinde kart sahibi, bankasıyla arasındaki kredi kartı sözleşmesi çerçevesinde bankasına karşı sorumludur. Bu durumda ilgili banka hukuki yollara başvurabilir ve doğacak masraf ile avukatlık ücretini talep edebilir.',
  },
  {
    title: '14. Şikâyet ve uyuşmazlık',
    content:
      'Şikâyet ve itirazlarınızı, Ticaret Bakanlığı tarafından her yıl aralık ayında ilan edilen parasal sınırlar dâhilinde, malı satın aldığınız veya ikametgâhınızın bulunduğu yerdeki Tüketici Hakem Heyeti\'ne ya da Tüketici Mahkemesi\'ne iletebilirsiniz.',
  },
]

export default function IadePolitikasiPage() {
  return (
    <main className="py-16 sm:py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
        <div className="mb-10">
          <p className="text-gray-400 text-sm font-semibold uppercase tracking-widest mb-2">
            {SATICI.unvan}
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
            İptal ve İade Koşulları
          </h1>
          <p className="text-gray-500 text-sm mt-2">
            Tüketici hakları · Son güncelleme: Eylül 2026
          </p>
        </div>

        <div className="space-y-8">
          {sections.map((s) => (
            <div key={s.title}>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">{s.title}</h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line text-sm">{s.content}</p>
            </div>
          ))}

          {/* İletişim bloğu ayrı: değerler SATICI'dan geliyor, elle yazılmıyor */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              15. İade ve değişim iletişimi
            </h2>
            <p className="text-gray-600 leading-relaxed text-sm">
              İade veya değişim talepleriniz için bize ulaşabilirsiniz:
            </p>
            <dl className="mt-3 space-y-1 text-sm">
              <div className="flex gap-2">
                <dt className="text-gray-500 w-28 shrink-0">E-posta</dt>
                <dd>
                  <a
                    href={`mailto:${SATICI.eposta}`}
                    className="text-gray-900 font-medium hover:underline"
                  >
                    {SATICI.eposta}
                  </a>
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-gray-500 w-28 shrink-0">Telefon</dt>
                <dd className="text-gray-900 font-medium">{SATICI.telefon}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-gray-500 w-28 shrink-0">İade adresi</dt>
                <dd className="text-gray-700">{SATICI.iadeAdresi}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="mt-10 rounded-xl border border-gray-200 bg-gray-50 p-5 text-sm text-gray-600 leading-relaxed">
          Sipariş sırasında onayladığınız{' '}
          <Link
            href="/mesafeli-satis-sozlesmesi"
            className="text-gray-900 font-medium hover:underline"
          >
            Mesafeli Satış Sözleşmesi
          </Link>{' '}
          ve Ön Bilgilendirme Formu&apos;nun tam metnini istediğiniz zaman okuyabilir,
          dilerseniz yazdırabilirsiniz.
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <Link
            href="/iletisim"
            className="flex-1 text-center bg-gray-900 text-white py-3 px-6 rounded-xl font-semibold text-sm hover:bg-gray-700 transition-colors"
          >
            İletişime Geç
          </Link>
          <Link
            href="/"
            className="flex-1 text-center border border-gray-200 text-gray-700 py-3 px-6 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors"
          >
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    </main>
  )
}
