'use client'

import { useEffect } from 'react'

/**
 * `.btn-sticker` butonlarının etkileşim katmanı — sayfa genelinde TEK dinleyici.
 *
 * - pointermove: imlecin buton içindeki konumunu `--mx` / `--my` olarak yazar;
 *   CSS bu değerle ışığı (ve açık butonda sarı dolguyu) imlecin altına taşır.
 * - pointerdown: basılan noktaya bir `.btn-dalga` ekler, animasyon bitince siler.
 *
 * Her butona ayrı dinleyici bağlamaktan ucuz; yeni eklenen butonlar da
 * kendiliğinden çalışır. "Hareketi azalt" açıksa dalga eklenmez.
 */
export default function ButonEfekti() {
  useEffect(() => {
    const azalt = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const konum = (e: PointerEvent) => {
      const btn = (e.target as Element | null)?.closest<HTMLElement>('.btn-sticker')
      if (!btn) return null
      const r = btn.getBoundingClientRect()
      return { btn, x: e.clientX - r.left, y: e.clientY - r.top }
    }

    const hareket = (e: PointerEvent) => {
      const k = konum(e)
      if (!k) return
      k.btn.style.setProperty('--mx', `${k.x}px`)
      k.btn.style.setProperty('--my', `${k.y}px`)
    }

    const bas = (e: PointerEvent) => {
      if (azalt) return
      const k = konum(e)
      if (!k || (k.btn as HTMLButtonElement).disabled) return
      const dalga = document.createElement('span')
      dalga.className = 'btn-dalga'
      dalga.style.left = `${k.x}px`
      dalga.style.top = `${k.y}px`
      k.btn.appendChild(dalga)
      dalga.addEventListener('animationend', () => dalga.remove(), { once: true })
    }

    document.addEventListener('pointermove', hareket, { passive: true })
    document.addEventListener('pointerover', hareket, { passive: true })
    document.addEventListener('pointerdown', bas, { passive: true })
    return () => {
      document.removeEventListener('pointermove', hareket)
      document.removeEventListener('pointerover', hareket)
      document.removeEventListener('pointerdown', bas)
    }
  }, [])

  return null
}
