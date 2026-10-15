'use client'

import { useEffect, useRef } from 'react'

/**
 * Sayfanın en üstünde ince bir okuma ilerlemesi çizgisi.
 *
 * Uzun ürün ve içerik sayfalarında "daha ne kadar var" hissini veriyor.
 * Genişlik yerine `transform: scaleX` kullanılıyor — düzen yeniden
 * hesaplanmadığı için kaydırma sırasında takılma yapmıyor.
 */
export default function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let frame = 0

    const update = () => {
      frame = 0
      const bar = barRef.current
      if (!bar) return

      const scrollable = document.documentElement.scrollHeight - window.innerHeight
      // Kısa sayfalarda çizgi anlamsız; gizle
      if (scrollable < 400) {
        bar.style.opacity = '0'
        return
      }

      const ratio = Math.min(1, Math.max(0, window.scrollY / scrollable))
      bar.style.opacity = ratio > 0.01 ? '1' : '0'
      bar.style.transform = `scaleX(${ratio})`
    }

    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)

    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <div
      ref={barRef}
      aria-hidden="true"
      className="scroll-progress w-full opacity-0 transition-opacity duration-300"
      style={{ transform: 'scaleX(0)' }}
    />
  )
}
