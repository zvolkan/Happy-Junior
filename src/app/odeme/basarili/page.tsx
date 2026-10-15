import Link from 'next/link'
import { redirect } from 'next/navigation'
import ClearCart from './_components/ClearCart'
import { prisma } from '@/lib/db'
import { formatOrderNo } from '@/lib/order-number'
import { createClient } from '@/lib/supabase/server'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Siparişiniz Alındı',
  robots: { index: false, follow: false },
}


type Props = {
  searchParams: Promise<{ siparis?: string }>
}

export default async function BasariliPage({ searchParams }: Props) {
  const { siparis } = await searchParams

  // Sipariş gerçekten var mı ve bu kullanıcıya mı ait?
  // Eskiden URL'i bilen herkes "Ödemeniz tamamlandı" ekranını görüyor ve
  // sayfayı açan herkesin sepeti (kendi siparişi olmasa bile) siliniyordu.
  let verified: {
    id: string
    orderNumber: string | null
    totalAmount: unknown
    paymentStatus: string | null
  } | null = null

  if (siparis) {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      verified = await prisma.order
        .findFirst({
          where: { id: siparis, userId: user.id },
          select: { id: true, orderNumber: true, totalAmount: true, paymentStatus: true },
        })
        .catch(() => null)
    }
  }

  // Doğrulanamayan sipariş → ana sayfaya
  if (siparis && !verified) {
    redirect('/')
  }

  const isPaid = verified?.paymentStatus === 'paid'

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      {/* Sepet yalnızca doğrulanmış siparişten sonra temizlenir */}
      {verified && <ClearCart />}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 max-w-md w-full text-center">

        {/* Checkmark */}
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Siparişiniz Alındı!</h1>
        <p className="text-gray-500 text-sm mb-6">
          {isPaid
            ? 'Ödemeniz başarıyla tamamlandı. Siparişiniz en kısa sürede hazırlanıp kargoya verilecektir.'
            : 'Siparişiniz oluşturuldu. Ödeme doğrulaması tamamlandığında bilgilendirileceksiniz.'}
        </p>

        {verified && (
          <div className="bg-gray-50 rounded-xl px-5 py-3 mb-6">
            <p className="text-xs text-gray-400 mb-0.5">Sipariş Numaranız</p>
            <p className="font-mono font-semibold text-gray-900 text-sm tracking-wider">
              {formatOrderNo(verified)}
            </p>
          </div>
        )}

        <p className="text-xs text-gray-400 mb-8">
          Sipariş durumunuzu <strong>Hesabım</strong> sayfasından takip edebilirsiniz.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/hesabim"
            className="flex-1 py-3 rounded-xl bg-gray-900 hover:bg-gray-700 text-white font-semibold text-sm text-center transition-colors"
          >
            Siparişlerimi Gör
          </Link>
          <Link
            href="/"
            className="flex-1 py-3 rounded-xl border border-gray-200 hover:border-gray-400 text-gray-700 font-semibold text-sm text-center transition-colors"
          >
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    </div>
  )
}
