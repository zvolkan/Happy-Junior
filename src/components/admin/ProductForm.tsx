'use client'

import { useState, useRef, useTransition, useMemo } from 'react'
import { createSignedUploadUrl } from '@/app/actions/admin'
import { slugify } from '@/lib/utils'
import Icon from '@/components/ui/Icon'

// ── Ürün markası listesi (11 marka) ──────────────────────────────────────────
const URUN_MARKALARI = [
  'ALB TARIM',
  'TİMAC AGRO',
  'BAZACHEM',
  'HAIFA',
  'STOLLER',
  'ATLANTICA AGRICOLA',
  'UNITTAR',
  "LANCE'S LINK",
  'LEBOSOL',
  'TAMAGRO',
  'FERTIVAL',
]

type Brand = { id: number; key: string; name: string }
type Category = { id: number; name: string; parentId?: number | null; brand: Brand }
type Spec = { name: string; value: string; unit: string }
type ImageRecord = { id: number; url: string; isPrimary: boolean }

interface ProductFormProps {
  brands: Brand[]
  categories: Category[]
  /**
   * Sunucu aksiyonu. Başarıda `redirect()` ile biter ve hiç dönmez;
   * doğrulama hatasında `{ ok: false, error }` döner. Hata fırlatmıyor
   * çünkü Next.js üretimde sunucu aksiyonu hatalarının mesajını gizliyor.
   */
  action: (formData: FormData) => Promise<{ ok: false; error: string } | void>
  defaultValues?: {
    id?: string
    name?: string
    slug?: string
    description?: string
    shortDescription?: string
    price?: number
    salePrice?: number | null
    stock?: number
    unit?: string
    sku?: string
    brandId?: number
    categoryId?: number
    productBrand?: string        // ← YENİ
    vatRate?: number
    isActive?: boolean
    isFeatured?: boolean
    specs?: Spec[]
    images?: ImageRecord[]
  }
  submitLabel?: string
  /**
   * Düzenleme ekranında görseller ayrı `ImageManager` bileşeniyle yönetiliyor
   * (çoklu görsel). Bu durumda formdaki tek görsel alanı gizlenir — aksi halde
   * form kaydedildiğinde tek görsel diğerlerinin yerine geçerdi.
   */
  hideImageSection?: boolean
}

