import { SATICI } from '@/lib/legal'
import BrandLogo from '@/components/ui/BrandLogo'
import type { BrandKey } from '@/lib/types'
import Link from 'next/link'
import Image from 'next/image'
import { BRANDS, KURULUS_ANLATIM, SITE_CONFIG } from '@/lib/constants'
import { telefonGoster, telefonArama } from '@/lib/utils'

const GRUP_LINKS = [
  { label: 'Hakkımızda', href: '/hakkimizda' },
  { label: 'Hizmetler', href: '/hizmetler' },
  // Sipariş takibi sayfası yalnızca giriş yapmış kullanıcının sipariş
  // detayından erişilebiliyordu; oysa asıl işi e-postasını kaybetmiş
  // misafir müşterinin siparişini bulması.
  { label: 'Sipariş Takibi', href: '/siparis-takibi' },
  // Blog bilerek yok: footer grup geneline ait, blog ise markaya ait.
  // Buradaki `/blog` bağlantısı aktif markanın bloguna yönleniyordu; yani
  // grup ana sayfasından tıklayan ALB Tarım blogunda buluyordu kendini.
  // Blog, marka menüsünden (Header) erişiliyor.
  { label: 'Bayi Başvurusu', href: '/bayi-basvuru' },
  { label: 'İletişim', href: '/iletisim' },
]

// Her markanın kendi Instagram hesabı var; tek bir grup hesabı yok.
// Bu yüzden simge tek başına yeterli değil, yanına marka adı yazılıyor.
const INSTAGRAM = [
  { marka: 'ALB Tarım', kullanici: 'alb.tarim', href: 'https://www.instagram.com/alb.tarim' },
  { marka: 'Alb Su Teknolojileri', kullanici: 'albsuteknolojileri', href: 'https://www.instagram.com/albsuteknolojileri' },
]

// Bağlantı adları sayfa başlıklarıyla birebir aynı tutuluyor. Ödeme kuruluşu
// incelemesinde footer'daki ad ile açılan sayfanın başlığının uyuşması aranıyor;
// "İade Politikası" yazıp "İptal ve İade Koşulları" sayfasına düşmek eksik sayılır.
const YASAL_LINKS = [
  { label: 'Gizlilik ve Güvenlik', href: '/gizlilik' },
  { label: 'Kullanım Koşulları', href: '/kullanim-kosullari' },
  { label: 'Mesafeli Satış Sözleşmesi', href: '/mesafeli-satis-sozlesmesi' },
  { label: 'İptal ve İade Koşulları', href: '/iade-politikasi' },
  { label: 'KVKK Aydınlatma Metni', href: '/kvkk' },
]

