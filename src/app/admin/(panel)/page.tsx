import Link from 'next/link'
import { getOrderCountsByStatus, getUnreadMessageCount } from '@/app/actions/admin-orders'
import { getOpenReturnCount } from '@/app/actions/returns'
import { prisma } from '@/lib/db'
import Icon, { type IconName } from '@/components/ui/Icon'
import { KAPSAM } from '@/lib/admin-kapsam'

export const dynamic = 'force-dynamic'

export default async function PanelOzetPage() {
  const [counts, unreadMessages, lowStock, openReturns] = await Promise.all([
    getOrderCountsByStatus(KAPSAM),
    getUnreadMessageCount(KAPSAM),
    prisma.product
      .count({ where: { isActive: true, stockQuantity: { lte: 5 } } })
      .catch(() => 0),
    getOpenReturnCount(KAPSAM).catch(() => 0),
  ])

  // Havale bekleyen siparişler: ödeme onayı yöneticiden bekleniyor.
  const odemeBekleyen = counts.PENDING ?? 0
  const activeOrders =
    (counts.CONFIRMED ?? 0) + (counts.PROCESSING ?? 0) + (counts.SHIPPED ?? 0)

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <Kutu
          etiket="Ödeme Bekleyen"
          deger={odemeBekleyen}
          href="/admin/siparisler?durum=PENDING"
          vurgu={odemeBekleyen > 0 ? 'text-amber-600' : undefined}
        />
        <Kutu etiket="Aktif Sipariş" deger={activeOrders} href="/admin/siparisler" />
        <Kutu etiket="Okunmamış Mesaj" deger={unreadMessages} href="/admin/mesajlar" />
        <Kutu
          etiket="Stoğu Azalan"
          deger={lowStock}
          href="/admin/urunler"
          vurgu={lowStock > 0 ? 'text-orange-600' : undefined}
        />
        <Kutu
          etiket="Bekleyen İade"
          deger={openReturns}
          href="/admin/iadeler"
          vurgu={openReturns > 0 ? 'text-red-600' : undefined}
        />
      </div>

      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Bölümler</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Kart
            href="/admin/siparisler"
            ikon="paket"
            baslik="Siparişler"
            aciklama="Havale onayı, durum güncelleme, kargo bilgisi"
            rozet={odemeBekleyen}
          />
          <Kart
            href="/admin/urunler"
            ikon="fiyat"
            baslik="Ürünler"
            aciklama="Ürün ekle, fiyat, beden ve stok güncelle"
          />
          <Kart
            href="/admin/iadeler"
            ikon="yenile"
            baslik="İade Talepleri"
            aciklama="Cayma hakkı ve beden değişimi talepleri"
            rozet={openReturns}
          />
          <Kart
            href="/admin/mesajlar"
            ikon="eposta"
            baslik="İletişim Mesajları"
            aciklama="Siteden gelen mesajlar"
            rozet={unreadMessages}
          />
          <Kart href="/admin/blog" ikon="yazar" baslik="Blog Yazıları" aciklama="Yazı ekle, düzenle, yayına al" />
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
