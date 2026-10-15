import type { Metadata } from 'next'
import Link from 'next/link'
import Breadcrumb from '@/components/ui/Breadcrumb'
import { COMPANY_NAME } from '@/lib/constants'
import { SATICI } from '@/lib/legal'

export const metadata: Metadata = {
  title: 'Gizlilik ve Güvenlik',
  description: `${COMPANY_NAME} gizlilik politikası, ödeme güvenliği ve kişisel verilerin korunması hakkında bilgi.`,
  alternates: { canonical: '/gizlilik' },
}

/**
 * GİZLİLİK VE GÜVENLİK
 *
 * ── Neden genişletildi ──────────────────────────────────────────────────────
 *
 * Eski sayfa yalnızca KVKK tarafını anlatıyordu. Ödeme kuruluşu (iyzico) üye
 * işyeri incelemesinde bu sayfada ayrıca şunları arıyor ve eksikleri hiçbiri
 * yoktu:
 *
 *   · Kart bilgilerinin sitede saklanmadığı ve 3D Secure kullanıldığı beyanı
 *   · SSL / şifreli bağlantı açıklaması
 *   · IP adresi ve günlük kayıtlarının ne amaçla tutulduğu
 *   · E-posta güvenliği uyarısı (kart bilgisi asla e-postayla istenmez)
 *   · Üçüncü taraf sitelere verilen bağlantıların sorumluluğu
 *   · Yasal makam talebi gibi istisnai hâller
 *
 * Sayfanın başlığı da "Gizlilik Politikası"ndan "Gizlilik ve Güvenlik"e
 * çevrildi; ödeme kuruluşunun aradığı başlık bu.
 *
 * İletişim bilgisi `SATICI`dan geliyor — künye, sözleşme, iade koşulları ve
 * bu sayfa aynı kaynaktan besleniyor ki zamanla ayrışmasınlar.
 */

