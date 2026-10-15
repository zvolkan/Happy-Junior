'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { useCartStore } from '@/store/cartStore'
import { removeFavorite } from '@/app/actions/favorites'
import { ACTIVE_BRAND_KEY } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { Product, BrandKey } from '@/lib/types'

const primaryBg = 'bg-brand-600'
const primaryHover = 'hover:bg-brand-500'

interface FavoriteProduct {
  id: string
  name: string
  slug: string
  price: number
  salePrice?: number
  stock: number
  unit: string
  brandKey: string
  categoryName: string
  image: string | null
}

/**
 * Favori kartındaki "Sepete Ekle" ve "Favorilerden Çıkar" butonları.
 *
 * Eskiden bu butonlar yalnızca yerel diziden çıkarıyordu; sepete ekleme
 * butonunun `onClick`'i bile yoktu.
 */
export default function FavoriteCardActions({ product }: { product: FavoriteProduct }) {
  const router = useRouter()
  const addItem = useCartStore((state) => state.addItem)
  const [isPending, startTransition] = useTransition()
  const [removed, setRemoved] = useState(false)

  const isOutOfStock = product.stock === 0

  const handleAddToCart = () => {
    if (isOutOfStock) return

    // Sepet, uygulama genelindeki Product tipini bekliyor
    const cartProduct: Product = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: '',
      shortDescription: '',
      price: product.price,
      salePrice: product.salePrice,
      images: product.image
        ? [{ url: product.image, alt: product.name, isPrimary: true }]
        : [],
      category: {
        id: 0,
        name: product.categoryName,
        slug: '',
        brand: product.brandKey as BrandKey,
        sortOrder: 0,
      },
      brand: product.brandKey as BrandKey,
      specs: [],
      stock: product.stock,
      unit: product.unit,
      isFeatured: false,
      isActive: true,
      rating: 0,
      reviewCount: 0,
      sku: '',
      createdAt: '',
      updatedAt: '',
    }

    // Sepet deposu stok tavanında ve tükenmiş üründe sessizce hiçbir şey
    // yapmıyor; öncesi/sonrası karşılaştırılmadan "eklendi" demek yanlış
    // bilgi veriyordu.
    const before = useCartStore.getState().items.find((i) => i.product.id === product.id)?.quantity ?? 0
    addItem(cartProduct, 1)
    const after = useCartStore.getState().items.find((i) => i.product.id === product.id)?.quantity ?? 0

    if (after <= before) {
      toast.error(
        after === 0
          ? 'Bu ürün şu anda stokta yok.'
          : `Stokta en fazla ${after} adet var, sepetinizde zaten o kadar mevcut.`,
      )
      return
    }
    toast.success(`${product.name} sepete eklendi`)
  }

  const handleRemove = () => {
    setRemoved(true) // iyimser gizleme
    startTransition(async () => {
      const result = await removeFavorite(product.id)
      if (!result.ok) {
        setRemoved(false)
        toast.error('Favorilerden çıkarılamadı. Lütfen tekrar deneyin.')
        return
      }
      toast.success('Favorilerden çıkarıldı')
      router.refresh()
    })
  }

  if (removed) {
    return (
      <p className="text-xs text-gray-400 text-center py-2">Favorilerden çıkarılıyor…</p>
    )
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleAddToCart}
        disabled={isOutOfStock}
        className={cn(
          'btn-press w-full text-white text-sm py-2.5 rounded-xl font-semibold',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0',
          primaryBg,
          primaryHover,
        )}
      >
        {isOutOfStock ? 'Tükendi' : 'Sepete Ekle'}
      </button>

      <button
        onClick={handleRemove}
        disabled={isPending}
        className="w-full text-xs text-gray-400 hover:text-red-500 py-1.5 transition-colors disabled:opacity-50"
      >
        Favorilerden çıkar
      </button>
    </div>
  )
}
