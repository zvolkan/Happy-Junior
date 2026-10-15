import { notFound } from 'next/navigation'
import { getReturnRequests } from '@/app/actions/returns'
import ReturnRow from '@/components/admin/ReturnRow'
import Icon from '@/components/ui/Icon'
import { KAPSAM, kapsamAdi, markaMi } from '@/lib/admin-kapsam'

export const dynamic = 'force-dynamic'

function formatPrice(value: unknown): string {
  return Number(value).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

interface RequestItem {
  orderItemId?: string
  quantity?: number
}

export default async function KapsamIadelerPage() {
  const kapsam = KAPSAM
  // İade her zaman bir siparişe, sipariş de bir markaya bağlı.

  const requests = await getReturnRequests(false, kapsam)

  const open = requests.filter(
    (r: { status: string }) => r.status === 'PENDING' || r.status === 'APPROVED',
  )
  const closed = requests.filter(
    (r: { status: string }) => r.status === 'REJECTED' || r.status === 'COMPLETED',
  )

  const toRow = (request: {
    id: string
    status: string
    reason: string
    adminNote: string | null
    createdAt: Date
    items: unknown
    order: {
      id: string
      totalAmount: unknown
      shipFullName: string | null
      shipPhone: string | null
      brand: { name: string }
      items: Array<{ id: string; quantity: number; product: { name: string; unit: string } }>
    }
    user: { email: string; name: string | null }
  }) => {
    const selected = Array.isArray(request.items) ? (request.items as RequestItem[]) : []
    const ids = new Set(selected.map((i) => i.orderItemId).filter(Boolean))
    const matched = request.order.items.filter((i) => ids.has(i.id))
    const source = matched.length > 0 ? matched : request.order.items

    return (
      <ReturnRow
        key={request.id}
        kapsam={kapsam}
        id={request.id}
        orderId={request.order.id}
        status={request.status}
        reason={request.reason}
        adminNote={request.adminNote}
        createdAt={formatDate(request.createdAt)}
        customerName={request.order.shipFullName ?? request.user.name ?? 'Müşteri'}
        customerEmail={request.user.email}
        customerPhone={request.order.shipPhone ?? ''}
        brandName={request.order.brand.name}
        totalAmount={formatPrice(request.order.totalAmount)}
        itemNames={source.map((i) => `${i.product.name} × ${i.quantity} ${i.product.unit}`)}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">İade Talepleri</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {kapsamAdi(kapsam)} · müşterilerin cayma hakkı kapsamında açtığı talepler
        </p>
      </div>

      {requests.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
          <Icon name="yenile" className="w-9 h-9 mb-3 mx-auto text-gray-300" />
          <p className="text-gray-500">Henüz iade talebi yok.</p>
        </div>
      ) : (
        <>
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Açık talepler ({open.length})
            </h2>
            {open.length === 0 ? (
              <p className="text-sm text-gray-400 bg-white rounded-2xl shadow-sm p-6">
                Bekleyen talep yok.
              </p>
            ) : (
              open.map(toRow)
            )}
          </section>

          {closed.length > 0 && (
            <section className="space-y-4 pt-4">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Sonuçlanmış ({closed.length})
              </h2>
              {closed.map(toRow)}
            </section>
          )}
        </>
      )}
    </div>
  )
}
