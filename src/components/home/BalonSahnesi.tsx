'use client'

import { useEffect, useRef } from 'react'

/**
 * Ana sayfa hero'sundaki hareketli sahne (canvas).
 *
 * Balonlar, yıldızlar ve kalpler yavaşça yukarı süzülür. İmleç ya da parmak
 * yaklaşınca kenara kaçarlar; bir balona dokunulunca patlar ve renkli konfeti
 * saçar. Sahne görünür değilken (sekme arka planda ya da sayfa aşağı
 * kaydırılmışken) çizim durur, pil ve işlemci boşa harcanmaz.
 *
 * "Hareketi azalt" açıksa yalnızca tek bir sabit kare çizilir.
 */

type Tur = 'balon' | 'yildiz' | 'kalp'
interface Parca {
  x: number; y: number; r: number; vx: number; vy: number
  renk: string; tur: Tur; aci: number; donus: number; faz: number
}
interface Konfeti { x: number; y: number; vx: number; vy: number; renk: string; omur: number; aci: number }

// Paletteki renkler (brand.css ile aynı): pembe, güneş, mavi, mürekkep moru, nane
const RENKLER = ['#FF4F8B', '#FFC23D', '#33B5F2', '#8B6CF0', '#2ED3A4', '#FF8FB5']

function rastgele(min: number, max: number) {
  return min + Math.random() * (max - min)
}

