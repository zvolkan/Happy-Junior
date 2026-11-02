/**
 * "HAPPY JUNIOR" yazısı — mağaza logosundaki yazının sitedeki karşılığı.
 *
 * Görsel değil metin olarak çiziliyor: her boyutta keskin, hafif ve
 * renkleri tek yerden değişiyor. Logodaki ayrıntılar korunuyor:
 *  - HAPPY açık pembe, JUNIOR turkuaz, harflerin etrafında ince koyu kontur
 *  - ilk P hafifçe sola yatık
 *  - iki kelimenin arasında, altta gülümseme; JUNIOR'un üstünde iki göz
 *
 * Ekran okuyucu yalnızca "Happy Junior" duyar; süslemeler aria-hidden.
 */

interface Props {
  className?: string
  /** Harf konturu; koyu zeminde (footer) beyaz verilir */
  kontur?: string
}

const PEMBE = '#F898E0'
const TURKUAZ = '#68D0D0'

export default function MarkaYazisi({ className = '', kontur = '#271A55' }: Props) {
  const harf: React.CSSProperties = {
    WebkitTextStroke: `0.055em ${kontur}`,
    paintOrder: 'stroke fill',
  }

  return (
    <span
      className={`relative inline-flex items-baseline whitespace-nowrap font-logo leading-none tracking-[-0.01em] ${className}`}
      aria-label="Happy Junior"
      role="img"
    >
      <span aria-hidden="true" style={{ ...harf, color: PEMBE }}>
        HA
        <span className="inline-block origin-bottom -rotate-[16deg] translate-y-[0.04em] -ml-[0.02em] -mr-[0.1em]">P</span>
        PY
      </span>

      {/* gülümseme: kelimelerin arasında, satırın altında */}
      <svg
        aria-hidden="true"
        viewBox="0 0 56 28"
        className="mx-[0.02em] h-[0.5em] w-[0.7em] self-end translate-y-[0.36em]"
        fill="none"
        stroke={kontur}
        strokeWidth="3.5"
        strokeLinecap="round"
      >
        <path d="M5 6 Q26 34 51 8" />
      </svg>

      <span aria-hidden="true" className="relative" style={{ ...harf, color: TURKUAZ }}>
        {/* iki göz, J'nin üstünde */}
        <span className="absolute -top-[0.34em] left-[0.02em] flex gap-[0.1em]">
          <span className="h-[0.15em] w-[0.15em] rounded-full" style={{ background: kontur }} />
          <span className="h-[0.15em] w-[0.15em] rounded-full" style={{ background: kontur }} />
        </span>
        JUNIOR
      </span>
    </span>
  )
}
