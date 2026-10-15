import type { Metadata } from 'next'
import Link from 'next/link'
import Breadcrumb from '@/components/ui/Breadcrumb'
import { COMPANY_NAME } from '@/lib/constants'
import { TESLIMAT_SURESI } from '@/lib/checkout'

export const metadata: Metadata = {
  title: 'Kullanım Koşulları',
  description: `${COMPANY_NAME} kullanım koşulları ve satış sözleşmesi.`,
  alternates: { canonical: '/kullanim-kosullari' },
}

export default function KullanimKosullariPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <Breadcrumb
          className="mb-8"
          adimlar={[
            { label: 'Ana Sayfa', href: '/' },
            { label: 'Kullanım Koşulları' },
          ]}
        />

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 md:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Kullanım Koşulları</h1>
          <p className="text-sm text-gray-500 mb-8">Son güncelleme: Ocak 2025</p>

          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Genel Hükümler</h2>
              <p className="text-gray-600 leading-relaxed">
                Bu web sitesini kullanarak {COMPANY_NAME} kullanım koşullarını kabul etmiş sayılırsınız.
                Siteyi kullanmaya devam etmeniz, bu koşulları okuduğunuzu ve anladığınızı gösterir.
                {COMPANY_NAME}, bu koşulları önceden haber vermeksizin değiştirme hakkını saklı tutar.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Üyelik ve Hesap Güvenliği</h2>
              <p className="text-gray-600 leading-relaxed">
                Sitemizde üye olmak için 18 yaşını doldurmuş olmanız gerekmektedir. Hesap bilgilerinizin
                doğru ve güncel olmasından siz sorumlusunuz. Şifrenizin güvenliğini korumak ve hesabınızda
                gerçekleşen tüm işlemlerden siz sorumlusunuz.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Sipariş ve Ödeme</h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                Siparişleriniz, stok durumuna ve ödemenin onaylanmasına bağlı olarak işleme alınır.
                Aşağıdaki ödeme yöntemlerini kabul etmekteyiz:
              </p>
              <ul className="list-disc list-outside pl-5 text-gray-600 space-y-2 marker:text-gray-400">
                <li>Kredi kartı ve banka kartı (iyzico altyapısı, 3D Secure güvencesiyle)</li>
                <li>Kredi kartına taksitli ödeme</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Teslimat</h2>
              <p className="text-gray-600 leading-relaxed">
                Siparişler, stok durumuna bağlı olarak genellikle {TESLIMAT_SURESI} içinde teslim edilir.
                Teslimat süresi, bulunduğunuz konuma ve anlaşmalı kargo firmasının kapasitesine göre
                değişiklik gösterebilir. {COMPANY_NAME}, teslimat gecikmelerinden dolayı sorumluluk kabul etmez.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">5. İptal ve İade</h2>
              <p className="text-gray-600 leading-relaxed">
                Mesafeli Satışlar Yönetmeliği kapsamında, ürünü teslim aldığınız tarihten itibaren 14 gün
                içinde herhangi bir gerekçe göstermeksizin iade hakkınız bulunmaktadır. İade etmek istediğiniz
                ürünlerin kullanılmamış, orijinal ambalajında ve faturasıyla birlikte gönderilmesi gerekmektedir.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Ürün Bilgileri</h2>
              <p className="text-gray-600 leading-relaxed">
                Sitemizde yer alan ürün açıklamaları, görseller ve fiyatlar bilgi amaçlıdır. Fiyatlar
                önceden haber verilmeksizin değiştirilebilir. Ürün görselleri gerçek renk ve boyutu tam
                olarak yansıtmayabilir.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Fikri Mülkiyet</h2>
              <p className="text-gray-600 leading-relaxed">
                Bu web sitesindeki tüm içerikler (metin, görsel, logo, tasarım) {COMPANY_NAME}&apos;ye aittir ve
                telif hakkı yasalarıyla korunmaktadır. İzin alınmadan kopyalanamaz veya kullanılamaz.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Uygulanacak Hukuk</h2>
              <p className="text-gray-600 leading-relaxed">
                Bu kullanım koşulları Türk hukukuna tabidir. Anlaşmazlıkların çözümünde Ankara Mahkemeleri
                ve İcra Daireleri yetkilidir.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">9. İletişim</h2>
              <p className="text-gray-600 leading-relaxed">
                Kullanım koşulları hakkında sorularınız için{' '}
                <Link href="/iletisim" className="text-green-600 hover:underline">İletişim</Link> sayfamızı
                ziyaret edebilirsiniz.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
