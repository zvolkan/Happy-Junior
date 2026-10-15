import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { formatOrderNo } from '@/lib/order-number'
import { cancelStalePendingOrders } from '@/lib/stale-orders'
import { signOut } from '@/app/actions/auth'
import CancelOrderButton from './_components/CancelOrderButton'
import { siparisIptalEdilebilir, iadeIsleniyorMu } from '@/lib/order-cancel'
import RepeatOrderButton from '../_components/RepeatOrderButton'
import Icon, { type IconName } from '@/components/ui/Icon'
import BrandLogo from '@/components/ui/BrandLogo'
import type { BrandKey } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Siparişlerim',
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING:    { label: 'Beklemede',       color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  CONFIRMED:  { label: 'Onaylandı',       color: 'bg-blue-100 text-blue-700 border-blue-200' },
  PROCESSING: { label: 'Hazırlanıyor',    color: 'bg-purple-100 text-purple-700 border-purple-200' },
  SHIPPED:    { label: 'Kargoya Verildi', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  DELIVERED:  { label: 'Teslim Edildi',   color: 'bg-green-100 text-green-700 border-green-200' },
  CANCELLED:  { label: 'İptal Edildi',    color: 'bg-red-100 text-red-700 border-red-200' },
  REFUNDED:   { label: 'İade Edildi',     color: 'bg-gray-100 text-gray-700 border-gray-200' },
}

function formatPrice(value: unknown): string {
  return Number(value).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date(date))
}

export default async function SiparislerimPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/giris')

  // Ödemesi yarım kalmış eski siparişleri temizle — listede sonsuza kadar
  // "Beklemede" olarak birikmesinler
  await cancelStalePendingOrders(authUser.id)

  const dbUser = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { name: true },
  })

  const orders = await prisma.order.findMany({
    where: { userId: authUser.id },
    include: {
      brand: { select: { name: true, key: true } },
      address: {
        select: { fullName: true, line1: true, district: true, city: true },
      },
      items: {
        include: {
          product: { select: { name: true, unit: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const userName = dbUser?.name ?? authUser.email ?? ''
  const initials = userName
    .split(' ')
    .map((w: string) => w[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const sidebarLinks: { href: string; label: string; icon: IconName }[] = [
    { href: '/hesabim',              label: 'Hesabım',      icon: 'kullanici' },
    { href: '/hesabim/siparislerim', label: 'Siparişlerim', icon: 'paket' },
    { href: '/hesabim/adreslerim',   label: 'Adreslerim',   icon: 'konum' },
    { href: '/hesabim/favorilerim',  label: 'Favorilerim',  icon: 'favori' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">

        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-6 flex items-center gap-1.5 flex-wrap">
          <Link href="/" className="hover:text-gray-900">Ana Sayfa</Link>
          <span>/</span>
          <Link href="/hesabim" className="hover:text-gray-900">Hesabım</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">Siparişlerim</span>
        </nav>

        <div className="flex flex-col md:flex-row gap-6">

          {/* Sidebar */}
          <aside className="w-full md:w-56 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-5 bg-gray-900">
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-white text-lg font-bold mb-2">
                  {initials || '?'}
                </div>
                <p className="text-white font-semibold text-sm truncate">{dbUser?.name ?? '—'}</p>
                <p className="text-white/60 text-xs truncate">{authUser.email}</p>
              </div>
              <nav className="p-2">
                {sidebarLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      link.href === '/hesabim/siparislerim'
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon name={link.icon} className="w-5 h-5" />
                    {link.label}
                  </Link>
                ))}
                <form action={signOut}>
                  <button
                    type="submit"
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors mt-1"
                  >
                    <Icon name="cikis" className="w-5 h-5" />
                    Çıkış Yap
                  </button>
                </form>
              </nav>
            </div>
          </aside>

          {/* Orders */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Siparişlerim</h1>
              <span className="text-sm text-gray-500">{orders.length} sipariş</span>
            </div>

            {orders.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                <Icon name="paket" className="w-9 h-9 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 text-sm mb-4">Henüz siparişiniz bulunmuyor.</p>
                <Link
                  href="/"
                  className="inline-block px-6 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold transition-colors"
                >
                  Alışverişe Başla
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => {
                  const status = STATUS_MAP[order.status] ?? { label: order.status, color: 'bg-gray-100 text-gray-700 border-gray-200' }
                  const dotColor = 'bg-brand-400'
                  // Karar `src/lib/order-cancel.ts`'te; sunucu aksiyonu da aynı
                  // fonksiyonu kullanıyor. Burada ayrı bir kopya vardı ve
                  // yalnızca `status`'a bakıyordu: iadesi sürmekte olan
                  // siparişte düğme duruyordu.
                  const cancellable = siparisIptalEdilebilir(order)
                  const iadeIsleniyor = iadeIsleniyorMu(order.paymentStatus)
                  const shipped = ['SHIPPED', 'DELIVERED'].includes(order.status)

                  return (
                    <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

                      {/* Header row */}
                      <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 py-4 border-b border-gray-100">
                        <div className="flex items-center gap-2 min-w-0">
                          <BrandLogo boyut="xs" ikonSinifi="text-gray-500" />
                          <div className="min-w-0">
                            <span className="text-xs font-mono text-gray-400">#{formatOrderNo(order)}</span>
                            <span className="text-gray-300 mx-1.5">·</span>
                            <span className="text-xs text-gray-500">{formatDate(order.createdAt)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${status.color}`}>
                            {status.label}
                          </span>
                          <span className="font-bold text-gray-900 text-sm">{formatPrice(order.totalAmount)}</span>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="px-4 sm:px-5 py-4 space-y-1.5">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex items-center gap-2 text-sm text-gray-600">
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColor}`} />
                            <span className="flex-1 truncate">{item.product.name}</span>
                            <span className="text-gray-400 flex-shrink-0 text-xs whitespace-nowrap">
                              {item.quantity} {item.product.unit}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Footer actions */}
                      <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 py-3 bg-gray-50 border-t border-gray-100">
                        {/* Left actions */}
                        <div className="flex flex-wrap gap-2 items-center">
                          {cancellable && (
                            <CancelOrderButton orderId={order.id} isPaid={order.paymentStatus === 'paid'} />
                          )}
                          {/* Düğmenin kaybolması tek başına hiçbir şey
                              anlatmıyor. İadesi işlenen siparişte müşteri ne
                              olduğunu görmeli, yoksa tekrar denemeye çalışıyor. */}
                          {iadeIsleniyor && (
                            <span className="inline-flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              İptal / iade işleniyor
                            </span>
                          )}
                          {/* Takip numarası girilmemişse buton takip
                              bilgisi olmayan bir sayfaya götürüyordu. */}
                          {shipped && order.trackingNumber && (
                            <Link
                              href={`/hesabim/siparislerim/${order.id}`}
                              className="text-xs px-3 py-1.5 rounded-lg border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-colors font-medium"
                            >
                              Kargo Takip
                            </Link>
                          )}
                          <RepeatOrderButton
                            orderId={order.id}
                            brandKey={order.brand.key as BrandKey}
                          />
                        </div>

                        {/* Right: details */}
                        <Link
                          href={`/hesabim/siparislerim/${order.id}`}
                          className="text-xs px-4 py-2 rounded-lg bg-gray-900 hover:bg-gray-700 text-white font-semibold transition-colors flex-shrink-0"
                        >
                          Detaylar →
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
