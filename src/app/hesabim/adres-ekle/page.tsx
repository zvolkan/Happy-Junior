'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { addAddress } from '@/app/actions/orders'
import { TURKISH_CITIES } from '@/lib/constants'
import toast from 'react-hot-toast'

export default function AdresEklePage() {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      try {
        // Sunucu artık hata fırlatmıyor; hangi alanın hatalı olduğunu
        // sonuç nesnesinde bildiriyor (üretimde fırlatılan mesaj gizleniyordu).
        const result = await addAddress(formData)
        if (!result.ok) {
          toast.error(result.error)
          return
        }
        toast.success('Adres kaydedildi!')
        router.push('/hesabim')
      } catch {
        toast.error('Adres kaydedilemedi. Bağlantınızı kontrol edip tekrar deneyin.')
      }
    })
  }

  return (
    <main className="min-h-screen bg-gray-50 py-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-lg">
        <div className="mb-6">
          <Link href="/hesabim" className="text-sm text-gray-500 hover:text-gray-900">
            ← Hesabıma Dön
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h1 className="text-xl font-bold text-gray-900 mb-6">Yeni Adres Ekle</h1>

          <form action={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="adres-label" className="block text-sm font-medium text-gray-700 mb-1.5">
                Adres Etiketi
              </label>
              <input
                type="text"
                name="label"
                id="adres-label"
                placeholder="Ev, İş, Çiftlik..."
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>

            <div>
              <label htmlFor="adres-fullName" className="block text-sm font-medium text-gray-700 mb-1.5">
                Ad Soyad
              </label>
              <input
                type="text"
                name="fullName"
                id="adres-fullName"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>

            <div>
              <label htmlFor="adres-phone" className="block text-sm font-medium text-gray-700 mb-1.5">
                Telefon
              </label>
              <input
                type="tel"
                name="phone"
                id="adres-phone"
                placeholder="05XX XXX XX XX"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>

            <div>
              <label htmlFor="adres-line1" className="block text-sm font-medium text-gray-700 mb-1.5">
                Adres Satırı 1
              </label>
              <input
                type="text"
                name="line1"
                id="adres-line1"
                placeholder="Mahalle, cadde, sokak, no..."
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
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                name="isDefault"
                id="isDefault"
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
                {isPending ? 'Kaydediliyor...' : 'Adresi Kaydet'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}
