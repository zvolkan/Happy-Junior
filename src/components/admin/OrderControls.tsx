'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import {
  updateOrderStatus,
  updateOrderShipping,
  updateOrderNote,
  refundOrder,
  markOrderManuallyRefunded,
} from '@/app/actions/admin-orders'

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Ödeme Bekliyor' },
  { value: 'CONFIRMED', label: 'Onaylandı' },
  { value: 'PROCESSING', label: 'Hazırlanıyor' },
  { value: 'SHIPPED', label: 'Kargoya Verildi' },
  { value: 'DELIVERED', label: 'Teslim Edildi' },
  { value: 'CANCELLED', label: 'İptal Edildi' },
  // 'REFUNDED' bilerek yok: iade, para hareketi gerektirdiği için durum
  // menüsünden değil "Siparişi İade Et" butonundan yapılıyor. Sunucu zaten
  // reddediyordu; seçeneği burada göstermek yöneticiyi boşuna uğraştırıyordu.
]

const CARRIERS = [
  'Yurtiçi Kargo',
  'Aras Kargo',
  'MNG Kargo',
  'PTT Kargo',
  'Sürat Kargo',
  'UPS',
]

interface Props {
  orderId: string
  status: string
  carrier: string | null
  trackingNumber: string | null
  adminNote: string | null
  canRefund: boolean
}

