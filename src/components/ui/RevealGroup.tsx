'use client'

import { Children, type ReactNode } from 'react'
import Reveal, { type RevealProps, type RevealTag, type RevealVariant } from './Reveal'

interface RevealGroupProps {
  children: ReactNode
  /** Öğeler arası gecikme (ms). Varsayılan: 90 */
  stagger?: number
  /** İlk öğenin gecikmesi (ms). Varsayılan: 0 */
  baseDelay?: number
  /** Kaçıncı öğeden sonra gecikme artmasın (uzun listelerde bekleme olmasın) */
  maxStaggered?: number
  as?: RevealTag
  variant?: RevealVariant
  duration?: RevealProps['duration']
  once?: RevealProps['once']
  threshold?: RevealProps['threshold']
  /** Her bir sarmalayıcıya verilecek sınıf (ör. "h-full") */
  itemClassName?: string
}

/**
 * Çocuklarını sırayla, birer birer getirir — grid ve listeler için.
 *
 *   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 *     <RevealGroup itemClassName="h-full">
 *       {urunler.map((u) => <ProductCard key={u.id} {...u} />)}
 *     </RevealGroup>
 *   </div>
 *
 * Her çocuk kendi <Reveal> sarmalayıcısını alır; grid düzeni bozulmaz
 * çünkü sarmalayıcı çocuğun yerini alır.
 */
export default function RevealGroup({
  children,
  stagger = 90,
  baseDelay = 0,
  maxStaggered = 8,
  as,
  variant = 'up',
  duration,
  once,
  threshold,
  itemClassName,
}: RevealGroupProps) {
  return (
    <>
      {Children.map(children, (child, index) => (
        <Reveal
          as={as}
          variant={variant}
          duration={duration}
          once={once}
          threshold={threshold}
          className={itemClassName}
          delay={baseDelay + Math.min(index, maxStaggered) * stagger}
        >
          {child}
        </Reveal>
      ))}
    </>
  )
}
