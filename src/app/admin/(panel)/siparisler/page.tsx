import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getOrdersForAdmin, getOrderCountsByStatus } from '@/app/actions/admin-orders'
import { formatOrderNo } from '@/lib/order-number'
import Icon from '@/components/ui/Icon'
import { KAPSAM, kapsamAdi, markaMi } from '@/lib/admin-kapsam'
import { iadeIsleniyorMu, odemeDurumAdi, IADE_INCELEME_FILTRESI } from '@/lib/order-cancel'

export const dynamic = 'force-dynamic'

const STATUS_META: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Ödeme Bekliyor', color: 'bg-yellow-100 text-yellow-700' },
  CONFIRMED: { label: 'Onaylandı', color: 'bg-blue-100 text-blue-700' },
  PROCESSING: { label: 'Hazırlanıyor', color: 'bg-purple-100 text-purple-700' },
  SHIPPED: { label: 'Kargoya Verildi', color: 'bg-indigo-100 text-indigo-700' },
  DELIVERED: { label: 'Teslim Edildi', color: 'bg-green-100 text-green-700' },
  CANCELLED: { label: 'İptal', color: 'bg-red-100 text-red-700' },
  REFUNDED: { label: 'İade', color: 'bg-gray-100 text-gray-700' },
}

const FILTERS = [
  { value: '', label: 'Tümü' },
  { value: 'CONFIRMED', label: 'Onaylandı' },
  { value: 'PROCESSING', label: 'Hazırlanıyor' },
  { value: 'SHIPPED', label: 'Kargoya Verildi' },
  { value: 'DELIVERED', label: 'Teslim Edildi' },
  { value: 'PENDING', label: 'Ödeme Bekliyor' },
  { value: 'CANCELLED', label: 'İptal' },
  { value: 'REFUNDED', label: 'İade' },
  // Sipariş durumu değil, ödeme durumu filtresi — bkz. IADE_INCELEME_FILTRESI.
  { value: IADE_INCELEME_FILTRESI, label: 'İade incelemesi' },
]