export default function BalonSahnesi({ className = '' }: { className?: string }) {
  const tuval = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const cv = tuval.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    const hareketAzalt = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let w = 0, h = 0, dpr = 1
    let parcalar: Parca[] = []
    let konfetiler: Konfeti[] = []
    const imlec = { x: -9999, y: -9999 }
    let calisiyor = true
    let gorunur = true
    let kare = 0

    const yeniParca = (altta = false): Parca => {
      const tur: Tur = Math.random() < 0.55 ? 'balon' : Math.random() < 0.6 ? 'yildiz' : 'kalp'
      const r = tur === 'balon' ? rastgele(16, 34) : rastgele(8, 16)
      return {
        x: rastgele(0, w), y: altta ? h + r * 3 : rastgele(0, h),
        r, vx: rastgele(-0.15, 0.15), vy: -rastgele(0.25, 0.7),
        renk: RENKLER[Math.floor(Math.random() * RENKLER.length)],
        tur, aci: rastgele(0, Math.PI * 2), donus: rastgele(-0.01, 0.01), faz: rastgele(0, Math.PI * 2),
      }
    }

    const boyutla = () => {
      const kutu = cv.getBoundingClientRect()
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = kutu.width; h = kutu.height
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      // Ekran genişliğine göre yoğunluk: telefonda daha seyrek
      const adet = Math.round(Math.min(34, Math.max(12, (w * h) / 26000)))
      parcalar = Array.from({ length: adet }, () => yeniParca(false))
    }

    const balonCiz = (p: Parca) => {
      const { x, y, r } = p
      // ip
      ctx.strokeStyle = 'rgba(39,26,85,0.25)'
      ctx.lineWidth = 1.2
      ctx.beginPath()
      ctx.moveTo(x, y + r * 1.15)
      ctx.bezierCurveTo(x - 6, y + r * 1.6, x + 6, y + r * 2.1, x, y + r * 2.6)
      ctx.stroke()
      // gövde
      ctx.fillStyle = p.renk
      ctx.beginPath()
      ctx.ellipse(x, y, r * 0.86, r, 0, 0, Math.PI * 2)
      ctx.fill()
      // düğüm
      ctx.beginPath()
      ctx.moveTo(x - 4, y + r * 1.12); ctx.lineTo(x + 4, y + r * 1.12); ctx.lineTo(x, y + r * 0.96)
      ctx.fill()
      // parlama
      ctx.fillStyle = 'rgba(255,255,255,0.55)'
      ctx.beginPath()
      ctx.ellipse(x - r * 0.32, y - r * 0.38, r * 0.16, r * 0.28, -0.5, 0, Math.PI * 2)
      ctx.fill()
    }

    const yildizCiz = (p: Parca) => {
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.aci)
      ctx.fillStyle = p.renk
      ctx.beginPath()
      for (let i = 0; i < 10; i++) {
        const rr = i % 2 === 0 ? p.r : p.r * 0.48
        const a = (Math.PI / 5) * i - Math.PI / 2
        ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr)
      }
      ctx.closePath(); ctx.fill(); ctx.restore()
    }

    const kalpCiz = (p: Parca) => {
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.aci * 0.3)
      const s = p.r / 16
      ctx.scale(s, s)
      ctx.fillStyle = p.renk
      ctx.beginPath()
      ctx.moveTo(0, 6)
      ctx.bezierCurveTo(-16, -6, -8, -18, 0, -9)
      ctx.bezierCurveTo(8, -18, 16, -6, 0, 6)
      ctx.fill(); ctx.restore()
    }

    const ciz = () => {
      ctx.clearRect(0, 0, w, h)
      // Yazının arkasından geçen parçalar soluklaşır ki başlık okunabilsin.
      // Masaüstünde yazı sol yarıda, telefonda tüm genişlikte.
      const yaziSag = w >= 1024 ? w * 0.5 : w
      for (const p of parcalar) {
        const yaziUstunde = p.x < yaziSag && p.y > h * 0.12 && p.y < h * 0.82
        ctx.globalAlpha = yaziUstunde ? 0.28 : 1
        if (p.tur === 'balon') balonCiz(p)
        else if (p.tur === 'yildiz') yildizCiz(p)
        else kalpCiz(p)
      }
      ctx.globalAlpha = 1
      for (const k of konfetiler) {
        ctx.save(); ctx.translate(k.x, k.y); ctx.rotate(k.aci)
        ctx.globalAlpha = Math.max(0, k.omur / 60)
        ctx.fillStyle = k.renk
        ctx.fillRect(-4, -2, 8, 4)
        ctx.restore()
      }
      ctx.globalAlpha = 1
    }

    const guncelle = () => {
      kare++
      for (const p of parcalar) {
        // imleçten kaçma
        const dx = p.x - imlec.x, dy = p.y - imlec.y
        const d2 = dx * dx + dy * dy, menzil = 130
        if (d2 < menzil * menzil && d2 > 1) {
          const d = Math.sqrt(d2), kuvvet = (1 - d / menzil) * 1.6
          p.vx += (dx / d) * kuvvet * 0.35
          p.vy += (dy / d) * kuvvet * 0.35
        }
        p.vx *= 0.96
        p.vy = p.vy * 0.96 + (-0.45 * (p.r > 16 ? 0.9 : 0.6)) * 0.04
        p.x += p.vx + Math.sin(kare * 0.012 + p.faz) * 0.25
        p.y += p.vy
        p.aci += p.donus
        if (p.y < -p.r * 3) Object.assign(p, yeniParca(true))
        if (p.x < -60) p.x = w + 40
        if (p.x > w + 60) p.x = -40
      }
      konfetiler = konfetiler.filter((k) => k.omur > 0)
      for (const k of konfetiler) {
        k.vy += 0.12; k.vx *= 0.99
        k.x += k.vx; k.y += k.vy; k.aci += 0.2; k.omur--
      }
    }

    const dongu = () => {
      if (!calisiyor) return
      if (gorunur && !document.hidden) { guncelle(); ciz() }
      requestAnimationFrame(dongu)
    }

    const konum = (e: PointerEvent) => {
      const k = cv.getBoundingClientRect()
      return { x: e.clientX - k.left, y: e.clientY - k.top }
    }
    const hareket = (e: PointerEvent) => Object.assign(imlec, konum(e))
    const ayril = () => { imlec.x = -9999; imlec.y = -9999 }
    const dokun = (e: PointerEvent) => {
      const { x, y } = konum(e)
      const i = parcalar.findIndex((p) => p.tur === 'balon' && (p.x - x) ** 2 + (p.y - y) ** 2 < (p.r * 1.1) ** 2)
      if (i === -1) return
      const p = parcalar[i]
      for (let n = 0; n < 26; n++) {
        const a = rastgele(0, Math.PI * 2), hiz = rastgele(2, 6)
        konfetiler.push({
          x: p.x, y: p.y, vx: Math.cos(a) * hiz, vy: Math.sin(a) * hiz - 2,
          renk: RENKLER[n % RENKLER.length], omur: rastgele(40, 70), aci: a,
        })
      }
      parcalar[i] = yeniParca(true)
    }

    boyutla()
    const gozlemci = new IntersectionObserver(([g]) => { gorunur = g.isIntersecting }, { threshold: 0 })
    gozlemci.observe(cv)
    const yenidenBoyut = new ResizeObserver(() => { boyutla(); if (hareketAzalt) ciz() })
    yenidenBoyut.observe(cv)

    // Olaylar sahnenin üstündeki içerik yüzünden kaçmasın diye üst öğede dinleniyor
    const hedef = cv.parentElement ?? cv
    if (hareketAzalt) {
      ciz()
    } else {
      hedef.addEventListener('pointermove', hareket)
      hedef.addEventListener('pointerleave', ayril)
      hedef.addEventListener('pointerdown', dokun)
      requestAnimationFrame(dongu)
    }

    return () => {
      calisiyor = false
      gozlemci.disconnect(); yenidenBoyut.disconnect()
      hedef.removeEventListener('pointermove', hareket)
      hedef.removeEventListener('pointerleave', ayril)
      hedef.removeEventListener('pointerdown', dokun)
    }
  }, [])

  return <canvas ref={tuval} aria-hidden="true" className={`absolute inset-0 h-full w-full ${className}`} />
}
