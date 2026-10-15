import { notFound } from 'next/navigation'
import { getContactMessages } from '@/app/actions/admin-orders'
import MessageRow from '@/components/admin/MessageRow'
import Icon from '@/components/ui/Icon'
import { KAPSAM, kapsamAdi } from '@/lib/admin-kapsam'

export const dynamic = 'force-dynamic'

export default async function KapsamMesajlarPage() {
  const kapsam = KAPSAM

  const messages = await getContactMessages({ kapsam })
  const unread = messages.filter((m: { isRead: boolean }) => !m.isRead).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">İletişim Mesajları</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {kapsamAdi(kapsam)} · {messages.length} mesaj · {unread} okunmamış
        </p>
      </div>

      {messages.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-16 text-center">
          <Icon name="eposta" className="w-9 h-9 mb-3 mx-auto text-gray-300" />
          <p className="text-gray-500">Bu kapsamda mesaj yok.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((message) => (
            <MessageRow
              key={message.id}
              message={{
                id: message.id,
                firstName: message.firstName,
                lastName: message.lastName,
                email: message.email,
                phone: message.phone,
                subject: message.subject,
                message: message.message,
                brandKey: message.brandKey,
                isRead: message.isRead,
                createdAt: new Intl.DateTimeFormat('tr-TR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                }).format(new Date(message.createdAt)),
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
