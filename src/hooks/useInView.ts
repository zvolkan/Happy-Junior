'use client'

import { useEffect, useRef, useState } from 'react'

interface UseInViewOptions {
  /** Öğenin ne kadarı görününce tetiklensin (0–1). Varsayılan: 0.15 */
  threshold?: number
  /** Görüş alanı kenar payı. Varsayılan: alt kenardan 80px önce tetikle */
  rootMargin?: string
  /** true → bir kez görününce bir daha izleme. Varsayılan: true */
  once?: boolean
}

/**
 * Bir öğe görüş alanına girdiğinde `inView` değerini true yapar.
 * IntersectionObserver kullanır; SSR ve eski tarayıcılarda içerik
 * animasyonsuz ama görünür kalır (asla gizli takılmaz).
 */
export function useInView<T extends HTMLElement = HTMLDivElement>(
  options: UseInViewOptions = {},
) {
  const {
    threshold = 0.15,
    rootMargin = '0px 0px -80px 0px',
    once = true,
  } = options

  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Tarayıcı desteklemiyorsa içeriği gizli bırakma
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }

    // Öğe zaten ekranın üstünde kaldıysa (ör. sayfa yenilenince aşağıdaysanız)
    // observer ilk çağrısında bunu zaten yakalar — ek kontrol gerekmez.
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry) return

        if (entry.isIntersecting) {
          setInView(true)
          if (once) observer.disconnect()
        } else if (!once) {
          setInView(false)
        }
      },
      { threshold, rootMargin },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold, rootMargin, once])

  return { ref, inView }
}

export default useInView
