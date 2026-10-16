import Link from 'next/link'
import Image from 'next/image'
import { BRAND } from '@/lib/constants'
import type { BrandKey, Product } from '@/lib/types'
import BalonSahnesi from './BalonSahnesi'

interface Props {
  brandKey: BrandKey
  /** Sağdaki fotoğraf yığını için öne çıkan ürünler (ilk üçü kullanılır). */
  urunler?: Product[]
}

/**
 * Ana sayfa hero'su.
 *
 * Sayfanın tek "kendiliğinden hareket eden" anı burası: arka planda balon
 * sahnesi (canvas). Ziyaretçi balona dokunursa patlar — mağazanın oyunbaz
 * tonunu ilk saniyede veren şey bu. Geri kalan her şey sakin.
 *
 * Sağdaki fotoğraflar gerçek ürünlerden geliyor; ürün yoksa yığın çizilmez.
 */
export default function BrandHeroSection({ urunler = [] }: Props) {
  const cfg = BRAND
  const satirlar = cfg.tagline.split('\n')
  const kartlar = urunler
    .map((u) => ({ u, img: u.images.find((i) => i.isPrimary)?.url ?? u.images[0]?.url }))
    .filter((k) => k.img)
    .slice(0, 3)

  // Yığındaki üç fotoğrafın duruşu: eğim ve kayma
  const duruslar = [
    'rotate-[-7deg] -translate-x-10 translate-y-6 z-10',
    'rotate-[5deg] translate-x-16 -translate-y-4 z-20',
    'rotate-[-2deg] translate-x-2 translate-y-24 z-30',
  ]

  return (
    <section className="relative overflow-hidden bg-brand-50">
      <BalonSahnesi />

      <div className="relative z-10 container-main grid lg:grid-cols-[1.1fr_1fr] gap-10 items-center py-16 sm:py-20 lg:py-24 pointer-events-none">
        <div className="max-w-xl pointer-events-auto">
          <h1 className="font-display text-[clamp(2.75rem,8vw,5.5rem)] leading-[0.95] font-extrabold text-ink tracking-[-0.03em] anim-fade-up">
            {satirlar.map((s, i) => (
              <span key={i} className="block">
                {s}
              </span>
            ))}
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-ink/75 leading-relaxed max-w-md anim-fade-up anim-delay-150">
            {cfg.description}
          </p>

          <div className="mt-9 flex flex-wrap gap-4 anim-fade-up anim-delay-300">
            <Link href={cfg.cta.href} className="btn-sticker px-7 py-3.5 text-lg">
              {cfg.cta.label}
            </Link>
            <a
              href={`https://wa.me/${cfg.whatsapp.phone}?text=${encodeURIComponent(cfg.whatsapp.message)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-sticker btn-acik px-7 py-3.5 text-lg"
            >
              {cfg.ctaSecondary.label}
            </a>
          </div>

          <p className="mt-6 text-sm text-ink/55">Balonlara dokunun, patlasınlar.</p>
        </div>

        {kartlar.length > 0 && (
          <div className="relative h-[380px] sm:h-[460px] pointer-events-auto hidden sm:block">
            {kartlar.map(({ u, img }, i) => (
              <Link
                key={u.slug}
                href={`/urunler/${u.slug}`}
                className={`group absolute left-1/2 top-0 -ml-[120px] w-[240px] sm:w-[260px] bg-white p-3 pb-12 rounded-md shadow-[0_18px_40px_-14px_rgba(39,26,85,0.45)] transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:rotate-0 hover:scale-[1.04] hover:z-40 ${duruslar[i]}`}
              >
                <span className="block relative aspect-[4/5] overflow-hidden rounded-sm bg-brand-100">
                  <Image src={img!} alt={u.name} fill sizes="260px" className="object-cover" priority={i === 0} />
                </span>
                <span className="absolute left-3 right-3 bottom-3 font-display font-bold text-ink text-sm truncate">
                  {u.name}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
