import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Breadcrumb from '@/components/ui/Breadcrumb'
import { BRANDS } from '@/lib/constants'
import { telefonGoster, telefonArama } from '@/lib/utils'
import type { BrandKey } from '@/lib/types'
import Icon, { type IconName } from '@/components/ui/Icon'
import Reveal from '@/components/ui/Reveal'
import RevealGroup from '@/components/ui/RevealGroup'

/**
 * Hizmet alanları / referans sayfası.
 *
 * ÖNCEKİ HALİ TAMAMEN UYDURMAYDI: isim isim kurumlar (Anamur Belediyesi,
 * Anamur Devlet Hastanesi, Türk Telekom Mersin Merkezi, Mersin Üniversitesi),
 * isimli müşteri yorumları ve doğrulanamayan rakamlar (730+ kurulum, %98
 * memnuniyet, 8 sektörde 500+ müşteri) içeriyordu.
 *
 * Adı geçen kurumlar gerçek müşteri değilse bu, ticari reklam mevzuatı
 * açısından aldatıcı reklamdır ve kurumların kendileri kaldırılmasını
 * isteyebilir. Sayfa, doğrulanabilir olmayan hiçbir iddia içermeyecek şekilde
 * yeniden yazıldı.
 *
 * Gerçek referanslar ve belgeler geldiğinde eklenecek yerler aşağıda yorum
 * olarak işaretli.
 */

const VALID_BRANDS: BrandKey[] = ['alb-tarim', 'alb-su-aritma']

interface Props {
  params: Promise<{ brand: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { brand } = await params
  if (!VALID_BRANDS.includes(brand as BrandKey)) return {}
  const cfg = BRANDS[brand as BrandKey]
  return {
    title: 'Hizmet Alanlarımız',
    description: `${cfg.name} olarak sanayi, sağlık, eğitim, gıda ve konut alanlarında kurulum ve bakım hizmeti veriyoruz.`,
    alternates: { canonical: `/${brand}/referanslar` },
  }
}

const SECTORS_SU: { icon: IconName; label: string; desc: string }[] = [
  { icon: 'fabrika', label: 'Sanayi & Üretim', desc: 'Kazan besleme suyu, proses suyu ve endüstriyel RO sistemleri.' },
  { icon: 'gida', label: 'Gıda & Yiyecek', desc: 'Mutfak ve üretim hatları için arıtma, sebil ve filtre çözümleri.' },
  { icon: 'bina', label: 'Ofis & İşyeri', desc: 'Arıtmalı su sebilleri ve periyodik filtre değişim hizmeti.' },
  { icon: 'otel', label: 'Otel & Turizm', desc: 'Merkezi arıtma, yumuşatma ve oda içi çözümler.' },
  { icon: 'bina', label: 'Konut & Site', desc: 'Daire içi tezgah altı sistemler ve site geneli yumuşatma.' },
  { icon: 'traktor', label: 'Tarımsal İşletme', desc: 'Sulama suyu yumuşatma ve damlama hattı koruma sistemleri.' },
]

const SECTORS_TARIM: { icon: IconName; label: string; desc: string }[] = [
  { icon: 'filiz', label: 'Tarla Bitkileri', desc: 'Buğday, arpa, mısır ve pamukta taban ve üst gübreleme programları.' },
  { icon: 'sera', label: 'Örtü Altı Yetiştiricilik', desc: 'Sera koşullarına uygun damla sulama gübreleri ve yaprak besleme.' },
  { icon: 'filiz', label: 'Meyve Bahçeleri', desc: 'Narenciye, muz ve zeytinde dönemsel besleme ve mikro element takviyesi.' },
  { icon: 'filiz', label: 'Fidan & Fide Üretimi', desc: 'Kök gelişimi ve şaşırtma sonrası stres yönetimi ürünleri.' },
  { icon: 'analiz', label: 'Toprak Islahı', desc: 'Tuzluluk, kireç ve organik madde sorunlarına yönelik düzenleyiciler.' },
  { icon: 'molekul', label: 'Zirai Danışmanlık', desc: 'Toprak ve yaprak analizine dayalı gübreleme ve bitki koruma programları.' },
]

export default async function ReferanslarPage({ params }: Props) {
  const { brand } = await params
  if (!VALID_BRANDS.includes(brand as BrandKey)) notFound()

  const brandKey = brand as BrandKey
  const cfg = BRANDS[brandKey]
  const isAlbSu = brandKey === 'alb-su-aritma'
  const sectors = isAlbSu ? SECTORS_SU : SECTORS_TARIM

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── HERO ── */}
      <section className="brand-surface py-20">
        <div className="container-main">
          <Breadcrumb
            koyu
            className="mb-8"
            adimlar={[
              { label: 'Ana Sayfa', href: '/' },
              { label: cfg.name, href: `/${brandKey}` },
              { label: 'Hizmet Alanlarımız' },
            ]}
          />
          <div className="max-w-2xl">
            <p className="font-bold uppercase text-sm tracking-widest mb-3 text-brand-400">
              Nerelerde Çalışıyoruz
            </p>
            <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight mb-6">
              Hizmet Alanlarımız
            </h1>
            <p className="text-white/70 text-lg leading-relaxed">
              {isAlbSu
                ? 'Evden fabrikaya, otelden tarımsal işletmeye kadar farklı ölçeklerde su arıtma kurulumu ve bakımı yapıyoruz. Kullanım yerine ve su analizine göre sistem öneriyoruz.'
                : 'Tarla bitkilerinden örtü altı yetiştiriciliğe, meyve bahçelerinden fidan üretimine kadar farklı üretim biçimlerine uygun besleme programları hazırlıyoruz.'}
            </p>
          </div>
        </div>
      </section>

