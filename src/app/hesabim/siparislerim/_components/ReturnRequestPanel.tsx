'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { createReturnRequest } from '@/app/actions/returns'

interface OrderItemLite {
  id: string
  name: string
  quantity: number
  unit: string
}

interface Props {
  orderId: string
  items: OrderItemLite[]
  remainingDays: number
  /** Açık veya sonuçlanmış talep varsa formu değil durumu göster */
  existing: { status: string; adminNote: string | null } | null
}

const STATUS_TEXT: Record<string, { title: string; body: string; tone: string }> = {
  PENDING: {
    title: 'İade talebiniz değerlendiriliyor',
    body: 'Talebinizi aldık. Sonucu e-posta ile bildireceğiz. Ürünü henüz göndermeyin.',
    tone: 'bg-amber-50 border-amber-200 text-amber-800',
  },
  APPROVED: {
    title: 'İade talebiniz onaylandı',
    body: 'Ürünü tarafımıza gönderebilirsiniz. Ürün elimize ulaşıp kontrol edildikten sonra ödemeniz iade edilecek.',
    tone: 'bg-green-50 border-green-200 text-green-800',
  },
  REJECTED: {
    title: 'İade talebiniz karşılanamadı',
    body: 'Talebiniz değerlendirildi ancak karşılanamadı.',
    tone: 'bg-red-50 border-red-200 text-red-700',
  },
  COMPLETED: {
    title: 'İade tamamlandı',
    body: 'Ödemeniz iade edildi. Kartınıza yansıması bankanıza bağlı olarak 1-7 iş günü sürebilir.',
    tone: 'bg-gray-50 border-gray-200 text-gray-700',
  },
}

/**
 * Cayma hakkı (iade) talebi.
 *
 * Müşterinin ödeme adımında onayladığı sözleşme metni tam olarak bu ekranı
 * tarif ediyordu; önceden buton devre dışıydı ve "yakında" yazıyordu.
 */
export default function ReturnRequestPanel({
  orderId,
  items,
  remainingDays,
  existing,
}: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<string[]>(items.map((i) => i.id))
  const [reason, setReason] = useState('')
  const [isPending, startTransition] = useTransition()

  if (existing) {
    const info = STATUS_TEXT[existing.status] ?? STATUS_TEXT.PENDING
    return (
      <div className={`rounded-2xl border p-4 sm:p-5 ${info.tone}`}>
        <p className="font-bold text-sm">{info.title}</p>
        <p className="text-sm mt-1 leading-relaxed">{info.body}</p>
        {existing.adminNote && (
          <p className="text-sm mt-2 leading-relaxed">
            <span className="font-semibold">Açıklama:</span> {existing.adminNote}
          </p>
        )}
      </div>
    )
  }

  if (remainingDays === 0) return null

  const toggle = (id: string) => {
    setSelected((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    )
  }

  const submit = () => {
    startTransition(async () => {
      const result = await createReturnRequest(orderId, reason, selected)
      if (result.ok) {
        toast.success(result.message)
        setOpen(false)
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  if (!open) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-bold text-sm text-gray-900">İade / cayma hakkı</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Bu sipariş için {remainingDays} gününüz kaldı.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="btn-press text-sm px-4 py-2 rounded-lg bg-gray-900 text-white font-semibold hover:bg-gray-700 transition-colors"
          >
            İade Talebi Oluştur
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5 space-y-4">
      <div>
        <p className="font-bold text-sm text-gray-900">İade Talebi</p>
        <p className="text-xs text-gray-500 mt-0.5">
          Teslim tarihinden itibaren {remainingDays} gününüz kaldı. Ürünü onay
          gelmeden göndermeyin.
        </p>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-xs font-semibold text-gray-700 mb-1">
          İade edilecek ürünler
        </legend>
        {items.map((item) => (
          <label
            key={item.id}
            htmlFor={`iade-urun-${item.id}`}
            className="flex items-start gap-2.5 text-sm text-gray-700 cursor-pointer"
          >
            <input
              id={`iade-urun-${item.id}`}
              type="checkbox"
              checked={selected.includes(item.id)}
              onChange={() => toggle(item.id)}
              className="mt-0.5 w-4 h-4 rounded border-gray-300"
            />
            <span>
              {item.name}
              <span className="text-gray-400">
                {' '}
                — {item.quantity} {item.unit}
              </span>
            </span>
          </label>
        ))}
      </fieldset>

      <div>
        <label htmlFor="iade-sebep" className="block text-xs font-semibold text-gray-700 mb-1">
          İade sebebi
        </label>
        <textarea
          id="iade-sebep"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          maxLength={2000}
          placeholder="Ürünle ilgili yaşadığınız durumu kısaca yazın."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
        />
        <p className="text-[11px] text-gray-400 mt-1">
          Süreci hızlandırmak için en az 10 karakterlik kısa bir açıklama istiyoruz.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 justify-end">
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={isPending}
          className="text-sm px-4 py-2 rounded-lg border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 disabled:opacity-50"
        >
          Vazgeç
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={isPending || selected.length === 0 || reason.trim().length < 10}
          className="btn-press text-sm px-4 py-2 rounded-lg bg-gray-900 text-white font-semibold hover:bg-gray-700 disabled:opacity-40 transition-colors"
        >
          {isPending ? 'Gönderiliyor…' : 'Talebi Gönder'}
        </button>
      </div>
    </div>
  )
}
