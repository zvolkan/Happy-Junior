import type { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { formatOrderNo } from '@/lib/order-number'
import CancelOrderButton from '../_components/CancelOrderButton'
import { siparisIptalEdilebilir, iadeIsleniyorMu } from '@/lib/order-cancel'
import RepeatOrderButton from '../../_components/RepeatOrderButton'
import Icon, { type IconName } from '@/components/ui/Icon'
import type { BrandKey } from '@/lib/types'
import { carrierTrackingUrl } from '@/lib/carrier'
import { remainingReturnDays } from '@/lib/returns'
import ReturnRequestPanel from '../_components/ReturnRequestPanel'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Sipariş Detayı',
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: IconName }> = {
  PENDING:    { label: 'Beklemede',       color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: 'saat' },
  CONFIRMED:  { label: 'Onaylandı',       color: 'bg-blue-100 text-blue-700 border-blue-200',       icon: 'onay-daire' },
  PROCESSING: { label: 'Hazırlanıyor',    color: 'bg-purple-100 text-purple-700 border-purple-200', icon: 'belge' },
  SHIPPED:    { label: 'Kargoya Verildi', color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: 'kargo' },
  DELIVERED:  { label: 'Teslim Edildi',   color: 'bg-green-100 text-green-700 border-green-200',    icon: 'onay' },
  CANCELLED:  { label: 'İptal Edildi',    color: 'bg-red-100 text-red-700 border-red-200',           icon: 'kapat' },
  REFUNDED:   { label: 'İade Edildi',     color: 'bg-gray-100 text-gray-700 border-gray-200',        icon: 'yenile' },
}

const PAYMENT_LABELS: Record<string, string> = {
  credit_card:      'Kredi / Banka Kartı',
  bank_transfer:    'Havale / EFT',
  cash_on_delivery: 'Kapıda Ödeme',
  iyzico:           'Kredi / Banka Kartı (İyzico)',
}

