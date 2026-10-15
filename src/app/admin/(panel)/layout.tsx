import Link from 'next/link'
import { adminLogout } from '@/app/actions/admin'
import { yoneticiGerekli } from '@/lib/admin-guard'
import { BRAND } from '@/lib/constants'
import BrandLogo from '@/components/ui/BrandLogo'

/**
 * Yönetim panelinin ortak çerçevesi: başlık + bölüm menüsü.
 *
 * Giriş sayfası (`/admin/giris`) bu route grubunun DIŞINDA durduğu için
 * buradaki yetki kontrolü koşulsuz yapılabiliyor.
 */

const BOLUMLER: { yol: string; ad: string }[] = [
  { yol: '', ad: 'Özet' },
  { yol: '/siparisler', ad: 'Siparişler' },
  { yol: '/urunler', ad: 'Ürünler' },
  { yol: '/iadeler', ad: 'İadeler' },
  { yol: '/mesajlar', ad: 'Mesajlar' },
  { yol: '/blog', ad: 'Blog' },
]

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  // Koşulsuz yetki kontrolü: middleware hiç çalışmasa bile panel korumasız kalmaz.
  await yoneticiGerekli()

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-brand-200 bg-brand-50 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <BrandLogo boyut="md" />
            <div>
              <p className="text-[11px] uppercase tracking-widest text-gray-500 font-semibold">
                Yönetim Paneli
              </p>
              <p className="font-bold leading-tight text-brand-800">{BRAND.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-sm font-semibold text-gray-600 hover:text-gray-900 underline underline-offset-4"
            >
              Siteye git
            </Link>
            <form action={adminLogout}>
              <button
                type="submit"
                className="text-sm text-gray-400 hover:text-red-500 transition-colors"
              >
                Çıkış
              </button>
            </form>
          </div>
        </div>

        {/* Telefonda yatay kaydırılabilir menü */}
        <nav className="mt-4 -mx-1 flex gap-1.5 overflow-x-auto pb-1">
          {BOLUMLER.map((b) => (
            <Link
              key={b.yol || 'ozet'}
              href={`/admin${b.yol}`}
              className="mx-1 px-3 py-2 rounded-lg text-sm font-semibold bg-white/80 text-gray-700 border border-white hover:border-gray-300 hover:text-gray-900 transition-colors whitespace-nowrap"
            >
              {b.ad}
            </Link>
          ))}
        </nav>
      </header>
      {children}
    </div>
  )
}
