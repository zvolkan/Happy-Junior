'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { createSignedUploadUrl } from '@/app/actions/admin'
import { createBlogPost, updateBlogPost, deleteBlogPost } from '@/app/actions/blog'
import { slugify } from '@/lib/utils'

interface Brand {
  id: number
  key: string
  name: string
}

interface Props {
  brands: Brand[]
  /** Kaydettikten sonra dönülecek marka paneli */
  kapsam: string
  defaultValues?: {
    id?: string
    brandId?: number
    title?: string
    slug?: string
    excerpt?: string | null
    content?: string
    category?: string | null
    coverImage?: string | null
    author?: string | null
    isPublished?: boolean
  }
}

// 'Zirai İlaç' yerine 'Bitki Koruma' kondu. Ürünlerin internetten satışı
// yasak olduğu için başlığın satış çağrısı gibi okunmaması önemli; buna
// karşılık bilgilendirici yazı yazmak serbest ve zaten danışmanlığın bir
// parçası. Bu alan serbest metin girişi (datalist yalnızca öneri listesi),
// dolayısıyla eski yazıların kategorisi kendiliğinden değişmez.
const KATEGORILER = [
  'Gübreleme',
  'Bitki Koruma',
  'Bitki Besleme',
  'Toprak Analizi',
  'Su Arıtma',
  'Bakım & Servis',
  'Duyuru',
]

const label = 'block text-sm font-medium text-gray-700 mb-1'
const input =
  'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent'

