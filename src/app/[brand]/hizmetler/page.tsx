import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { BRANDS, SITE_CONFIG } from '@/lib/constants'
import { TESLIMAT_SURESI } from '@/lib/checkout'
import type { BrandKey } from '@/lib/types'
import Icon, { type IconName } from '@/components/ui/Icon'
import Reveal from '@/components/ui/Reveal'
import RevealGroup from '@/components/ui/RevealGroup'
import SssBolumu from '@/components/ui/SssBolumu'
import Breadcrumb from '@/components/ui/Breadcrumb'
import { paylasimMetadata } from '@/lib/seo'

const VALID_BRANDS: BrandKey[] = ['alb-tarim', 'alb-su-aritma']

interface Props {
  params: Promise<{ brand: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { brand } = await params
  if (!VALID_BRANDS.includes(brand as BrandKey)) return {}
  const cfg = BRANDS[brand as BrandKey]
  const baslik = 'Hizmetler'
  const aciklama = `${cfg.name} hizmetleri: teknik destek, danışmanlık ve daha fazlası.`
  return {
    // Marka adını `[brand]/layout.tsx` şablonu zaten ekliyor; burada tekrar
    // yazmak başlığı "Hizmetler — ALB Tarım | ALB Tarım" yapıyordu.
    title: baslik,
    description: aciklama,
    alternates: { canonical: `/${brand}/hizmetler` },
    ...paylasimMetadata({
      title: `${baslik} — ${cfg.name}`,
      description: aciklama,
      url: `/${brand}/hizmetler`,
      marka: brand as BrandKey,
    }),
  }
}

const TARIM_SERVICES: { icon: IconName; title: string; desc: string; features: string[] }[] = [
  {
    icon: 'filiz',
    title: 'Tarım Danışmanlığı',
    desc: 'Uzman agronomlarımız tarladan sofraya tüm süreçte yanınızda. Toprak analizi, ürün seçimi, gübreleme ve bitki koruma planlaması.',
    features: ['Toprak analizi', 'Ürün seçim danışmanlığı', 'Gübreleme planı', 'Bitki koruma programı', 'Hasat sonrası rehberlik'],
  },
  {
    icon: 'traktor',
    title: 'Saha Ziyareti',
    desc: 'Uzmanlarımız tarlanıza gelir, yerinde inceleme yaparak en doğru çözümü sunar.',
    features: ['Ücretsiz saha analizi', 'Yerinde toprak ve bitki gözlemi', 'Özel aksiyon planı'],
  },
  {
    icon: 'analiz',
    title: 'Bitki Koruma Ürünleri — Mağazadan Satış',
    desc: 'Bitki koruma ürünlerinin internetten satışı mevzuat gereği yapılamaz. Bu ürünleri Anamur\'daki iş yerimizden, Çiftçi Kayıt Sistemi (ÇKS) kaydı bulunan çiftçilere satıyoruz. Danışmanlık görüşmesinde ihtiyacınızı belirleyip doğru ürünü mağazada temin edebilirsiniz.',
    features: ['İnternetten satışı yoktur', 'ÇKS belgesi ile mağazadan satış', 'Danışmanlıkla birlikte ürün seçimi', 'Anamur\'daki iş yerimizde'],
  },
  // "Sulama Sistem Kurulumu" hizmeti kaldırıldı: ALB Tarım sulama sistemi
  // kurulumu yapmıyor. Tarım ekipmanı satışı da yok.
  //
  // ── ZİRAİ İLAÇ: internette YOK, mağazada VAR ────────────────────────────
  //
  // Bitki koruma ürünlerinin internetten satışı mevzuat gereği yasak; bu
  // yüzden ürün kataloğunda yer almıyor, arama motoru anahtar kelimelerinde
  // de geçmemeli. Ancak Anamur'daki iş yerinde, ÇKS kaydı bulunan çiftçilere
  // satışı yapılıyor. Bunu gizlemek de yanlış olurdu: danışmanlık verirken
  // ortaya çıkan ihtiyacın nerede karşılandığını söylemek gerekiyor.
  //
  // Aşağıdaki kart tam olarak bu ayrımı kuruyor — "mağazadan, ÇKS ile".
  // Metni değiştirirken "internetten satın alın" çağrısına dönüşmemesine
  // dikkat edin.
  // "Çiftçi Eğitimi" hizmeti kaldırıldı: seminer, sertifika programı ve online
  // eğitim gibi bir faaliyet sitenin hiçbir yerinde yok. Böyle bir çalışmanız
  // varsa yeniden ekleyelim.
  {
    icon: 'kargo',
    title: 'Hızlı Teslimat',
    desc: `81 ile uzanan dağıtım ağımızla siparişleriniz ${TESLIMAT_SURESI} içinde kapınızda.`,
    features: ['81 il teslimat', TESLIMAT_SURESI, 'Soğuk zincir ürünler', 'Takip numarası ile anlık izleme'],
  },
  // "Teknik Servis" hizmeti kaldırıldı: ALB Tarım tarım ekipmanı bakım/onarım
  // hizmeti vermiyor. (Alb Su tarafındaki teknik servis duruyor, o gerçek.)
]

const ALBSU_SERVICES: { icon: IconName; title: string; desc: string; features: string[] }[] = [
  {
    icon: 'analiz',
    title: 'Su Analizi',
    desc: 'Suyunuzun kalitesini ücretsiz analiz ediyoruz, ihtiyacınıza en uygun sistemi öneriyoruz.',
    features: ['Ücretsiz su kalite testi', 'Sertifikalı laboratuvar analizi', 'Sistem önerileri', 'Karşılaştırmalı rapor'],
  },
  {
    icon: 'servis',
    title: 'Profesyonel Montaj',
    desc: 'Sertifikalı teknisyenlerimiz tüm kurulumu güvenle yapar, sisteminizi devreye alır.',
    features: ['Ücretsiz keşif', 'Sertifikalı montaj', 'Test ve devreye alma', 'Kullanım eğitimi'],
  },
  {
    icon: 'yenile',
    title: 'Filtre Değişimi',
    desc: 'Düzenli filtre değişimi ve bakım programlarıyla sisteminizin verimliliğini koruyun.',
    features: ['Periyodik filtre değişimi', 'Sistem temizliği', 'Performans kontrolü', 'Hatırlatma servisi'],
  },
  {
    icon: 'telefon',
    title: 'Teknik Destek',
    desc: 'Arıza ve bakım taleplerinizi çalışma saatlerimiz içinde alıyor, sıraya göre en kısa sürede dönüyoruz.',
    features: [`Destek hattı: ${SITE_CONFIG.workingHours}`, 'Uzaktan tanı', 'Yerinde servis', 'Online takip sistemi'],
  },
  {
    icon: 'iklim',
    title: 'Klima Bakımı',
    desc: 'Sezon başı ve sezon sonu klima bakımıyla enerji verimliliğini artırın.',
    features: ['Gaz dolumu', 'Filtre temizliği', 'Performans testi', 'Garanti kapsamında bakım'],
  },
  {
    icon: 'ev',
    title: 'Akıllı Ev Çözümleri',
    desc: 'Evinizi akıllı sistemlerle donatın, enerji tasarrufu sağlayın ve konforlu yaşayın.',
    features: ['Akıllı termostat', 'Su kalite monitörü', 'Uzaktan kontrol', 'Enerji takip paneli'],
  },
]

export default async function HizmetlerPage({ params }: Props) {
  const { brand } = await params
  if (!VALID_BRANDS.includes(brand as BrandKey)) notFound()

  const brandKey = brand as BrandKey
  const isAlbSu = brandKey === 'alb-su-aritma'
  const cfg = BRANDS[brandKey]
  const services = isAlbSu ? ALBSU_SERVICES : TARIM_SERVICES

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="brand-surface py-16">
        <div className="container-main text-center">
          <Breadcrumb
            koyu
            className="mb-6 justify-center [&>ol]:justify-center"
            adimlar={[
              { label: 'Ana Sayfa', href: '/' },
              { label: cfg.name, href: `/${brandKey}` },
              { label: 'Hizmetler' },
            ]}
          />
          <p className="font-bold uppercase text-sm tracking-widest mb-3 text-brand-400">
            Hizmetlerimiz
          </p>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-4">
            {cfg.name} Hizmetleri
          </h1>
          <p className="text-white/60 max-w-xl mx-auto">
            {isAlbSu
              ? 'Kurulumdan bakıma, teknik destekten akıllı çözümlere kadar her aşamada yanınızdayız.'
              : 'Zirai danışmanlıktan saha ziyaretine, doğru ürün seçiminden hızlı teslimata kadar çiftçimizi destekliyoruz.'}
          </p>
        </div>
      </section>

      {/* Hizmetler Grid */}
      <section className="py-16 container-main">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <RevealGroup itemClassName="h-full">
          {services.map((svc) => (
            <div
              key={svc.title}
              className="h-full bg-white rounded-2xl border border-brand-100 hover:border-brand-200 p-7 hover-lift"
            >
              <div className="mb-5"><Icon name={svc.icon} className="w-9 h-9 text-brand-600" /></div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{svc.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-5">{svc.desc}</p>
              <ul className="space-y-2">
                {svc.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-brand-500" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          </RevealGroup>
        </div>
      </section>

      {/* SSS — marka sayfasında hiç yoktu; oysa servis sorusu burada soruluyor */}
      <SssBolumu marka={brandKey} />

      {/* CTA */}
      <section className="py-16 brand-surface">
        <div className="container-main text-center">
          <Reveal>
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-4">
              Hizmet Almaya Hazır mısınız?
            </h2>
            <p className="text-white/60 mb-8">Uzman ekibimiz sizin için burada.</p>
          </Reveal>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href={`/${brandKey}/iletisim`}
              className="bg-brand-600 hover:bg-brand-500 text-white px-8 py-3.5 rounded-xl font-bold transition-colors shadow-lg btn-press"
            >
              Hizmet Talebi Oluştur
            </Link>
            <a
              href={`https://wa.me/${cfg.whatsapp.phone}?text=${encodeURIComponent(cfg.whatsapp.message)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-[#25D366] hover:bg-[#1aad50] text-white px-8 py-3.5 rounded-xl font-bold transition-colors shadow-lg"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp
            </a>
          </div>
        </div>
      </section>

    </div>
  )
}
