'use client'

import { useState } from 'react'
import AddToCartButton from './AddToCartButton'
import type { Product } from '@/lib/types'

interface Props {
  product: Product
  className?: string
}

/**
 * Adet seçici + sepete ekle.
 *
 * Ürün detayında her tıklama sabit 1 adet ekliyordu; 10 çuval gübre almak
 * isteyen müşteri butona on kez basmak zorunda kalıyordu.
 */
export default function QuantityAddToCart({ product, className = '' }: Props) {
  const max = Number.isFinite(product.stock) ? Math.max(0, product.stock) : 99
  const [quantity, setQuantity] = useState(1)

  const clamp = (value: number) => Math.min(Math.max(1, value), Math.max(1, max))
  const outOfStock = max === 0

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Mobilde kutu tam genişlik oluyor; justify-between olmadan −/+ sola
          sıkışıp sağda ~200px boşluk kalıyordu. */}
      <div className="flex items-center justify-between sm:justify-start border border-gray-200 rounded-xl overflow-hidden shrink-0 self-stretch sm:self-auto">
        <button
          type="button"
          onClick={() => setQuantity((q) => clamp(q - 1))}
          disabled={outOfStock || quantity <= 1}
          aria-label="Adedi azalt"
          className="px-4 py-3.5 text-lg font-bold text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        >
          −
        </button>

        <label htmlFor="urun-adet" className="sr-only">
          Adet
        </label>
        <input
          id="urun-adet"
          type="number"
          inputMode="numeric"
          min={1}
          max={Math.max(1, max)}
          value={quantity}
          disabled={outOfStock}
          onChange={(e) => setQuantity(clamp(Number(e.target.value) || 1))}
          className="w-14 text-center font-bold text-gray-900 border-0 focus:ring-0 focus:outline-none disabled:opacity-40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />

        <button
          type="button"
          onClick={() => setQuantity((q) => clamp(q + 1))}
          disabled={outOfStock || quantity >= max}
          aria-label="Adedi artır"
          className="px-4 py-3.5 text-lg font-bold text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        >
          +
        </button>
      </div>

      <AddToCartButton
        product={product}
        quantity={quantity}
        disabled={outOfStock}
        className={className}
      />
    </div>
  )
}
