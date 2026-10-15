'use client'

import { useState, useEffect, useRef, Fragment } from 'react'
import Link from 'next/link'
import { BRANDS } from '@/lib/constants'
import type { BrandKey } from '@/lib/types'

interface Props {
  brandKey: BrandKey
}

/**
 * Marka hero bölümü.
 *
 * ── Giriş animasyonu neden state'te DEĞİL ───────────────────────────────────
 *
 * Başlık, alt başlık, açıklama ve butonlar eskiden `loaded` adlı bir React
 * state'ine bağlıydı: sunucudan `opacity-0` geliyor, tarayıcıda 100 ms'lik bir
 * `setTimeout` çalışınca görünür oluyorlardı. Yani hero'nun tamamı JavaScript'e
 * bağımlıydı. Hidrasyon gecikirse, bir hata sınırı devreye girerse ya da JS hiç
 * çalışmazsa sayfa tamamen boş kalıyordu — görsel QA'da `/` sayfasının
 * "soluk" render olmasının sebebi buydu.
 *
 * Artık giriş animasyonu saf CSS (`anim-fade-up`, animations.css). `both` dolgu
 * kipiyle tanımlı olduğu için animasyon bittiğinde öğe görünür kalıyor ve
 * JavaScript hiç çalışmasa bile içerik okunuyor. "Hareketi azalt" ayarı da
 * aynı dosyadaki blokla kendiliğinden destekleniyor.
 */