      {/* ── SEKTÖRLER ── */}
      <section className="py-16 bg-white">
        <div className="container-main">
          <Reveal>
            <div className="text-center mb-12">
              <p className="font-bold uppercase text-sm tracking-widest mb-2 text-brand-600">
                Uygulama Alanları
              </p>
              <h2 className="text-3xl font-black text-gray-900 rule-under rule-center">
                Kimlere Hizmet Veriyoruz
              </h2>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <RevealGroup itemClassName="h-full">
              {sectors.map((s) => (
                <div
                  key={s.label}
                  className="h-full bg-white rounded-2xl border border-gray-100 p-6 hover-lift card-glow"
                >
                  <div className="mb-3 icon-pop"><Icon name={s.icon} className="w-8 h-8 text-brand-600" /></div>
                  <h3 className="font-bold text-gray-900 mb-1.5">{s.label}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </RevealGroup>
          </div>
        </div>
      </section>

      {/* ── NASIL ÇALIŞIYORUZ ── */}
      <section className="py-16 bg-gray-50">
        <div className="container-main">
          <Reveal>
            <div className="text-center mb-12">
              <p className="font-bold uppercase text-sm tracking-widest mb-2 text-brand-600">
                Süreç
              </p>
              <h2 className="text-3xl font-black text-gray-900 rule-under rule-center">
                Nasıl İlerliyoruz
              </h2>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <RevealGroup itemClassName="h-full">
              {(isAlbSu
                ? [
                    { n: '01', t: 'Su Analizi', d: 'Kullandığınız suyun sertlik ve mineral değerlerini ücretsiz ölçüyoruz.' },
                    { n: '02', t: 'Sistem Önerisi', d: 'Analiz sonucuna ve kullanım hacmine göre uygun cihazı öneriyoruz.' },
                    { n: '03', t: 'Kurulum', d: 'Montajı kendi ekibimiz yapıyor, çalışma prensibini yerinde anlatıyoruz.' },
                    { n: '04', t: 'Periyodik Bakım', d: 'Filtre değişim zamanı geldiğinde biz hatırlatıyoruz.' },
                  ]
                : [
                    { n: '01', t: 'Toprak & Yaprak Analizi', d: 'Mevcut besin durumunu ölçüyoruz; eksik olanı görmeden program yapmıyoruz.' },
                    { n: '02', t: 'Besleme Programı', d: 'Ürününüze ve dönemine göre gübreleme takvimi çıkarıyoruz.' },
                    { n: '03', t: 'Ürün Tedariki', d: 'Programdaki ürünleri stoktan hızlıca gönderiyoruz.' },
                    { n: '04', t: 'Saha Takibi', d: 'Sezon boyunca uygulamanın nasıl gittiğini takip ediyoruz.' },
                  ]
              ).map((step) => (
                <div
                  key={step.n}
                  className="h-full bg-white rounded-2xl border border-gray-100 p-6"
                >
                  <p className="text-brand-accent font-black text-2xl mb-2 [-webkit-text-stroke:1px_rgb(var(--brand-600))]">
                    {step.n}
                  </p>
                  <h3 className="font-bold text-gray-900 mb-1.5">{step.t}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{step.d}</p>
                </div>
              ))}
            </RevealGroup>
          </div>
        </div>
      </section>

      {/*
        BURAYA GELECEK — gerçek referanslar ve belgeler:

        1. Kurumsal referans listesi: yalnızca YAZILI İZİN alınan müşteriler,
           kurum adı + kısa iş tanımı + yıl.
        2. Belgeler: ISO, TSE, yetkili bayilik yazıları — belge numarası veya
           belgenin taranmış görseliyle birlikte.

        İzinsiz kurum adı yayınlamak aldatıcı reklam sayılır; bu yüzden
        buraya doğrulanmamış hiçbir şey konmadı.
      */}

      {/* ── CTA ── */}
      <section className="py-20 brand-surface">
        <div className="container-main text-center">
          <Reveal>
            <h2 className="text-3xl font-black text-white mb-4">
              {isAlbSu ? 'Suyunuzu ücretsiz analiz edelim' : 'Toprağınıza uygun programı çıkaralım'}
            </h2>
            <p className="text-white/70 max-w-xl mx-auto mb-8 leading-relaxed">
              {isAlbSu
                ? 'Hangi sistemin size uygun olduğunu konuşmak için bize ulaşın. Benzer ölçekte yaptığımız uygulamaları örnekleriyle anlatalım.'
                : 'Ürününüze ve dönemine uygun besleme programı için bize ulaşın. Benzer üretim yapan işletmelerdeki uygulamalarımızı örnekleriyle anlatalım.'}
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                href={`/${brandKey}/iletisim`}
                className="btn-press btn-sheen inline-flex items-center gap-2 bg-brand-accent text-brand-900 px-7 py-3.5 rounded-xl font-bold transition-all"
              >
                İletişime Geçin
              </Link>
              <a
                href={`tel:${telefonArama(cfg.telefon)}`}
                className="inline-flex items-center gap-2 border-2 border-brand-400/60 hover:bg-brand-400/10 text-white px-7 py-3.5 rounded-xl font-semibold transition-colors"
              >
                {telefonGoster(cfg.telefon)}
              </a>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  )
}
