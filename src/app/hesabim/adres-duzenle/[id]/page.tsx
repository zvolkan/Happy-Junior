'use client'

import { useTransition, useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { updateAddress } from '@/app/actions/orders'
import { TURKISH_CITIES } from '@/lib/constants'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

type Address = {
  id: string
  label: string
  fullName: string
  phone: string
  line1: string
  line2: string | null
  district: string
  city: string
  postalCode: string | null
  isDefault: boolean
}

export default function AdresDuzenlePage() {
  const params = useParams()
  const id = params.id as string
  const [isPending, startTransition] = useTransition()
  const [address, setAddress] = useState<Address | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/giris'); return }

      const res = await fetch(`/api/adreslerim/${id}`)
      if (!res.ok) { router.push('/hesabim'); return }
      const addr = (await res.json()) as Address
      setAddress(addr)
      setLoading(false)
    })
  }, [id, router])

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      try {
        const result = await updateAddress(id, formData)
        if (!result.ok) {
          toast.error(result.error)
          return
        }
        toast.success('Adres güncellendi!')
        router.push('/hesabim')
      } catch {
        toast.error('Adres güncellenemedi. Bağlantınızı kontrol edip tekrar deneyin.')
      }
    })
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Yükleniyor...</div>
      </main>
    )
  }

  if (!address) return null

  return (
    <main className="min-h-screen bg-gray-50 py-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-lg">
        <div className="mb-6">
          <Link href="/hesabim" className="text-sm text-gray-500 hover:text-gray-900">
            ← Hesabıma Dön
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h1 className="text-xl font-bold text-gray-900 mb-6">Adresi Düzenle</h1>

          <form action={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="adres-label" className="block text-sm font-medium text-gray-700 mb-1.5">Adres Etiketi</label>
              <input
                type="text"
                name="label"
                id="adres-label"
                defaultValue={address.label}
                placeholder="Ev, İş, Çiftlik..."
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>

            <div>
              <label htmlFor="adres-fullName" className="block text-sm font-medium text-gray-700 mb-1.5">Ad Soyad</label>
              <input
                type="text"
                name="fullName"
                id="adres-fullName"
                defaultValue={address.fullName}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>

            <div>
              <label htmlFor="adres-phone" className="block text-sm font-medium text-gray-700 mb-1.5">Telefon</label>
              <input
                type="tel"
                name="phone"
                id="adres-phone"
                defaultValue={address.phone}
                placeholder="05XX XXX XX XX"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>

            <div>
              <label htmlFor="adres-line1" className="block text-sm font-medium text-gray-700 mb-1.5">Adres Satırı 1</label>
              <input
                type="text"
                name="line1"
                id="adres-line1"
                defaultValue={address.line1}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>

            <div>
              <label htmlFor="adres-line2" className="block text-sm font-medium text-gray-700 mb-1.5">
                Adres Satırı 2 <span className="text-gray-400">(opsiyonel)</span>
              </label>
              <input
                type="text"
                name="line2"
                id="adres-line2"
                defaultValue={address.line2 ?? ''}
                placeholder="Daire, kat..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="adres-city" className="block text-sm font-medium text-gray-700 mb-1.5">İl</label>
                <select
                  name="city"
                  id="adres-city"
                  defaultValue={address.city}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                >
                  <option value="">İl seçin</option>
                  {TURKISH_CITIES.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="adres-district" className="block text-sm font-medium text-gray-700 mb-1.5">İlçe</label>
                <input
                  type="text"
                  name="district"
                  id="adres-district"
                  defaultValue={address.district}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
            </div>

            <div>
              <label htmlFor="adres-postalCode" className="block text-sm font-medium text-gray-700 mb-1.5">
                Posta Kodu <span className="text-gray-400">(opsiyonel)</span>
              </label>
              <input
                type="text"
                name="postalCode"
                id="adres-postalCode"
                defaultValue={address.postalCode ?? ''}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                name="isDefault"
                id="isDefault"
                defaultChecked={address.isDefault}
                className="rounded"
              />
              <label htmlFor="isDefault" className="text-sm text-gray-700 cursor-pointer">
                Varsayılan adres olarak kaydet
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <Link
                href="/hesabim"
                className="flex-1 text-center py-3 rounded-xl border border-gray-300 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Vazgeç
              </Link>
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isPending ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}
