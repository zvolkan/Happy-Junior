'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { BRANDS } from '@/lib/constants'
import { useCart } from '@/hooks/useCart'
import { useCartStore } from '@/store/cartStore'
import type { BrandKey } from '@/lib/types'
import BrandLogo from '@/components/ui/BrandLogo'
import UserMenuButton from '@/components/layout/UserMenuButton'
import MobileUserSection from '@/components/layout/MobileUserSection'

// ─── BRAND SWITCHER ───────────────────────────────────────────────────────────

// `icon` alanı kaldırıldı: marka görseli artık BrandLogo'dan geliyor ve
// hangi markanın logo mu yoksa yedek ikon mu göstereceğine orası karar veriyor.
const BRAND_TABS: { key: BrandKey; label: string }[] = [
  { key: 'alb-tarim', label: 'ALB Tarım' },
  { key: 'alb-su-aritma', label: 'Alb Su Teknolojileri' },
]

// Seçili sekme her zaman o an açık olan markadır, dolayısıyla aktif marka
// değişkenleri doğru rengi getiriyor; sekme başına ayrı renk gerekmiyor.
const ACTIVE_TAB_CLASS = 'bg-brand-600 text-white shadow-brand-700/30 shadow-lg'

// ─── HEADER COMPONENT ─────────────────────────────────────────────────────────

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { getTotalItems } = useCart()
  // Sepet localStorage'dan okunmadan rozet basılmaz — sunucu 0, istemci N
  // render edip hydration uyumsuzluğu üretiyordu.
  const cartHydrated = useCartStore((s) => s.hasHydrated)
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // JS-tabanlı dropdown: CSS group-hover yerine timer kullanıyoruz
  // → mouse'u nav item'dan dropdown'a geçerken dropdown kapanmıyor
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const dropdownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cartCount = cartHydrated ? getTotalItems() : 0

  // Aktif marka belirle
  const activeBrandKey: BrandKey | null =
    pathname.startsWith('/alb-su-aritma') ? 'alb-su-aritma' :
    pathname.startsWith('/alb-tarim') ? 'alb-tarim' : null

  const activeBrand = activeBrandKey ? BRANDS[activeBrandKey] : null

  // Hero sayfasında mı? → marka ana sayfası
  const isHeroPage = !!activeBrandKey && (
    pathname === `/${activeBrandKey}` || pathname === `/${activeBrandKey}/`
  )

  // Header arka planı
  const headerBg =
    isHeroPage && !scrolled
      ? 'bg-transparent'
      : scrolled
      ? 'bg-gray-900/95 backdrop-blur-xl shadow-2xl shadow-black/20'
      : 'bg-gray-900'

  // Marka dışı sayfalarda (grup ana sayfası) marka değişkenleri nötr griye
  // düştüğü için ayrıca "marka yoksa gri" dalı tutmaya gerek kalmadı.
  const accentColor = 'bg-brand-600 hover:bg-brand-500'

  // Nav ve dropdown yalnızca marka sayfalarında görünüyor; buradaki marka
  // tonları grup ana sayfasına sızmıyor.
  const navHover = 'hover:text-brand-400'
  const dropdownDot = 'bg-brand-400/60'

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Dropdown aç/kapat — timer sayesinde gap'te bile kapanmaz
  const openDropdown = (label: string) => {
    if (dropdownTimerRef.current) clearTimeout(dropdownTimerRef.current)
    setActiveDropdown(label)
  }
  const scheduleClose = () => {
    dropdownTimerRef.current = setTimeout(() => setActiveDropdown(null), 120)
  }
  const cancelClose = () => {
    if (dropdownTimerRef.current) clearTimeout(dropdownTimerRef.current)
  }

  // ── Klavye erişimi ────────────────────────────────────────────────────────
  //
  // Dropdown'lar yalnızca `onMouseEnter` ile açılıyordu: fare kullanmayan
  // hiç kimse alt menülere ulaşamıyordu. Daha kötüsü, paneller kapalıyken
  // DOM'da `opacity-0 pointer-events-none` ile duruyordu — yani görünmez ama
  // ODAKLANILABİLİR haldeydiler. Tab'la gezen kullanıcı, ekranda hiçbir şey
  // yokken görünmez bağlantıların içinden geçiyor ve odağı kaybediyordu.
  //
  // Çözüm iki parçalı: (1) odak menü grubuna girince panel açılıyor, gruptan
  // çıkınca kapanıyor; (2) kapalı panel `invisible` oluyor — `visibility:
  // hidden` içindeki her şeyi sekme sırasından da çıkarır, `opacity-0` çıkarmaz.
  const grubaOdaklanildi = (label: string) => openDropdown(label)

  // Odak aynı menü grubunun İÇİNDE başka bir öğeye geçtiyse kapatma.
  // `relatedTarget` odağın gittiği öğedir; null ise (pencere değişimi gibi)
  // kapatmak doğru davranış.
  const gruptanCikildi = (e: React.FocusEvent<HTMLDivElement>) => {
    const gidilen = e.relatedTarget as Node | null
    if (gidilen && e.currentTarget.contains(gidilen)) return
    setActiveDropdown(null)
  }

  // Esc menüyü kapatıp odağı tetikleyen bağlantıda bırakır.
  const menuKlavye = (e: React.KeyboardEvent<HTMLDivElement>, label: string) => {
    if (e.key === 'Escape') {
      setActiveDropdown(null)
      return
    }
    // Aşağı ok, fare kullanıcısının "üzerine gelme" hareketinin karşılığı.
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      openDropdown(label)
    }
  }

  useEffect(() => () => {
    if (dropdownTimerRef.current) clearTimeout(dropdownTimerRef.current)
  }, [])

  // Mobil menü açıkken arka plandaki sayfanın kaydırılmasını engelle.
  // Önceki `overflow` değeri saklanıp geri yükleniyor — başka bir bileşen
  // (ör. modal) da kilit uygulamışsa onun değerini ezmemek için.
  useEffect(() => {
    if (!menuOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [menuOpen])

  // Escape ile mobil menüyü kapat
  useEffect(() => {
    if (!menuOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [menuOpen])

  // Marka değiştirildiğinde o markanın sayfasına git
  const handleBrandSwitch = (key: BrandKey) => {
    const currentPath = pathname
    if (key === 'alb-tarim') {
      router.push(
        currentPath.startsWith('/alb-su-aritma')
          ? currentPath.replace('/alb-su-aritma', '/alb-tarim')
          : '/alb-tarim'
      )
    } else {
      router.push(
        currentPath.startsWith('/alb-tarim')
          ? currentPath.replace('/alb-tarim', '/alb-su-aritma')
          : '/alb-su-aritma'
      )
    }
    setMenuOpen(false)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const term = searchQuery.trim()
    if (term.length < 2) return

    // Arama sunucuda yapılır; sonuç sayfası filtreleri sıfırdan kurar
    const base = activeBrandKey ? `/${activeBrandKey}` : '/alb-tarim'
    router.push(`${base}/urunler?arama=${encodeURIComponent(term)}`)
    setSearchOpen(false)
    setSearchQuery('')
  }

  const navPrefix = activeBrandKey ? `/${activeBrandKey}` : ''
  // Blog artık yönetim panelinden yönetiliyor; menüde yeniden görünüyor.
  const navItems = activeBrand?.nav
    .map((item) => ({
      ...item,
      href: navPrefix + item.href,
      children: item.children?.map((c) => ({ ...c, href: navPrefix + c.href })),
    })) ?? []

  return (
    <>
      <header className={`sticky top-0 z-40 transition-all duration-500 ${headerBg}`}>

        {/* ── ÜSTTE: Logo + Marka seçici + Sağ ikonlar ── */}
        <div className={`border-b transition-all duration-500 ${
          isHeroPage && !scrolled ? 'border-white/15' : 'border-white/10'
        }`}>
          <div className="container-main">
            {/* ── Yerleşim ────────────────────────────────────────────────
                Eskiden üç grup (logo · marka seçici · eylemler) tek bir
                `justify-between` içindeydi. Geniş ekranda kap 1280 piksele
                kadar açıldığı için gruplar birbirinden kopuyor, aralarda iki
                büyük boşluk kalıyordu; header boş görünüyordu.

                Şimdi logo ile marka seçici SOLDA tek küme; `justify-between`
                yalnızca bu kümeyle sağdaki eylemleri ayırıyor. Tek boşluk
                kaldı ve o da doğal yerinde. */}
            <div
              className={`flex items-center justify-between gap-3 transition-[height] duration-500 ease-out ${
                scrolled ? 'h-12 sm:h-14' : 'h-14 sm:h-16'
              }`}
            >

              <div className="flex min-w-0 items-center gap-3 sm:gap-5">

              {/* LOGO */}
              <Link
                href="/"
                className="flex items-center flex-shrink-0 transition-transform duration-300 hover:scale-105 active:scale-95"
                onClick={() => setMenuOpen(false)}
              >
                {/* Dağ + kurt markası. Oran 2,67:1 (yatay) olduğu için kare
                    kutuya sığdırılmıyor — yükseklik sabit, genişlik serbest.
                    Kare kutu + object-contain kullanılsa logo kutunun ancak
                    üçte birini doldurur ve minicik görünürdü. */}
                <Image
                  src="/images/bayirlioglu-mark-beyaz.svg"
                  alt="Bayırlıoğlu"
                  width={2080}
                  height={780}
                  className={`w-auto object-contain transition-all duration-500 ease-out ${
                    scrolled ? 'h-6 sm:h-7' : 'h-7 sm:h-8'
                  }`}
                  priority
                />
              </Link>

              {/* MARKA SEÇİCİ
                  Sekmelerin arkasındaki gri hap kaldırıldı. Logo ile sekmeler
                  yan yana gelince o zemin bir "çerçeve" gibi okunuyor ve
                  header'ı kutulu gösteriyordu. Seçili markayı zaten sekmenin
                  kendi dolgusu belli ediyor; kapsayıcının ayrıca bir zemine
                  ihtiyacı yok. */}
              <div className="flex items-center gap-0.5">
                {BRAND_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => handleBrandSwitch(tab.key)}
                    // Marka değiştirici 40×28 px ölçülüyordu; parmakla isabetli
                    // tıklanamıyor. WCAG 2.5.5 ve iki platformun arayüz kılavuzu
                    // da 44×44 istiyor. Yükseklik `min-h` ile garantileniyor.
                    className={`flex items-center justify-center gap-1.5 min-h-[44px] px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 ${
                      activeBrandKey === tab.key
                        ? ACTIVE_TAB_CLASS
                        : 'text-white/60 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {/* Marka rozeti tek kaynaktan: bkz. components/ui/BrandLogo */}
                    <BrandLogo brand={tab.key} boyut="xs" ikonSinifi="text-current" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>

              </div>

              {/* SAĞ — Arama, Sepet, Giriş, Hamburger */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setSearchOpen(!searchOpen)}
                  className="text-white/70 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-all duration-200"
                  aria-label="Arama"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>

                {/*
                  aria-label ŞART: bağlantının içinde yalnızca bir <svg> var,
                  metin yok. Ekran okuyucu bu bağlantıyı sadece "link" diye
                  okuyordu. Aynı dosyadaki arama ve hamburger düğmelerine
                  etiket doğru verilmiş, sepet atlanmıştı — muhtemelen bir
                  <button> değil <Link> olduğu için gözden kaçmış.

                  Etiket sepetteki ürün sayısını da söylüyor; rozetteki sayı
                  görsel bir bilgi ve ekran okuyucuya başka türlü ulaşmıyor.
                */}
                <Link
                  href="/sepet"
                  aria-label={cartCount > 0 ? `Sepetim, ${cartCount} ürün` : 'Sepetim (boş)'}
                  className="relative text-white/70 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-all duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {cartCount > 0 && (
                    <span
                      aria-hidden="true"
                      className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] min-w-[18px] h-[18px] rounded-full flex items-center justify-center font-bold px-1"
                    >
                      {cartCount > 9 ? '9+' : cartCount}
                    </span>
                  )}
                </Link>

                <UserMenuButton accentColor={accentColor} />

                <button
                  className="md:hidden text-white/70 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-all duration-200 ml-1"
                  onClick={() => setMenuOpen(!menuOpen)}
                  aria-expanded={menuOpen}
                  aria-controls="mobil-menu"
                  aria-label={menuOpen ? 'Menüyü kapat' : 'Menüyü aç'}
                >
                  <div className="relative w-5 h-5">
                    <span className={`absolute block w-5 h-0.5 bg-current transition-all duration-300 ${menuOpen ? 'top-2 rotate-45' : 'top-0.5'}`} />
                    <span className={`absolute block w-5 h-0.5 bg-current top-2 transition-all duration-300 ${menuOpen ? 'opacity-0 scale-x-0' : 'opacity-100'}`} />
                    <span className={`absolute block w-5 h-0.5 bg-current transition-all duration-300 ${menuOpen ? 'top-2 -rotate-45' : 'top-3.5'}`} />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── ALTTA: Aktif markanın nav linkleri (desktop) ── */}
        {activeBrand && (
          <div className={`hidden md:block border-b transition-all duration-500 ${
            isHeroPage && !scrolled
              ? 'bg-transparent border-white/10'
              : 'bg-gray-800/60 border-white/5'
          }`}>
            <div className="container-main">
              <nav className="flex items-center gap-0.5 h-10">
                {navItems.map((item) => (
                  <div
                    key={item.label}
                    className="relative"
                    onMouseEnter={() => openDropdown(item.label)}
                    onMouseLeave={scheduleClose}
                    onFocus={() => item.children && grubaOdaklanildi(item.label)}
                    onBlur={gruptanCikildi}
                    onKeyDown={(e) => item.children && menuKlavye(e, item.label)}
                  >
                    <Link
                      href={item.href}
                      data-active={pathname === item.href}
                      aria-haspopup={item.children ? 'true' : undefined}
                      aria-expanded={item.children ? activeDropdown === item.label : undefined}
                      className={`link-underline text-white/70 ${navHover} text-sm font-medium px-3 py-2 rounded-lg transition-all duration-200 flex items-center gap-1.5 hover:bg-white/8 whitespace-nowrap`}
                    >
                      {item.label}
                      {item.children && (
                        <svg
                          className={`w-3 h-3 opacity-50 transition-transform duration-300 ${activeDropdown === item.label ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                    </Link>

                    {/* Dropdown paneli — JS kontrollü, gap sorunu yok */}
                    {item.children && (
                      <div
                        className={`absolute top-full left-0 z-50 pt-2 min-w-[13rem] transition-all duration-300 ${
                          activeDropdown === item.label
                            ? 'visible opacity-100 pointer-events-auto'
                            : // `invisible` şart: opacity-0 öğeyi görünmez yapar
                              // ama sekme sırasında bırakır. visibility:hidden
                              // içindeki bağlantıları odaklanılamaz kılıyor.
                              'invisible opacity-0 pointer-events-none'
                        }`}
                        onMouseEnter={cancelClose}
                        onMouseLeave={scheduleClose}
                      >
                        {/* pt-2 → görünmez köprü: mouse gap'ten geçerken dropdown açık kalır */}
                        <div
                          className={`bg-gray-900 border border-white/12 rounded-2xl shadow-2xl shadow-black/50 py-2 origin-top transition-all duration-300 ease-out ${
                            activeDropdown === item.label
                              ? 'translate-y-0 scale-100'
                              : '-translate-y-2 scale-[0.97]'
                          }`}
                        >
                          {item.children.map((child) => (
                            <Link
                              key={child.label}
                              href={child.href}
                              onClick={() => setActiveDropdown(null)}
                              className={`group/item flex items-center gap-2.5 text-white/75 ${navHover} text-sm px-4 py-2.5 transition-all duration-200 hover:bg-white/8 hover:pl-5`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-transform duration-200 group-hover/item:scale-150 ${dropdownDot}`} />
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </nav>
            </div>
          </div>
        )}

        {/* ── ARAMA ── */}
        {searchOpen && (
          <div className="absolute top-full inset-x-0 bg-gray-900/97 backdrop-blur-xl border-t border-white/10 p-4 shadow-2xl z-50">
            <form onSubmit={handleSearch} className="container-main">
              <div className="relative max-w-xl mx-auto">
                <input
                  type="text"
                  id="header-arama"
                  aria-label="Ürün ara"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={activeBrand ? `${activeBrand.name} ürünlerinde ara...` : 'Ürün ara...'}
                  className="w-full bg-white/10 text-white placeholder:text-white/40 border border-white/20 rounded-xl px-5 py-3 pr-12 focus:outline-none focus:border-white/40 focus:bg-white/15 transition-all duration-200"
                  autoFocus
                />
                <button type="submit" aria-label="Ara" className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        )}
      </header>

      {/* ── MOBİL MENÜ ── */}
      {menuOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden" onClick={() => setMenuOpen(false)} />
          <div id="mobil-menu" className="fixed inset-x-0 top-[56px] sm:top-[64px] bg-gray-900/97 backdrop-blur-xl border-t border-white/10 z-40 md:hidden max-h-[80vh] overflow-y-auto">

            <div className="p-4 border-b border-white/10">
              <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-3">Marka Seç</p>
              <div className="flex gap-2">
                {BRAND_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => { handleBrandSwitch(tab.key); setMenuOpen(false) }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      activeBrandKey === tab.key
                        ? ACTIVE_TAB_CLASS
                        : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {/* Marka rozeti tek kaynaktan: bkz. components/ui/BrandLogo */}
                    <BrandLogo brand={tab.key} boyut="xs" ikonSinifi="text-current" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {navItems.length > 0 && (
              <nav className="p-4 space-y-1">
                {navItems.map((item) => (
                  <div key={item.label}>
                    <Link
                      href={item.href}
                      className="block text-white/80 hover:text-white py-3 px-4 rounded-xl hover:bg-white/10 font-medium transition-all duration-200"
                      onClick={() => setMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                    {item.children && (
                      <div className="ml-4 mt-0.5 space-y-0.5">
                        {item.children.map((child) => (
                          <Link
                            key={child.label}
                            href={child.href}
                            className="flex items-center gap-2 text-white/55 hover:text-white py-2 px-4 rounded-lg hover:bg-white/8 text-sm transition-all duration-200"
                            onClick={() => setMenuOpen(false)}
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </nav>
            )}

            <MobileUserSection
              accentColor={accentColor}
              cartCount={cartCount}
              onClose={() => setMenuOpen(false)}
            />
          </div>
        </>
      )}
    </>
  )
}
