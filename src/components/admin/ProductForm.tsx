'use client'

import { useState, useRef, useTransition, useMemo } from 'react'
import { createSignedUploadUrl } from '@/app/actions/admin'

/**
 * Ürün ekleme / düzenleme formu.
 *
 * Bilerek sade: mağaza tek olduğu için marka seçimi yok; adres (slug) ve ürün
 * kodu sistemde üretiliyor; ölçü, malzeme gibi bilgiler açıklamaya yazılıyor.
 * Kategori listede yoksa "Diğer" seçilip yeni kategori adı yazılıyor, kayıt
 * sırasında açılıyor.
 */

type Category = { id: number; name: string; parentId?: number | null }

/** Açılır listede "Diğer (yeni kategori)" seçeneğinin değeri */
const YENI = 'yeni'

interface ProductFormProps {
  categories: Category[]
  /**
   * Sunucu aksiyonu. Başarıda `redirect()` ile biter ve hiç dönmez;
   * doğrulama hatasında `{ ok: false, error }` döner.
   */
  action: (formData: FormData) => Promise<{ ok: false; error: string } | void>
  defaultValues?: {
    id?: string
    name?: string
    description?: string
    shortDescription?: string
    price?: number
    salePrice?: number | null
    stock?: number
    categoryId?: number
    vatRate?: number
    isActive?: boolean
    isFeatured?: boolean
  }
  submitLabel?: string
  /**
   * Düzenleme ekranında görseller ayrı `ImageManager` bileşeniyle yönetiliyor;
   * bu durumda formdaki görsel bölümü gizlenir.
   */
  hideImageSection?: boolean
}

type Yuklenen = { onizleme: string; url: string | null; hata?: boolean }

const alan =
  'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent'
const etiket = 'block text-sm font-medium text-gray-700 mb-1'

