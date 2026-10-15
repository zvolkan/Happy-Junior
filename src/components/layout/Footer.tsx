import Link from 'next/link'
import { SATICI } from '@/lib/legal'
import BrandLogo from '@/components/ui/BrandLogo'
import { BRAND, SITE_CONFIG } from '@/lib/constants'
import { telefonGoster, telefonArama } from '@/lib/utils'

const KATEGORI_LINKS = BRAND.nav.find((n) => n.href === '/urunler')?.children ?? []

const KURUMSAL_LINKS = [
  { label: 'Hakkımızda', href: '/hakkimizda' },
  { label: 'İletişim', href: '/iletisim' },
  // Misafir müşterinin e-postasını kaybettiği siparişi bulabilmesi için.
  { label: 'Sipariş Takibi', href: '/siparis-takibi' },
  { label: 'Blog', href: '/blog' },
]

// Bağlantı adları sayfa başlıklarıyla birebir aynı tutuluyor; ödeme kuruluşu
// incelemesinde footer'daki ad ile açılan sayfanın başlığının uyuşması aranıyor.
const YASAL_LINKS = [
  { label: 'Gizlilik ve Güvenlik', href: '/gizlilik' },
  { label: 'Kullanım Koşulları', href: '/kullanim-kosullari' },
  { label: 'Mesafeli Satış Sözleşmesi', href: '/mesafeli-satis-sozlesmesi' },
  { label: 'İptal ve İade Koşulları', href: '/iade-politikasi' },
  { label: 'KVKK Aydınlatma Metni', href: '/kvkk' },
]

const linkSinifi =
  'inline-flex items-center min-h-[44px] py-1 text-brand-100/70 hover:text-white transition-colors text-sm'

export default function Footer() {
  const instagramKullanici = SITE_CONFIG.socialMedia.instagram.split('/').filter(Boolean).pop()

  return (
    <footer className="bg-brand-900 text-white">
      <div className="py-14">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {/* Mağaza + sosyal medya */}
            <div className="flex flex-col gap-5">
              <Link href="/" className="flex items-center gap-3 group">
                <BrandLogo boyut="md" />
                <span className="text-white font-extrabold text-xl leading-tight">{BRAND.name}</span>
              </Link>
              <p className="text-brand-100/70 text-sm leading-relaxed">{BRAND.description}</p>
              <a
                href={SITE_CONFIG.socialMedia.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${BRAND.name} Instagram hesabı`}
                className="inline-flex items-center gap-2.5 text-brand-100/70 hover:text-white transition-colors rounded-lg py-1.5 pr-3 pl-2 -ml-2 hover:bg-white/10 w-fit"
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
                <span className="text-sm">@{instagramKullanici}</span>
              </a>
            </div>

            {/* Kategoriler */}
            <div>
              <h3 className="text-white font-semibold text-base mb-4">Kategoriler</h3>
              <ul className="flex flex-col">
                {KATEGORI_LINKS.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className={linkSinifi}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Kurumsal + yasal */}
            <div>
              <h3 className="text-white font-semibold text-base mb-4">Kurumsal</h3>
              <ul className="flex flex-col mb-6">
                {KURUMSAL_LINKS.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className={linkSinifi}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <h3 className="text-white font-semibold text-sm mb-2">Yasal</h3>
              <ul className="flex flex-col gap-1.5">
                {YASAL_LINKS.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-brand-100/50 hover:text-brand-100 transition-colors text-xs">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* İletişim */}
            <div>
              <h3 className="text-white font-semibold text-base mb-4">İletişim</h3>
              <ul className="flex flex-col gap-2 text-sm">
                <li>
                  <a href={`tel:${telefonArama(BRAND.telefon)}`} className={linkSinifi}>
                    {telefonGoster(BRAND.telefon)}
                  </a>
                </li>
                <li>
                  <a
                    href={`https://wa.me/${BRAND.whatsapp.phone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={linkSinifi}
                  >
                    WhatsApp’tan yazın
                  </a>
                </li>
                <li>
                  <a href={`mailto:${SITE_CONFIG.email}`} className={`${linkSinifi} break-all`}>
                    {SITE_CONFIG.email}
                  </a>
                </li>
                <li className="text-brand-100/70 leading-relaxed py-1">
                  {SITE_CONFIG.mapsUrl ? (
                    <a href={SITE_CONFIG.mapsUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                      {SITE_CONFIG.address}
                    </a>
                  ) : (
                    SITE_CONFIG.address
                  )}
                </li>
                <li className="text-brand-100/70 py-1">{SITE_CONFIG.workingHours}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Ödeme bilgisi. Kart ödemesi (iyzico) açıldığında iyzico'nun istediği
          logo bandı buraya eklenecek: /odeme/iyzico-band-beyaz.svg */}
      <div className="border-t border-white/10 py-5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <p className="text-brand-100/60 text-xs leading-relaxed">
            Siparişlerinizi <span className="text-white">havale/EFT</span> ile ödeyebilirsiniz.
            Site SSL ile şifrelenir; ödeme bilgileriniz sitemizde saklanmaz.
          </p>
        </div>
      </div>

      {/* Yasal künye — e-ticaret sitelerinde zorunlu. Tek kaynak: src/lib/legal.ts */}
      <div className="border-t border-white/10 py-5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="text-brand-100/50 text-xs leading-relaxed space-y-1">
            <p>
              <span className="text-brand-100/70">Ticaret Unvanı:</span> {SATICI.unvan}
              {SATICI.vergiNo && (
                <>
                  {' · '}
                  <span className="text-brand-100/70">
                    {SATICI.vergiDairesi ? 'Vergi Dairesi / No:' : 'Vergi No:'}
                  </span>{' '}
                  {SATICI.vergiDairesi ? `${SATICI.vergiDairesi} / ${SATICI.vergiNo}` : SATICI.vergiNo}
                </>
              )}
              {SATICI.mersis && (
                <>
                  {' · '}
                  <span className="text-brand-100/70">MERSİS No:</span> {SATICI.mersis}
                </>
              )}
            </p>
            <p>
              <span className="text-brand-100/70">Adres:</span> {SATICI.adres}
            </p>
            {/* ETBİS cümlesi yalnızca kayıt yapıldıysa çıkar; aksi yanlış beyan olur. */}
            {SATICI.etbisKayitli && <p>Bu site ETBİS&apos;e kayıtlıdır.</p>}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 py-5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <p className="text-brand-100/50 text-sm">
            © {new Date().getFullYear()} {BRAND.name}. Tüm hakları saklıdır.
          </p>
        </div>
      </div>
    </footer>
  )
}
