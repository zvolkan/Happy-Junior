import Link from 'next/link'
import { adminLogout } from '@/app/actions/admin'
import { getOrderCountsByStatus, getUnreadMessageCount } from '@/app/actions/admin-orders'
import { getOpenReturnCount } from '@/app/actions/returns'
import { BRANDS } from '@/lib/constants'
import BrandLogo from '@/components/ui/BrandLogo'
import type { BrandKey } from '@/lib/types'
import { yoneticiGerekli } from '@/lib/admin-guard'

export const dynamic = 'force-dynamic'

/**
 * Panelin giriş ekranı: marka seçimi.
 *
 * Eskiden buradan doğrudan sipariş/ürün/blog listelerine giriliyor ve iki
 * markanın kayıtları aynı listede karışıyordu. Artık önce hangi markayla
 * çalışılacağı seçiliyor; sonraki her ekran o markaya göre filtreleniyor.
 *
 * Seçim bilerek hatırlanmıyor — panele her girişte tekrar soruluyor ki yanlış
 * markada işlem yapılmasın.
 */
export default async function AdminGirisEkrani() {
  // Koşulsuz yetki kontrolü — gerekçe için `admin/[kapsam]/layout.tsx`
  await yoneticiGerekli()

  const [tarimSayilari, suSayilari, tarimMesaj, suMesaj, belirsizMesaj, tarimIade, suIade] =
    await Promise.all([
      getOrderCountsByStatus('alb-tarim'),
      getOrderCountsByStatus('alb-su-aritma'),
      getUnreadMessageCount('alb-tarim'),
      getUnreadMessageCount('alb-su-aritma'),
      getUnreadMessageCount('belirtilmemis'),
      getOpenReturnCount('alb-tarim').catch(() => 0),
      getOpenReturnCount('alb-su-aritma').catch(() => 0),
    ])

  const aktif = (c: Record<string, number>) =>
    (c.CONFIRMED ?? 0) + (c.PROCESSING ?? 0) + (c.SHIPPED ?? 0)

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Yönetim Paneli</h1>
          <p className="text-sm text-gray-500 mt-1">
            Hangi markayla çalışacaksınız?
          </p>
        </div>
        <form action={adminLogout}>
          <button
            type="submit"
            className="text-sm text-gray-400 hover:text-red-500 transition-colors"
          >
            Çıkış Yap
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <MarkaKarti
          href="/admin/alb-tarim"
          ad={BRANDS['alb-tarim'].name}
          aciklama="Gübre ve zirai danışmanlık"
          marka="alb-tarim"
          renkler={{
            kenar: 'border-green-200 hover:border-green-400',
            arka: 'from-green-50 to-emerald-50',
            rozet: 'bg-green-600',
            metin: 'text-green-800',
          }}
          aktifSiparis={aktif(tarimSayilari)}
          okunmamis={tarimMesaj}
          iade={tarimIade}
        />
        <MarkaKarti
          href="/admin/alb-su-aritma"
          ad={BRANDS['alb-su-aritma'].name}
          aciklama="Su arıtma, klima ve yedek parça"
          marka="alb-su-aritma"
          renkler={{
            kenar: 'border-blue-200 hover:border-blue-400',
            arka: 'from-blue-50 to-cyan-50',
            rozet: 'bg-blue-600',
            metin: 'text-blue-800',
          }}
          aktifSiparis={aktif(suSayilari)}
          okunmamis={suMesaj}
          iade={suIade}
        />
      </div>

      {/* Markası olmayan kayıtlar hiçbir markanın listesine düşmüyor; burada
          toplanıyorlar ki gözden kaçmasınlar. */}
      <Link
        href="/admin/belirtilmemis"
        className="flex items-center justify-between gap-4 bg-white rounded-2xl border border-gray-200 hover:border-gray-400 p-5 transition-colors"
      >
        <div>
          <p className="font-bold text-gray-900">Belirtilmemiş</p>
          <p className="text-sm text-gray-500 mt-0.5">
            Grup iletişim formundan gelen ve marka seçilmeden yapılmış başvurular
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {belirsizMesaj > 0 && (
            <span className="text-[11px] font-bold bg-red-500 text-white px-2 py-0.5 rounded-full">
              {belirsizMesaj} okunmamış
            </span>
          )}
          <span className="text-gray-400">→</span>
        </div>
      </Link>
    </div>
  )
}

function MarkaKarti({
  href,
  ad,
  aciklama,
  marka,
  renkler,
  aktifSiparis,
  okunmamis,
  iade,
}: {
  href: string
  ad: string
  aciklama: string
  marka: BrandKey
  renkler: { kenar: string; arka: string; rozet: string; metin: string }
  aktifSiparis: number
  okunmamis: number
  iade: number
}) {
  return (
    <Link
      href={href}
      className={`block rounded-3xl border-2 bg-gradient-to-br ${renkler.arka} ${renkler.kenar} p-7 transition-colors hover-lift`}
    >
      <BrandLogo
        brand={marka}
        boyut="lg"
        kutuSinifi={`${renkler.rozet} rounded-2xl`}
        className="mb-5"
      />
      <h2 className={`text-xl font-black ${renkler.metin}`}>{ad}</h2>
      <p className="text-sm text-gray-600 mt-1">{aciklama}</p>

      <dl className="mt-6 grid grid-cols-3 gap-3 border-t border-white/70 pt-4">
        <Sayac etiket="Aktif sipariş" deger={aktifSiparis} />
        <Sayac etiket="Okunmamış" deger={okunmamis} />
        <Sayac etiket="Bekleyen iade" deger={iade} />
      </dl>

      <p className="mt-5 text-sm font-semibold text-gray-700">Bu markayla çalış →</p>
    </Link>
  )
}

function Sayac({ etiket, deger }: { etiket: string; deger: number }) {
  return (
    <div>
      <dt className="text-[11px] text-gray-500 leading-tight">{etiket}</dt>
      <dd className="text-lg font-black text-gray-900 tabular-nums">{deger}</dd>
    </div>
  )
}
