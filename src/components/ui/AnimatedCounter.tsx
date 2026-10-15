'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useInView } from '@/hooks/useInView'

/** SSR'de uyarı vermeyen layout effect */
const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

interface ParsedValue {
  prefix: string
  target: number
  suffix: string
  grouped: boolean
}

/**
 * "16.000+" → { prefix: '', target: 16000, suffix: '+', grouped: true }
 * "81 İl"   → { prefix: '', target: 81,    suffix: ' İl', grouped: false }
 * "7/24"    → null  (birden fazla sayı var, animasyon uygulanmaz)
 */
function parseValue(raw: string): ParsedValue | null {
  const match = raw.match(/^(\D*)([\d.,]+)([\s\S]*)$/)
  if (!match) return null

  const [, prefix, numberPart, suffix] = match

  // "7/24" gibi ikinci bir sayı varsa dokunma
  if (/\d/.test(suffix)) return null

  const digits = numberPart.replace(/[.,]/g, '')
  const target = Number.parseInt(digits, 10)
  if (!Number.isFinite(target)) return null

  return {
    prefix,
    target,
    suffix,
    grouped: /[.,]/.test(numberPart),
  }
}

function format(value: number, grouped: boolean) {
  return grouped ? value.toLocaleString('tr-TR') : String(value)
}

interface AnimatedCounterProps {
  /** Gösterilecek değer: "20+", "16.000+", "81 İl", "500+" … */
  value: string
  /** Sayma süresi (ms). Varsayılan: 1600 */
  duration?: number
  /** Başlangıç gecikmesi (ms) */
  delay?: number
  className?: string
}

/**
 * Görüş alanına girince sayıyı 0'dan hedefe kadar sayar.
 *
 *   <AnimatedCounter value="16.000+" className="text-4xl font-black" />
 *
 * Sayıya çevrilemeyen değerler ("7/24" gibi) olduğu gibi yazılır.
 * Sunucu tarafında ve JS kapalıyken nihai değer görünür.
 */
export default function AnimatedCounter({
  value,
  duration = 1600,
  delay = 0,
  className,
}: AnimatedCounterProps) {
  const parsed = parseValue(value)
  const { ref, inView } = useInView<HTMLSpanElement>({ threshold: 0.4 })

  // İlk render (SSR dahil) nihai değeri gösterir → içerik hiçbir zaman "0" kalmaz
  const [display, setDisplay] = useState(value)
  const frameRef = useRef<number | null>(null)

  // Boyamadan önce sıfıra çek — böylece "önce sonuç, sonra sıfır" titremesi olmaz
  useIsoLayoutEffect(() => {
    if (!parsed) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    setDisplay(`${parsed.prefix}${format(0, parsed.grouped)}${parsed.suffix}`)
    // parsed her render'da yeniden üretiliyor; bağımlılık olarak `value` yeterli
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  useEffect(() => {
    if (!parsed || !inView) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(value)
      return
    }

    const { prefix, target, suffix, grouped } = parsed
    let startTime: number | null = null

    const tick = (now: number) => {
      if (startTime === null) startTime = now
      const elapsed = now - startTime - delay

      if (elapsed < 0) {
        frameRef.current = requestAnimationFrame(tick)
        return
      }

      const progress = Math.min(elapsed / duration, 1)
      // easeOutExpo — hızlı başlar, yumuşak durur
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
      const current = Math.round(target * eased)

      setDisplay(`${prefix}${format(current, grouped)}${suffix}`)

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick)
      } else {
        setDisplay(value) // orijinal biçimlendirmeye dön
      }
    }

    frameRef.current = requestAnimationFrame(tick)

    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, value, duration, delay])

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  )
}