function formatPrice(value: unknown): string {
  return Number(value).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date(date))
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function SiparisDetayPage({ params }: Props) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/giris')

  const order = await prisma.order.findFirst({
    where: { id, userId: authUser.id },
    include: {
      brand: { select: { name: true, key: true } },
      address: true,
      returnRequests: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { status: true, adminNote: true },
      },
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              unit: true,
              images: {
                where: { isPrimary: true },
                take: 1,
                select: { url: true },
              },
            },
          },
        },
      },
    },
  })

  if (!order) notFound()

  const status = STATUS_MAP[order.status] ?? { label: order.status, color: 'bg-gray-100 text-gray-700 border-gray-200', icon: 'uyari' as IconName }
  // Karar `src/lib/order-cancel.ts`'te — liste sayfası ve `cancelOrder` da
  // aynı fonksiyonu kullanıyor.
  const cancellable = siparisIptalEdilebilir(order)
  const iadeIsleniyor = iadeIsleniyorMu(order.paymentStatus)
  const shipped = ['SHIPPED', 'DELIVERED'].includes(order.status)
  const delivered = order.status === 'DELIVERED'

  // Adres anlık kopyası: müşteri adresini silerse/düzenlerse geçmiş sipariş
  // bozulmasın diye sipariş anındaki bilgiler tercih edilir. `order.address`
  // yalnızca eski (snapshot'sız) siparişler için yedek.
  const addr = order.shipFullName
    ? {
        fullName: order.shipFullName,
        line1: order.shipLine1 ?? '',
        line2: order.shipLine2,
        district: order.shipDistrict ?? '',
        city: order.shipCity ?? '',
        postalCode: order.shipPostalCode,
        phone: order.shipPhone ?? '',
      }
    : order.address

  // Tutarlar siparişin kendi kayıtlarından okunur. Önceden burada kargo ücreti
  // ve limiti yeniden hesaplanıyordu; `order.totalAmount` (kargo DAHİL) ara
  // toplam sanıldığı için 500 TL sınırına yakın siparişlerde ödenen kargo
  // "Ücretsiz" görünüyordu. Ayrıca kargo ücreti ileride değişirse geçmiş
  // siparişlerin dökümü de değişirdi.
  const total = Number(order.totalAmount)
  const cargoFee = Number(order.shippingFee ?? 0)
  const subtotal = order.subtotal != null ? Number(order.subtotal) : total - cargoFee

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">

        {/* Top nav */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/hesabim/siparislerim"
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Tüm Siparişler
          </Link>
          <span className="text-xs text-gray-400 font-mono">#{formatOrderNo(order)}</span>
        </div>

        {/* Order summary header */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4">
          <div className="p-4 sm:p-5 border-b border-gray-100">
            <h1 className="text-base font-bold text-gray-900 mb-3">Sipariş Özeti</h1>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-400 text-xs mb-0.5">Sipariş No</p>
                <p className="font-semibold text-gray-900 font-mono text-xs">{formatOrderNo(order)}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-0.5">Sipariş Tarihi</p>
                <p className="font-semibold text-gray-900 text-xs">{formatDate(order.createdAt)}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-0.5">Paket Detayları</p>
                <p className="font-semibold text-gray-900 text-xs">{order.items.length} ürün</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-0.5">Durumu</p>
                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${status.color}`}>
                  <Icon name={status.icon} className="w-3.5 h-3.5" />{status.label}
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons row */}
          <div className="flex flex-wrap items-center gap-2 px-4 sm:px-5 py-3 bg-gray-50">
            <div className="flex flex-wrap gap-2 ml-auto">
              <RepeatOrderButton orderId={order.id} brandKey={order.brand.key as BrandKey} />
            </div>
          </div>
        </div>

        {/* Delivery status */}
        {(shipped || delivered) && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 mb-4">
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${delivered ? 'bg-green-100 text-green-600' : 'bg-indigo-100 text-indigo-600'} font-bold text-sm`}>
                <Icon name={delivered ? 'onay' : 'kargo'} className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm ${delivered ? 'text-green-700' : 'text-indigo-700'}`}>
                  {delivered ? 'Teslim Edildi' : 'Kargoya Verildi'}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {delivered
                    ? 'Siparişiniz teslim edilmiştir.'
                    : 'Siparişiniz kargoya verilmiştir.'}
                </p>

                {/* Takip bilgisi admin tarafından giriliyordu ama müşteriye
                    hiç gösterilmiyordu; müşteri satıcıya yazmak zorunda
                    kalıyordu. */}
                {order.carrier && order.trackingNumber && (
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                    <span className="text-gray-500">
                      {order.carrier} —{' '}
                      <span className="font-mono font-semibold text-gray-900">
                        {order.trackingNumber}
                      </span>
                    </span>
                    {carrierTrackingUrl(order.carrier, order.trackingNumber) ? (
                      <a
                        href={carrierTrackingUrl(order.carrier, order.trackingNumber)!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-indigo-600 hover:text-indigo-700"
                      >
                        Kargoyu takip et →
                      </a>
                    ) : (
                      <Link
                        href="/siparis-takibi"
                        className="font-semibold text-indigo-600 hover:text-indigo-700"
                      >
                        Sipariş takibi →
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* E-fatura — yüklendiğinde görünür.
            PDF e-postaya ek olarak gönderilmiyor: fatura ad, adres ve
            TCKN/VKN taşıyor ve e-posta şifresiz bir kanal. İndirme burada,
            kimlik doğrulandıktan sonra yapılıyor. */}
        {order.invoiceFilePath && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 mb-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <Icon name="belge" className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900">Faturanız hazır</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {order.invoiceNo ? `Fatura no: ${order.invoiceNo}` : 'E-arşiv fatura (PDF)'}
                </p>
              </div>
              <a
                href={`/api/fatura/${order.id}`}
                className="btn-press text-sm font-semibold px-4 py-2 rounded-xl bg-gray-900 text-white hover:bg-gray-700 transition-colors"
              >
                Faturayı İndir
              </a>
            </div>
          </div>
        )}

        {/* Cayma hakkı / iade */}
        {delivered && order.paymentStatus === 'paid' && (
          <div className="mb-4">
            <ReturnRequestPanel
              orderId={order.id}
              items={order.items.map((item) => ({
                id: item.id,
                name: item.product.name,
                quantity: item.quantity,
                unit: item.product.unit,
              }))}
              remainingDays={remainingReturnDays(order.deliveredAt)}
              existing={order.returnRequests[0] ?? null}
            />
          </div>
        )}

        {/* Products */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4">
          <div className="p-4 sm:p-5 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-900">Ürünler</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {order.items.map((item) => {
              const img = item.product.images[0]?.url
              return (
                <div key={item.id} className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-4">
                  {/* Product image */}
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden border border-gray-100">
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <Image
                        src={img}
                        alt={item.product.name}
                        width={64}
                        height={64}
                        // Boyut verilmesi ŞART: ham <img> yükleninceye kadar
                        // yer kaplamıyor ve görsel geldiğinde altındaki her şey
                        // aşağı kayıyordu (düzen kayması).
                        className="w-full h-full object-contain p-1"
                      />
                    ) : (
                      <Icon name="paket" className="w-6 h-6 text-gray-300" />
                    )}
                  </div>

                  {/* Product info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm leading-tight">{item.product.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {item.quantity} {item.product.unit} × {formatPrice(item.unitPrice)}
                    </p>
                  </div>

                  {/* Item total */}
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-gray-900 text-sm">{formatPrice(item.totalPrice)}</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Price summary */}
          <div className="px-4 sm:px-5 py-4 bg-gray-50 border-t border-gray-100 space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Ara Toplam</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Kargo</span>
              <span className={cargoFee === 0 ? 'text-green-600 font-medium' : ''}>
                {cargoFee === 0 ? 'Ücretsiz' : formatPrice(cargoFee)}
              </span>
            </div>
            {order.taxAmount != null && Number(order.taxAmount) > 0 && (
              <div className="flex justify-between text-sm text-gray-500">
                <span>Bunun KDV&apos;si</span>
                <span>{formatPrice(order.taxAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-200">
              <span>Toplam (KDV dahil)</span>
              <span>{formatPrice(order.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Bottom info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {/* Shipping address */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Teslimat Adresi</h3>
            {addr ? (
              <div className="text-sm text-gray-700 space-y-0.5">
                <p className="font-semibold">{addr.fullName}</p>
                <p>{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}</p>
                <p>{addr.district} / {addr.city}</p>
                {addr.postalCode && <p className="text-gray-400">{addr.postalCode}</p>}
                <p className="text-gray-500">{addr.phone}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-400">Adres bilgisi bulunamadı.</p>
            )}
          </div>

          {/* Payment info */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Ödeme Bilgileri</h3>
            <div className="text-sm text-gray-700 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Ödeme Yöntemi</span>
                <span className="font-medium">
                  {PAYMENT_LABELS[order.paymentMethod ?? ''] ?? order.paymentMethod ?? '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Ödeme Durumu</span>
                <span className={`font-medium ${order.paymentStatus === 'paid' ? 'text-green-600' : 'text-gray-700'}`}>
                  {order.paymentStatus === 'paid'    ? 'Ödendi'
                    : order.paymentStatus === 'failed' ? 'Başarısız'
                    : order.paymentStatus === 'refunded' ? 'İade Edildi'
                    : 'Bekliyor'}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-gray-100 font-bold">
                <span>Toplam</span>
                <span>{formatPrice(order.totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* İptal / iade işleniyor — düğme yerine durum açıklaması */}
        {iadeIsleniyor && (
          <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <span className="mt-1.5 w-2 h-2 rounded-full bg-amber-500 animate-pulse flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-900">İptal talebiniz işleniyor</p>
                <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                  Ödeme sağlayıcısından iade onayı bekleniyor. İşlem sonuçlandığında
                  sipariş durumunuz otomatik güncellenecek ve size e-posta göndereceğiz.
                  Tekrar iptal etmeye çalışmanıza gerek yok.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Cancel order */}
        {cancellable && (
          <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">Siparişi İptal Et</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Sipariş henüz hazırlanmaya başlanmadı. İptal edebilirsiniz.
                </p>
              </div>
              <CancelOrderButton orderId={order.id} isPaid={order.paymentStatus === 'paid'} />
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
