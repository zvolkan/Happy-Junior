'use client'

import { useTransition } from 'react'
import { updateProfile } from '@/app/actions/orders'
import toast from 'react-hot-toast'

type Props = {
  name: string | null
  phone: string | null
  email: string
}

export default function ProfileForm({ name, phone, email }: Props) {
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      try {
        const result = await updateProfile(formData)
        if (!result.ok) {
          toast.error(result.error)
          return
        }
        toast.success('Profiliniz güncellendi.')
      } catch {
        // try/catch yoktu: kısa bir isim girilince hata yakalanmadan
        // hata sınırına düşüyor ve tüm sayfa "bir şeyler ters gitti"
        // ekranına dönüşüyordu.
        toast.error('Profil güncellenemedi. Lütfen tekrar deneyin.')
      }
    })
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="profil-name" className="block text-sm font-medium text-gray-700 mb-1.5">Ad Soyad</label>
        <input
          type="text"
          id="profil-name"
          name="name"
          defaultValue={name ?? ''}
          required
          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
      </div>
      <div>
        <label htmlFor="profil-email" className="block text-sm font-medium text-gray-700 mb-1.5">E-posta</label>
        <input
          type="email"
          id="profil-email"
          value={email}
          disabled
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-400 text-sm bg-gray-50 cursor-not-allowed"
        />
        <p className="text-xs text-gray-400 mt-1">E-posta adresi değiştirilemez.</p>
      </div>
      <div>
        <label htmlFor="profil-phone" className="block text-sm font-medium text-gray-700 mb-1.5">Telefon</label>
        <input
          type="tel"
          id="profil-phone"
          name="phone"
          defaultValue={phone ?? ''}
          placeholder="05XX XXX XX XX"
          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="px-6 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors disabled:opacity-60"
      >
        {isPending ? 'Kaydediliyor...' : 'Kaydet'}
      </button>
    </form>
  )
}