export default function ProductForm({
  categories,
  action,
  defaultValues = {},
  submitLabel = 'Kaydet',
  hideImageSection = false,
}: ProductFormProps) {
  const [isPending, startTransition] = useTransition()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [aktif, setAktif] = useState<boolean>(defaultValues.isActive ?? true)
  const [oneCikan, setOneCikan] = useState<boolean>(defaultValues.isFeatured ?? false)

  // ── Kategori ──────────────────────────────────────────────────────────────
  const anaKategoriler = useMemo(() => categories.filter((c) => c.parentId == null), [categories])

  const baslangic = useMemo(() => {
    const kat = categories.find((c) => c.id === defaultValues.categoryId)
    if (!kat) return { ana: '', alt: '' }
    // Ürün doğrudan bir ana kategoriye bağlıysa alt kategori boş gelir
    if (kat.parentId == null) return { ana: String(kat.id), alt: '' }
    return { ana: String(kat.parentId), alt: String(kat.id) }
  }, [categories, defaultValues.categoryId])

  const [ana, setAna] = useState<string>(baslangic.ana)
  const [alt, setAlt] = useState<string>(baslangic.alt)

  const altKategoriler = useMemo(
    () => (ana && ana !== YENI ? categories.filter((c) => c.parentId === Number(ana)) : []),
    [categories, ana],
  )

  // Yeni ana kategoride alt kategori de yeni olmak zorunda
  const altYeni = ana === YENI || alt === YENI

  // ── Görseller (yalnızca yeni üründe; düzenlemede ImageManager) ───────────
  const [gorseller, setGorseller] = useState<Yuklenen[]>([])
  const yukleniyor = gorseller.some((g) => !g.url && !g.hata)
  const dosyaRef = useRef<HTMLInputElement>(null)

  async function dosyalariYukle(dosyalar: FileList) {
    const secilen = Array.from(dosyalar).slice(0, Math.max(0, 10 - gorseller.length))
    const yeni = secilen.map((f) => ({ onizleme: URL.createObjectURL(f), url: null }) as Yuklenen)
    setGorseller((g) => [...g, ...yeni])

    await Promise.all(
      secilen.map(async (dosya, i) => {
        const onizleme = yeni[i].onizleme
        try {
          const uzanti = (dosya.name.split('.').pop() || 'jpg').toLowerCase()
          const ad = `urun-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${uzanti}`
          const { signedUrl, publicUrl } = await createSignedUploadUrl(ad)
          const res = await fetch(signedUrl, {
            method: 'PUT',
            headers: { 'Content-Type': dosya.type },
            body: dosya,
          })
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          setGorseller((g) => g.map((x) => (x.onizleme === onizleme ? { ...x, url: publicUrl } : x)))
        } catch (err) {
          console.error('[ürün formu] görsel yüklenemedi:', err)
          setGorseller((g) => g.map((x) => (x.onizleme === onizleme ? { ...x, hata: true } : x)))
        }
      }),
    )
  }

  const gorselKaldir = (onizleme: string) => setGorseller((g) => g.filter((x) => x.onizleme !== onizleme))

  // ── Enter ile kaydetme (açıklama alanları hariç) ─────────────────────────
  function handleKeyDown(e: React.KeyboardEvent<HTMLFormElement>) {
    if (e.key !== 'Enter' || e.nativeEvent.isComposing) return
    const hedef = e.target
    if (
      hedef instanceof HTMLTextAreaElement ||
      hedef instanceof HTMLButtonElement ||
      hedef instanceof HTMLAnchorElement
    ) {
      return
    }
    e.preventDefault()
    if (isPending || yukleniyor) return
    e.currentTarget.requestSubmit()
  }

  // ── Gönderim ──────────────────────────────────────────────────────────────
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (yukleniyor) return

    const formData = new FormData(e.currentTarget)
    formData.set('isActive', aktif ? 'true' : 'false')
    formData.set('isFeatured', oneCikan ? 'true' : 'false')
    formData.set('imageUrls', JSON.stringify(gorseller.filter((g) => g.url).map((g) => g.url)))
    formData.delete('gorselDosya')

    setSubmitError(null)
    startTransition(async () => {
      try {
        const result = await action(formData)
        if (result && !result.ok) {
          setSubmitError(result.error)
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }
      } catch (err) {
        // Başarılı kayıt redirect() ile biter; Next bunu özel bir hata olarak fırlatır.
        if (
          err &&
          typeof err === 'object' &&
          'digest' in err &&
          typeof (err as { digest?: unknown }).digest === 'string' &&
          (err as { digest: string }).digest.startsWith('NEXT_REDIRECT')
        ) {
          throw err
        }
        console.error('[ürün formu] beklenmeyen hata:', err)
        setSubmitError('Kayıt sırasında beklenmeyen bir hata oluştu. Bağlantınızı kontrol edip tekrar deneyin.')
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="space-y-8">
      {submitError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          <span className="font-semibold">Kaydedilemedi: </span>
          {submitError}
        </div>
      )}

      {/* ── Temel Bilgiler ── */}
      <section className="bg-white rounded-xl shadow-sm p-6 space-y-5">
        <h2 className="font-semibold text-gray-800 text-base border-b pb-3">Temel Bilgiler</h2>

        <div>
          <label htmlFor="urun-name" className={etiket}>Ürün Adı *</label>
          <input id="urun-name" name="name" required defaultValue={defaultValues.name ?? ''} className={alan} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Ana kategori */}
          <div>
            <label htmlFor="urun-ana" className={etiket}>Ana Kategori *</label>
            <select
              id="urun-ana"
              name="anaKategori"
              required
              value={ana}
              onChange={(e) => {
                setAna(e.target.value)
                setAlt(e.target.value === YENI ? YENI : '')
              }}
              className={alan}
            >
              <option value="">Seçiniz</option>
              {anaKategoriler.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
              <option value={YENI}>Diğer (yeni kategori)</option>
            </select>
            {ana === YENI && (
              <input
                name="yeniAnaKategori"
                required
                maxLength={100}
                aria-label="Yeni ana kategorinin adı"
                className={`${alan} mt-2`}
                autoFocus
              />
            )}
          </div>

          {/* Alt kategori */}
          <div>
            <label htmlFor="urun-alt" className={etiket}>Alt Kategori *</label>
            {ana === YENI ? (
              <input type="hidden" name="altKategori" value={YENI} />
            ) : (
              <select
                id="urun-alt"
                name="altKategori"
                required
                disabled={!ana}
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
                className={`${alan} disabled:bg-gray-50 disabled:text-gray-400`}
              >
                <option value="">{ana ? 'Seçiniz' : 'Önce ana kategoriyi seçin'}</option>
                {altKategoriler.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
                {ana && <option value={YENI}>Diğer (yeni kategori)</option>}
              </select>
            )}
            {altYeni && (
              <input
                id={ana === YENI ? 'urun-alt' : undefined}
                name="yeniAltKategori"
                required
                maxLength={100}
                aria-label="Yeni alt kategorinin adı"
                className={`${alan} ${ana === YENI ? '' : 'mt-2'}`}
                autoFocus={ana !== YENI}
              />
            )}
          </div>
        </div>
        {altYeni && (
          <p className="-mt-2 text-xs text-gray-500">
            Yeni kategori, ürünü kaydettiğinizde açılır. Aynı adda bir kategori varsa yenisi açılmaz, o kullanılır.
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label htmlFor="urun-vatRate" className={etiket}>
              KDV Oranı *
              <span className="ml-1.5 text-xs font-normal text-gray-400">(fiyat KDV dahil girilir)</span>
            </label>
            {/* Hazır giyim ve ayakkabıda oran %10, oyuncak ve aksesuarda
                genellikle %20. TODO(müşteri): mali müşavirle teyit. */}
            <select id="urun-vatRate" name="vatRate" defaultValue={String(defaultValues.vatRate ?? 10)} className={alan}>
              <option value="10">%10 — Giyim, ayakkabı</option>
              <option value="20">%20 — Oyuncak, araç-gereç</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="urun-shortDescription" className={etiket}>
            Kısa Açıklama
            <span className="ml-1.5 text-xs font-normal text-gray-400">(ürün sayfasında fiyatın altında görünür)</span>
          </label>
          <textarea
            id="urun-shortDescription"
            name="shortDescription"
            rows={2}
            defaultValue={defaultValues.shortDescription ?? ''}
            className={`${alan} resize-none`}
          />
        </div>

        <div>
          <label htmlFor="urun-description" className={etiket}>
            Tam Açıklama
            <span className="ml-1.5 text-xs font-normal text-gray-400">(kumaş, ölçü, yaş aralığı, yıkama gibi bilgiler)</span>
          </label>
          <textarea
            id="urun-description"
            name="description"
            rows={6}
            defaultValue={defaultValues.description ?? ''}
            className={`${alan} resize-y`}
          />
        </div>
      </section>

      {/* ── Fiyat & Stok ── */}
      <section className="bg-white rounded-xl shadow-sm p-6 space-y-5">
        <h2 className="font-semibold text-gray-800 text-base border-b pb-3">Fiyat & Stok</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div>
            <label htmlFor="urun-price" className={etiket}>Fiyat (₺) *</label>
            <input
              id="urun-price"
              name="price"
              type="number"
              step="0.01"
              min="0"
              required
              inputMode="decimal"
              defaultValue={defaultValues.price ?? ''}
              className={alan}
            />
          </div>
          <div>
            <label htmlFor="urun-salePrice" className={etiket}>İndirimli Fiyat (₺)</label>
            <input
              id="urun-salePrice"
              name="salePrice"
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              defaultValue={defaultValues.salePrice ?? ''}
              className={alan}
            />
          </div>
          <div>
            <label htmlFor="urun-stockQuantity" className={etiket}>Stok Adedi *</label>
            <input
              id="urun-stockQuantity"
              name="stockQuantity"
              type="number"
              min="0"
              required
              inputMode="numeric"
              defaultValue={defaultValues.stock ?? 0}
              className={alan}
            />
          </div>
        </div>
      </section>

      {/* ── Görseller (yeni ürün) ── */}
      {!hideImageSection && (
        <section className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-800 text-base border-b pb-3">Görseller</h2>

          {gorseller.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {gorseller.map((g, i) => (
                <div key={g.onizleme} className="relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                  {/* Yerel blob: önizlemesi; next/image bunu işleyemiyor */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={g.onizleme} alt="" className="h-full w-full object-cover" />
                  {i === 0 && !g.hata && (
                    <span className="absolute left-1.5 top-1.5 rounded bg-brand-600 px-1.5 py-0.5 text-[10px] font-bold text-white">Kapak</span>
                  )}
                  {!g.url && !g.hata && (
                    <span className="absolute inset-0 flex items-center justify-center bg-white/70">
                      <span className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                    </span>
                  )}
                  {g.hata && (
                    <span className="absolute inset-0 flex items-center justify-center bg-red-50/90 p-2 text-center text-xs font-medium text-red-700">
                      Yüklenemedi
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => gorselKaldir(g.onizleme)}
                    aria-label={`${i + 1}. görseli kaldır`}
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-sm leading-none text-white hover:bg-black/80"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div>
            <label htmlFor="urun-gorsel" className={etiket}>
              Görsel Ekle
              <span className="ml-1.5 text-xs font-normal text-gray-400">(birden fazla seçebilirsiniz; ilki kapak olur)</span>
            </label>
            <input
              id="urun-gorsel"
              ref={dosyaRef}
              name="gorselDosya"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              multiple
              disabled={gorseller.length >= 10}
              onChange={(e) => {
                if (e.target.files?.length) dosyalariYukle(e.target.files)
                e.target.value = ''
              }}
              className="block text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 disabled:opacity-50"
            />
          </div>
        </section>
      )}

      {/* ── Yayın Durumu ── */}
      <section className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="font-semibold text-gray-800 text-base border-b pb-3 mb-4">Yayın Durumu</h2>
        <div className="flex flex-col sm:flex-row gap-4">
          <label htmlFor="urun-isActive" className="flex items-center gap-3 cursor-pointer select-none">
            <input
              id="urun-isActive"
              type="checkbox"
              checked={aktif}
              onChange={(e) => setAktif(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="text-sm text-gray-700">Aktif (sitede görünsün)</span>
          </label>
          <label htmlFor="urun-isFeatured" className="flex items-center gap-3 cursor-pointer select-none">
            <input
              id="urun-isFeatured"
              type="checkbox"
              checked={oneCikan}
              onChange={(e) => setOneCikan(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="text-sm text-gray-700">Öne Çıkan (ana sayfada görünsün)</span>
          </label>
        </div>
      </section>

      <div className="flex items-center justify-end gap-4">
        <a href="/admin/urunler" className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors">
          İptal
        </a>
        <button
          type="submit"
          disabled={isPending || yukleniyor}
          className="px-6 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {yukleniyor ? 'Görseller yükleniyor…' : isPending ? 'Kaydediliyor…' : submitLabel}
        </button>
      </div>
    </form>
  )
}
