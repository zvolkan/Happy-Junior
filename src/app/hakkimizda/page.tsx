import type { Metadata } from 'next'
import Link from 'next/link'
import Breadcrumb from '@/components/ui/Breadcrumb'
import Icon, { type IconName } from '@/components/ui/Icon'
import Reveal from '@/components/ui/Reveal'
import RevealGroup from '@/components/ui/RevealGroup'
import { BRAND, SITE_CONFIG } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Hakkımızda',
  description: `${BRAND.name} hakkında: Anamur'daki mağazamız, ürünlerimiz ve çalışma şeklimiz.`,
  alternates: { canonical: '/hakkimizda' },
}

const DEGERLER: { icon: IconName; baslik: string; aciklama: string }[] = [
  {
    icon: 'favori',
    baslik: 'Özenle seçilmiş ürünler',
    aciklama: '0–15 yaş için giyim, ayakkabı, araç-gereç ve oyuncakları sezonun yeni koleksiyonlarından seçiyoruz.',
  },
  {
    icon: 'kullanici',
    baslik: 'Beden konusunda yanınızdayız',
    aciklama: 'Emin olamadığınız bedeni WhatsApp’tan sorun; çocuğunuzun yaşına ve boyuna göre birlikte seçelim.',
  },
  {
    icon: 'kargo',
    baslik: 'Anamur’dan her yere',
    aciklama: 'Siparişlerinizi kargoyla gönderiyoruz; Anamur’daysanız mağazamızdan da teslim alabilirsiniz.',
  },
]

export default function HakkimizdaPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <section className="brand-surface py-20">
        <div className="container-main">
          <Breadcrumb
            koyu
            className="mb-8"
            adimlar={[{ label: 'Ana Sayfa', href: '/' }, { label: 'Hakkımızda' }]}
          />
          <div className="max-w-2xl">
            <p className="font-bold uppercase text-sm tracking-widest mb-3 text-brand-200">Biz Kimiz</p>
            <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight mb-6">
              {BRAND.name} Hakkında
            </h1>
            <p className="text-white/75 text-lg leading-relaxed">{BRAND.description}</p>
          </div>
        </div>
      </section>

      {/* TODO(müşteri): mağazanın hikâyesi (kuruluş, kim işletiyor, mağaza
          fotoğrafları). Metin gelene kadar bu bölüm kısa tutuldu. */}
      <section className="py-16 bg-white">
        <div className="container-main">
          <div className="max-w-3xl mx-auto">
            <Reveal>
              <h2 className="text-3xl font-black text-gray-900 leading-tight mb-6 rule-under">
                Anamur’da bir çocuk mağazası
              </h2>
              <div className="space-y-5 text-gray-700 leading-relaxed text-lg">
                <p>
                  {BRAND.name}, Anamur’da bebek ve çocuk giyimi, araç-gereç ve oyuncak satan bir
                  mağaza. Yeni sezon ürünlerimizi Instagram’da paylaşıyor, artık bu sitede de
                  yaş ve bedene göre listeliyoruz.
                </p>
                <p>
                  Siparişlerinizi havale/EFT ile güvenle verebilir, sorularınız için bize
                  WhatsApp’tan ulaşabilirsiniz.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container-main">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <RevealGroup itemClassName="h-full">
              {DEGERLER.map((d) => (
                <div key={d.baslik} className="h-full bg-white rounded-2xl border border-gray-100 p-6">
                  <Icon name={d.icon} className="w-8 h-8 text-brand-600 mb-4" />
                  <h3 className="font-bold text-gray-900 mb-2">{d.baslik}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{d.aciklama}</p>
                </div>
              ))}
            </RevealGroup>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container-main text-center">
          <h2 className="text-2xl font-black text-gray-900 mb-3">Mağazamıza bekleriz</h2>
          <p className="text-gray-600 mb-1">{SITE_CONFIG.address}</p>
          <p className="text-gray-600 mb-8">{SITE_CONFIG.workingHours}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/urunler"
              className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold transition-colors"
            >
              Ürünleri İncele
            </Link>
            <Link
              href="/iletisim"
              className="px-6 py-3 rounded-xl border border-gray-200 hover:border-gray-300 text-gray-800 font-semibold transition-colors"
            >
              İletişim
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
