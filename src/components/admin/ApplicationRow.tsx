'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { updateDealerStatus } from '@/app/actions/admin-orders'

const STATUS_META: Record<string, { label: string; color: string }> = {
  new: { label: 'Yeni', color: 'bg-blue-100 text-blue-700' },
  contacted: { label: 'İletişime Geçildi', color: 'bg-yellow-100 text-yellow-700' },
  approved: { label: 'Onaylandı', color: 'bg-green-100 text-green-700' },
  rejected: { label: 'Reddedildi', color: 'bg-gray-100 text-gray-600' },
}

interface Application {
  id: string
  companyName: string
  firstName: string
  lastName: string
  email: string
  phone: string
  city: string
  district: string | null
  brandInterest: string | null
  businessType: string | null
  annualRevenue: string | null
  message: string | null
  status: string
  createdAt: string
}

export default function ApplicationRow({ application }: { application: Application }) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(application.status === 'new')
  const [isPending, startTransition] = useTransition()

  const meta = STATUS_META[application.status] ?? STATUS_META.new

  const setStatus = (status: string) => {
    startTransition(async () => {
      try {
        await updateDealerStatus(application.id, status)
        toast.success('Başvuru durumu güncellendi')
        router.refresh()
      } catch {
        toast.error('Durum güncellenemedi')
      }
    })
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left p-5 flex items-start justify-between gap-4"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900">{application.companyName}</span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${meta.color}`}>
              {meta.label}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {application.firstName} {application.lastName} · {application.city}
            {application.district ? ` / ${application.district}` : ''}
          </p>
        </div>
        <span className="text-xs text-gray-400 whitespace-nowrap">{application.createdAt}</span>
      </button>

      {expanded && (
        <div className="px-5 pb-5 -mt-1 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm bg-gray-50 rounded-xl p-4">
            <div>
              <p className="text-xs text-gray-400">E-posta</p>
              <a
                href={`mailto:${application.email}`}
                className="text-gray-800 hover:underline break-all"
              >
                {application.email}
              </a>
            </div>
            <div>
              <p className="text-xs text-gray-400">Telefon</p>
              <a
                href={`tel:${application.phone.replace(/\s/g, '')}`}
                className="text-gray-800 hover:underline"
              >
                {application.phone}
              </a>
            </div>
            {application.brandInterest && (
              <div>
                <p className="text-xs text-gray-400">İlgilendiği Marka</p>
                <p className="text-gray-800">{application.brandInterest}</p>
              </div>
            )}
            {application.businessType && (
              <div>
                <p className="text-xs text-gray-400">İşletme Türü</p>
                <p className="text-gray-800">{application.businessType}</p>
              </div>
            )}
            {application.annualRevenue && (
              <div>
                <p className="text-xs text-gray-400">Ciro / Deneyim</p>
                <p className="text-gray-800">{application.annualRevenue}</p>
              </div>
            )}
          </div>

          {application.message && (
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50 rounded-xl p-4">
              {application.message}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            {[
              { value: 'contacted', label: 'İletişime geçildi' },
              { value: 'approved', label: 'Onayla' },
              { value: 'rejected', label: 'Reddet' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setStatus(option.value)}
                disabled={isPending || application.status === option.value}
                className="btn-press text-sm font-medium px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
