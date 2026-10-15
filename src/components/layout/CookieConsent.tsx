'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

const STORAGE_KEY = 'happyjunior-cookie-consent'
const CONSENT_VERSION = '1'

type ConsentValue = 'all' | 'necessary'

/**
 * Çerez onay bandı.
 *
 * KVKK ve Elektronik Ticaret Kanunu kapsamında zorunlu çerezler dışındaki
 * çerezler için açık rıza alınması gerekir. Analitik/pazarlama araçları
 * eklendiğinde `hasAnalyticsConsent()` ile kontrol edilmelidir.
 */
export function hasAnalyticsConsent(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return false
    const parsed = JSON.parse(raw) as { value?: ConsentValue; version?: string }
    return parsed.version === CONSENT_VERSION && parsed.value === 'all'
  } catch {
    return false
  }
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)
  const bandRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (!raw) {
        setVisible(true)
        return
      }
      const parsed = JSON.parse(raw) as { version?: string }
      // Metin sürümü değiştiyse onay yeniden alınır
      if (parsed.version !== CONSENT_VERSION) setVisible(true)
    } catch {
      setVisible(true)
    }
  }, [])

  // ── Bandın altında kalan içeriği kurtar ───────────────────────────────────
  //
  // Bant sabit konumlu (`fixed`) olduğu için sayfa akışında yer kaplamıyor ve
  // altındaki her şeyin ÜZERİNE biniyordu. Bileşenin kendisi doğru yazılmıştı;
  // sorun ancak sayfayla birlikte görülüyor: mobilde bant görünümün yaklaşık
  // %40'ını kaplıyor ve ana sayfada iki marka kartını, iletişim sayfasında
  // e-posta ile telefon alanlarını, 404 sayfasında "Ana Sayfaya Dön" butonunu
  // örtüyordu. Yeni ziyaretçinin gördüğü ilk ekran, eylem çağrısının üstüne
  // oturmuş bir onay kutusuydu.
  //
  // Çözüm: bant durduğu sürece gövdeye kendi yüksekliği kadar alt boşluk
  // ekleniyor, böylece sayfanın sonu bandın üstünde bitiyor. Yükseklik sabit
  // yazılmıyor — metin kırılım noktasına göre bir ya da iki satıra düştüğü
  // için ölçülerek alınıyor; pencere yeniden boyutlandığında yeniden ölçülüyor.
  useEffect(() => {
    if (!visible) return

    const govde = document.body
    const oncekiPadding = govde.style.paddingBottom

    const olc = () => {
      const yukseklik = bandRef.current?.offsetHeight ?? 0
      govde.style.paddingBottom = yukseklik ? `${yukseklik}px` : oncekiPadding
    }

    olc()
    window.addEventListener('resize', olc)

    // Yazı tipi geç yüklendiğinde metin sarması değişip bandın yüksekliği
    // artabiliyor; o durumda ölçü kendiliğinden güncelleniyor.
    const gozlemci = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(olc) : null
    if (gozlemci && bandRef.current) gozlemci.observe(bandRef.current)

    return () => {
      window.removeEventListener('resize', olc)
      gozlemci?.disconnect()
      govde.style.paddingBottom = oncekiPadding
    }
  }, [visible])

  const decide = (value: ConsentValue) => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ value, version: CONSENT_VERSION, at: new Date().toISOString() }),
      )
    } catch {
      /* localStorage kapalıysa sessiz geç */
    }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      ref={bandRef}
      role="dialog"
      aria-live="polite"
      aria-label="Çerez tercihleri"
      className="fixed bottom-0 inset-x-0 z-[60] p-3 sm:p-4 anim-fade-up"
    >
      <div className="mx-auto max-w-4xl bg-white border border-gray-200 rounded-2xl shadow-2xl p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex-1">
            <p className="font-semibold text-gray-900 text-sm mb-1">Çerez Kullanımı</p>
            <p className="text-sm text-gray-600 leading-relaxed">
              {/* Mobilde bant ne kadar kısa olursa o kadar az yer kaplıyor;
                  ayrıntı zaten aşağıdaki iki bağlantının arkasında. */}
              <span className="hidden sm:inline">
                Sitemizin çalışması için zorunlu çerezleri kullanıyoruz. İzin vermeniz
                hâlinde deneyimi iyileştirmek ve kullanım istatistikleri toplamak için
                analitik çerezler de kullanılır.{' '}
              </span>
              <span className="sm:hidden">Zorunlu çerezleri kullanıyoruz. </span>
              Detaylar için{' '}
              <Link
                href="/gizlilik"
                className="underline font-medium text-gray-800 hover:text-gray-900"
              >
                Gizlilik ve Güvenlik
              </Link>{' '}
              ve{' '}
              <Link
                href="/kvkk"
                className="underline font-medium text-gray-800 hover:text-gray-900"
              >
                KVKK Aydınlatma Metni
              </Link>
              .
            </p>
          </div>

          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => decide('necessary')}
              className="btn-press flex-1 lg:flex-none px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50"
            >
              Yalnızca Zorunlu
            </button>
            <button
              onClick={() => decide('all')}
              className="btn-press flex-1 lg:flex-none px-5 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700"
            >
              Tümünü Kabul Et
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
