'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { cancelOrder } from '@/app/actions/orders'

export default function CancelOrderButton({
  orderId,
  isPaid = false,
}: {
  orderId: string
  /** Ödemesi alınmış sipariş — iptal edilince para iade edilir */
  isPaid?: boolean
}) {
  const [step, setStep] = useState<'idle' | 'confirm' | 'loading'>('idle')
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleCancel = async () => {
    setStep('loading')
    setError(null)
    try {
      const result = await cancelOrder(orderId)

      if (!result.ok) {
        setError(result.error)
        setStep('idle')
        // ── Başarısızlıkta da tazeliyoruz ───────────────────────────────────
        //
        // "İptal edilemedi" demek "hiçbir şey değişmedi" demek değil. İade
        // süreci başlamış ve sonucu belirsiz kalmışsa sipariş sunucuda
        // `refund_pending` oldu; sayfa tazelenmezse müşteri hem hata mesajını
        // hem de hâlâ duran iptal düğmesini görüyor — tam olarak bildirilen
        // belirti buydu.
        router.refresh()
        return
      }

      toast.success(result.message, { duration: 7000 })
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Bir hata oluştu.')
      setStep('idle')
      // Sunucu aksiyonu istisna fırlattıysa (ör. iade e-postası gönderilemedi)
      // veritabanı çoktan güncellenmiş olabilir. Tazeleme, ekranı gerçeğe
      // döndürmenin tek yolu.
      router.refresh()
    }
  }

  if (step === 'confirm') {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-gray-500">
          {isPaid
            ? 'İptal edilecek ve ödemeniz iade edilecek. Emin misiniz?'
            : 'Emin misiniz?'}
        </span>
        <button
          onClick={handleCancel}
          className="text-xs px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold transition-colors"
        >
          Evet, İptal Et
        </button>
        <button
          onClick={() => setStep('idle')}
          className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors"
        >
          Vazgeç
        </button>
      </div>
    )
  }

  return (
    <div>
      {error && <p className="text-xs text-red-500 mb-1">{error}</p>}
      <button
        onClick={() => setStep('confirm')}
        disabled={step === 'loading'}
        className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors font-medium disabled:opacity-50"
      >
        {step === 'loading' ? 'İptal ediliyor...' : 'Siparişi İptal Et'}
      </button>
    </div>
  )
}
