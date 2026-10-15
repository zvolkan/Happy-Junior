import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { formatOrderNo } from '@/lib/order-number'
import { signOut } from '@/app/actions/auth'
import Icon from '@/components/ui/Icon'
import BrandLogo from '@/components/ui/BrandLogo'
import ProfileForm from './_components/ProfileForm'
import RepeatOrderButton from './_components/RepeatOrderButton'

export const metadata: Metadata = {
  title: 'Hesabım',
}

const ORDER_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING:    { label: 'Beklemede',       color: 'bg-yellow-100 text-yellow-700' },
  CONFIRMED:  { label: 'Onaylandı',       color: 'bg-blue-100 text-blue-700' },
  PROCESSING: { label: 'Hazırlanıyor',    color: 'bg-purple-100 text-purple-700' },
  SHIPPED:    { label: 'Kargoya Verildi', color: 'bg-indigo-100 text-indigo-700' },
  DELIVERED:  { label: 'Teslim Edildi',   color: 'bg-green-100 text-green-700' },
  CANCELLED:  { label: 'İptal Edildi',    color: 'bg-red-100 text-red-700' },
  REFUNDED:   { label: 'İade Edildi',     color: 'bg-gray-100 text-gray-700' },
}

function formatPrice(value: unknown): string {
  return Number(value).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date(date))
}

export default async function HesabimPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/giris')

  // DB'deki profil + siparişler
  let dbUser = await prisma.user.findUnique({
    where: { id: authUser.id },
    include: {
      addresses: { orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }] },
      orders: {
        include: {
          brand: { select: { name: true, key: true } },
          items: {
            include: {
              product: {
                select: {
                  name: true, unit: true,
                  images: { where: { isPrimary: true }, take: 1, select: { url: true } },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  })

  // İlk girişte DB kaydı henüz yoksa oluştur
  if (!dbUser) {
    dbUser = await prisma.user.upsert({
      where: { id: authUser.id },
      update: {},
      create: {
        id: authUser.id,
        email: authUser.email!,
        name: authUser.user_metadata?.full_name ?? null,
      },
      include: {
        addresses: true,
        orders: { include: { brand: { select: { name: true, key: true } }, items: { include: { product: { select: { name: true, unit: true, images: { where: { isPrimary: true }, take: 1, select: { url: true } } } } } } }, orderBy: { createdAt: 'desc' }, take: 20 },
      },
    })
  }

  const user = dbUser!
  const orders = user.orders

  return (
    <main className="min-h-screen bg-gray-50 py-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">

        {/* Başlık */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Merhaba{user.name ? `, ${user.name.split(' ')[0]}` : ''}!
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">{authUser.email}</p>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="text-sm text-gray-500 hover:text-gray-900 border border-gray-300 px-4 py-2 rounded-xl transition-colors"
            >
              Çıkış Yap
            </button>
          </form>
        </div>

        {/* Özet kartlar */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {[
            { label: 'Sipariş',       value: orders.length,         icon: 'paket' as const },
            { label: 'Kayıtlı Adres', value: user.addresses.length, icon: 'konum' as const },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl border border-gray-200 p-5 text-center">
              <Icon name={stat.icon} className="w-6 h-6 mx-auto mb-1 text-gray-400" />
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* `grid` tek başına örtük sütunu max-content genişliğinde
            tutuyor; 320px ekranda kartlar 334px’e çıkıp sayfayı yatayda
            taşırıyordu. Mobil sütun sayısı ve min-w-0 açıkça verildi. */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* SOL — Profil + Adresler */}
          <div className="min-w-0 space-y-5">
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Profil Bilgileri</h2>
              <ProfileForm name={user.name} phone={user.phone} email={authUser.email!} />
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Kayıtlı Adresler</h2>
              {user.addresses.length === 0 ? (
                <p className="text-gray-400 text-sm">Henüz kayıtlı adres yok.</p>
              ) : (
                <div className="space-y-3">
                  {user.addresses.map((addr) => (
                    <div key={addr.id} className="p-3 rounded-xl border border-gray-100 bg-gray-50 text-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-800">{addr.label}</span>
                        {addr.isDefault && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Varsayılan</span>
                        )}
                      </div>
                      <p className="text-gray-600">{addr.fullName}</p>
                      <p className="text-gray-500">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}</p>
                      <p className="text-gray-500">{addr.district} / {addr.city}</p>
                      <div className="flex gap-2 mt-2 pt-2 border-t border-gray-200">
                        <Link
                          href={`/hesabim/adres-duzenle/${addr.id}`}
                          className="text-xs text-gray-600 hover:text-gray-900 font-medium border border-gray-300 rounded-lg px-3 py-1.5 transition-colors"
                        >
                          Düzenle
                        </Link>
                        {/* Silme onay adımı yoktu: tek dokunuşla adres
                            gidiyordu. /hesabim/adreslerim'deki iki adımlı
                            akışa yönlendiriliyor. */}
                        <Link
                          href="/hesabim/adreslerim"
                          className="text-xs text-gray-600 hover:text-gray-900 font-medium border border-gray-300 rounded-lg px-3 py-1.5 transition-colors"
                        >
                          Sil / Yönet
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Link
                href="/hesabim/adres-ekle"
                className="mt-4 inline-block text-sm text-gray-600 hover:text-gray-900 font-medium border border-gray-300 rounded-xl px-4 py-2 transition-colors"
              >
                + Adres Ekle
              </Link>
            </div>
          </div>

          {/* SAĞ — Siparişler */}
          <div className="lg:col-span-2 min-w-0 space-y-6">

            {/* Siparişler */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <BrandLogo boyut="sm" kutuSinifi="bg-brand-600 rounded-lg" />
                  <h2 className="font-semibold text-gray-900">Siparişlerim</h2>
                </div>
                <Link href="/urunler" className="text-xs text-brand-600 font-semibold hover:underline">
                  Yeni Sipariş →
                </Link>
              </div>

              {orders.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-400 text-sm mb-3">Henüz sipariş vermediniz.</p>
                  <Link
                    href="/urunler"
                    className="inline-block px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold transition-colors"
                  >
                    Ürünleri İncele
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {orders.map((order) => {
                    const status = ORDER_STATUS_LABELS[order.status] ?? { label: order.status, color: 'bg-gray-100 text-gray-700' }
                    return (
                      <div key={order.id} className="p-5">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div>
                            <p className="text-xs text-gray-400 font-mono mb-0.5">#{formatOrderNo(order)}</p>
                            <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${status.color}`}>
                              {status.label}
                            </span>
                            <span className="text-sm font-bold text-gray-900">{formatPrice(order.totalAmount)}</span>
                          </div>
                        </div>

                        <div className="space-y-1.5 mb-4">
                          {order.items.map((item) => (
                            <div key={item.id} className="flex items-center gap-2 text-sm text-gray-600">
                              <span className="w-1.5 h-1.5 rounded-full bg-brand-400 flex-shrink-0" />
                              <span className="flex-1 truncate">{item.product.name}</span>
                              <span className="text-gray-400 flex-shrink-0">{item.quantity} {item.product.unit}</span>
                            </div>
                          ))}
                        </div>

                        {/* "Aynı siparişi tekrarla" */}
                        <RepeatOrderButton orderId={order.id} brandKey="happy-junior" />
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