export default function GizlilikPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <Breadcrumb
          className="mb-8"
          adimlar={[
            { label: 'Ana Sayfa', href: '/' },
            { label: 'Gizlilik ve Güvenlik' },
          ]}
        />

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 md:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gizlilik ve Güvenlik</h1>
          <p className="text-sm text-gray-500 mb-8">Son güncelleme: Eylül 2026</p>

          <div className="prose prose-gray max-w-none space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Genel Bilgi</h2>
              <p className="text-gray-600 leading-relaxed">
                {COMPANY_NAME} olarak, müşterilerimizin kişisel verilerinin güvenliği ve gizliliğine
                büyük önem veriyoruz. Bu metin, sitemizi ziyaret ettiğinizde veya hizmetlerimizden
                faydalandığınızda kişisel verilerinizin nasıl toplandığını, kullanıldığını ve
                korunduğunu açıklar. 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK)
                kapsamında hazırlanmıştır.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Toplanan Kişisel Veriler</h2>
              <p className="text-gray-600 leading-relaxed mb-3">Sitemizi kullanırken aşağıdaki kişisel verileri toplayabiliriz:</p>
              <ul className="list-disc list-outside pl-5 text-gray-600 space-y-2 marker:text-gray-400">
                <li>Ad, soyad, e-posta adresi ve telefon numarası</li>
                <li>Teslimat ve fatura adresi bilgileri</li>
                <li>Kurumsal fatura talebinde ticaret unvanı, vergi dairesi ve vergi numarası</li>
                <li>Sipariş geçmişi ve alışveriş tercihleri</li>
                <li>IP adresi, tarayıcı türü ve cihaz bilgileri</li>
                <li>Çerezler aracılığıyla toplanan kullanım verileri</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mt-3">
                Kredi kartı numarası, son kullanma tarihi ve CVV gibi ödeme araçlarına ait bilgiler
                bu listede <strong className="font-semibold text-gray-900">yer almaz</strong>; bu
                veriler tarafımızca hiçbir aşamada toplanmaz ve görülmez.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Verilerin Kullanım Amaçları</h2>
              <p className="text-gray-600 leading-relaxed mb-3">Kişisel verilerinizi şu amaçlarla kullanıyoruz:</p>
              <ul className="list-disc list-outside pl-5 text-gray-600 space-y-2 marker:text-gray-400">
                <li>Siparişlerinizi işlemek ve teslimat sürecini yönetmek</li>
                <li>Müşteri hizmetleri sunmak ve sorularınızı yanıtlamak</li>
                <li>Kampanya ve fırsatlar hakkında bilgilendirme yapmak (onayınız dahilinde)</li>
                <li>Site güvenliğini sağlamak ve dolandırıcılık girişimlerini önlemek</li>
                <li>Yasal yükümlülüklerimizi yerine getirmek</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Kampanya ve Bilgilendirme</h2>
              <p className="text-gray-600 leading-relaxed">
                Kampanya, indirim ve yeni ürün duyurularını yalnızca açık onayınız varsa
                gönderiyoruz. Bu onayı dilediğiniz zaman geri alabilirsiniz: gönderdiğimiz her
                iletinin altındaki bağlantıyı kullanmanız ya da bize yazmanız yeterli. Onayınızı
                geri almanız, siparişlerinizle ilgili işlem bildirimlerini (sipariş onayı, kargo
                bilgisi, iade süreci) almanızı engellemez; bunlar sözleşmenin ifası kapsamındadır.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Verilerin Paylaşımı</h2>
              <p className="text-gray-600 leading-relaxed">
                Kişisel verilerinizi, siparişlerinizin teslimatını gerçekleştiren kargo firmaları,
                ödeme işlemlerini yürüten ödeme kuruluşu ve bankalar, e-posta gönderim hizmeti
                sağlayıcımız ve yasal zorunluluk hâlinde yetkili makamlarla paylaşabiliriz.
                Paylaşım her durumda hizmetin gerektirdiği kadarıyla sınırlıdır. Kişisel
                verileriniz hiçbir koşulda ticari amaçla üçüncü taraflara satılmaz veya kiralanmaz.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                6. Ödeme ve Kredi Kartı Güvenliği
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Sitemizdeki tüm kredi kartı işlemleri, lisanslı ödeme kuruluşu{' '}
                <strong className="font-semibold text-gray-900">iyzico</strong> altyapısı üzerinden
                gerçekleştirilir. Ödeme adımına geldiğinizde kart bilgileriniz doğrudan iyzico&apos;nun
                güvenli ödeme ekranına girilir.
              </p>
              <ul className="list-disc list-outside pl-5 text-gray-600 space-y-2 marker:text-gray-400 mt-3">
                <li>
                  Kart numaranız, son kullanma tarihiniz ve CVV bilginiz sunucularımıza hiçbir
                  zaman ulaşmaz, tarafımızca görülmez ve saklanmaz.
                </li>
                <li>
                  İşlemler 3D Secure ile doğrulanır; ödeme, bankanızın gönderdiği tek kullanımlık
                  şifreyi girmenizin ardından tamamlanır.
                </li>
                <li>
                  Ödeme altyapısı PCI DSS güvenlik standartlarına uygundur ve BDDK ile TCMB
                  denetimine tabi bir ödeme kuruluşu tarafından işletilir.
                </li>
                <li>
                  Sipariş kayıtlarımızda yalnızca işlem numarası, tutar ve ödeme durumu tutulur.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">7. SSL ve Site Güvenliği</h2>
              <p className="text-gray-600 leading-relaxed">
                Site ile tarayıcınız arasındaki tüm trafik SSL/TLS ile şifrelenir; adres çubuğunda
                &quot;https://&quot; ve kilit simgesini görmeniz bu bağlantının şifreli olduğunu
                gösterir. Şifreleriniz veritabanımızda geri döndürülemez biçimde saklanır ve
                tarafımızca okunamaz. Yönetim paneline erişim ayrı bir kimlik doğrulamayla
                korunur ve başarısız giriş denemeleri sınırlandırılır.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                8. IP Adresleri ve Günlük Kayıtları
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Siteye yapılan istekler sırasında IP adresiniz, tarayıcı bilgileriniz ve erişim
                zamanı günlük kayıtlarında tutulur. Bu kayıtları sistem hatalarını tespit etmek,
                kötüye kullanım ve dolandırıcılık girişimlerini engellemek ve yasal yükümlülükleri
                yerine getirmek için kullanıyoruz. IP adresi, sipariş sırasında onayladığınız
                sözleşmenin hangi tarihte ve hangi sürümüyle kabul edildiğini ispatlamak amacıyla
                sipariş kaydına da işlenir.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Çerezler (Cookies)</h2>
              <p className="text-gray-600 leading-relaxed">
                Sitemizde deneyiminizi geliştirmek için çerezler kullanılmaktadır. Zorunlu çerezler
                oturumunuzun ve sepetinizin çalışması için gereklidir; analitik ve pazarlama
                çerezleri ise tarayıcı ayarlarınızdan devre dışı bırakılabilir. Çerezleri
                reddetmeniz durumunda giriş yapma ve sepet gibi bazı özellikler düzgün
                çalışmayabilir.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">10. E-Posta Güvenliği</h2>
              <p className="text-gray-600 leading-relaxed">
                Sipariş, iade veya herhangi bir konuda bize gönderdiğiniz e-postalarda{' '}
                <strong className="font-semibold text-gray-900">
                  kredi kartı numaranızı, son kullanma tarihinizi, CVV kodunuzu veya şifrenizi
                  asla paylaşmayın.
                </strong>{' '}
                Bu bilgileri hiçbir koşulda e-posta, telefon veya mesajla sizden talep etmeyiz.
                Bizden geliyormuş gibi görünen ve bu bilgileri isteyen bir ileti alırsanız
                yanıtlamayın ve{' '}
                <a href={`mailto:${SATICI.eposta}`} className="text-green-600 hover:underline">
                  {SATICI.eposta}
                </a>{' '}
                adresine bildirin.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                11. Üçüncü Taraf Siteler ve Uygulamalar
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Sitemiz, üzerinde denetimimiz bulunmayan başka internet sitelerine bağlantı
                verebilir. Bu sitelerin gizlilik uygulamalarından ve içeriklerinden sorumlu
                değiliz; bağlantıya tıklayarak ayrıldığınızda ilgili sitenin kendi gizlilik
                metnini okumanızı öneririz. Sitemizde reklam ve pazarlama amacıyla üçüncü taraf
                hizmetleri kullanılması hâlinde bu hizmetlerin veri işleme politikaları kendi
                metinlerinde düzenlenir.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">12. İstisnai Haller</h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                Aşağıdaki sınırlı durumlarda, bu metindeki hükümler dışında kişisel verileriniz
                üçüncü kişilere açıklanabilir:
              </p>
              <ul className="list-disc list-outside pl-5 text-gray-600 space-y-2 marker:text-gray-400">
                <li>Yürürlükteki mevzuatın veya yetkili idari ve adli makamların talebi hâlinde</li>
                <li>Sözleşmenin kurulması ve ifası için gerekli olduğunda</li>
                <li>
                  Kullanıcıların site üzerindeki hak ve güvenliğini korumak amacıyla bilgi
                  verilmesi gerektiğinde
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">13. Veri Saklama</h2>
              <p className="text-gray-600 leading-relaxed">
                Kişisel verilerinizi yetkisiz erişim, değişiklik, ifşa veya imhaya karşı korumak
                için teknik ve idari güvenlik önlemleri uyguluyoruz. Verileriniz, işlendikleri
                amaç için gerekli olan süre boyunca ve ilgili mevzuatın öngördüğü saklama
                süreleri (ticari defter ve belgeler için on yıl gibi) sona erene kadar saklanır;
                bu sürelerin ardından silinir veya anonim hâle getirilir.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">14. Haklarınız</h2>
              <p className="text-gray-600 leading-relaxed mb-3">KVKK kapsamında aşağıdaki haklara sahipsiniz:</p>
              <ul className="list-disc list-outside pl-5 text-gray-600 space-y-2 marker:text-gray-400">
                <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
                <li>Verilerinize erişim ve bunların düzeltilmesini talep etme</li>
                <li>Verilerinizin silinmesini veya yok edilmesini isteme</li>
                <li>Aktarıldığı üçüncü kişileri öğrenme</li>
                <li>
                  Otomatik sistemlerle işlenen veriler nedeniyle aleyhinize oluşan sonuçlara itiraz
                  etme
                </li>
                <li>Kanuna aykırı işleme nedeniyle zarara uğramanız hâlinde zararın giderilmesini talep etme</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mt-3">
                Ayrıntılı bilgi için{' '}
                <Link href="/kvkk" className="text-green-600 hover:underline">
                  KVKK Aydınlatma Metni
                </Link>{' '}
                sayfamıza bakabilirsiniz.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">15. İletişim</h2>
              <p className="text-gray-600 leading-relaxed">
                Gizlilik uygulamalarımız hakkında sorularınız veya kişisel verilerinizle ilgili
                talepleriniz için{' '}
                <a href={`mailto:${SATICI.eposta}`} className="text-green-600 hover:underline">
                  {SATICI.eposta}
                </a>{' '}
                adresine yazabilir, {SATICI.telefon} numarasını arayabilir veya{' '}
                <Link href="/iletisim" className="text-green-600 hover:underline">
                  İletişim
                </Link>{' '}
                sayfamızdan bize ulaşabilirsiniz.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
