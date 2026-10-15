import Link from 'next/link'
import { notFound } from 'next/navigation'
import { adminLogout } from '@/app/actions/admin'
import { gecerliKapsam, kapsamAdi, kapsamRengi, type Kapsam } from '@/lib/admin-kapsam'
import { yoneticiGerekli } from '@/lib/admin-guard'
import BrandLogo from '@/components/ui/BrandLogo'

/**
 * Marka kapsamının ortak çerçevesi.
 *
 * Panelin her ekranında hangi markada çalışıldığı üstte yazıyor. Bu bilinçli:
 * iki markanın ekranları birbirinin aynısı olduğu için, kapsam görünmediğinde
 * yanlış markaya ürün eklemek ya da yanlış siparişi kargoya vermek çok kolay.
 */

const BOLUMLER: { yol: string; ad: string; markaGerekir: boolean }[] = [
  { yol: '', ad: 'Özet', markaGerekir: false },
  { yol: '/siparisler', ad: 'Siparişler', markaGerekir: true },
  { yol: '/urunler', ad: 'Ürünler', markaGerekir: true },
  { yol: '/blog', ad: 'Blog', markaGerekir: true },
  { yol: '/iadeler', ad: 'İadeler', markaGerekir: true },
  { yol: '/mesajlar', ad: 'Mesajlar', markaGerekir: false },
  { yol: '/bayi-basvurulari', ad: 'Bayi Başvuruları', markaGerekir: false },
]

export default async function KapsamLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ kapsam: string }>
}) {
  // Koşulsuz yetki kontrolü. Üstteki `admin/layout.tsx` giriş sayfasını muaf
  // tutmak için `x-pathname` başlığına bakmak zorunda; burada böyle bir istisna
  // yok, dolayısıyla middleware hiç çalışmasa bile panel korumasız kalmıyor.
  await yoneticiGerekli()

  const { kapsam: ham } = await params
  const kapsam = gecerliKapsam(ham)
  if (!kapsam) notFound()

  return (
    <div className="space-y-6">
      <KapsamBasligi kapsam={kapsam} />
      {children}
    </div>
  )
}

function KapsamBasligi({ kapsam }: { kapsam: Kapsam }) {
  const renk = kapsamRengi(kapsam)
  const bolumler = BOLUMLER.filter((b) => kapsam !== 'belirtilmemis' || !b.markaGerekir)

  return (
    <header className={`rounded-2xl border ${renk.kenar} ${renk.arka} p-4 sm:p-5`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Marka kapsamında gerçek logo gösteriliyor. Eskiden markanın baş
              harfi yazılıydı ve iki marka da "A" ile başladığı için rozet ayırt
              edici değildi — oysa bu başlığın tek işi yanlış markada
              çalışıldığını fark ettirmek. Marka dışı kapsamda ("belirtilmemis")
              logo yok, eski soru işareti duruyor. */}
          {kapsam === 'belirtilmemis' ? (
            <span
              className={`inline-flex items-center justify-center w-9 h-9 rounded-xl ${renk.dolgu} text-white text-xs font-black`}
            >
              ?
            </span>
          ) : (
            <BrandLogo brand={kapsam} boyut="md" kutuSinifi={`${renk.dolgu} rounded-xl`} />
          )}
          <div>
            <p className="text-[11px] uppercase tracking-widest text-gray-500 font-semibold">
              Yönetim Paneli
            </p>
            <p className={`font-bold leading-tight ${renk.metin}`}>{kapsamAdi(kapsam)}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="text-sm font-semibold text-gray-600 hover:text-gray-900 underline underline-offset-4"
          >
            Marka değiştir
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

      <nav className="mt-4 flex flex-wrap gap-1.5 overflow-x-auto">
        {bolumler.map((b) => (
          <Link
            key={b.yol || 'ozet'}
            href={`/admin/${kapsam}${b.yol}`}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/70 text-gray-600 border border-white hover:border-gray-300 hover:text-gray-900 transition-colors whitespace-nowrap"
          >
            {b.ad}
          </Link>
        ))}
      </nav>
    </header>
  )
}
