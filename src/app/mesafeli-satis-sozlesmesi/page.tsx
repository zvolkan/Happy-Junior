import type { Metadata } from 'next'
import Link from 'next/link'
import Breadcrumb from '@/components/ui/Breadcrumb'
import { ON_BILGILENDIRME, MESAFELI_SATIS, CAYMA_HAKKI, SATICI } from '@/lib/legal'

export const metadata: Metadata = {
  title: 'Mesafeli Satış Sözleşmesi',
  description:
    'Ön Bilgilendirme Formu, Mesafeli Satış Sözleşmesi ve cayma hakkı koşulları.',
  alternates: { canonical: '/mesafeli-satis-sozlesmesi' },
}

/**
 * Sözleşme metinlerinin herkese açık hâli.
 *
 * Mesafeli Sözleşmeler Yönetmeliği, bu metinlerin sipariş öncesinde
 * erişilebilir ve saklanabilir olmasını istiyor. Önceden metinler yalnızca
 * ödeme adımındaki dar kaydırma kutularının içindeydi: müşteri sipariş
 * vermeden okuyamıyor, sonradan da geri dönüp bakamıyordu.
 *
 * Metinler `src/lib/legal.ts` içinde tek yerde duruyor; burada ve ödeme
 * ekranında aynı kaynaktan okunuyor, ayrışma ihtimali yok.
 */

const BOLUMLER = [
  { id: 'on-bilgilendirme', baslik: 'Ön Bilgilendirme Formu', metin: ON_BILGILENDIRME },
  { id: 'mesafeli-satis', baslik: 'Mesafeli Satış Sözleşmesi', metin: MESAFELI_SATIS },
  { id: 'cayma-hakki', baslik: 'Cayma Hakkı', metin: CAYMA_HAKKI },
]

export default function MesafeliSatisSozlesmesiPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <Breadcrumb
          className="mb-8"
          adimlar={[
            { label: 'Ana Sayfa', href: '/' },
            { label: 'Mesafeli Satış Sözleşmesi' },
          ]}
        />

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 md:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mesafeli Satış Sözleşmesi</h1>
          <p className="text-sm text-gray-500 mb-8">
            Ön Bilgilendirme Formu, Mesafeli Satış Sözleşmesi ve cayma hakkı koşulları.
            Sipariş verirken onayladığınız metinlerin tamamı bu sayfadadır.
          </p>

          {/* İçindekiler — metin uzun, doğrudan ilgili bölüme atlansın */}
          <nav className="flex flex-wrap gap-2 mb-10">
            {BOLUMLER.map((b) => (
              <a
                key={b.id}
                href={`#${b.id}`}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold border border-gray-200 text-gray-600 hover:border-gray-400 hover:text-gray-900 transition-colors"
              >
                {b.baslik}
              </a>
            ))}
          </nav>

          <div className="space-y-12">
            {BOLUMLER.map((b) => (
              <section key={b.id} id={b.id} className="scroll-mt-24">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">{b.baslik}</h2>
                <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                  {b.metin}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-gray-100 text-sm text-gray-500 leading-relaxed">
            <p>
              Sözleşme ve iade süreçleriyle ilgili sorularınız için{' '}
              <a href={`mailto:${SATICI.eposta}`} className="text-gray-900 font-medium hover:underline">
                {SATICI.eposta}
              </a>{' '}
              adresinden veya {SATICI.telefon} numarasından bize ulaşabilirsiniz.
            </p>
            <p className="mt-3">
              İade ve değişim koşullarının özeti için{' '}
              <Link href="/iade-politikasi" className="text-gray-900 font-medium hover:underline">
                İptal ve İade Koşulları
              </Link>{' '}
              sayfasına da göz atabilirsiniz.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
