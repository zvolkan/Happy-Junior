import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import Breadcrumb from '@/components/ui/Breadcrumb'
import { BRANDS } from '@/lib/constants'
import type { BrandKey } from '@/lib/types'
import Icon from '@/components/ui/Icon'
import Reveal from '@/components/ui/Reveal'
import RevealGroup from '@/components/ui/RevealGroup'
import BrandArtwork from '@/components/ui/BrandArtwork'

const VALID_BRANDS: BrandKey[] = ['alb-tarim', 'alb-su-aritma']

interface Props {
  params: Promise<{ brand: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { brand } = await params
  if (!VALID_BRANDS.includes(brand as BrandKey)) return {}
  const cfg = BRANDS[brand as BrandKey]
  return {
    title: `Hakkımızda — ${cfg.name}`,
    description: `${cfg.name} hakkında: tarihçemiz, ekibimiz ve değerlerimiz.`,
    // Kök /hakkimizda grup anlatısını, bu sayfa markayı anlatıyor. İkisi de
    // kendi adresini canonical bildiriyor ki arama motoru hangisinin asıl
    // olduğunu tahmin etmeye çalışmasın.
    alternates: { canonical: `/${brand}/hakkimizda` },
  }
}

type TimelineItem = { year: string; event: string }

// TARİHÇE
//
// Buradaki yıllar ve olaylar bir zamanlar uydurmaydı (ulusal dağıtım ağı,
// "1.000 başarılı montaj" gibi); hepsi silinmişti. Aşağıdakiler şirketin
// verdiği gerçek bilgiler.
//
// Yeni dönüm noktası eklemek isterseniz (dükkân açılışı, yeni bayilik, depo,
// yeni ürün grubu) yılıyla birlikte bu listeye yazın. Dizi boşken bölüm hiç
// görünmüyor.
const TARIM_TIMELINE: TimelineItem[] = [
  {
    year: '1977',
    event:
      'Durmuş Ali Bulut, Anamur\'da kendi lakabıyla tanınan bir ticaret kurdu. ' +
      'Zamanla o lakap şirketin adı oldu: Bayırlıoğlu.',
  },
]

const ALBSU_TIMELINE: TimelineItem[] = [
  {
    year: '1977',
    event:
      'Bayırlıoğlu adı, Durmuş Ali Bulut\'un Anamur\'da kurduğu güven ' +
      'ilişkisiyle doğdu. Bugünkü işin dayandığı gelenek buradan geliyor.',
  },
  {
    year: '2014',
    event:
      'Ramazan Bulut, Bayırlıoğlu çatısı altında ALB Su markasını kurdu. ' +
      'Anamur ve çevre bölgede hanelere ve işletmelere temiz su ulaştırmaya başladı.',
  },
  {
    year: '2019',
    event:
      'A.O. Smith yetkili bayiliğini aldık. Evsel ve endüstriyel su arıtma ' +
      'çözümlerimizi Türkiye\'nin dört bir yanına ulaştırmaya başladık.',
  },
]

export default async function HakkimizdaPage({ params }: Props) {
  const { brand } = await params
  if (!VALID_BRANDS.includes(brand as BrandKey)) notFound()

  const brandKey = brand as BrandKey
  const isAlbSu = brandKey === 'alb-su-aritma'
  const cfg = BRANDS[brandKey]
  const timeline = isAlbSu ? ALBSU_TIMELINE : TARIM_TIMELINE

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="brand-surface py-20">
        <div className="container-main">
          <Breadcrumb
            koyu
            className="mb-8"
            adimlar={[
              { label: 'Ana Sayfa', href: '/' },
              { label: cfg.name, href: `/${brandKey}` },
              { label: 'Hakkımızda' },
            ]}
          />
          <div className="max-w-2xl">
            <p className="font-bold uppercase text-sm tracking-widest mb-3 text-brand-400">Biz Kimiz</p>
            <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight mb-6">
              {cfg.name} Hakkında
            </h1>
            <p className="text-white/70 text-lg leading-relaxed">{cfg.description}</p>
          </div>
        </div>
      </section>

      {/* Hikâyemiz — şirketin verdiği metin. Yalnızca Alb Su tarafında
          gösteriliyor: metin ALB Su markasını ve A.O. Smith bayiliğini
          anlatıyor, ALB Tarım sayfasında yanlış olurdu. */}
      {isAlbSu && (
      <section className="py-16 bg-white">
        <div className="container-main">
          <div className="max-w-3xl mx-auto">
            <Reveal>
              <p className="font-bold uppercase text-sm tracking-widest mb-3 text-brand-600">
                Hikâyemiz
              </p>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight mb-8">
                Yarım asra yaklaşan bir ticaret geleneği
              </h2>
              <div className="space-y-5 text-gray-700 leading-relaxed text-lg">
                <p>
                  Hikâyemiz, 1977 yılında Bayırlıoğlu adıyla tanınan Durmuş Ali
                  Bulut&apos;un kurduğu güven ilişkisiyle başladı. Bir lakapla başlayan
                  bu isim, zamanla şirketimizin adı ve değerlerimizin bir parçası oldu.
                </p>
                <p>
                  Babadan oğula aktarılan bu anlayışı sürdüren Ramazan Bulut, 2014
                  yılından bu yana Bayırlıoğlu çatısı altındaki{' '}
                  <strong className="font-bold text-gray-900">
                    ALB Su markasıyla Anamur ve çevre bölgelerde binlerce haneye ve
                    işletmeye temiz su ulaştırıyor.
                  </strong>
                </p>
                <p>
                  Bugün,{' '}
                  <strong className="font-bold text-gray-900">
                    A.O. Smith yetkili bayiliğimiz
                  </strong>{' '}
                  ile evsel ve endüstriyel su arıtma çözümlerimizi Türkiye&apos;nin dört
                  bir yanına ulaştırıyoruz.
                </p>
                <p>
                  Sattığımız her ürünün arkasında,{' '}
                  <strong className="font-bold text-gray-900">
                    kırk yılı aşkın bir ticaret geleneğinin, güvenin ve sorumluluğun
                  </strong>{' '}
                  izi var.
                </p>
              </div>
            </Reveal>
            <Reveal variant="scale">
              <div className="mt-10 border-l-4 border-brand-500 bg-gray-50 rounded-r-2xl px-6 py-5">
                <p className="text-gray-600 mb-1">Dünden bugüne değişmeyen anlayışımız:</p>
                <p className="text-xl sm:text-2xl font-black text-gray-900">
                  Güven, kalite ve sürdürülebilir hizmet.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
      )}

      {/* Misyon & Vizyon */}
      <section className="py-16 container-main">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <RevealGroup itemClassName="h-full">
          <div className="h-full bg-white rounded-2xl border border-gray-100 p-4 sm:p-8 hover-lift">
            <div className="mb-4"><Icon name="hedef" className="w-8 h-8 text-brand-600" /></div>
            <h2 className="text-xl font-black text-gray-900 mb-3">Misyonumuz</h2>
            <p className="text-gray-600 leading-relaxed">
              {isAlbSu
                ? 'Her haneye ve işletmeye temiz, güvenli su ulaştırmak. Sattığımız cihazın arkasında durmak; kurulumundan filtre değişimine kadar aynı elin işi olmasını sağlamak.'
                : 'Türk çiftçisine en kaliteli tarım girdilerini ve teknolojiyi ulaştırarak üretim verimliliğini artırmak ve sürdürülebilir tarımı yaygınlaştırmak.'}
            </p>
          </div>
          <div className="h-full bg-white rounded-2xl border border-gray-100 p-4 sm:p-8 hover-lift">
            <div className="mb-4"><Icon name="vizyon" className="w-8 h-8 text-brand-600" /></div>
            <h2 className="text-xl font-black text-gray-900 mb-3">Vizyonumuz</h2>
            <p className="text-gray-600 leading-relaxed">
              {isAlbSu
                ? 'Anamur\'da kurulan güven ilişkisini Türkiye geneline taşımak; su arıtmada akla ilk gelen, arkasında durulan marka olmak.'
                : 'Bölgenin lider tarım teknolojileri şirketi olmak; dijital tarım çözümleriyle Türk çiftçisini geleceğe taşımak.'}
            </p>
          </div>
          </RevealGroup>
        </div>
      </section>

      {/* Tarihçe — liste boşsa bölüm hiç render edilmiyor */}
      {timeline.length > 0 && (
      <section className="py-16 bg-white">
        <div className="container-main">
          <Reveal>
            <div className="text-center mb-12">
              <p className="font-bold uppercase text-sm tracking-widest mb-2 text-brand-600">Tarihçe</p>
              <h2 className="text-3xl font-black text-gray-900">Yolculuğumuz</h2>
            </div>
          </Reveal>
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />
              <div className="space-y-8">
                <RevealGroup variant="left">
                {timeline.map((item, i) => (
                  <div key={i} className="relative flex gap-6 pl-16">
                    <div className="absolute left-4 top-1 w-4 h-4 rounded-full ring-4 ring-white bg-brand-500 ring-brand-200" style={{ transform: 'translateX(-50%)' }} />
                    <div>
                      <p className="text-sm font-black text-brand-600 mb-1">{item.year}</p>
                      <p className="text-gray-700 leading-relaxed">{item.event}</p>
                    </div>
                  </div>
                ))}
                </RevealGroup>
              </div>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* İstatistikler */}
      <section className="py-16 bg-gray-50">
        <div className="container-main">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <RevealGroup variant="scale" itemClassName="h-full">
            {/* 320px'de iki sütunlu ızgarada hücreye ~82px kalıyordu;
                "Ücretsiz" gibi tek kelimelik değerler 36px punto ile sığmayıp
                sayfayı yatayda taşırıyordu. Punto ve iç boşluk küçük ekranda
                düşürüldü, kelime kırılması açıldı. */}
            {cfg.stats.map((s) => (
              <div key={s.label} className="h-full text-center bg-white rounded-2xl border border-gray-100 p-4 sm:p-6">
                <p className="text-2xl sm:text-3xl md:text-4xl font-black text-brand-600 mb-2 break-words">
                  {s.value}
                </p>
                <p className="text-gray-500 text-sm font-medium break-words">{s.label}</p>
              </div>
            ))}
            </RevealGroup>
          </div>
        </div>
      </section>

      {/* Ekip Placeholder */}
      <section className="py-16 bg-white">
        <div className="container-main text-center">
          <Reveal>
            <p className="font-bold uppercase text-sm tracking-widest mb-3 text-brand-600">Ekibimiz</p>
            <h2 className="text-3xl font-black text-gray-900 mb-4">Uzman Kadromuz</h2>
            <p className="text-gray-500 max-w-xl mx-auto mb-10">
              {isAlbSu
                ? 'Keşiften montaja, filtre değişiminden arıza servisine kadar işi kendi ekibimiz yapıyor. Sattığımız cihazı kuran ve bakımını yapan aynı ekip.'
                : 'Agronomi ve bitki besleme konusunda deneyimli ekibimizle sahada yanınızdayız.'}
            </p>
          </Reveal>
          {/* Gerçek ekip fotoğrafı hazır olduğunda burası <Image> ile
              değiştirilecek; şimdilik marka renklerine uyan bir görsel var. */}
          <Reveal variant="scale">
            <div className="max-w-3xl mx-auto mb-8 rounded-3xl overflow-hidden border border-gray-100 shadow-sm">
              <BrandArtwork variant="ekip" className="w-full h-40 sm:h-52 block" />
            </div>
          </Reveal>
          <Link
            href={`/${brandKey}/iletisim`}
            className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white px-6 py-3 rounded-xl font-semibold transition-colors btn-press"
          >
            Bizimle İletişime Geçin
          </Link>
        </div>
      </section>
    </div>
  )
}