export default function BlogForm({ brands, kapsam, defaultValues = {} }: Props) {
  const router = useRouter()
  const isEdit = Boolean(defaultValues.id)

  const [title, setTitle] = useState(defaultValues.title ?? '')
  const [slug, setSlug] = useState(defaultValues.slug ?? '')
  const [slugTouched, setSlugTouched] = useState(Boolean(defaultValues.slug))
  const [coverImage, setCoverImage] = useState(defaultValues.coverImage ?? '')
  const [isPublished, setIsPublished] = useState(defaultValues.isPublished ?? false)
  const [uploading, setUploading] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Başlık yazılırken adres otomatik üretilsin; kullanıcı adrese dokunduysa karışma
  const onTitleChange = (value: string) => {
    setTitle(value)
    if (!slugTouched) setSlug(slugify(value))
  }

  async function uploadCover(file: File) {
    setUploading(true)
    try {
      const ext = (file.name.split('.').pop() ?? 'jpg').replace(/[^a-zA-Z0-9]/g, '')
      const { signedUrl, publicUrl } = await createSignedUploadUrl(
        `blog-${Date.now()}.${ext}`,
      )
      const res = await fetch(signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setCoverImage(publicUrl)
      toast.success('Kapak görseli yüklendi')
    } catch (error) {
      console.error('[blog] kapak yüklenemedi:', error)
      toast.error('Görsel yüklenemedi.')
    } finally {
      setUploading(false)
    }
  }

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set('isPublished', isPublished ? 'true' : 'false')
    formData.set('coverImage', coverImage)

    startTransition(async () => {
      const result = defaultValues.id
        ? await updateBlogPost(defaultValues.id, formData)
        : await createBlogPost(formData)

      if (result.ok) {
        toast.success(result.message)
        router.push(`/admin/${kapsam}/blog`)
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  const remove = () => {
    if (!defaultValues.id) return
    if (!confirm('Bu yazı kalıcı olarak silinecek. Emin misiniz?')) return
    startTransition(async () => {
      const result = await deleteBlogPost(defaultValues.id!)
      if (result.ok) {
        toast.success(result.message)
        router.push(`/admin/${kapsam}/blog`)
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <section className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-gray-800 text-base border-b pb-3">Yazı Bilgileri</h2>

        <div>
          <label htmlFor="blog-title" className={label}>
            Başlık
          </label>
          <input
            id="blog-title"
            name="title"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            required
            maxLength={200}
            className={input}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="blog-slug" className={label}>
              Adres (slug)
            </label>
            <input
              id="blog-slug"
              name="slug"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true)
                setSlug(e.target.value)
              }}
              maxLength={220}
              className={`${input} font-mono`}
            />
            <p className="text-xs text-gray-400 mt-1">
              /{brands.find((b) => b.id === Number(defaultValues.brandId))?.key ?? 'marka'}/blog/
              {slug || 'adres'}
            </p>
          </div>

          <div>
            <label htmlFor="blog-brandId" className={label}>
              Marka
            </label>
            <select
              id="blog-brandId"
              name="brandId"
              defaultValue={defaultValues.brandId ?? brands[0]?.id}
              className={input}
            >
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="blog-category" className={label}>
              Kategori
            </label>
            <input
              id="blog-category"
              name="category"
              list="blog-kategoriler"
              defaultValue={defaultValues.category ?? ''}
              maxLength={80}
              className={input}
            />
            <datalist id="blog-kategoriler">
              {KATEGORILER.map((k) => (
                <option key={k} value={k} />
              ))}
            </datalist>
          </div>

          <div>
            <label htmlFor="blog-author" className={label}>
              Yazar
            </label>
            <input
              id="blog-author"
              name="author"
              defaultValue={defaultValues.author ?? ''}
              maxLength={120}
              placeholder="Bayırlıoğlu"
              className={input}
            />
          </div>
        </div>

        <div>
          <label htmlFor="blog-excerpt" className={label}>
            Özet
            <span className="ml-1.5 text-xs font-normal text-gray-400">
              (liste ve arama sonuçlarında görünür)
            </span>
          </label>
          <textarea
            id="blog-excerpt"
            name="excerpt"
            defaultValue={defaultValues.excerpt ?? ''}
            rows={2}
            maxLength={500}
            className={input}
          />
        </div>
      </section>

      <section className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-gray-800 text-base border-b pb-3">Kapak Görseli</h2>

        {coverImage ? (
          <div className="flex items-start gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverImage}
              alt="Kapak önizleme"
              className="w-48 h-28 object-cover rounded-lg border border-gray-200 bg-gray-50"
            />
            <button
              type="button"
              onClick={() => setCoverImage('')}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Kaldır
            </button>
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic">
            Kapak görseli eklenmezse marka renklerinde otomatik bir görsel kullanılır.
          </p>
        )}

        <div>
          <label htmlFor="blog-cover" className={label}>
            Görsel Yükle
          </label>
          <input
            id="blog-cover"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            disabled={uploading || isPending}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) uploadCover(file)
              e.target.value = ''
            }}
            className="block text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
          />
          {uploading && <p className="text-sm text-blue-600 mt-2">Yükleniyor…</p>}
        </div>
      </section>

      <section className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-gray-800 text-base border-b pb-3">İçerik</h2>
        <div>
          <label htmlFor="blog-content" className={label}>
            Yazı metni
            <span className="ml-1.5 text-xs font-normal text-gray-400">
              (paragrafları boş satırla ayırın; istersen HTML de yazabilirsiniz)
            </span>
          </label>
          <textarea
            id="blog-content"
            name="content"
            defaultValue={defaultValues.content ?? ''}
            rows={18}
            required
            className={`${input} font-mono text-[13px] leading-relaxed`}
          />
        </div>
      </section>

      <section className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <label htmlFor="blog-publish" className="flex items-center gap-2.5 cursor-pointer">
            <input
              id="blog-publish"
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300"
            />
            <span className="text-sm font-medium text-gray-700">
              Yayında
              <span className="ml-1.5 text-xs font-normal text-gray-400">
                (işaretli değilse taslak olarak kalır, sitede görünmez)
              </span>
            </span>
          </label>

          <div className="flex items-center gap-3 ml-auto">
            {isEdit && (
              <button
                type="button"
                onClick={remove}
                disabled={isPending}
                className="text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-40"
              >
                Sil
              </button>
            )}
            <Link
              href={`/admin/${kapsam}/blog`}
              className="text-sm px-4 py-2 rounded-lg border border-gray-200 text-gray-600 font-medium hover:bg-gray-50"
            >
              Vazgeç
            </Link>
            <button
              type="submit"
              disabled={isPending || uploading}
              className="btn-press px-5 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-700 disabled:opacity-40"
            >
              {isPending ? 'Kaydediliyor…' : isEdit ? 'Değişiklikleri Kaydet' : 'Yazıyı Oluştur'}
            </button>
          </div>
        </div>
      </section>
    </form>
  )
}
