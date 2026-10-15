'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { deleteAddress, setDefaultAddress } from '@/app/actions/orders'

interface Props {
  addressId: string
  label: string
  isDefault: boolean
}

export default function AddressCardActions({ addressId, label, isDefault }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [confirming, setConfirming] = useState(false)

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteAddress(addressId)
        toast.success(`"${label}" adresi silindi`)
        router.refresh()
      } catch {
        toast.error('Adres silinemedi. Lütfen tekrar deneyin.')
      } finally {
        setConfirming(false)
      }
    })
  }

  const handleSetDefault = () => {
    startTransition(async () => {
      try {
        await setDefaultAddress(addressId)
        toast.success('Varsayılan adres güncellendi')
        router.refresh()
      } catch {
        toast.error('İşlem tamamlanamadı.')
      }
    })
  }

  if (confirming) {
    return (
      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-sm text-gray-600 mb-3">
          Bu adresi silmek istediğinize emin misiniz?
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="btn-press flex-1 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold py-2 rounded-lg disabled:opacity-50"
          >
            {isPending ? 'Siliniyor…' : 'Evet, sil'}
          </button>
          <button
            onClick={() => setConfirming(false)}
            disabled={isPending}
            className="flex-1 border border-gray-200 text-gray-600 text-sm font-medium py-2 rounded-lg hover:bg-gray-50"
          >
            Vazgeç
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-3 text-sm">
      <Link
        href={`/hesabim/adres-duzenle/${addressId}`}
        className="font-medium text-gray-700 hover:text-gray-900"
      >
        Düzenle
      </Link>

      {!isDefault && (
        <>
          <span className="text-gray-200">|</span>
          <button
            onClick={handleSetDefault}
            disabled={isPending}
            className="font-medium text-gray-500 hover:text-gray-900 disabled:opacity-50"
          >
            Varsayılan yap
          </button>
        </>
      )}

      <span className="text-gray-200">|</span>
      <button
        onClick={() => setConfirming(true)}
        disabled={isPending}
        className="font-medium text-gray-400 hover:text-red-500 disabled:opacity-50"
      >
        Sil
      </button>
    </div>
  )
}
