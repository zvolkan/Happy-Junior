'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { decideReturnRequest } from '@/app/actions/returns'

interface Props {
  id: string
  orderId: string
  /** Sipariş detayı bağlantısının hangi marka panelinde kalacağı */
  kapsam: string
  status: string
  reason: string
  adminNote: string | null
  createdAt: string
  customerName: string
  customerEmail: string
  customerPhone: string
  brandName: string
  totalAmount: string
  itemNames: string[]
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  PENDING: { label: 'Bekliyor', className: 'bg-amber-100 text-amber-700' },
  APPROVED: { label: 'Onaylandı', className: 'bg-green-100 text-green-700' },
  REJECTED: { label: 'Reddedildi', className: 'bg-red-100 text-red-700' },
  COMPLETED: { label: 'Tamamlandı', className: 'bg-gray-100 text-gray-600' },
}

export default function ReturnRow(props: Props) {
  const router = useRouter()
  const [note, setNote] = useState('')
  const [isPending, startTransition] = useTransition()

  const badge = STATUS_BADGE[props.status] ?? STATUS_BADGE.PENDING
  const open = props.status === 'PENDING'

  const decide = (decision: 'APPROVED' | 'REJECTED') => {
    startTransition(async () => {
      const result = await decideReturnRequest(props.id, decision, note)
      if (result.ok) {
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${badge.className}`}>
              {badge.label}
            </span>
            <span className="text-xs text-gray-400">{props.createdAt}</span>
            <span className="text-xs text-gray-400">· {props.brandName}</span>
          </div>
          <p className="font-bold text-gray-900 mt-1.5">{props.customerName}</p>
          <p className="text-sm text-gray-500">
            <a href={`mailto:${props.customerEmail}`} className="hover:text-gray-900">
              {props.customerEmail}
            </a>
            {props.customerPhone && <> · {props.customerPhone}</>}
          </p>
        </div>

        <div className="text-right shrink-0">
          <p className="font-black text-gray-900">{props.totalAmount}</p>
          <Link
            href={`/admin/${props.kapsam}/siparisler/${props.orderId}`}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            Siparişi aç →
          </Link>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 space-y-2">
        <div>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
            İade edilecek ürünler
          </p>
          <ul className="text-sm text-gray-700 mt-1 space-y-0.5">
            {props.itemNames.map((name) => (
              <li key={name}>• {name}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
            Müşterinin gerekçesi
          </p>
          <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{props.reason}</p>
        </div>
      </div>

      {props.adminNote && !open && (
        <p className="text-sm text-gray-500">
          <span className="font-semibold text-gray-700">Müşteriye iletilen açıklama:</span>{' '}
          {props.adminNote}
        </p>
      )}

      {open && (
        <div className="space-y-2">
          <label
            htmlFor={`iade-not-${props.id}`}
            className="block text-xs font-semibold text-gray-700"
          >
            Müşteriye iletilecek açıklama
            <span className="ml-1 font-normal text-gray-400">
              (reddederken zorunlu)
            </span>
          </label>
          <textarea
            id={`iade-not-${props.id}`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            maxLength={2000}
            placeholder="Örn. Ürünü orijinal ambalajıyla gönderin."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
          <div className="flex flex-wrap gap-2 justify-end">
            <button
              type="button"
              onClick={() => decide('REJECTED')}
              disabled={isPending}
              className="text-sm px-4 py-2 rounded-lg border border-red-200 text-red-600 font-semibold hover:bg-red-50 disabled:opacity-40"
            >
              Reddet
            </button>
            <button
              type="button"
              onClick={() => decide('APPROVED')}
              disabled={isPending}
              className="btn-press text-sm px-4 py-2 rounded-lg bg-gray-900 text-white font-semibold hover:bg-gray-700 disabled:opacity-40"
            >
              Onayla
            </button>
          </div>
          <p className="text-[11px] text-gray-400 text-right">
            Onaylamak parayı iade etmez. Ürün elinize ulaşınca siparişteki
            &quot;Siparişi İade Et&quot; ile iadeyi tamamlayın.
          </p>
        </div>
      )}

      {props.status === 'APPROVED' && (
        <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          Onaylandı — ürün beklendiği için henüz para iade edilmedi. Ürün elinize
          ulaşınca siparişteki &quot;Siparişi İade Et&quot; butonunu kullanın; talep
          otomatik olarak kapanacak.
        </p>
      )}
    </div>
  )
}
