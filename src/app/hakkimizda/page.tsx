import type { Metadata } from 'next'
import Link from 'next/link'
import Icon, { type IconName } from '@/components/ui/Icon'
import BrandLogo from '@/components/ui/BrandLogo'
import type { BrandKey } from '@/lib/types'
import { KURULUS_ANLATIM, SITE_CONFIG } from '@/lib/constants'

// KENDİNE REFERANS VEREN CANONICAL — neden gerekli
//
// Aynı konunun üç adresi var: bu kök sayfa (grup anlatısı) ve iki marka
// sürümü. İçerikleri gerçekten farklı, ama canonical yokken arama motoru
// bunu kendi kararıyla çözmeye çalışıyor ve çoğu zaman yanlış olanı seçip
// diğerlerini "kopya" sayarak dizinden düşürüyor. Her sayfanın kendi adresini
// canonical olarak bildirmesi bu belirsizliği ortadan kaldırıyor.
//
// Adres göreli yazılıyor; kök layout'taki `metadataBase` başına alan adını
// ekliyor. Mutlak yazmak, alan adı değiştiğinde burayı unutmak demek olurdu.
export const metadata: Metadata = {
  title: 'Hakkımızda — Bayırlıoğlu',
  description: `${KURULUS_ANLATIM} tarım alanında faaliyet gösteren Bayırlıoğlu hakkında bilgi edinin.`,
  alternates: { canonical: '/hakkimizda' },
}

// Doğrulanamayan rakamlar kaldırıldı. Gerçek değerleriniz olduğunda buraya
// yazın — uydurma sayı, tüketici şikâyetinde aleyhe delil olur.
const stats = [
  { value: 'Anamur', label: 'Merkez' },
  { value: '2 Marka', label: 'Tarım ve Su' },
  { value: '81 İl', label: 'Kargo ile Teslimat' },
  { value: '11 Marka', label: 'Yetkili Tedarik' },
]

const values: { title: string; description: string; icon: IconName }[] = [
  {
    title: 'İşimiz',
    description:
      // Zirai ilaç bilerek burada anılıyor ama internet satışı olarak DEĞİL:
      // bitki koruma ürünlerinin internetten satışı mevzuat gereği yasak,
      // Anamur'daki iş yerinde ÇKS kaydı olan çiftçilere satılıyor. Sayfa
      // metninde bunu söylemek doğru; arama motoru anahtar kelimelerine
      // eklemek değil.
      'Çiftçiye gübre satıyor, zirai danışmanlık veriyoruz; ev ile iş yerlerine su arıtma sistemi satıyoruz. Bitki koruma ürünlerini yalnızca Anamur\'daki iş yerimizden, ÇKS kaydı bulunan çiftçilere veriyoruz. Su arıtmada kurulumu ve bakımı kendi ekibimiz yapıyor.',
    icon: 'hedef',
  },
  {
    title: 'Hedefimiz',
    description:
      'Doğru ürünü önermek, siparişi zamanında teslim etmek ve satıştan sonra da telefonla ulaşılabilir olmak. Bölgede işini bilen bir dükkân olarak kalmak istiyoruz.',
    icon: 'odul',
  },
  {
    title: 'Çalışma Şeklimiz',
    description:
      'Elimizde olmayan ürünü varmış gibi göstermiyor, bilmediğimiz konuda tavsiye vermiyoruz. Fiyatı ve teslim süresini baştan açık söylüyoruz.',
    icon: 'kalite',
  },
]

