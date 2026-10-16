'use client'

import { useMemo, useState, useTransition } from 'react'
import Breadcrumb from '@/components/ui/Breadcrumb'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import UrunKarti from '@/components/product/UrunKarti'
import Icon from '@/components/ui/Icon'
import { categoryIcon } from '@/lib/category-icon'
import { BRAND, BRANDS } from '@/lib/constants'
import { useCartStore } from '@/store/cartStore'
import { SORT_OPTIONS, type SortOption } from '@/lib/queries/product-search-options'
import type { BrandKey, Product, Category } from '@/lib/types'
import { toast } from 'react-hot-toast'

// Pill için ortak tip (ALB L1 ve İthal L2 aynı şekle gelir)
type TypePill = { name: string; slug: string; icon: string | null; sortOrder: number }

interface Props {
  brandKey: BrandKey
  /** Sunucuda filtrelenmiş, sıralanmış ve sayfalanmış ürünler */
  products: Product[]
  categories: Category[]
  total: number
  page: number
  pageCount: number
  facets: {
    productBrands: string[]
    priceRange: { min: number; max: number }
  }
  sort: SortOption
}

export default function UrunlerContent({
  brandKey,
  products,
  categories,
  total,
  page,
  pageCount,
  facets,
  sort,
}: Props) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const addItem = useCartStore((s) => s.addItem)
  const [isPending, startTransition] = useTransition()

  const cfg = BRANDS[brandKey] ?? BRAND

  // ── URL parametreleri ─────────────────────────────────────────────────────
  const activeKullanim = searchParams.get('kullanim') ?? ''
  const activeCategory = searchParams.get('kategori') ?? '' // geriye dönük uyumluluk
  const activeType = searchParams.get('type') ?? ''
  const activeBrandFilter = searchParams.get('marka') ?? ''
  const searchQuery = searchParams.get('arama') ?? ''
  const minPrice = searchParams.get('min') ?? ''
  const maxPrice = searchParams.get('max') ?? ''
  const inStockOnly = searchParams.get('stokta') === '1'

  // ── Renk sistemi (tonlar src/styles/brand.css'ten) ──────────────────────
  const accentText = 'text-brand-600'
  const accentBg = 'bg-brand-600'
  const accentHover = 'hover:bg-brand-500'
  const accentBorder = 'border-b-brand-600'
  const accentLight = 'bg-brand-50/60'
  const accentTag = 'text-brand-500'
  const pillActive = 'bg-brand-600 hover:bg-brand-500 text-white border-transparent shadow-sm'
  const pillInactive =
    'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:text-gray-800'

  // ── Kategori haritaları ───────────────────────────────────────────────────
  const catById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])
  const catBySlug = useMemo(() => new Map(categories.map((c) => [c.slug, c])), [categories])

  const rootCategories = useMemo(() => categories.filter((c) => c.parentId == null), [categories])

  const level1Categories = useMemo(
    () =>
      categories.filter((c) => {
        if (c.parentId == null) return false
        return catById.get(c.parentId)?.parentId == null
      }),
    [categories, catById],
  )


  const hasHierarchy = rootCategories.length > 0
  const activeRootCat = useMemo(
    () => rootCategories.find((c) => c.slug === activeKullanim) ?? null,
    [rootCategories, activeKullanim],
  )

  // ── Pill şeridi: seçili ana kategorinin alt kategorileri ─────────────────
  // (ör. Kız Çocuk → Takımlar, Üst Giyim, Alt Giyim…)
  const activePills = useMemo((): TypePill[] => {
    if (!activeRootCat) return []
    return level1Categories
      .filter((c) => c.parentId === activeRootCat.id)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((c) => ({ name: c.name, slug: c.slug, icon: c.icon ?? null, sortOrder: c.sortOrder }))
  }, [activeRootCat, level1Categories])

  // ── Ürün kartı etiketi: üretici markası (ör. Mudese), yoksa boş ─────────
  const productBrandLabels = useMemo(() => {
    const map = new Map<string, string>()
    products.forEach((p) => map.set(p.slug, p.productBrand?.trim() ?? ''))
    return map
  }, [products])

  // ── URL yönetimi ──────────────────────────────────────────────────────────

  /**
   * Parametreleri BİRLEŞTİREREK günceller. Eskiden her filtre değişiminde
   * URLSearchParams sıfırdan kuruluyor ve diğer filtreler siliniyordu.
   * Filtre değişince sayfa 1'e döner.
   */
  const updateParams = (patch: Record<string, string | null>, resetPage = true) => {
    const sp = new URLSearchParams(searchParams.toString())

    for (const [key, value] of Object.entries(patch)) {
      if (value === null || value === '') sp.delete(key)
      else sp.set(key, value)
    }

    if (resetPage) sp.delete('sayfa')

    const qs = sp.toString()
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    })
  }

  // Kök kategori değişince tip filtresi anlamını yitirir → temizlenir
  const setKullanim = (slug: string) => updateParams({ kullanim: slug || null, type: null, kategori: null })
  const setTypeFilter = (typeName: string) => updateParams({ type: typeName || null, kategori: null })
  const clearTypeFilter = () => updateParams({ type: null, kategori: null })
  const clearAll = () => startTransition(() => router.push(pathname, { scroll: false }))

  const goToPage = (next: number) => {
    updateParams({ sayfa: next > 1 ? String(next) : null }, false)
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ── Fiyat aralığı (yerel giriş, uygulanınca URL'e yazılır) ───────────────
  const [priceInputs, setPriceInputs] = useState({ min: minPrice, max: maxPrice })

  const applyPriceFilter = () => {
    const min = priceInputs.min.trim()
    const max = priceInputs.max.trim()
    if (min && max && Number(min) > Number(max)) {
      toast.error('En düşük fiyat, en yüksek fiyattan büyük olamaz.')
      return
    }
    updateParams({ min: min || null, max: max || null })
  }

  // ── Sepet ─────────────────────────────────────────────────────────────────
  const handleAddToCart = (product: Product) => {
    if (product.stock === 0) {
      toast.error(`${product.name} şu anda tükendi.`)
      return
    }
    // Sepet deposu stok tavanında sessizce hiçbir şey yapmıyor; öncesi ve
    // sonrası karşılaştırılmadan "eklendi" demek yanlış bilgi oluyordu.
    const before = useCartStore.getState().items.find((i) => i.product.id === product.id)?.quantity ?? 0
    addItem(product, 1)
    const after = useCartStore.getState().items.find((i) => i.product.id === product.id)?.quantity ?? 0

    if (after > before) {
      toast.success(`${product.name} sepete eklendi`)
    } else {
      toast.error(`Sepetinizde bu üründen en fazla ${product.stock} ${product.unit} olabilir.`)
    }
  }

  const discount = (product: Product) =>
    product.salePrice ? Math.round((1 - product.salePrice / product.price) * 100) : null

  const pillAllActive = !activeType && !activeCategory

  const activeCategoryLabel = useMemo(() => {
    if (activeType) return activeType
    if (activeCategory) return catBySlug.get(activeCategory)?.name ?? null
    if (activeRootCat) return activeRootCat.name
    return null
  }, [activeType, activeCategory, activeRootCat, catBySlug])

  // Aktif filtre rozetleri
  const activeFilters = useMemo(() => {
    const list: { label: string; clear: () => void }[] = []
    if (searchQuery)
      list.push({ label: `Arama: "${searchQuery}"`, clear: () => updateParams({ arama: null }) })
    if (activeBrandFilter)
      list.push({ label: activeBrandFilter, clear: () => updateParams({ marka: null }) })
    if (minPrice || maxPrice) {
      list.push({
        label: `${minPrice || '0'} – ${maxPrice || '∞'} ₺`,
        clear: () => {
          setPriceInputs({ min: '', max: '' })
          updateParams({ min: null, max: null })
        },
      })
    }
    if (inStockOnly)
      list.push({ label: 'Stokta olanlar', clear: () => updateParams({ stokta: null }) })
    return list
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, activeBrandFilter, minPrice, maxPrice, inStockOnly, searchParams])

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ─── Başlık + breadcrumb ─────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 py-6">
        <div className="container-main">
          {/* Kırıntı yolu bileşeni görünür yolla birlikte BreadcrumbList
              yapısal verisini de basıyor; burada hiç yoktu. Seçili kategori
              varsa son adım o oluyor. */}
          <Breadcrumb
            className="mb-2"
            adimlar={[
              { label: 'Ana Sayfa', href: '/' },
              { label: cfg.name, href: '/' },
              ...(activeCategoryLabel
                ? [
                    { label: 'Ürünler', href: `/urunler` },
                    { label: activeCategoryLabel },
                  ]
                : [{ label: 'Ürünler' }]),
            ]}
          />
          <div className="flex items-end justify-between gap-4">
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight">
              {activeCategoryLabel ?? `${cfg.name} Ürünleri`}
            </h1>
            <p className="text-sm text-gray-400 hidden sm:block shrink-0">{total} ürün</p>
          </div>
        </div>
      </div>

      {/* ─── L0: Kök kategori sekme çubuğu ──────────────────────────────── */}
      {hasHierarchy && (
        <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-[0_1px_4px_rgba(0,0,0,.06)]">
          <div className="container-main">
            <div role="tablist" className="flex items-stretch overflow-x-auto scrollbar-hide -mb-px">
              <button
                role="tab"
                aria-selected={!activeKullanim}
                onClick={clearAll}
                className={[
                  'flex-shrink-0 px-5 py-4 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap',
                  !activeKullanim
                    ? `${accentText} ${accentBorder}`
                    : 'text-gray-500 border-transparent hover:text-gray-800 hover:border-gray-300',
                ].join(' ')}
              >
                Tümü
              </button>

              <span aria-hidden className="self-center text-gray-200 select-none px-1">|</span>

              {rootCategories.map((cat, idx) => {
                const isActive = activeKullanim === cat.slug
                return (
                  <div key={cat.slug} className="flex items-stretch flex-shrink-0">
                    <button
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setKullanim(cat.slug)}
                      className={[
                        'flex items-center gap-2 px-5 py-4 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap',
                        isActive
                          ? `${accentText} ${accentBorder}`
                          : 'text-gray-500 border-transparent hover:text-gray-800 hover:border-gray-300',
                      ].join(' ')}
                    >
                      <Icon name={categoryIcon(cat.slug, cat.icon)} className="w-4 h-4" />
                      <span>{cat.name}</span>
                      {cat.productCount != null && cat.productCount > 0 && (
                        <span
                          className={[
                            'text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none transition-colors',
                            isActive ? `${accentBg} text-white` : 'bg-gray-100 text-gray-500',
                          ].join(' ')}
                        >
                          {cat.productCount}
                        </span>
                      )}
                    </button>
                    {idx < rootCategories.length - 1 && (
                      <span aria-hidden className="self-center text-gray-200 select-none px-1">
                        |
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─── Ürün tipi pill şeridi ───────────────────────────────────────── */}
      {hasHierarchy && activePills.length > 0 && (
        <div className={`${accentLight} border-b border-gray-100`}>
          <div className="container-main">
            {/* Mobil */}
            <div className="flex md:hidden items-center gap-2 py-3">
              <button
                onClick={clearTypeFilter}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold border transition-all duration-300 ease-out active:scale-95 ${
                  pillAllActive ? `${pillActive} scale-105 shadow-sm` : `${pillInactive} hover:scale-105`
                }`}
              >
                Tümü
              </button>
              <div className="relative">
                <select
                  value={activeType}
                  onChange={(e) => {
                    const val = e.target.value
                    if (!val) clearTypeFilter()
                    else setTypeFilter(val)
                  }}
                  aria-label="Ürün tipi"
                  className="appearance-none max-w-[60vw] sm:max-w-none truncate pl-3 pr-7 py-1.5 rounded-full text-xs font-semibold border border-gray-200 bg-white text-gray-700 focus:outline-none focus:border-gray-400 cursor-pointer"
                >
                  <option value="">Kategori Seç</option>
                  {activePills.map((pill) => (
                    <option key={pill.name} value={pill.name}>
                      {pill.name}
                    </option>
                  ))}
                </select>
                <svg
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Masaüstü */}
            <div className="hidden md:flex flex-wrap items-center gap-2 py-3">
              <button
                onClick={clearTypeFilter}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold border transition-all duration-300 ease-out active:scale-95 ${
                  pillAllActive ? `${pillActive} scale-105 shadow-sm` : `${pillInactive} hover:scale-105`
                }`}
              >
                Tümü
              </button>
              {activePills.map((pill) => {
                const isActive = activeType === pill.name
                return (
                  <button
                    key={pill.name}
                    onClick={() => setTypeFilter(pill.name)}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold border transition-all duration-300 ease-out whitespace-nowrap active:scale-95 ${
                      isActive ? `${pillActive} scale-105 shadow-sm` : `${pillInactive} hover:scale-105`
                    }`}
                  >
                    <Icon name={categoryIcon(pill.slug, pill.icon)} className="w-3.5 h-3.5" />
                    <span>{pill.name}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─── Ana içerik ──────────────────────────────────────────────────── */}
      <div className="container-main py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* ── Filtre paneli ── */}
          <aside className="lg:w-60 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 lg:sticky lg:top-24 space-y-6">
              {/* Ürün markası */}
              {facets.productBrands.length > 0 && (
                <div>
                  <h3 className="font-bold text-gray-900 mb-3 text-xs uppercase tracking-widest">
                    Ürün Markası
                  </h3>
                  <div className="space-y-1 max-h-56 overflow-y-auto scrollbar-hide">
                    <button
                      onClick={() => updateParams({ marka: null })}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        !activeBrandFilter
                          ? `${accentBg} text-white font-semibold`
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Tümü
                    </button>
                    {facets.productBrands.map((brand) => (
                      <button
                        key={brand}
                        onClick={() => updateParams({ marka: brand })}
                        className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                          activeBrandFilter === brand
                            ? `${accentBg} text-white font-semibold`
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {brand}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Fiyat aralığı */}
              <div>
                <h3 className="font-bold text-gray-900 mb-3 text-xs uppercase tracking-widest">
                  Fiyat Aralığı
                </h3>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={priceInputs.min}
                    onChange={(e) => setPriceInputs((p) => ({ ...p, min: e.target.value }))}
                    placeholder={String(facets.priceRange.min)}
                    aria-label="En düşük fiyat"
                    className="w-full min-w-0 px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400"
                  />
                  <span className="text-gray-300">–</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={priceInputs.max}
                    onChange={(e) => setPriceInputs((p) => ({ ...p, max: e.target.value }))}
                    placeholder={String(facets.priceRange.max)}
                    aria-label="En yüksek fiyat"
                    className="w-full min-w-0 px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400"
                  />
                </div>
                <button
                  onClick={applyPriceFilter}
                  className={`btn-press w-full text-white text-sm font-semibold py-2 rounded-lg ${accentBg} ${accentHover}`}
                >
                  Uygula
                </button>
              </div>

              {/* Stok */}
              <div>
                <label htmlFor="filtre-stokta" className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    id="filtre-stokta"
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => updateParams({ stokta: e.target.checked ? '1' : null })}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Sadece stokta olanlar</span>
                </label>
              </div>

              {(activeFilters.length > 0 || activeKullanim || activeType) && (
                <button
                  onClick={clearAll}
                  className="w-full text-sm text-gray-500 hover:text-gray-900 underline underline-offset-2 pt-1"
                >
                  Tüm filtreleri temizle
                </button>
              )}
            </div>
          </aside>

          {/* ── Liste ── */}
          <div className="flex-1 min-w-0">
            {/* Sıralama + sayım */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <p className="text-sm text-gray-500">
                {activeCategoryLabel && (
                  <span className={`font-semibold ${accentText}`}>{activeCategoryLabel} · </span>
                )}
                {total} ürün
                {pageCount > 1 && (
                  <span className="text-gray-400">
                    {' '}
                    (sayfa {page}/{pageCount})
                  </span>
                )}
              </p>
              <select
                value={sort}
                onChange={(e) => updateParams({ sirala: e.target.value })}
                aria-label="Sıralama"
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:border-gray-400"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Aktif filtre rozetleri */}
            {activeFilters.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-5">
                {activeFilters.map((filter) => (
                  <button
                    key={filter.label}
                    onClick={filter.clear}
                    className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-medium px-3 py-1.5 rounded-full hover:border-gray-400 transition-colors"
                  >
                    {filter.label}
                    <span className="text-gray-400 text-sm leading-none">×</span>
                  </button>
                ))}
              </div>
            )}

            <div className={isPending ? 'opacity-50 transition-opacity duration-200' : ''}>
              <ProductGrid
                products={products}
                brandKey={brandKey}
                brandLabels={productBrandLabels}
                accentBg={accentBg}
                accentHover={accentHover}
                accentText={accentText}
                accentTag={accentTag}
                discount={discount}
                handleAddToCart={handleAddToCart}
                clearAll={clearAll}
              />
            </div>

            {/* Sayfalama */}
            {pageCount > 1 && (
              <Pagination page={page} pageCount={pageCount} onChange={goToPage} accentBg={accentBg} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Sayfalama ────────────────────────────────────────────────────────────────

function Pagination({
  page,
  pageCount,
  onChange,
  accentBg,
}: {
  page: number
  pageCount: number
  onChange: (page: number) => void
  accentBg: string
}) {
  // Geniş listelerde sayfa numaralarını kısalt: 1 … 4 5 6 … 20
  const pages: (number | '…')[] = []
  const spread = 1 // aktif sayfanın iki yanında gösterilecek sayfa adedi

  for (let i = 1; i <= pageCount; i++) {
    if (i === 1 || i === pageCount || (i >= page - spread && i <= page + spread)) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '…') {
      pages.push('…')
    }
  }

  return (
    <nav aria-label="Sayfalama" className="flex items-center justify-center gap-1.5 mt-10">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        ← Önceki
      </button>

      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`gap-${i}`} className="px-2 text-gray-400 select-none">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            aria-current={p === page ? 'page' : undefined}
            className={`min-w-[38px] px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              p === page
                ? `${accentBg} text-white`
                : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-400'
            }`}
          >
            {p}
          </button>
        ),
      )}

      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= pageCount}
        className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Sonraki →
      </button>
    </nav>
  )
}

// ─── Ürün ızgarası ────────────────────────────────────────────────────────────

interface GridProps {
  products: Product[]
  brandKey: BrandKey
  brandLabels: Map<string, string>
  accentBg: string
  accentHover: string
  accentText: string
  accentTag: string
  discount: (p: Product) => number | null
  handleAddToCart: (p: Product) => void
  clearAll: () => void
}

function ProductGrid({
  products,
  brandKey,
  brandLabels,
  accentBg,
  accentHover,
  accentText,
  accentTag,
  discount,
  handleAddToCart,
  clearAll,
}: GridProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-24">
        <Icon name="arama" className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p className="text-gray-500 font-medium text-lg">Bu filtrelerle ürün bulunamadı</p>
        <button
          onClick={clearAll}
          className={`mt-5 ${accentText} underline underline-offset-2 text-sm font-medium`}
        >
          Tüm ürünleri gör
        </button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
      {products.map((product, index) => (
        <div
          key={product.slug}
          style={{ animationDelay: `${Math.min(index, 12) * 45}ms` }}
          className="anim-fade-up"
        >
          <UrunKarti urun={product} sira={index} etiket={brandLabels.get(product.slug) || undefined} />
        </div>
      ))}
    </div>
  )
}
