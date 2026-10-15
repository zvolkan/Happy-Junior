'use client'

import { useEffect, useRef, useState } from 'react'
import ProductImage from './ProductImage'
import type { ProductImage as ProductImageType } from '@/lib/types'
import type { IconName } from '@/components/ui/Icon'

interface Props {
  images: ProductImageType[]
  productName: string
  fallback?: IconName
  /** Sağ üstte gösterilecek rozet (indirim / öne çıkan) */
  badge?: React.ReactNode
}

/**
 * Ürün detay galerisi.
 *
 * Önceden detay sayfası yalnızca kapak görselini gösteriyordu; ürüne kaç görsel
 * eklenirse eklensin diğerleri hiçbir yerde görünmüyordu. Gübre alıcısı
 * ambalajın arkasındaki analiz tablosunu, cihaz alıcısı da kurulum/ölçü
 * görselini göremiyordu.
 */
export default function ProductGallery({ images, productName, fallback = 'paket', badge }: Props) {
  const [index, setIndex] = useState(0)
  const [zoomed, setZoomed] = useState(false)

  const safeImages = images.filter((i) => i.url)
  const count = safeImages.length
  const active = safeImages[Math.min(index, Math.max(count - 1, 0))]

  const go = (delta: number) => {
    if (count < 2) return
    setIndex((current) => (current + delta + count) % count)
  }

  // Büyütülmüş görünüm açılınca odağın kaçtığı yeri hatırla
  const acilistanOncekiOdak = useRef<HTMLElement | null>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  // ── Büyütme açıkken klavye: gezinme + ODAK TUZAĞI ────────────────────────
  //
  // Pencere `aria-modal="true"` beyan ediyordu ama odak hiç içeri taşınmıyordu.
  // Ekran okuyucuya "bu bir kalıcı pencere, arkası kapalı" deniyor, gerçekte
  // ise Tab tuşu arkadaki sayfada dolaşmaya devam ediyordu — yani beyan ile
  // davranış çelişiyordu. Klavye kullanıcısı pencereyi kapatamadan arka
  // plandaki bağlantılara gidiyordu.
  //
  // Üç parça: (1) açılışta odak pencereye taşınıyor, (2) Tab ve Shift+Tab
  // pencerenin ilk/son öğesi arasında dönüyor, (3) kapanışta odak, pencereyi
  // açan öğeye geri dönüyor. Üçüncüsü olmadan pencere kapanınca odak sayfanın
  // en başına düşer ve kullanıcı yerini kaybeder.
  useEffect(() => {
    if (!zoomed) return

    acilistanOncekiOdak.current = document.activeElement as HTMLElement | null

    /** Pencere içindeki odaklanılabilir öğeler — DOM sırasıyla. */
    const odaklanabilirler = (): HTMLElement[] => {
      const kok = modalRef.current
      if (!kok) return []
      return Array.from(
        kok.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => !el.hasAttribute('disabled'))
    }

    // Açılışta odağı içeri al.
    odaklanabilirler()[0]?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setZoomed(false)
        return
      }
      if (e.key === 'ArrowRight') {
        go(1)
        return
      }
      if (e.key === 'ArrowLeft') {
        go(-1)
        return
      }
      if (e.key !== 'Tab') return

      const oge = odaklanabilirler()
      if (oge.length === 0) return

      const ilk = oge[0]
      const son = oge[oge.length - 1]
      const simdiki = document.activeElement

      // Sondan ileri → başa; baştan geri → sona. Odak pencerenin dışına
      // çıkmışsa (arka plana kaçmışsa) da içeri geri çekiliyor.
      if (e.shiftKey && (simdiki === ilk || !modalRef.current?.contains(simdiki))) {
        e.preventDefault()
        son.focus()
      } else if (!e.shiftKey && (simdiki === son || !modalRef.current?.contains(simdiki))) {
        e.preventDefault()
        ilk.focus()
      }
    }

    document.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
      acilistanOncekiOdak.current?.focus?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoomed, count])

  return (
    <div className="flex flex-col">
      {/* Ana görsel */}
      <div className="img-zoom bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center min-h-72 md:min-h-[420px] relative overflow-hidden group">
        <ProductImage
          src={active?.url ?? ''}
          alt={active?.alt || productName}
          fallback={fallback}
          fill
          className="img-zoom-target object-contain p-6"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />

        {badge}

        {/* Büyüt */}
        {active?.url && (
          <button
            type="button"
            onClick={() => setZoomed(true)}
            aria-label="Görseli büyüt"
            className="absolute bottom-3 right-3 z-10 w-9 h-9 rounded-full bg-white/85 backdrop-blur text-gray-700 shadow-sm flex items-center justify-center hover:bg-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="7" />
              <path strokeLinecap="round" d="M20 20l-3.2-3.2M11 8.5v5M8.5 11h5" />
            </svg>
          </button>
        )}

        {/* Oklar */}
        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Önceki görsel"
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/85 backdrop-blur text-gray-700 shadow-sm flex items-center justify-center hover:bg-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Sonraki görsel"
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/85 backdrop-blur text-gray-700 shadow-sm flex items-center justify-center hover:bg-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <span className="absolute bottom-3 left-3 z-10 text-[11px] font-semibold text-gray-600 bg-white/85 backdrop-blur px-2.5 py-1 rounded-full">
              {index + 1} / {count}
            </span>
          </>
        )}
      </div>

      {/* Küçük görseller */}
      {count > 1 && (
        <div className="flex gap-2 p-3 overflow-x-auto bg-white">
          {safeImages.map((image, i) => (
            <button
              key={`${image.url}-${i}`}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`${i + 1}. görseli göster`}
              aria-current={i === index}
              className={`relative shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 bg-gray-50 transition-colors ${
                i === index ? 'border-gray-900' : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              <ProductImage
                src={image.url}
                alt={image.alt || `${productName} görsel ${i + 1}`}
                fallback={fallback}
                fill
                className="object-contain p-1"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}

      {/* Büyütülmüş görünüm */}
      {zoomed && active?.url && (
        <div
          ref={modalRef}
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setZoomed(false)}
          role="dialog"
          aria-modal="true"
          aria-label={`${productName} görseli`}
        >
          <button
            type="button"
            onClick={() => setZoomed(false)}
            aria-label="Kapat"
            className="absolute top-4 right-4 text-white/80 hover:text-white text-3xl leading-none"
          >
            ×
          </button>

          {count > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  go(-1)
                }}
                aria-label="Önceki görsel"
                className="absolute left-4 text-white/70 hover:text-white text-4xl leading-none px-3"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  go(1)
                }}
                aria-label="Sonraki görsel"
                className="absolute right-4 text-white/70 hover:text-white text-4xl leading-none px-3"
              >
                ›
              </button>
            </>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={active.url}
            alt={active.alt || productName}
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-[88vh] object-contain select-none"
          />

          {count > 1 && (
            <span className="absolute bottom-5 text-white/70 text-sm">
              {index + 1} / {count}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