const markalar: {
  name: string
  color: string
  textColor: string
  bgLight: string
  borderColor: string
  href: string
  desc: string
  kuruluş: string
  /** `icon` yerine marka anahtarı: görsel artık BrandLogo'dan geliyor */
  key: BrandKey
}[] = [
  {
    name: 'ALB Tarım',
    color: 'bg-green-600',
    textColor: 'text-green-700',
    bgLight: 'bg-green-50',
    borderColor: 'border-green-200',
    href: '/alb-tarim',
    desc: 'Kendi formülleriyle ürettiği gübreler alanında faaliyet göstermektedir. Çiftçilerimize uygun fiyat, hızlı teslimat ve uzman zirai danışmanlık sunmaktadır. Bitki koruma ürünleri internetten satılmamakta; ÇKS kaydı bulunan çiftçilere iş yerimizden verilmektedir.',
    kuruluş: '1977',
    key: 'alb-tarim',
  },
  {
    name: 'Alb Su Teknolojileri',
    color: 'bg-blue-600',
    textColor: 'text-blue-700',
    bgLight: 'bg-blue-50',
    borderColor: 'border-blue-200',
    href: '/alb-su-aritma',
    desc: `A.O. Smith yetkili bayii olarak evsel ve endüstriyel su arıtma sistemleri satıyor. Montaj ve filtre değişimini kendi ekibi yapar; teknik servis ${SITE_CONFIG.workingHours} saatlerinde hizmet verir.`,
    kuruluş: '2014',
    key: 'alb-su-aritma',
  },
]

// EKİP — şimdilik boş.
//
// Burada dört uydurma kişi vardı (isimler, unvanlar ve "vizyoner lider" gibi
// tanıtım cümleleri gerçek çalışanlara ait değildi).
//
// Ekipte gerçekten kim varsa adını, görevini ve bir cümlelik tanıtımını
// gönderin, buraya eklensin. Dizi boşken bölüm hiç görünmüyor.
const team: Array<{ name: string; title: string; description: string }> = []

// BELGELER — şimdilik boş.
//
// Burada ISO 9001, ISO 14001, CE ve TSE belgeleri listeleniyordu. Sahip
// olmadığınız bir belgeyi ilan etmek yalnızca itibar sorunu değil; Ticaret
// Bakanlığı'nın aldatıcı reklam denetimine de konu olur.
//
// Elinizdeki gerçek belgeleri (belge numarası ve veren kurumla birlikte)
// gönderdiğinizde bu listeye eklenecek. Dizi boş olduğunda bölüm hiç
// görünmüyor.
const certifications: Array<{ name: string; description: string }> = []

