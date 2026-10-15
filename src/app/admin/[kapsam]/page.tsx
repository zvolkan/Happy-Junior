import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  getOrderCountsByStatus,
  getUnreadMessageCount,
  getNewDealerCount,
} from '@/app/actions/admin-orders'
import { getOpenReturnCount } from '@/app/actions/returns'
import { prisma } from '@/lib/db'
import Icon, { type IconName } from '@/components/ui/Icon'
import { gecerliKapsam, kapsamAdi, markaMi } from '@/lib/admin-kapsam'

export const dynamic = 'force-dynamic'

export default async function KapsamOzetPage({
  params,
}: {
  params: Promise<{ kapsam: string }>
}) {
  const { kapsam: ham } = await params
  const kapsam = gecerliKapsam(ham)
  if (!kapsam) notFound()

  const marka = markaMi(kapsam) ? kapsam : undefined

  const [counts, unreadMessages, newApplications, lowStock, openReturns] = await Promise.all([
    marka ? getOrderCountsByStatus(marka) : Promise.resolve({} as Record<string, number>),
    getUnreadMessageCount(kapsam),
    getNewDealerCount(kapsam),
    marka
      ? prisma.product
          .count({
            where: { isActive: true, stockQuantity: { lte: 5 }, brand: { key: marka } },
          })
          .catch(() => 0)
      : Promise.resolve(0),
    marka ? getOpenReturnCount(marka).catch(() => 0) : Promise.resolve(0),
  ])

  const activeOrders =
    (counts.CONFIRMED ?? 0) + (counts.PROCESSING ?? 0) + (counts.SHIPPED ?? 0)

  return (
    <div className="space-y-8">
      {kapsam === 'belirtilmemis' ? (
        <p className="text-sm text-gray-500 bg-white rounded-2xl shadow-sm p-5 leading-relaxed">
          Bu bölümde yalnızca <strong>markası belli olmayan</strong> kayıtlar var: Bayırlıoğlu
          grup iletişim formundan gelen mesajlar ve marka seçilmeden yapılmış bayi başvuruları.
          Sipariş, ürün ve blog her zaman bir markaya ait olduğu için burada görünmez.
        </p>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <Kutu etiket="Aktif Sipariş" deger={activeOrders} href={`/admin/${kapsam}/siparisler`} />
          <Kutu etiket="Okunmamış Mesaj" deger={unreadMessages} href={`/admin/${kapsam}/mesajlar`} />
          <Kutu
            etiket="Yeni Bayi Başvurusu"
            deger={newApplications}
            href={`/admin/${kapsam}/bayi-basvurulari`}
          />
          <Kutu
            etiket="Stoğu Azalan"
            deger={lowStock}
            href={`/admin/${kapsam}/urunler`}
            vurgu={lowStock > 0 ? 'text-orange-600' : undefined}
          />
          <Kutu
            etiket="Bekleyen İade"
            deger={openReturns}
            href={`/admin/${kapsam}/iadeler`}
            vurgu={openReturns > 0 ? 'text-red-600' : undefined}
          />
        </div>
      )}

      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          {kapsamAdi(kapsam)} — Bölümler
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {marka && (
            <>
              <Kart
                href={`/admin/${kapsam}/siparisler`}
                ikon="paket"
                baslik="Siparişler"
                aciklama="Durum güncelle, kargo bilgisi gir, e-fatura yükle"
              />
              <Kart
                href={`/admin/${kapsam}/urunler`}
                ikon="fiyat"
                baslik="Ürünler"
                aciklama="Ürün ekle, fiyat ve stok güncelle"
              />
              <Kart
                href={`/admin/${kapsam}/blog`}
                ikon="yazar"
                baslik="Blog Yazıları"
                aciklama="Yazı ekle, düzenle, yayına al"
              />
              <Kart
                href={`/admin/${kapsam}/iadeler`}
                ikon="yenile"
                baslik="İade Talepleri"
                aciklama="Cayma hakkı talepleri"
                rozet={openReturns}
              />
            </>
          )}
          <Kart
            href={`/admin/${kapsam}/mesajlar`}
            ikon="eposta"
            baslik="İletişim Mesajları"
            aciklama="Siteden gelen mesajlar"
            rozet={unreadMessages}
          />
          <Kart
            href={`/admin/${kapsam}/bayi-basvurulari`}
            ikon="garanti"
            baslik="Bayi Başvuruları"
            aciklama="Gelen bayilik talepleri"
            rozet={newApplications}
          />
        </div>
      </section>
    </div>
  )
}

function Kutu({
  etiket,
  deger,
  href,
  vurgu,
}: {
  etiket: string
  deger: number
  href: string
  vurgu?: string
}) {
  return (
    <Link href={href} className="bg-white rounded-2xl shadow-sm p-5 block hover:shadow-md transition-shadow">
      <p className="text-xs text-gray-400 uppercase tracking-wide">{etiket}</p>
      <p className={`text-2xl font-black mt-1 ${vurgu ?? 'text-gray-900'}`}>{deger}</p>
    </Link>
  )
}

function Kart({
  href,
  ikon,
  baslik,
  aciklama,
  rozet,
}: {
  href: string
  ikon: IconName
  baslik: string
  aciklama: string
  rozet?: number
}) {
  return (
    <Link
      href={href}
      className="block bg-white rounded-2xl shadow-sm p-6 hover-lift border border-gray-100"
    >
      <div className="mb-3 icon-pop">
        <Icon name={ikon} className="w-8 h-8 text-gray-700" />
      </div>
      <h3 className="text-base font-bold text-gray-900">
        {baslik}
        {rozet !== undefined && rozet > 0 && (
          <span className="ml-2 text-[11px] font-bold bg-red-500 text-white px-2 py-0.5 rounded-full align-middle">
            {rozet}
          </span>
        )}
      </h3>
      <p className="text-sm text-gray-400 mt-1">{aciklama}</p>
    </Link>
  )
}
