'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { deleteProduct } from '@/app/actions/admin'

export default function DeleteButton({ id, name }: { id: string; name: string }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleClick() {
    if (!confirm(`"${name}" ürününü silmek istediğinize emin misiniz?`)) return

    startTransition(async () => {
      try {
        const result = await deleteProduct(id)

        if (!result.ok) {
          toast.error(result.error, { duration: 6000 })
          return
        }

        if (result.archived) {
          toast.success(
            `"${name}" ürünü ${result.orderCount} siparişte kullanıldığı için silinmedi, ` +
              'satıştan kaldırıldı (pasife alındı). Geçmiş siparişler korunuyor.',
            { duration: 8000 },
          )
        } else {
          toast.success(`"${name}" silindi.`)
        }

        router.refresh()
      } catch {
        toast.error('Ürün silinemedi. Lütfen tekrar deneyin.')
      }
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="px-3 py-1 text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
    >
      {isPending ? '...' : 'Sil'}
    </button>
  )
}