export default function BrandHeroSection({ brandKey }: Props) {
  const cfg = BRANDS[brandKey]

  const [videoSrc, setVideoSrc]     = useState<string | null>(null)
  const [videoError, setVideoError] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  // ── Video kaynağı — ve videoyu hiç yüklememe kararı ──────────────────────
  //
  // Masaüstü videosu 11 MB, mobil sürüm 5,5 MB. `autoPlay` ile bu dosya her
  // ziyarette, kullanıcı istemeden iniyor. Mobil veride bu tek başına kabul
  // edilemez bir maliyet ve hero'nun okunması için gerekli DEĞİL — altındaki
  // gradyan zaten tasarımın parçası ve tek başına düzgün görünüyor.
  //
  // İki durumda video hiç yüklenmiyor:
  //   • "Hareketi azalt" ayarı açıksa (erişilebilirlik tercihi; otomatik
  //     oynayan tam ekran video bu tercihin tam olarak dışladığı şey).
  //   • Tarayıcı "veri tasarrufu" bildiriyorsa (Save-Data).
  //
  // Video dosyalarının kendisi de sıkıştırılmalı (720p, 1–1,5 MB hedefi) —
  // o iş bu dosyanın dışında.
  useEffect(() => {
    const hareketAzalt = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

    // `connection` henüz her tarayıcıda standart değil; tipini burada daraltıyoruz.
    const baglanti = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
    const veriTasarrufu = baglanti?.saveData === true

    if (hareketAzalt || veriTasarrufu) {
      setVideoSrc(null)
      return
    }

    const src = window.innerWidth < 768 && cfg.videoMobile
      ? cfg.videoMobile
      : cfg.video
    setVideoSrc(src)
    setVideoError(false)
  }, [cfg.video, cfg.videoMobile])

  const taglineLines = cfg.tagline.split('\n')

  // Renk şeması — tonlar <html data-brand="..."> üzerinden geliyor,
  // burada marka ayrımı yapmaya gerek yok.
  const heroBg       = 'from-brand-900 via-brand-800 to-brand-900'
  const overlayColor = 'from-brand-900/85 via-brand-800/60 to-brand-900/80'
  const tagText      = 'text-brand-400'
  // Vurgu rengi (tarımda limon yeşili, suda turkuaz) yalnızca KOYU zeminde
  // kullanılıyor. Beyaz üzerinde kontrastı 1,5:1 — okunmaz. Burada zemin
  // olarak kullanılıp üstüne en koyu marka tonu yazılıyor: 9,9:1.
  const primaryBtn   = 'bg-brand-accent hover:brightness-110 shadow-brand-accent/30 text-brand-900'
  const outlineBtn   = 'border-brand-400/60 hover:bg-brand-400/10 focus:ring-brand-400'
  const badgeBg      = 'bg-brand-accent/90 border-brand-accent text-brand-900'
  const dividerColor = 'bg-brand-500/40'

  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden -mt-14 sm:-mt-16 md:-mt-[6.5rem]">

      {/* ── Arka Plan Katmanı ── */}
      <div className="absolute inset-0 z-0" aria-hidden="true">

        {/* Fallback gradient (video yokken veya hata varsa görünür) */}
        <div className={`absolute inset-0 bg-gradient-to-br ${heroBg}`} />

        {/* ── Video oynatılmayacaksa: hareketsiz poster ────────────────────
            "Hareketi azalt" tercihi açıkken ya da video yüklenemediğinde
            arka plan tamamen boş bir degradeye düşüyordu. Oysa tercih
            HAREKETE karşı; duran bir fotoğraf o tercihi birebir karşılıyor
            ve bomboş bir degradeden çok daha iyi görünüyor.

            Poster zaten videonun birinci karesi, yani hareket kapalıyken
            görülen sahne, açıkken videonun başladığı sahneyle aynı.

            Görsel yoksa `<img>`
            boş render edilir ve altındaki degrade görünür — kırık simge
            çıkmaması için `alt` bilerek boş. */}
        {cfg.poster && (!videoSrc || videoError) && (
          <img
            src={cfg.poster}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Video — kaynağı mobil (<768px) veya masaüstüne göre seçilir */}
        {!videoError && videoSrc && (
          <video
            key={videoSrc}
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            // ── `preload="none"` KALDIRILDI ─────────────────────────────
            //
            // `autoPlay` ile birlikte çelişkili bir çift: biri "indirme"
            // diyor, diğeri "oynat". Chrome bu durumda yüklemeyi erteliyor,
            // oynatma hiç başlamıyor, dolayısıyla `canplay` olayı da hiç
            // tetiklenmiyordu. Aşağıdaki opacity kapısı o olaya bağlı
            // olduğu için video sonsuza kadar görünmez kalıyordu —
            // masaüstünde hero'da yalnızca gradyan görünmesinin sebebi bu.
            //
            // `metadata` otomatik oynatmanın başlaması için yeterli ve
            // dosyanın tamamını peşinen indirmiyor. Asıl veri tasarrufu
            // zaten yukarıda: "hareketi azalt" ve "veri tasarrufu"
            // durumlarında video hiç yüklenmiyor, mobile ayrı ve küçük
            // dosya veriliyor (1,8 MB).
            preload="metadata"
            // Poster, video hazır olana kadar görünmesi gereken kare.
            // Oysa `<video>` elemanının KENDİSİ `opacity-0` ile başlıyordu;
            // poster hiçbir zaman görünemiyordu. Artık opacity kapısı yok:
            // poster videonun birinci karesi olduğu için geçiş zaten
            // fark edilmiyor, araya fade koymaya gerek kalmıyor.
            poster={cfg.poster}
            onError={() => setVideoError(true)}
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src={videoSrc} type="video/mp4" />
          </video>
        )}

        {/* Koyu renk gradient overlay — videoyu okunabilir kılar */}
        <div className={`absolute inset-0 bg-gradient-to-br ${overlayColor}`} />

        {/* Üstten alta siyah fade — içerik bölümünü vurgular */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/25" />

        {/* Dekoratif ışık efekti */}
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[300px] rounded-full bg-white/3 blur-3xl pointer-events-none" />
      </div>

      {/* ── Hero İçeriği ── */}
      <div className="relative z-10 flex-1 flex items-center py-24 sm:py-28 lg:py-36 mt-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="max-w-3xl">

            {/* Badge */}
            <div
              className={[
                'inline-flex items-center gap-2 border rounded-full px-4 py-2 text-sm font-medium mb-6',
                badgeBg,
                'anim-fade-up',
              ].join(' ')}
            >
              <span className="w-2 h-2 rounded-full bg-current opacity-80 animate-pulse" />
              {cfg.badge}
            </div>

            {/* Alt başlık */}
            <p
              className={[
                'text-sm sm:text-base font-semibold text-white/55 uppercase tracking-[0.18em] mb-4',
                'anim-fade-up anim-delay-150',
              ].join(' ')}
            >
              {cfg.subtitle}
            </p>

            {/* Ana başlık */}
            <h1
              className={[
                'text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-[1.02] tracking-tight mb-6',
                'anim-fade-up anim-delay-200',
              ].join(' ')}
            >
              {taglineLines.map((line, i) => (
                <Fragment key={i}>
                  <span className={i === 1 ? `${tagText}` : 'text-white'}>
                    {line}
                  </span>
                  {i < taglineLines.length - 1 && <br />}
                </Fragment>
              ))}
            </h1>

            {/* Açıklama */}
            <p
              className={[
                'text-base sm:text-lg lg:text-xl text-white/70 leading-relaxed max-w-2xl mb-10',
                'anim-fade-up anim-delay-300',
              ].join(' ')}
            >
              {cfg.description}
            </p>

            {/* CTA Butonları */}
            <div
              className={[
                'flex flex-col sm:flex-row gap-3 sm:gap-4 mb-16',
                'anim-fade-up anim-delay-400',
              ].join(' ')}
            >
                <>
                  <Link
                    href={cfg.cta.href}
                    className={`inline-flex items-center justify-center gap-2 ${primaryBtn} font-bold text-base sm:text-lg px-8 py-4 rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200`}
                  >
                    {cfg.cta.label}
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                  <Link
                    href={cfg.ctaSecondary.href}
                    className={`inline-flex items-center justify-center gap-2 border-2 ${outlineBtn} text-white font-semibold text-base sm:text-lg px-8 py-4 rounded-2xl backdrop-blur-sm hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200`}
                  >
                    {cfg.ctaSecondary.label}
                  </Link>
                </>
            </div>

            {/* İstatistikler */}
            <div
              className={[
                'flex flex-wrap items-center gap-x-8 gap-y-4',
                'anim-fade-up anim-delay-500',
              ].join(' ')}
            >
              {cfg.stats.map((stat, i) => (
                <Fragment key={stat.label}>
                  <div>
                    <div className="text-2xl sm:text-4xl font-black text-white leading-none break-words">
                      {stat.value}
                    </div>
                    <div className="text-sm text-white/50 mt-1 font-medium">{stat.label}</div>
                  </div>
                  {i < cfg.stats.length - 1 && (
                    <div className={`hidden sm:block w-px h-10 ${dividerColor}`} aria-hidden="true" />
                  )}
                </Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Scroll İndikatörü ── */}
      <div
        className={[
          'relative z-10 flex flex-col items-center gap-2 pb-10',
          'anim-fade-up anim-delay-500',
        ].join(' ')}
        aria-hidden="true"
      >
        <span className="text-white/35 text-[10px] tracking-[0.25em] uppercase font-medium">
          Keşfet
        </span>
        <div className="w-5 h-8 border border-white/25 rounded-full flex items-start justify-center pt-1.5">
          <div className="w-1 h-1.5 bg-white/55 rounded-full animate-bounce" />
        </div>
      </div>
    </section>
  )
}