export default function HakkimizdaPage() {
  return (
    <main>
      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-20 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl text-center text-white">
          <p className="text-gray-400 text-sm font-semibold uppercase tracking-widest mb-3">
            Bayırlıoğlu
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Hakkımızda</h1>
          <p className="text-xl text-white/75 font-medium max-w-xl mx-auto">
            {KURULUS_ANLATIM} Anamur&apos;dayız; tarım girdileri ve su arıtma
            sistemleri satıyoruz.
          </p>
        </div>
      </section>

      {/* Şirket Hikayesi */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Hikayemiz</h2>
            <div className="prose prose-lg text-gray-700 space-y-4">
              <p>
                Hikâyemiz 1977'de, &ldquo;Bayırlıoğlu&rdquo; lakabıyla tanınan
                Durmuş Ali Bulut&apos;un Mersin&apos;in Anamur ilçesinde kurduğu güven
                ilişkisiyle başladı. Bir lakapla başlayan bu isim, zamanla şirketimizin
                adı ve değerlerimizin bir parçası oldu. O günden beri aynı ilçedeyiz,
                çoğunlukla aynı ailelerle çalışıyoruz.
              </p>
              <p>
                Babadan oğula aktarılan bu anlayışla iş, zamanla kendi formülleriyle
                gübre üreten bir yapıya dönüştü. 2014 yılında ise Ramazan Bulut,
                Bayırlıoğlu çatısı altında{' '}
                <strong>Alb Su Teknolojileri</strong> markasını kurarak su arıtma
                alanına adım attı.
              </p>
              <p>
                Bugün Anamur merkezli olarak Türkiye'nin 81 iline kargo ile ürün gönderiyoruz.
                Tarım girdileri ve su arıtma sistemlerinde ürün seçiminden kuruluma kadar
                yanınızda olmaya devam ediyoruz.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Markalar */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="text-center mb-12">
            <p className="text-gray-500 text-sm font-semibold uppercase tracking-widest mb-2">
              Bünyemizde
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Markalarımız</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {markalar.map((m) => (
              <div
                key={m.name}
                className={`bg-white rounded-2xl border ${m.borderColor} shadow-sm hover:shadow-md transition-shadow p-4 sm:p-8`}
              >
                <div className="flex items-center gap-4 mb-5">
                  <BrandLogo brand={m.key} boyut="md" kutuSinifi={`${m.color} rounded-xl`} />
                  <div>
                    <h3 className={`text-xl font-bold ${m.textColor}`}>{m.name}</h3>
                    <p className="text-gray-400 text-xs">Kuruluş: {m.kuruluş}</p>
                  </div>
                </div>
                <p className="text-gray-600 leading-relaxed mb-6">{m.desc}</p>
                <Link
                  href={m.href}
                  className={`inline-flex items-center gap-1.5 text-sm font-semibold ${m.textColor} hover:underline`}
                >
                  Markaya Git →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Misyon / Vizyon / Değerler */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Ne Yapıyoruz, Nasıl Çalışıyoruz?
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((item) => (
              <div
                key={item.title}
                className="bg-gray-50 rounded-2xl shadow-sm hover:shadow-md transition-shadow p-4 sm:p-8 text-center"
              >
                <div className="mb-5 flex justify-center"><Icon name={item.icon} className="w-12 h-12 text-gray-700" /></div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* İstatistikler */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-16 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center text-white">
                <div className="text-2xl sm:text-5xl lg:text-6xl font-bold mb-2 break-words">
                  {stat.value}
                </div>
                <div className="text-white/60 text-base sm:text-lg font-medium break-words">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ekip — ekip listesi boşsa bölüm hiç render edilmiyor */}
      {team.length > 0 && (
      <section className="py-16 sm:py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Ekibimiz</h2>
            <p className="text-gray-500 text-lg">Deneyimli kadromuzla hizmetinizdeyiz</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member) => (
              <div
                key={member.name}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow text-center p-6"
              >
                <div className="w-20 h-20 mx-auto rounded-full bg-gray-100 mb-4 flex items-center justify-center text-2xl">
                  <Icon name="kullanici" className="w-6 h-6 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">{member.name}</h3>
                <p className="text-sm font-semibold text-gray-500 mb-3">{member.title}</p>
                <p className="text-gray-600 text-sm leading-relaxed">{member.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* Sertifikalar — belge listesi boşsa bölüm hiç render edilmiyor */}
      {certifications.length > 0 && (
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Sertifikalarımız</h2>
            <p className="text-gray-500 text-lg">
              Kalite standartlarımızı belgeleyen uluslararası sertifikalarımız
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {certifications.map((cert) => (
              <div
                key={cert.name}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-6 text-center"
              >
                <div className="w-14 h-14 mx-auto rounded-xl bg-gray-100 mb-4 flex items-center justify-center text-2xl">
                  <Icon name="odul" className="w-6 h-6 text-gray-400" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1">{cert.name}</h3>
                <p className="text-gray-500 text-sm">{cert.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* CTA */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-16 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl text-center text-white">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Bizimle Çalışmak İster misiniz?</h2>
          <p className="text-white/70 text-lg mb-8 max-w-xl mx-auto">
            Müşterimiz veya iş ortağımız olun, farkı birlikte yaşayalım.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/iletisim"
              className="bg-white text-gray-900 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-colors"
            >
              İletişime Geçin
            </Link>
            <Link
              href="/bayi-basvuru"
              className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/10 transition-colors"
            >
              Bayi Başvurusu
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
