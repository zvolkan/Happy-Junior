import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { formatOrderNo } from '@/lib/order-number'

export const metadata: Metadata = {
  title: 'Ödemeniz Doğrulanıyor',
  robots: { index: false, follow: false },
}

/**
 * Ödeme doğrulaması sırasında beklenmeyen bir hata oluştuğunda gösterilir.
 *
 * Bu durumda para çekilmiş OLABİLİR — bu yüzden müşteriye "başarısız, tekrar
 * deneyin" demek yanlış olur (ikinci kez ödeme yapabilir). Sipariş yönetici
 * incelemesi için işaretlenmiş durumda.
 */
export default async function OdemeBeklemedePage({
  searchParams,
}: {
  searchParams: Promise<{ siparis?: string }>
}) {
  const { siparis } = await searchParams

  // Kimliği zaten adres çubuğunda olan siparişin müşteriye gösterilen
  // numarasını çeviriyoruz; destek araması bu numarayla yapılacak.
  // Sahiplik kontrolü: `/odeme/basarili` bunu zaten yapıyordu, burada
  // eksikti — sipariş kimliğini ele geçiren biri müşteriye gösterilen sipariş
  // numarasını öğrenebiliyordu (o numara sipariş takibinin iki anahtarından biri).
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const order =
    siparis && user
      ? await prisma.order
          .findFirst({
            where: { id: siparis, userId: user.id },
            select: { id: true, orderNumber: true },
          })
          .catch(() => null)
      : null

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-10 h-10 text-amber-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Ödemeniz Doğrulanıyor</h1>
        <p className="text-gray-500 text-sm mb-6 leading-relaxed">
          Ödemenizi aldık ancak doğrulama işlemi tamamlanamadı. Ekibimiz durumu kontrol
          ediyor ve en kısa sürede sizinle iletişime geçecek.
        </p>

        <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm text-amber-800 mb-8 text-left">
          <p className="font-semibold mb-1">Lütfen tekrar ödeme yapmayın.</p>
          <p className="text-amber-700">
            Kartınızdan tahsilat yapılmış olabilir. Aynı siparişi ikinci kez ödemeniz
            durumunda iki ayrı tahsilat oluşur.
          </p>
        </div>

        {order && (
          <p className="text-xs text-gray-400 font-mono mb-6 break-all">
            Sipariş No: {formatOrderNo(order)}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/hesabim/siparislerim"
            className="btn-press flex-1 py-3 rounded-xl bg-gray-900 hover:bg-gray-700 text-white font-semibold text-sm text-center"
          >
            Siparişlerim
          </Link>
          <Link
            href="/iletisim"
            className="btn-press flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold text-sm text-center hover:bg-gray-50"
          >
            İletişime Geç
          </Link>
        </div>
      </div>
    </div>
  )
}