export default function OrderControls({
  orderId,
  status,
  carrier,
  trackingNumber,
  adminNote,
  canRefund,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [selectedStatus, setSelectedStatus] = useState(status)
  const [carrierValue, setCarrierValue] = useState(carrier ?? CARRIERS[0])
  const [trackingValue, setTrackingValue] = useState(trackingNumber ?? '')
  const [note, setNote] = useState(adminNote ?? '')
  const [confirmRefund, setConfirmRefund] = useState(false)
  const [confirmElle, setConfirmElle] = useState(false)
  const [elleSebep, setElleSebep] = useState('')

  const handleStatus = () => {
    // Ödemesi alınmış siparişi iptal etmek iyzico'ya iade isteği gönderiyor;
    // geri alınamayan bir işlem olduğu için önce onay isteniyor.
    if (selectedStatus === 'CANCELLED' && canRefund) {
      const onay = confirm(
        'Bu siparişin ödemesi tahsil edilmiş.\n\n' +
          'İptal ederseniz iyzico üzerinden otomatik iade isteği gönderilecek, ' +
          'stoklar geri yüklenecek ve müşteriye bilgi e-postası gidecek. ' +
          'Sipariş "İade Edildi" olarak işaretlenecek.\n\n' +
          'Devam edilsin mi?',
      )
      if (!onay) return
    }

    startTransition(async () => {
      // Sunucu aksiyonundan hata FIRLATMIYORUZ: üretimde fırlatılan hatanın
      // mesajı Next tarafından gizleniyor ve yönetici genel bir hata ekranı
      // görüyor. Bunun yerine sonuç nesnesi dönüyor.
      const result = await updateOrderStatus(orderId, selectedStatus)

      if (result.ok) {
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(result.error, { duration: 6000 })
      }
    })
  }

  const handleShipping = () => {
    if (!trackingValue.trim()) {
      toast.error('Takip numarası girin')
      return
    }
    startTransition(async () => {
      try {
        await updateOrderShipping(orderId, carrierValue, trackingValue)
        toast.success('Kargo bilgisi kaydedildi, sipariş "Kargoya Verildi" olarak işaretlendi')
        router.refresh()
      } catch {
        toast.error('Kargo bilgisi kaydedilemedi')
      }
    })
  }

  const handleNote = () => {
    startTransition(async () => {
      try {
        await updateOrderNote(orderId, note)
        toast.success('Not kaydedildi')
        router.refresh()
      } catch {
        toast.error('Not kaydedilemedi')
      }
    })
  }

  /**
   * "Parayı iyzico panelinden zaten iade ettim / iptal ettim" durumu.
   *
   * Sunucu aksiyonu (`markOrderManuallyRefunded`) baştan beri vardı ama
   * arayüzde karşılığı yoktu. Sonuç: ödeme iyzico panelinden iptal edildiğinde
   * sipariş sistemde CONFIRMED kalıyor, müşteri hesabında hâlâ "Onaylandı"
   * görüyor, yönetici de düzeltemiyordu — durum menüsünden "İptal Edildi"
   * seçmek iyzico'ya İKİNCİ bir iade isteği göndermeye çalışıp hata veriyordu.
   *
   * Bu düğme gateway'e hiç dokunmuyor: yalnızca kaydı gerçeğe uyduruyor,
   * stokları geri yüklüyor ve müşteriye bildirim gönderiyor.
   */
  const handleElleIade = () => {
    startTransition(async () => {
      const result = await markOrderManuallyRefunded(orderId, elleSebep.trim() || undefined)
      setConfirmElle(false)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      setElleSebep('')
      toast.success(result.message, { duration: 6000 })
      router.refresh()
    })
  }

  const handleRefund = () => {
    startTransition(async () => {
      const result = await refundOrder(orderId)
      setConfirmRefund(false)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success(result.message, { duration: 6000 })
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      {/* Durum */}
      <section className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="font-semibold text-gray-800 border-b pb-3 mb-4">Sipariş Durumu</h2>
        {/* Ekran okuyucu için: bu alanların hiçbirinde htmlFor/id eşleşmesi
            yoktu, yani alanlar isimsiz okunuyordu. */}
        <label htmlFor="siparis-durum" className="sr-only">
          Sipariş durumu
        </label>
        <select
          id="siparis-durum"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-3 focus:ring-2 focus:ring-gray-900 focus:border-transparent"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          onClick={handleStatus}
          disabled={isPending || selectedStatus === status}
          className="btn-press w-full bg-gray-900 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Durumu Güncelle
        </button>
      </section>

      {/* Kargo */}
      <section className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="font-semibold text-gray-800 border-b pb-3 mb-4">Kargo Bilgisi</h2>

        <label htmlFor="kargo-firmasi" className="block text-xs font-medium text-gray-600 mb-1">
          Kargo Firması
        </label>
        <select
          id="kargo-firmasi"
          value={carrierValue}
          onChange={(e) => setCarrierValue(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-3"
        >
          {CARRIERS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <label htmlFor="takip-numarasi" className="block text-xs font-medium text-gray-600 mb-1">
          Takip Numarası
        </label>
        <input
          id="takip-numarasi"
          value={trackingValue}
          onChange={(e) => setTrackingValue(e.target.value)}
          placeholder="Örn: 1234567890123"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono mb-3"
        />

        <button
          onClick={handleShipping}
          disabled={isPending}
          className="btn-press w-full bg-indigo-600 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-indigo-500 disabled:opacity-40"
        >
          Kaydet ve Kargoya Ver
        </button>
        <p className="text-xs text-gray-400 mt-2">
          Kaydedince müşteri sipariş takibi sayfasından takip edebilir.
        </p>
      </section>

      {/* Admin notu */}
      <section className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="font-semibold text-gray-800 border-b pb-3 mb-4">İç Not</h2>
        <label htmlFor="ic-not" className="sr-only">
          Yönetici iç notu
        </label>
        <textarea
          id="ic-not"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="Yalnızca yönetici görür"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none mb-3"
        />
        <button
          onClick={handleNote}
          disabled={isPending}
          className="btn-press w-full border border-gray-300 text-gray-700 text-sm font-semibold py-2.5 rounded-xl hover:bg-gray-50 disabled:opacity-40"
        >
          Notu Kaydet
        </button>
      </section>

      {/* İade */}
      {canRefund && (
        <section className="bg-white rounded-2xl shadow-sm p-6 border border-red-100">
          <h2 className="font-semibold text-red-700 border-b border-red-100 pb-3 mb-4">
            İade
          </h2>

          {confirmRefund ? (
            <>
              <p className="text-sm text-gray-600 mb-3">
                Ödeme iyzico üzerinden iade edilecek ve stoklar geri yüklenecek. Bu işlem
                geri alınamaz.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleRefund}
                  disabled={isPending}
                  className="btn-press flex-1 bg-red-600 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-red-500 disabled:opacity-40"
                >
                  {isPending ? 'İşleniyor…' : 'Evet, iade et'}
                </button>
                <button
                  onClick={() => setConfirmRefund(false)}
                  disabled={isPending}
                  className="flex-1 border border-gray-300 text-gray-600 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-50"
                >
                  Vazgeç
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={() => setConfirmRefund(true)}
              className="btn-press w-full border border-red-200 text-red-600 text-sm font-semibold py-2.5 rounded-xl hover:bg-red-50"
            >
              Siparişi İade Et
            </button>
          )}

          {/* ── iyzico panelinden yapılmış iade/iptali kaydet ──────────────
              Yukarıdaki düğme iyzico'ya İSTEK GÖNDERİR. Bu ise göndermez:
              para zaten iyzico panelinden iade edilmişse, sipariş kaydını
              gerçeğe uydurur. İkisi bilinçli olarak ayrı. */}
          {!confirmRefund && (
            <div className="mt-4 pt-4 border-t border-red-100">
              {confirmElle ? (
                <>
                  <p className="text-sm text-gray-600 mb-3">
                    Ödeme <strong>iyzico panelinden</strong> iade veya iptal edildiyse
                    bunu kullanın. iyzico&apos;ya yeni bir istek gönderilmez; sipariş
                    &quot;İade Edildi&quot; olarak işaretlenir, stoklar geri yüklenir ve
                    müşteriye bilgi verilir.
                  </p>
                  <label htmlFor="elle-iade-sebep" className="block text-xs font-medium text-gray-600 mb-1">
                    Açıklama (yönetici notuna yazılır)
                  </label>
                  <input
                    id="elle-iade-sebep"
                    type="text"
                    value={elleSebep}
                    onChange={(e) => setElleSebep(e.target.value)}
                    placeholder="Örn. müşteri telefonla iptal istedi, iyzico panelinden iade edildi"
                    className="w-full mb-3 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-200 focus:border-transparent"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleElleIade}
                      disabled={isPending}
                      className="btn-press flex-1 bg-gray-900 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-gray-700 disabled:opacity-40"
                    >
                      {isPending ? 'İşleniyor…' : 'İade edildi olarak işaretle'}
                    </button>
                    <button
                      onClick={() => setConfirmElle(false)}
                      disabled={isPending}
                      className="flex-1 border border-gray-300 text-gray-600 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-50"
                    >
                      Vazgeç
                    </button>
                  </div>
                </>
              ) : (
                <button
                  onClick={() => setConfirmElle(true)}
                  className="w-full text-xs text-gray-500 hover:text-gray-800 underline underline-offset-2 py-1"
                >
                  iyzico panelinden iade/iptal ettim — kaydı güncelle
                </button>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