function formatPrice(value: unknown) {
  return Number(value).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export default async function KapsamSiparislerPage({
  searchParams,
}: {
  searchParams: Promise<{ durum?: string; ara?: string; sayfa?: string }>
}) {
  const sp = await searchParams
  const kapsam = KAPSAM
  // Sipariş her zaman bir markaya ait; "belirtilmemiş" kapsamında sipariş olmaz.

  const page = Number(sp.sayfa) || 1

  const [{ orders, total, pageCount }, counts] = await Promise.all([
    getOrdersForAdmin({ status: sp.durum, search: sp.ara, page, brandKey: kapsam }),
    getOrderCountsByStatus(kapsam),
  ])

  const buildHref = (overrides: Record<string, string | undefined>) => {
    const qs = new URLSearchParams()
    const merged = { durum: sp.durum, ara: sp.ara, sayfa: undefined, ...overrides }
    for (const [key, value] of Object.entries(merged)) {
      if (value) qs.set(key, value)
    }
    const q = qs.toString()
    return `/admin/siparisler${q ? `?${q}` : ''}`
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Siparişler</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {kapsamAdi(kapsam)} · {total} sipariş
        </p>
      </div>

      {/* ── İade incelemesi uyarısı ─────────────────────────────────────────────
          Bu siparişlerin `status`'u hâlâ CONFIRMED; listede diğerlerinden hiçbir
          şekilde ayrılmıyorlardı. Oysa müşterinin parası askıda olan tek grup
          bunlar ve gecikmenin bedeli doğrudan müşteriye yansıyor. */}
      {(counts[IADE_INCELEME_FILTRESI] ?? 0) > 0 && (
        <Link
          href={buildHref({ durum: IADE_INCELEME_FILTRESI })}
          className="block bg-amber-50 border-2 border-amber-300 rounded-2xl px-5 py-4 hover:bg-amber-100 transition-colors"
        >
          <p className="text-sm font-bold text-amber-900">
            {counts[IADE_INCELEME_FILTRESI]} sipariş iade incelemesi bekliyor
          </p>
          <p className="text-xs text-amber-800 mt-1 leading-relaxed">
            Bu siparişlerde iyzico&apos;ya iade/iptal isteği gönderildi ama sonuç
            öğrenilemedi. Para iade edilmiş olabilir; iyzico panelinden kontrol
            edilmesi gerekiyor. Görmek için tıklayın.
          </p>
        </Link>
      )}

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((filter) => {
          const isActive = (sp.durum ?? '') === filter.value
          const count = filter.value ? (counts[filter.value] ?? 0) : total
          return (
            <Link
              key={filter.value || 'all'}
              href={buildHref({ durum: filter.value || undefined })}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
                isActive
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
            >
              {filter.label}
              <span className={`ml-1.5 ${isActive ? 'text-white/60' : 'text-gray-400'}`}>
                {count}
              </span>
            </Link>
          )
        })}
      </div>

      <form className="flex gap-2" action={`/admin/siparisler`}>
        {sp.durum && <input type="hidden" name="durum" value={sp.durum} />}
        <label htmlFor="siparis-ara" className="sr-only">
          Siparişlerde ara
        </label>
        <input
          id="siparis-ara"
          name="ara"
          defaultValue={sp.ara ?? ''}
          placeholder="Sipariş no, müşteri adı, e-posta veya takip no"
          className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
        />
        <button
          type="submit"
          className="btn-press px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-700"
        >
          Ara
        </button>
      </form>

      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-16 text-center">
          <Icon name="paket" className="w-9 h-9 mb-3 mx-auto text-gray-300" />
          <p className="text-gray-500">Bu filtreye uyan sipariş yok.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left font-semibold px-4 py-3">Sipariş</th>
                  <th className="text-left font-semibold px-4 py-3">Müşteri</th>
                  <th className="text-right font-semibold px-4 py-3">Tutar</th>
                  <th className="text-left font-semibold px-4 py-3">Durum</th>
                  <th className="text-left font-semibold px-4 py-3">Fatura</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => {
                  const meta = STATUS_META[order.status] ?? {
                    label: order.status,
                    color: 'bg-gray-100 text-gray-700',
                  }
                  return (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-mono text-xs text-gray-900">{formatOrderNo(order)}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {formatDate(order.createdAt)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">
                          {order.shipFullName ?? order.user.name ?? '—'}
                        </p>
                        <p className="text-xs text-gray-400">{order.user.email}</p>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">
                        {formatPrice(order.totalAmount)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block text-[11px] font-bold px-2 py-1 rounded-full ${meta.color}`}
                        >
                          {meta.label}
                        </span>
                        {iadeIsleniyorMu(order.paymentStatus) && (
                          <p className="text-[11px] font-bold text-amber-700 mt-1">
                            {odemeDurumAdi(order.paymentStatus)}
                          </p>
                        )}
                        {order.trackingNumber && (
                          <p className="text-[11px] text-gray-400 mt-1 font-mono">
                            {order.trackingNumber}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {order.invoiceFilePath ? (
                          <span className="inline-block text-[11px] font-bold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
                            Yüklendi
                          </span>
                        ) : (
                          <span className="text-[11px] text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/siparisler/${order.id}`}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                        >
                          Detay →
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p className="sm:hidden px-4 py-2.5 text-[11px] text-gray-400 border-t border-gray-100">
            Tüm sütunları görmek için tabloyu yana kaydırın →
          </p>
        </div>
      )}

      {pageCount > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={buildHref({ sayfa: String(page - 1) })}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:border-gray-400"
            >
              ← Önceki
            </Link>
          )}
          <span className="text-sm text-gray-500 px-3">
            Sayfa {page} / {pageCount}
          </span>
          {page < pageCount && (
            <Link
              href={buildHref({ sayfa: String(page + 1) })}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:border-gray-400"
            >
              Sonraki →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
