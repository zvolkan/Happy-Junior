'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { markMessageRead } from '@/app/actions/admin-orders'

interface Message {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  subject: string | null
  message: string
  brandKey: string | null
  isRead: boolean
  createdAt: string
}

export default function MessageRow({ message }: { message: Message }) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(!message.isRead)
  const [isPending, startTransition] = useTransition()

  const toggleRead = () => {
    startTransition(async () => {
      await markMessageRead(message.id, !message.isRead)
      router.refresh()
    })
  }

  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border transition-colors ${
        message.isRead ? 'border-gray-100' : 'border-blue-200 bg-blue-50/30'
      }`}
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left p-5 flex items-start justify-between gap-4"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            {!message.isRead && (
              <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
            )}
            <span className="font-semibold text-gray-900">
              {message.firstName} {message.lastName}
            </span>
            {message.subject && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {message.subject}
              </span>
            )}
            {message.brandKey && (
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                {message.brandKey}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1 truncate">{message.email}</p>
          {!expanded && (
            <p className="text-sm text-gray-400 mt-1 line-clamp-1">{message.message}</p>
          )}
        </div>
        <span className="text-xs text-gray-400 whitespace-nowrap">{message.createdAt}</span>
      </button>

      {expanded && (
        <div className="px-5 pb-5 -mt-1">
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50 rounded-xl p-4">
            {message.message}
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-4 text-sm">
            <a
              href={`mailto:${message.email}?subject=${encodeURIComponent(
                `Re: ${message.subject ?? 'Mesajınız hakkında'}`,
              )}`}
              className="btn-press bg-gray-900 text-white font-semibold px-4 py-2 rounded-lg hover:bg-gray-700"
            >
              E-posta ile yanıtla
            </a>
            {message.phone && (
              <a
                href={`tel:${message.phone.replace(/\s/g, '')}`}
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                {message.phone}
              </a>
            )}
            <button
              onClick={toggleRead}
              disabled={isPending}
              className="ml-auto text-gray-400 hover:text-gray-700 font-medium disabled:opacity-50"
            >
              {message.isRead ? 'Okunmadı işaretle' : 'Okundu işaretle'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