export default function ProductForm({
  brands,
  categories,
  action,
  defaultValues = {},
  submitLabel = 'Kaydet',
  hideImageSection = false,
}: ProductFormProps) {
  const [isPending, startTransition] = useTransition()
  const [submitError, setSubmitError] = useState<string | null>(null)

  // ── Website markası (ALB Tarım / ALB Su Arıtma) ──────────────────────────
  const [selectedBrandId, setSelectedBrandId] = useState<number>(
    defaultValues.brandId ?? brands[0]?.id ?? 0,
  )

  // ── Ürün markası (TİMAC AGRO, ALB TARIM, FERTIVAL vb.) ──────────────────
  const [selectedProductBrand, setSelectedProductBrand] = useState<string>(
    defaultValues.productBrand ?? '',
  )

  // ── Yayın durumu ─────────────────────────────────────────────────────────
  //
  // Bu iki alan eskiden `defaultChecked` ile kontrolsüz (uncontrolled) çalışıyor
  // ve yanına gizli bir `<input value="false">` konuyordu. İki sorun vardı:
  //
  //   1. `defaultChecked` yalnızca bileşen İLK kez bağlandığında okunuyor.
  //      Tarayıcı geri/ileri gezinmesinde form durumunu kendi hafızasından
  //      geri yükleyince, ürün aktif olsa bile kutu işaretsiz görünüyordu.
  //   2. Aynı adı taşıyan gizli input + checkbox ikilisi, gönderim sırasında
  //      `getAll()` ile ayrıştırılmak zorundaydı — kırılgan bir düzen.
  //
  // Kontrollü hâle getirilince ikisi de ortadan kalktı: değer React'te
  // tutuluyor, gönderimde doğrudan oradan yazılıyor.
  const [aktif, setAktif] = useState<boolean>(defaultValues.isActive ?? true)
  const [oneCikan, setOneCikan] = useState<boolean>(defaultValues.isFeatured ?? false)

  const [specs, setSpecs] = useState<Spec[]>(
    defaultValues.specs?.map((s) => ({ name: s.name, value: s.value, unit: s.unit ?? '' })) ?? [
      { name: '', value: '', unit: '' },
    ],
  )

  const existingImageUrl = defaultValues.images?.find((i) => i.isPrimary)?.url ?? null

  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(existingImageUrl)
  const [imagePreview, setImagePreview]         = useState<string | null>(existingImageUrl)
  const [replaceImage, setReplaceImage]         = useState(false)
  const [uploading, setUploading]               = useState(false)
  const [uploadError, setUploadError]           = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // ── Kategori hiyerarşisi ─────────────────────────────────────────────────
  // parentCategories: parentId === null (L0 kök kategoriler)
  // allChildren:      parentId !== null (L1 + L2 dahil tüm alt kategoriler)

  const parentCategories = useMemo(
    () => categories.filter((c) => c.brand.id === selectedBrandId && c.parentId == null),
    [categories, selectedBrandId],
  )

  const allChildren = useMemo(
    () => categories.filter((c) => c.brand.id === selectedBrandId && c.parentId != null),
    [categories, selectedBrandId],
  )

  const hasHierarchy = parentCategories.length > 0 && allChildren.length > 0

  // ── Düzenleme modunda başlangıç parent ID'yi çöz ─────────────────────────
  function resolveInitialParentId(brandId: number): number {
    if (defaultValues.categoryId) {
      const currentCat = categories.find((c) => c.id === defaultValues.categoryId)
      if (currentCat?.parentId != null) {
        // L2 kategori (İthal ürün tipi) → parent = brand L1 → grandparent = root
        const parentCat = categories.find((c) => c.id === currentCat.parentId)
        if (parentCat?.parentId != null) {
          // Grandparent = root (L0)
          return parentCat.parentId
        }
        // L1 kategori (ALB ürün tipi) → parent = root (L0)
        return currentCat.parentId
      }
    }
    return categories.find((c) => c.brand.id === brandId && c.parentId == null)?.id ?? 0
  }

  const [selectedParentId, setSelectedParentId] = useState<number>(() =>
    resolveInitialParentId(selectedBrandId),
  )

  // ── Ürün markası alanı hangi markada görünsün? ───────────────────────────
  //
  // "Ürün Markası" listesi (TİMAC AGRO, HAIFA, LEBOSOL …) tamamen tarım
  // tedarikçilerinden oluşuyor. ALB Su Arıtma tarafında karşılığı yok; orada
  // zorunlu bir alan olarak durunca kaydetmeyi engelliyordu.
  //
  // Alan artık YALNIZCA ALB Tarım'da görünüyor ve yalnızca orada zorunlu.
  // Diğer markalarda gizleniyor — ama gizli input ile mevcut değer korunuyor:
  // alanı formdan tamamen çıkarmak, ALB Su ürününde eskiden kayıtlı bir marka
  // varsa onu ilk kayıtta sessizce silerdi.
  const seciliMarkaAnahtari = useMemo(
    () => brands.find((b) => b.id === selectedBrandId)?.key ?? '',
    [brands, selectedBrandId],
  )
  const urunMarkasiGorunur = seciliMarkaAnahtari === 'alb-tarim'
  /** Alan gerçekten çiziliyor mu? Düz kategori düzeninde hiç çizilmiyor. */
  const urunMarkasiAlaniVar = hasHierarchy && urunMarkasiGorunur

  // ── İthal Ürünler mi seçili? ─────────────────────────────────────────────
  const isIthalSelected = useMemo(() => {
    const parent = parentCategories.find((c) => c.id === selectedParentId)
    return parent?.name === 'İthal Ürünler'
  }, [parentCategories, selectedParentId])

  // İthal modunda: seçilen ürün markasına karşılık gelen L1 marka kategorisi
  const brandL1Cat = useMemo(() => {
    if (!isIthalSelected || !selectedProductBrand) return null
    return allChildren.find(
      (c) =>
        c.parentId === selectedParentId &&
        c.name.toUpperCase() === selectedProductBrand.toUpperCase(),
    )
  }, [isIthalSelected, selectedParentId, selectedProductBrand, allChildren])

  // Alt Kategori: İthal → L2 (marka'nın ürün tipleri), ALB → L1 (ürün tipleri)
  const filteredChildren = useMemo(() => {
    if (isIthalSelected) {
      if (!brandL1Cat) return []
      return allChildren.filter((c) => c.parentId === brandL1Cat.id)
    }
    return allChildren.filter((c) => c.parentId === selectedParentId)
  }, [isIthalSelected, brandL1Cat, selectedParentId, allChildren])

  // Flat (hiyerarşi yoksa)
  const flatCategories = useMemo(
    () => (!hasHierarchy ? categories.filter((c) => c.brand.id === selectedBrandId) : []),
    [categories, selectedBrandId, hasHierarchy],
  )

  // Seçili alt kategori (controlled)
  function resolveInitialCategoryId(): number {
    if (defaultValues.categoryId) return defaultValues.categoryId
    return 0
  }
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(resolveInitialCategoryId)

  // ── Yardımcılar ──────────────────────────────────────────────────────────

  function addSpec() { setSpecs((prev) => [...prev, { name: '', value: '', unit: '' }]) }
  function removeSpec(idx: number) { setSpecs((prev) => prev.filter((_, i) => i !== idx)) }
  function updateSpec(idx: number, field: keyof Spec, val: string) {
    setSpecs((prev) => prev.map((s, i) => (i === idx ? { ...s, [field]: val } : s)))
  }

  // Website markası değişince tüm kategori seçimlerini sıfırla
  function handleBrandChange(newBrandId: number) {
    setSelectedBrandId(newBrandId)
    const firstParent = categories.find((c) => c.brand.id === newBrandId && c.parentId == null)
    setSelectedParentId(firstParent?.id ?? 0)
    setSelectedCategoryId(0)
    setSelectedProductBrand('')
  }

  // Ürün markası değişince alt kategori seçimini sıfırla
  function handleProductBrandChange(brand: string) {
    setSelectedProductBrand(brand)
    setSelectedCategoryId(0)
  }

  // Ana Kategori değişince alt kategori + ürün markasını sıfırla
  function handleParentChange(newParentId: number) {
    setSelectedParentId(newParentId)
    setSelectedCategoryId(0)
    setSelectedProductBrand('')
  }

  // ── Görsel yükleme (Supabase Storage → signed URL) ───────────────────────
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setImagePreview(URL.createObjectURL(file))
    setUploading(true)
    setUploadError(null)

    try {
      const slugInput = document.getElementById('slug-input') as HTMLInputElement
      const slug = slugInput?.value?.trim() || `urun-${Date.now()}`
      const ext = file.name.split('.').pop() || 'jpg'
      const fileName = `${slug}.${ext}`

      const { signedUrl, publicUrl } = await createSignedUploadUrl(fileName)

      const res = await fetch(signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      setUploadedImageUrl(publicUrl)
      setReplaceImage(true)
    } catch (err) {
      console.error('[ProductForm] upload error:', err)
      setUploadError('Görsel yüklenemedi. Lütfen tekrar deneyin.')
      setImagePreview(existingImageUrl)
      if (fileRef.current) fileRef.current.value = ''
    } finally {
      setUploading(false)
    }
  }

  // ── Enter ile kaydetme ────────────────────────────────────────────────────
  //
  // Tarayıcı normalde Enter'a basınca formu kendiliğinden gönderir, ama bu
  // "örtük gönderim" güvenilmez: açılır listelerde (select) çalışmaz, sayı
  // alanlarında tarayıcıya göre değişir, geçersiz bir alan varsa da hiçbir şey
  // olmadan sessizce durur. Fiyat güncellerken en çok kullanılan tuş bu olduğu
  // için açıkça ele alınıyor.
  //
  // Üç istisna var:
  //   • Çok satırlı alanlarda (açıklama) Enter satır atlamalı, kaydetmemeli.
  //   • Düğme ya da bağlantı odaktayken Enter zaten onların işini yapıyor.
  //   • Türkçe/başka dil klavyesinde metin birleştirme (IME) sürerken basılan
  //     Enter bir harf seçimi olabilir; onu gönderim saymak yazıyı bozar.
  function handleKeyDown(e: React.KeyboardEvent<HTMLFormElement>) {
    if (e.key !== 'Enter') return
    if (e.nativeEvent.isComposing) return

    const hedef = e.target
    if (
      hedef instanceof HTMLTextAreaElement ||
      hedef instanceof HTMLButtonElement ||
      hedef instanceof HTMLAnchorElement
    ) {
      return
    }

    // Görsel yüklenirken ya da kayıt sürerken Enter'ı yut: ikinci bir gönderim
    // aynı ürünü iki kez kaydetmeye çalışırdı.
    e.preventDefault()
    if (isPending || uploading) return

    // requestSubmit(), düğmeye basmışsınız gibi davranır: zorunlu alan boşsa
    // tarayıcı uyarısını gösterip o alana odaklanır. form.submit() bunu
    // atlardı ve eksik veriyle kaydederdi.
    e.currentTarget.requestSubmit()
  }

  // ── Form gönderimi ────────────────────────────────────────────────────────
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (uploading) return

    const formData = new FormData(e.currentTarget)

    // Yayın durumu React state'inden yazılıyor; DOM'dan okunmuyor.
    formData.set('isActive', aktif ? 'true' : 'false')
    formData.set('isFeatured', oneCikan ? 'true' : 'false')

    formData.set('specs', JSON.stringify(specs))

    // Dosya asla sunucuya gönderilmez — zaten Supabase'e yüklendi
    formData.delete('imageFile')

    if (replaceImage && uploadedImageUrl) {
      formData.set('imageUrl', uploadedImageUrl)
      formData.set('replaceImage', 'true')
    } else {
      const manualUrl = (formData.get('imageUrl') as string)?.trim()
      formData.set('replaceImage', manualUrl ? 'true' : 'false')
    }

    setSubmitError(null)

    startTransition(async () => {
      try {
        const result = await action(formData)

        // Doğrulama hatası: sunucu artık mesajı sonuç nesnesiyle bildiriyor
        if (result && !result.ok) {
          setSubmitError(result.error)
          window.scrollTo({ top: 0, behavior: 'smooth' })
          return
        }
      } catch (err) {
        // Başarılı kayıt redirect() ile biter; Next bunu özel bir hata olarak
        // fırlatır ve yeniden fırlatılması gerekir, yoksa yönlendirme çalışmaz.
        if (
          err &&
          typeof err === 'object' &&
          'digest' in err &&
          typeof (err as { digest?: unknown }).digest === 'string' &&
          (err as { digest: string }).digest.startsWith('NEXT_REDIRECT')
        ) {
          throw err
        }

        // Buraya artık yalnızca beklenmeyen hatalar düşüyor (ağ kopması gibi).
        // Doğrulama mesajları yukarıda sonuç nesnesinden geliyor.
        console.error('[ürün formu] beklenmeyen hata:', err)
        setSubmitError(
          'Kayıt sırasında beklenmeyen bir hata oluştu. Bağlantınızı kontrol edip tekrar deneyin.',
        )
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    })
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="space-y-8">

      {/* Sunucudan dönen doğrulama hatası */}
      {submitError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          <span className="font-semibold">Kaydedilemedi: </span>
          {submitError}
        </div>
      )}

      {/* ── Temel Bilgiler ── */}
      <section className="bg-white rounded-xl shadow-sm p-6 space-y-5">
        <h2 className="font-semibold text-gray-800 text-base border-b pb-3">Temel Bilgiler</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Website Markası (ALB Tarım / ALB Su Arıtma) */}
          <div>
            <label htmlFor="urun-brandId" className="block text-sm font-medium text-gray-700 mb-1">Marka *</label>
            <select
              id="urun-brandId"
              name="brandId"
              required
              value={selectedBrandId}
              onChange={(e) => handleBrandChange(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {brands.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* ── Kategori: Hiyerarşik ── */}
          {hasHierarchy ? (
            <>
              {/* Ana Kategori (L0) */}
              <div>
                <label htmlFor="urun-anaKategori" className="block text-sm font-medium text-gray-700 mb-1">Ana Kategori *</label>
                <select
                  id="urun-anaKategori"
                  required
                  value={selectedParentId || ''}
                  onChange={(e) => handleParentChange(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Seçiniz</option>
                  {parentCategories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Ürün Markası — yalnızca ALB Tarım'da */}
              {urunMarkasiGorunur && (
                <div className="md:col-span-2">
                  <label htmlFor="urun-productBrand" className="block text-sm font-medium text-gray-700 mb-1">
                    Ürün Markası *
                    <span className="ml-1.5 text-xs font-normal text-gray-400">
                      (Ürün kartında gösterilir)
                    </span>
                  </label>
                  <select
                    id="urun-productBrand"
                    name="productBrand"
                    required
                    value={selectedProductBrand}
                    onChange={(e) => handleProductBrandChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seçiniz</option>
                    {URUN_MARKALARI.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Alt Kategori (ürün tipi) */}
              <div className="md:col-span-2">
                <label htmlFor="urun-categoryId" className="block text-sm font-medium text-gray-700 mb-1">
                  Alt Kategori *
                  {isIthalSelected && !selectedProductBrand && (
                    <span className="ml-2 text-xs text-amber-600 font-normal">
                      Önce bir ürün markası seçin
                    </span>
                  )}
                  {isIthalSelected && selectedProductBrand && filteredChildren.length === 0 && (
                    <span className="ml-2 text-xs text-amber-600 font-normal">
                      Bu marka için kategori bulunamadı — SQL'de eklenmiş mi?
                    </span>
                  )}
                  {!isIthalSelected && selectedParentId > 0 && filteredChildren.length === 0 && (
                    <span className="ml-2 text-xs text-amber-600 font-normal">
                      Bu ana kategoride alt kategori bulunamadı
                    </span>
                  )}
                </label>
                <select
                  id="urun-categoryId"
                  name="categoryId"
                  required
                  value={selectedCategoryId || ''}
                  onChange={(e) => setSelectedCategoryId(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Seçiniz</option>
                  {filteredChildren.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            /* ── Kategori: Flat ── */
            <div>
              <label htmlFor="urun-categoryId" className="block text-sm font-medium text-gray-700 mb-1">Kategori *</label>
              <select
                id="urun-categoryId"
                name="categoryId"
                required
                defaultValue={defaultValues.categoryId ?? ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Seçiniz</option>
                {flatCategories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {/*
            Ürün markası alanı ekranda YOKSA değeri gizli olarak taşınır.
            Alanı formdan tamamen çıkarmak, kayıtlı bir markayı ilk kaydetmede
            sessizce silerdi — alan görünmediği için de kimse fark etmezdi.
            Bu satır düz (hiyerarşisiz) kategori düzenini de kapsıyor; orada
            alan hiçbir zaman çizilmiyordu ve değer zaten kayboluyordu.
          */}
          {!urunMarkasiAlaniVar && (
            <input type="hidden" name="productBrand" value={selectedProductBrand} />
          )}

          {/* Ürün Adı */}
          <div className="md:col-span-2">
            <label htmlFor="urun-name" className="block text-sm font-medium text-gray-700 mb-1">Ürün Adı *</label>
            <input
              id="urun-name"
              name="name"
              required
              defaultValue={defaultValues.name ?? ''}
              onChange={(e) => {
                const slugInput = document.getElementById('slug-input') as HTMLInputElement
                if (slugInput && !defaultValues.id) slugInput.value = slugify(e.target.value)
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Örn: FERTIACTYL GZ"
            />
          </div>

          {/* Slug */}
          <div>
            <label htmlFor="slug-input" className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
            <input
              id="slug-input"
              name="slug"
              required
              defaultValue={defaultValues.slug ?? ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="urun-adi"
            />
          </div>

          {/* KDV Oranı */}
          <div>
            <label htmlFor="urun-vatRate" className="block text-sm font-medium text-gray-700 mb-1">
              KDV Oranı *
              <span className="ml-1.5 text-xs font-normal text-gray-400">
                (fiyat KDV dahil girilir)
              </span>
            </label>
            <select
              id="urun-vatRate"
              name="vatRate"
              defaultValue={String(defaultValues.vatRate ?? 20)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {/* %1 seçeneği kaldırıldı, yerine %0 geldi. Gübreler artık
                  KDV'siz satıldığı için %10 satırındaki "Gübre, tohum, yem"
                  ifadesi de %0'a taşındı — eski etiket yanlış yönlendiriyordu. */}
              <option value="0">%0 — Gübre, tohum, yem vb. KDV&apos;siz girdiler</option>
              <option value="10">%10 — İndirimli oran</option>
              <option value="20">%20 — Genel oran</option>
            </select>
          </div>

          {/* SKU */}
          <div>
            <label htmlFor="urun-sku" className="block text-sm font-medium text-gray-700 mb-1">SKU / Ürün Kodu</label>
            <input
              id="urun-sku"
              name="sku"
              defaultValue={defaultValues.sku ?? ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="TİMAC-FGZE-25"
            />
          </div>
        </div>

        {/* Kısa Açıklama */}
        <div>
          <label htmlFor="urun-shortDescription" className="block text-sm font-medium text-gray-700 mb-1">Kısa Açıklama</label>
          <textarea
            id="urun-shortDescription"
            name="shortDescription"
            rows={2}
            defaultValue={defaultValues.shortDescription ?? ''}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ürünün kısa özeti (kart ve liste sayfasında görünür)"
          />
        </div>

        {/* Açıklama */}
        <div>
          <label htmlFor="urun-description" className="block text-sm font-medium text-gray-700 mb-1">Tam Açıklama</label>
          <textarea
            id="urun-description"
            name="description"
            rows={5}
            defaultValue={defaultValues.description ?? ''}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Detaylı ürün açıklaması"
          />
        </div>
      </section>

      {/* ── Fiyat & Stok ── */}
      <section className="bg-white rounded-xl shadow-sm p-6 space-y-5">
        <h2 className="font-semibold text-gray-800 text-base border-b pb-3">Fiyat & Stok</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          <div>
            <label htmlFor="urun-price" className="block text-sm font-medium text-gray-700 mb-1">Fiyat (₺) *</label>
            <input
              id="urun-price"
              name="price" type="number" step="0.01" min="0" required
              defaultValue={defaultValues.price ?? ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
            />
          </div>
          <div>
            <label htmlFor="urun-salePrice" className="block text-sm font-medium text-gray-700 mb-1">İndirimli Fiyat (₺)</label>
            <input
              id="urun-salePrice"
              name="salePrice" type="number" step="0.01" min="0"
              defaultValue={defaultValues.salePrice ?? ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
            />
          </div>
          <div>
            <label htmlFor="urun-stockQuantity" className="block text-sm font-medium text-gray-700 mb-1">Stok Adedi *</label>
            <input
              id="urun-stockQuantity"
              name="stockQuantity" type="number" min="0" required
              defaultValue={defaultValues.stock ?? 0}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label htmlFor="urun-unit" className="block text-sm font-medium text-gray-700 mb-1">Birim</label>
            <select
              id="urun-unit"
              name="unit"
              defaultValue={defaultValues.unit ?? 'adet'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="adet">adet</option>
              <option value="kg">kg</option>
              <option value="lt">lt</option>
              <option value="litre">litre</option>
              <option value="m">m</option>
              <option value="m²">m²</option>
              <option value="çift">çift</option>
              <option value="paket">paket</option>
            </select>
          </div>
        </div>
      </section>

      {/* ── Görsel ── */}
      {!hideImageSection && (
      <section className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-gray-800 text-base border-b pb-3">Ürün Görseli</h2>

        {/* Önizleme */}
        {imagePreview && (
          <div className="relative w-40 h-40 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {/*
              Burada bilerek ham <img> kullanılıyor. Kaynak, tarayıcıda
              `URL.createObjectURL()` ile üretilmiş bir `blob:` adresi ya da
              yeni yüklenmiş bir dosya; `next/image` bunları optimize
              edemiyor (sunucudan erişilebilir bir adres değiller).
              Yalnızca yönetim panelinde, tek bir önizleme olarak görünüyor.
            */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imagePreview} alt="Önizleme" className="w-full h-full object-contain" />
            {uploading && (
              <div className="absolute inset-0 bg-white/75 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        )}

        {uploading && (
          <p className="text-sm text-blue-600 flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin inline-block" />
            Görsel Supabase Storage&apos;a yükleniyor…
          </p>
        )}
        {uploadError && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
            {uploadError}
          </p>
        )}
        {!uploading && replaceImage && uploadedImageUrl && !uploadError && (
          <p className="text-sm text-green-600 bg-green-50 border border-green-200 px-3 py-2 rounded-lg">
            <Icon name="onay" className="w-4 h-4 inline-block mr-1 align-text-bottom" />Görsel başarıyla yüklendi
          </p>
        )}

        <div className="flex flex-col gap-3">
          <div>
            <label htmlFor="urun-imageFile" className="block text-sm font-medium text-gray-700 mb-1">
              Dosya Yükle
              <span className="ml-1.5 text-xs font-normal text-gray-400">
                (Supabase&apos;e doğrudan yüklenir — boyut sınırı yok)
              </span>
            </label>
            <input
              id="urun-imageFile"
              ref={fileRef}
              name="imageFile"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={uploading}
              className="block text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
            />
          </div>

          <div>
            <label htmlFor="urun-imageUrl" className="block text-sm font-medium text-gray-700 mb-1">
              veya Görsel URL&apos;si <span className="text-xs font-normal text-gray-400">(public/ dizini)</span>
            </label>
            <input
              id="urun-imageUrl"
              name="imageUrl"
              type="text"
              defaultValue={
                existingImageUrl && !existingImageUrl.includes('supabase')
                  ? existingImageUrl
                  : ''
              }
              onChange={(e) => {
                const val = e.target.value.trim()
                if (val) {
                  setImagePreview(val)
                  setUploadedImageUrl(val)
                  setReplaceImage(true)
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="/images/urun-adi.jpg"
            />
          </div>
        </div>
      </section>
      )}

      {/* ── Teknik Özellikler ── */}
      <section className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h2 className="font-semibold text-gray-800 text-base">Teknik Özellikler</h2>
          <button
            type="button"
            onClick={addSpec}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            + Özellik Ekle
          </button>
        </div>

        {specs.map((spec, idx) => (
          <div key={idx} className="grid grid-cols-6 sm:grid-cols-12 gap-2 sm:gap-3 items-center">
            <input
              aria-label={`${idx + 1}. özellik adı`}
              value={spec.name}
              onChange={(e) => updateSpec(idx, 'name', e.target.value)}
              placeholder="Özellik adı"
              className="col-span-6 sm:col-span-4 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              aria-label={`${idx + 1}. özellik değeri`}
              value={spec.value}
              onChange={(e) => updateSpec(idx, 'value', e.target.value)}
              placeholder="Değer"
              className="col-span-3 sm:col-span-5 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              aria-label={`${idx + 1}. özellik birimi`}
              value={spec.unit}
              onChange={(e) => updateSpec(idx, 'unit', e.target.value)}
              placeholder="Birim"
              className="col-span-2 sm:col-span-2 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => removeSpec(idx)}
              className="col-span-1 flex items-center justify-center h-10 w-10 mx-auto rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 text-xl leading-none"
              title="Sil"
              aria-label={`${idx + 1}. özelliği sil`}
            >
              ×
            </button>
          </div>
        ))}

        {specs.length === 0 && (
          <p className="text-sm text-gray-400 italic">Henüz özellik eklenmedi.</p>
        )}
      </section>

      {/* ── Yayın Durumu ── */}
      <section className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="font-semibold text-gray-800 text-base border-b pb-3 mb-4">Yayın Durumu</h2>

        <div className="flex flex-col sm:flex-row gap-4">
          {/* `name` verilmiyor: değerler gönderimde state'ten yazılıyor
              (bkz. handleSubmit). Gizli "false" input'una da gerek kalmadı. */}
          <label htmlFor="urun-isActive" className="flex items-center gap-3 cursor-pointer select-none">
            <input
              id="urun-isActive"
              type="checkbox"
              checked={aktif}
              onChange={(e) => setAktif(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Aktif (sitede görünsün)</span>
          </label>

          <label htmlFor="urun-isFeatured" className="flex items-center gap-3 cursor-pointer select-none">
            <input
              id="urun-isFeatured"
              type="checkbox"
              checked={oneCikan}
              onChange={(e) => setOneCikan(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Öne Çıkan (anasayfada görünsün)</span>
          </label>
        </div>
      </section>

      {/* Redirect için gizli alan — hangi markadaysak oraya dön */}
      <input
        type="hidden"
        name="redirectBrand"
        value={brands.find((b) => b.id === selectedBrandId)?.key ?? 'alb-tarim'}
      />

      {/* ── Submit ── */}
      <div className="flex items-center justify-end gap-4">
        <span className="mr-auto text-xs text-gray-400">
          Kaydetmek için <kbd className="px-1.5 py-0.5 rounded border border-gray-300 bg-gray-50 font-sans">Enter</kbd>&apos;a
          basmanız yeterli (açıklama alanı hariç).
        </span>
        <a
          href={`/admin/${brands.find((b) => b.id === selectedBrandId)?.key ?? 'alb-tarim'}/urunler`}
          className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
        >
          İptal
        </a>
        <button
          type="submit"
          disabled={isPending || uploading}
          className="px-6 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {uploading ? 'Görsel yükleniyor…' : isPending ? 'Kaydediliyor...' : submitLabel}
        </button>
      </div>
    </form>
  )
}
