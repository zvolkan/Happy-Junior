'use client'

import { useState } from 'react'
import { useCartStore } from '@/store/cartStore'
import { toast } from 'react-hot-toast'
import Icon from '@/components/ui/Icon'
import type { Product } from '@/lib/types'

interface AddToCartButtonProps {
  product: Product
  disabled?: boolean
  className?: string
  label?: string
  quantity?: number
}

export default function AddToCartButton({
  product,
  disabled = false,
  className = '',
  label = 'Sepete Ekle',
  quantity = 1,
}: AddToCartButtonProps) {
  const addItem = useCartStore((s) => s.addItem)
  const items = useCartStore((s) => s.items)
  const [added, setAdded] = useState(false)

  const handleClick = () => {
    if (disabled) return

    // Stok tavanına takılıp hiçbir şey eklenmediyse "eklendi" demek yanlış.
    // Örn. stoğu 3 olan üründen sepette zaten 3 varken butona basan kullanıcı
    // öncesinde başarı bildirimi görüyor, sepette değişiklik olmuyordu.
    const before = items.find((i) => i.product.id === product.id)?.quantity ?? 0
    addItem(product, quantity)
    const after =
      useCartStore.getState().items.find((i) => i.product.id === product.id)?.quantity ?? 0

    if (after <= before) {
      toast.error(
        after === 0
          ? 'Bu ürün şu anda stokta yok.'
          : `Stokta en fazla ${after} adet var, sepetinizde zaten o kadar mevcut.`,
      )
      return
    }

    toast.success(`${product.name} sepete eklendi`)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={className}
    >
      {added ? (
        <span className="inline-flex items-center gap-1.5">
          <Icon name="onay" className="w-4 h-4" />
          Eklendi
        </span>
      ) : (
        label
      )}
    </button>
  )
}
