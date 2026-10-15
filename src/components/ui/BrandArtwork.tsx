import type { CSSProperties } from 'react'

export type ArtworkVariant = 'tarla' | 'su' | 'ekip' | 'blog'

interface Props {
  variant: ArtworkVariant
  className?: string
  style?: CSSProperties
}

/**
 * Marka renklerine uyum sağlayan vektör görseller.
 *
 * Fotoğraf yerine kullanılıyor: gerçek saha fotoğrafı gelene kadar sayfalarda
 * gri kutular ve emoji yer tutucuları duruyordu, bu da "eksik" hissi veriyordu.
 * Bunlar dosya değil bileşen olduğu için:
 *
 * - Renkleri `--brand-*` değişkenlerinden alıyor, yani ALB Tarım'da yeşil,
 *   ALB Su'da mavi çıkıyor; iki ayrı görsel hazırlamak gerekmiyor.
 * - Her ekran çözünürlüğünde net; ek ağ isteği yok.
 *
 * Gerçek fotoğraflar hazır olduğunda bu bileşenlerin yerine `<Image>` konur.
 */
export default function BrandArtwork({ variant, className = '', style }: Props) {
  const common = {
    className,
    style,
    'aria-hidden': true as const,
    preserveAspectRatio: 'xMidYMid slice',
  }

  if (variant === 'tarla') {
    return (
      <svg viewBox="0 0 800 450" {...common}>
        <defs>
          <linearGradient id="art-tarla-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(var(--brand-900))" />
            <stop offset="100%" stopColor="rgb(var(--brand-700))" />
          </linearGradient>
        </defs>
        <rect width="800" height="450" fill="url(#art-tarla-sky)" />
        <circle cx="640" cy="105" r="46" fill="rgb(var(--brand-accent))" opacity="0.85" />

        {/* Tepeler */}
        <path d="M0 300 Q 180 240 380 296 T 800 262 V450 H0 Z" fill="rgb(var(--brand-800))" opacity="0.85" />
        <path d="M0 340 Q 220 292 430 344 T 800 316 V450 H0 Z" fill="rgb(var(--brand-600))" opacity="0.9" />

        {/* Ekili sıralar */}
        {Array.from({ length: 9 }).map((_, i) => (
          <path
            key={i}
            d={`M${-60 + i * 105} 450 Q ${20 + i * 105} 392 ${140 + i * 105} 372`}
            stroke="rgb(var(--brand-accent))"
            strokeOpacity={0.28}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        ))}

        {/* Başak */}
        <g transform="translate(120 250)" stroke="rgb(var(--brand-accent))" strokeWidth="4" fill="none" strokeLinecap="round">
          <path d="M0 130 V20" />
          {Array.from({ length: 5 }).map((_, i) => (
            <g key={i} transform={`translate(0 ${28 + i * 21})`}>
              <path d="M0 0 Q -22 -10 -30 -30" />
              <path d="M0 0 Q 22 -10 30 -30" />
            </g>
          ))}
        </g>
      </svg>
    )
  }

  if (variant === 'su') {
    return (
      <svg viewBox="0 0 800 450" {...common}>
        <defs>
          <linearGradient id="art-su-bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgb(var(--brand-900))" />
            <stop offset="100%" stopColor="rgb(var(--brand-600))" />
          </linearGradient>
        </defs>
        <rect width="800" height="450" fill="url(#art-su-bg)" />

        {/* Dalgalar */}
        {[0, 1, 2].map((i) => (
          <path
            key={i}
            d={`M0 ${300 + i * 40} Q 100 ${272 + i * 40} 200 ${300 + i * 40} T 400 ${300 + i * 40} T 600 ${300 + i * 40} T 800 ${300 + i * 40} V450 H0 Z`}
            fill="rgb(var(--brand-accent))"
            opacity={0.1 + i * 0.06}
          />
        ))}

        {/* Damla */}
        <path
          d="M400 96 C 400 96 470 190 470 240 a70 70 0 0 1 -140 0 c0 -50 70 -144 70 -144 Z"
          fill="rgb(var(--brand-accent))"
          opacity="0.9"
        />
        <path
          d="M372 236 a28 28 0 0 0 28 28"
          stroke="rgb(var(--brand-900))"
          strokeOpacity="0.35"
          strokeWidth="7"
          fill="none"
          strokeLinecap="round"
        />

        {/* Halkalar */}
        {[70, 120, 170].map((r, i) => (
          <circle
            key={r}
            cx="400"
            cy="352"
            r={r}
            fill="none"
            stroke="rgb(var(--brand-accent))"
            strokeOpacity={0.3 - i * 0.08}
            strokeWidth="2"
          />
        ))}
      </svg>
    )
  }

  if (variant === 'ekip') {
    return (
      <svg viewBox="0 0 800 300" {...common}>
        <defs>
          <linearGradient id="art-ekip-bg" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgb(var(--brand-800))" />
            <stop offset="100%" stopColor="rgb(var(--brand-600))" />
          </linearGradient>
        </defs>
        <rect width="800" height="300" fill="url(#art-ekip-bg)" />

        {/* Silüetler — farklı boy ve konumda, kalabalık hissi */}
        {[
          { x: 120, s: 1.0, o: 0.5 },
          { x: 250, s: 1.18, o: 0.68 },
          { x: 400, s: 1.32, o: 0.85 },
          { x: 550, s: 1.18, o: 0.68 },
          { x: 680, s: 1.0, o: 0.5 },
        ].map((p) => (
          <g key={p.x} transform={`translate(${p.x} 300) scale(${p.s})`} opacity={p.o}>
            <circle cx="0" cy="-146" r="30" fill="rgb(var(--brand-accent))" />
            <path d="M-52 0 v-72 a52 52 0 0 1 104 0 V0 Z" fill="rgb(var(--brand-accent))" />
          </g>
        ))}
      </svg>
    )
  }

  // blog
  return (
    <svg viewBox="0 0 800 450" {...common}>
      <defs>
        <linearGradient id="art-blog-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgb(var(--brand-800))" />
          <stop offset="100%" stopColor="rgb(var(--brand-600))" />
        </linearGradient>
      </defs>
      <rect width="800" height="450" fill="url(#art-blog-bg)" />

      {/* Soyut geometri */}
      <circle cx="660" cy="80" r="150" fill="rgb(var(--brand-accent))" opacity="0.12" />
      <circle cx="120" cy="400" r="200" fill="rgb(var(--brand-accent))" opacity="0.08" />

      {/* Yazı satırlarını andıran çizgiler */}
      <g stroke="rgb(var(--brand-accent))" strokeLinecap="round" strokeWidth="10" opacity="0.55">
        <path d="M260 190 H540" />
        <path d="M260 232 H600" strokeOpacity="0.6" />
        <path d="M260 274 H460" strokeOpacity="0.4" />
      </g>
    </svg>
  )
}
