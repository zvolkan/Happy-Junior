'use client'

import type { CSSProperties, ReactNode } from 'react'
import { useInView } from '@/hooks/useInView'

export type RevealVariant = 'up' | 'down' | 'left' | 'right' | 'fade' | 'scale' | 'blur'

/** `as` için desteklenen HTML etiketleri (özel bileşen değil, düz etiket) */
export type RevealTag =
  | 'div' | 'section' | 'article' | 'aside' | 'header' | 'footer'
  | 'ul' | 'ol' | 'li' | 'span' | 'p' | 'figure'
  | 'h1' | 'h2' | 'h3' | 'h4'

export interface RevealProps {
  children: ReactNode
  /** Sarmalayıcı etiket. Varsayılan: div */
  as?: RevealTag
  /** Giriş yönü/biçimi. Varsayılan: up */
  variant?: RevealVariant
  /** Gecikme (ms) — sıralı giriş için */
  delay?: number
  /** Süre (ms) — belirtilmezse CSS varsayılanı (700ms) */
  duration?: number
  /** false → yukarı kaydırınca tekrar animasyon oynar. Varsayılan: true */
  once?: boolean
  /** Tetikleme eşiği 0–1. Varsayılan: 0.15 */
  threshold?: number
  className?: string
  style?: CSSProperties
}

/**
 * Görüş alanına girince içeriği yumuşakça getirir.
 *
 *   <Reveal>            <h2>Biz Kimiz?</h2>        </Reveal>
 *   <Reveal delay={120} variant="left"> ... </Reveal>
 *
 * Not: Grid/flex içinde kullanırken sarmalayıcı öğenin kendisi grid öğesi
 * olur — kart `h-full` kullanıyorsa Reveal'e de className="h-full" verin.
 */
export default function Reveal({
  children,
  as = 'div',
  variant = 'up',
  delay = 0,
  duration,
  once = true,
  threshold = 0.15,
  className = '',
  style,
}: RevealProps) {
  const { ref, inView } = useInView<HTMLDivElement>({ once, threshold })

  // Runtime'da `as` ne verildiyse o etiket render edilir; cast yalnızca
  // TS'in ref/className/style'ı kabul etmesi için.
  const Tag = as as 'div'

  const classes = [
    'reveal',
    `reveal--${variant}`,
    inView ? 'is-visible' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <Tag
      ref={ref}
      className={classes}
      style={{
        transitionDelay: delay ? `${delay}ms` : undefined,
        transitionDuration: duration ? `${duration}ms` : undefined,
        ...style,
      }}
    >
      {children}
    </Tag>
  )
}
