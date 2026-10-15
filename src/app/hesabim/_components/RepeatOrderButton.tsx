'use client'

import { useState } from 'react'
import { useCartStore } from '@/store/cartStore'
import toast from 'react-hot-toast'
import { getRepeatOrderItems } from '@/app/actions/orders'
import Icon from '@/components/ui/Icon'
import type { BrandKey } from '@/lib/types'

type Props = {
  orderId: string
  brandKey: BrandKey
}

export default function RepeatOrderButton({ orderId, brandKey }: Props) {
  const [loading, setLoading] = useState(false)
  const addItem = useCartStore((s) => s.addItem)

  const handleRepeat = async () => {
    setLoading(true)
    try {
      const result = await getRepeatOrderItems(orderId)
      if (!result || result.available.length === 0) {
        toast.error('Bu siparişin ürünleri artık mevcut değil.')
        return
      }

      result.available.forEach((item) => {
        const price = Number(item.product.salePrice ?? item.product.price)
        addItem(
          {
            id: item.product.id,
            name: item.product.name,
            slug: item.product.slug,
            description: '',
            shortDescription: '',
            price,
            salePrice: item.product.salePrice ? Number(item.product.salePrice) : undefined,
            images: item.product.images.map((img) => ({
              url: img.url,
              alt: item.product.name,
              isPrimary: true,
            })),
            category: { id: 0, name: '', slug: '', brand: brandKey, sortOrder: 0 },
            brand: brandKey,
            specs: [],
            stock: item.product.stockQuantity,
            unit: item.product.unit,
            isFeatured: false,
            isActive: item.product.isActive,
            rating: 0,
            reviewCount: 0,
            sku: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          item.quantity
        )
      })

      if (result.unavailable.length > 0) {
        const names = result.unavailable.map((i) => i.product.name).join(', ')
        toast.success(
          `${result.available.length} ürün sepete eklendi. Stokta olmayan ürünler atlandı: ${names}`,
          { duration: 5000 }
        )
      } else {
        toast.success(`${result.available.length} ürün sepete eklendi!`)
      }
    } catch {
      toast.error('Bir hata oluştu. Lütfen tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleRepeat}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {loading ? (
        <>
          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          Ekleniyor...
        </>
      ) : (
        <>
          <Icon name="yenile" className="w-4 h-4" />
          Siparişi Tekrarla
        </>
      )}
    </button>
  )
}