// İki marka rozeti footer'da yan yana duruyor; bu yüzden aktif markaya bağlı
// `brand-*` değil, her markanın kendi sabit paleti kullanılıyor — yoksa ikisi
// aynı renge düşer ve grup ana sayfasında ikisi de griye dönerdi.
const MARKALAR: { key: BrandKey; name: string; desc: string; color: string; href: string }[] = [
  {
    key: 'alb-tarim',
    name: 'ALB Tarım',
    desc: 'Kendi formülümüzle ürettiğimiz gübreler ve zirai danışmanlık',
    color: 'bg-tarim-600',
    href: '/alb-tarim',
  },
  {
    key: 'alb-su-aritma',
    name: 'Alb Su Teknolojileri',
    desc: 'A.O. Smith yetkili bayii · evsel ve endüstriyel su arıtma',
    color: 'bg-albsu-600',
    href: '/alb-su-aritma',
  },
]

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      {/* ÜST BÖLÜM */}
      <div className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

            {/* COL 1 — Grup Kimliği + Sosyal Medya */}
            <div className="flex flex-col gap-5">
              <Link href="/" className="flex items-center gap-3 group">
                {/* Header ve ana sayfadaki logonun aynısı — footer koyu zeminde
                    olduğu için beyaz sürüm kullanılıyor. */}
                <Image
                  src="/images/bayirlioglu-mark-beyaz.svg"
                  alt="Bayırlıoğlu"
                  width={2080}
                  height={780}
                  className="h-8 w-auto object-contain flex-shrink-0 transition-transform duration-300 group-hover:scale-105"
                />
                <span className="text-white font-bold text-lg leading-tight">
                  Bayırlıoğlu
                </span>
              </Link>
              <p className="text-gray-400 text-sm leading-relaxed">
                {KURULUS_ANLATIM} faaliyet gösteren Bayırlıoğlu şirketi şu anda
                ALB Tarım ve Alb Su Teknolojileri markaları altında Türkiye
                genelinde hizmet vermektedir.
              </p>
              <div className="flex flex-col gap-2">
                {INSTAGRAM.map((h) => (
                  <a
                    key={h.kullanici}
                    href={h.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${h.marka} Instagram hesabı`}
                    className="inline-flex items-center gap-2.5 text-gray-400 hover:text-white transition-colors rounded-lg py-1.5 pr-3 pl-2 -ml-2 hover:bg-white/10 w-fit"
                  >
                    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                    <span className="text-sm leading-tight">
                      {h.marka}
                      <span className="block text-xs text-gray-500">@{h.kullanici}</span>
                    </span>
                  </a>
                ))}
              </div>
            </div>

            {/* COL 2 — Markalarımız */}
            <div>
              <h3 className="text-white font-semibold text-base mb-5">Markalarımız</h3>
              <div className="flex flex-col gap-4">
                {MARKALAR.map((m) => (
                  <Link key={m.key} href={m.href}
                    className="group flex items-start gap-3 hover:opacity-90 transition-opacity">
                    {/* Eskiden markanın baş harfi ("A") renkli bir kareye
                        yazılıyordu ve iki marka da aynı harfle başladığı için
                        ayırt edilemiyordu. Artık gerçek logo geliyor; logosu
                        olmayan markada renkli kare + ikon yedeği devrede. */}
                    <BrandLogo
                      brand={m.key}
                      boyut="sm"
                      kutuSinifi={`${m.color} rounded-lg`}
                      className="mt-0.5"
                    />
                    <div>
                      <p className="text-white text-sm font-semibold group-hover:text-gray-200 transition-colors">
                        {m.name}
                      </p>
                      <p className="text-gray-400 text-xs mt-0.5 leading-snug">{m.desc}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* COL 3 — Kurumsal + Yasal */}
            <div>
              <h3 className="text-white font-semibold text-base mb-5">Kurumsal</h3>
              {/* Dokunma hedefi: bağlantılar 44 px yüksekliğe çıkarıldı (WCAG 2.5.5).
                  Aralık `gap` yerine dolgudan geliyor, yoksa liste iki katına çıkardı. */}
              <ul className="flex flex-col mb-6">
                {GRUP_LINKS.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href}
                      className="inline-flex items-center min-h-[44px] py-1 text-gray-400 hover:text-white transition-colors text-sm">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <h3 className="text-white font-semibold text-sm mb-3 mt-2">Yasal</h3>
              <ul className="flex flex-col">
                {YASAL_LINKS.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href}
                      className="text-gray-500 hover:text-gray-300 transition-colors text-xs">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* COL 4 — İletişim */}
            <div>
              <h3 className="text-white font-semibold text-base mb-5">İletişim</h3>
              <ul className="flex flex-col gap-4">
                <li className="flex items-start gap-3">
                  <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <div>
                    <p className="text-gray-500 text-xs mb-1">ALB Tarım</p>
                    <a href={`tel:${telefonArama(BRANDS['alb-tarim'].telefon)}`} className="inline-flex items-center min-h-[44px] py-1 text-gray-400 hover:text-white transition-colors text-sm">
                      {telefonGoster(BRANDS['alb-tarim'].telefon)}
                    </a>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Alb Su Teknolojileri</p>
                    <a href={`tel:${telefonArama(BRANDS['alb-su-aritma'].telefon)}`} className="inline-flex items-center min-h-[44px] py-1 text-gray-400 hover:text-white transition-colors text-sm">
                      {telefonGoster(BRANDS['alb-su-aritma'].telefon)}
                    </a>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <a href="mailto:info@bayirlioglu.com"
                    className="text-gray-400 hover:text-white transition-colors text-sm break-all">
                    info@bayirlioglu.com
                  </a>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {/* Adres ve harita adresi `SITE_CONFIG`ten.
                      İkisi de burada elle yazılıydı: adresin üç, harita
                      bağlantısının iki kopyası vardı. Dükkân taşınsa birinin
                      güncellenip ötekilerin kalması kaçınılmazdı — üstelik
                      yasal künyedeki adres ile footer'daki adres ayrışırsa
                      Mesafeli Sözleşmeler Yönetmeliği açısından da sorun. */}
                  <a
                    href={SITE_CONFIG.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors text-sm leading-relaxed"
                  >
                    {SITE_CONFIG.address}
                  </a>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-gray-400 text-sm">{SITE_CONFIG.workingHours}</span>
                </li>
              </ul>
            </div>

          </div>
        </div>
      </div>

      {/* ÖDEME YÖNTEMLERİ — iyzico logo bandı
          iyzico'nun şartı: "Web sitenizde 'iyzico ile Öde', Visa ve Mastercard
          logolarının yer alması gerekmektedir." Resmî paketteki footer bandı
          üçünü de tek görselde taşıyor — iyzico ile Öde, Mastercard, Visa,
          American Express ve troy. Ayrı kart logosu eklemeye gerek yok.

          ÖLÇÜLENDİRME: genişlik sabit, yükseklik `h-auto`. `h-7` gibi sabit bir
          yükseklikle `max-w-full` birlikte kullanılırsa dar ekranda genişlik
          kısılıp yükseklik sabit kalıyor ve logo YATAY EZİLİYOR; marka kılavuzu
          logonun deforme edilmesini yasaklıyor. Bu haliyle oran her ölçüde
          korunuyor. Koyu zemin olduğu için beyaz sürüm. */}
      <div className="border-t border-white/10 py-6">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-gray-500 text-xs leading-relaxed max-w-md">
              Tüm ödemeler <span className="text-gray-300">iyzico</span> altyapısı üzerinden,
              3D&nbsp;Secure ve SSL şifreli bağlantıyla alınır. Kart bilgileriniz
              sitemizde saklanmaz.
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/odeme/iyzico-band-beyaz.svg"
              alt="iyzico ile Öde — Mastercard, Visa, American Express ve troy kabul edilir"
              width={456}
              height={32}
              className="w-[360px] max-w-full h-auto opacity-90"
              loading="lazy"
            />
          </div>
        </div>
      </div>

      {/* YASAL KÜNYE — e-ticaret sitelerinde zorunlu */}
      <div className="border-t border-white/10 py-5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="text-gray-600 text-xs leading-relaxed space-y-1">
            {/* Künye tek kaynaktan geliyor: src/lib/legal.ts → SATICI.
                Eskiden buradaki değerler elle yazılıydı ve boş olanlar "—"
                gösteriliyordu; sözleşme metniyle iki ayrı yerde tutuluyordu. */}
            <p>
              <span className="text-gray-500">Ticaret Unvanı:</span> {SATICI.unvan}
              {/* Vergi numarası vergi dairesinden bağımsız gösteriliyor:
                  yönetmeliğin zorunlu tuttuğu alan numaranın kendisi, daire
                  tamamlayıcı bilgi. Eskiden ikisi tek koşula bağlıydı ve daire
                  boşken numara da gizleniyordu. */}
              {SATICI.vergiNo && (
                <>
                  {' · '}
                  <span className="text-gray-500">
                    {SATICI.vergiDairesi ? 'Vergi Dairesi / No:' : 'Vergi No:'}
                  </span>{' '}
                  {SATICI.vergiDairesi ? `${SATICI.vergiDairesi} / ${SATICI.vergiNo}` : SATICI.vergiNo}
                </>
              )}
              {SATICI.mersis && (
                <>
                  {' · '}
                  <span className="text-gray-500">MERSİS No:</span> {SATICI.mersis}
                </>
              )}
            </p>
            <p>
              <span className="text-gray-500">Adres:</span> {SATICI.adres}
            </p>
            {/* ETBİS cümlesi KOŞULSUZ yazılıydı. Kayıt yapılmadıysa bu yanlış
                beyandır; artık yalnızca SATICI.etbisKayitli true iken çıkıyor. */}
            {SATICI.etbisKayitli && (
              <p className="text-gray-600">Bu site ETBİS&apos;e kayıtlıdır.</p>
            )}
          </div>
        </div>
      </div>

      {/* ALT BANT */}
      <div className="border-t border-white/10 py-6">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} Bayırlıoğlu. Tüm hakları saklıdır.
            </p>
            <p className="text-gray-600 text-xs">
              ALB Tarım &amp; Alb Su Teknolojileri
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
