'use client'

import { useState, useTransition } from 'react'
import toast from 'react-hot-toast'
import { createSignedUploadUrl } from '@/app/actions/admin'
import {
  addProductImage,
  removeProductImage,
  setPrimaryImage,
  reorderProductImages,
  type ProductImageDto,
} from '@/app/actions/product-images'

const MAX_IMAGES = 8

interface Props {
  productId: string
  productName: string
  initialImages: ProductImageDto[]
}

/**
 * Çoklu ürün görseli yöneticisi (yalnızca DÜZENLEME modunda).
 *
 * Yeni ürün eklerken ürünün henüz id'si olmadığı için tek kapak görseli
 * yükleniyor; ürün kaydedildikten sonra düzenleme ekranından diğer görseller
 * eklenebiliyor.
 */
export default function ImageManager({ productId, productName, initialImages }: Props) {
  const [images, setImages] = useState<ProductImageDto[]>(initialImages)
  const [uploading, setUploading] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [manualUrl, setManualUrl] = useState('')

  const busy = uploading || isPending

  function apply(result: { ok: true; images: ProductImageDto[] } | { ok: false; error: string }) {
    if (!result.ok) {
      toast.error(result.error)
      return false
    }
    setImages(result.images)
    return true
  }

  async function uploadFiles(files: FileList) {
    const remaining = MAX_IMAGES - images.length
    if (remaining <= 0) {
      toast.error(`En fazla ${MAX_IMAGES} görsel eklenebilir.`)
      return
    }

    const selected = Array.from(files).slice(0, remaining)
    if (files.length > remaining) {
      toast(`Yalnızca ilk ${remaining} görsel yüklenecek (sınır: ${MAX_IMAGES}).`, { icon: 'ℹ️' })
    }

    setUploading(true)

    for (const [index, file] of selected.entries()) {
      try {
        const ext = (file.name.split('.').pop() ?? 'jpg').replace(/[^a-zA-Z0-9]/g, '')
        // Çakışmayı önlemek için benzersiz ad
        const fileName = `${productId}-${Date.now()}-${index}.${ext}`

        const { signedUrl, publicUrl } = await createSignedUploadUrl(fileName)

        const res = await fetch(signedUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        const result = await addProductImage(productId, publicUrl, productName)
        if (!apply(result)) break
      } catch (error) {
        console.error('[görsel] yükleme hatası:', error)
        toast.error(`"${file.name}" yüklenemedi.`)
      }
    }

    setUploading(false)
  }

  const addManual = () => {
    const url = manualUrl.trim()
    if (!url) return
    startTransition(async () => {
      if (apply(await addProductImage(productId, url, productName))) {
        setManualUrl('')
        toast.success('Görsel eklendi')
      }
    })
  }

  const remove = (id: number) => {
    startTransition(async () => {
      if (apply(await removeProductImage(id))) toast.success('Görsel silindi')
    })
  }

  const makePrimary = (id: number) => {
    startTransition(async () => {
      if (apply(await setPrimaryImage(id))) toast.success('Kapak görseli güncellendi')
    })
  }

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= images.length) return

    const next = [...images]
    ;[next[index], next[target]] = [next[target], next[index]]
    setImages(next) // iyimser

    startTransition(async () => {
      const result = await reorderProductImages(
        productId,
        next.map((i) => i.id),
      )
      if (!result.ok) {
        setImages(images) // geri al
        toast.error(result.error)
      }
    })
  }

  return (
    <section className="bg-white rounded-xl shadow-sm p-6 space-y-4">
      <div className="flex items-center justify-between border-b pb-3">
        <h2 className="font-semibold text-gray-800 text-base">Ürün Görselleri</h2>
        <span className="text-xs text-gray-400">
          {images.length} / {MAX_IMAGES}
        </span>
      </div>

      {images.length === 0 ? (
        <p className="text-sm text-gray-400 italic py-4 text-center">
          Henüz görsel eklenmedi. İlk eklediğiniz görsel kapak olur.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {images.map((image, index) => (
            <div
              key={image.id}
              className={`relative group rounded-xl overflow-hidden border-2 bg-gray-50 ${
                image.isPrimary ? 'border-blue-500' : 'border-gray-200'
              }`}
            >
              <div className="aspect-square flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.url}
                  alt={image.altText ?? productName}
                  className="w-full h-full object-contain"
                />
              </div>

              {image.isPrimary && (
                <span className="absolute top-1.5 left-1.5 bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Kapak
                </span>
              )}

              {/* İşlemler */}
              <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-sm p-1.5 flex items-center justify-between opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                <div className="flex gap-0.5">
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={busy || index === 0}
                    title="Sola taşı"
                    className="text-white/80 hover:text-white disabled:opacity-30 px-1.5 text-sm leading-none"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={busy || index === images.length - 1}
                    title="Sağa taşı"
                    className="text-white/80 hover:text-white disabled:opacity-30 px-1.5 text-sm leading-none"
                  >
                    →
                  </button>
                </div>

                <div className="flex gap-1.5">
                  {!image.isPrimary && (
                    <button
                      type="button"
                      onClick={() => makePrimary(image.id)}
                      disabled={busy}
                      className="text-[10px] text-white/90 hover:text-white font-medium disabled:opacity-40"
                    >
                      Kapak yap
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => remove(image.id)}
                    disabled={busy}
                    title="Sil"
                    className="text-red-300 hover:text-red-200 text-sm leading-none px-1 disabled:opacity-40"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Yükleme */}
      <div className="pt-2 space-y-3">
        <div>
          <label htmlFor="gorsel-dosya" className="block text-sm font-medium text-gray-700 mb-1">
            Görsel Ekle
            <span className="ml-1.5 text-xs font-normal text-gray-400">
              (birden fazla seçebilirsiniz)
            </span>
          </label>
          <input
            id="gorsel-dosya"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
            disabled={busy || images.length >= MAX_IMAGES}
            onChange={(e) => {
              if (e.target.files?.length) uploadFiles(e.target.files)
              e.target.value = ''
            }}
            className="block text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
          />
        </div>

        <div>
          <label htmlFor="gorsel-url" className="block text-sm font-medium text-gray-700 mb-1">
            veya Görsel URL&apos;si
          </label>
          <div className="flex gap-2">
            <input
              id="gorsel-url"
              value={manualUrl}
              onChange={(e) => setManualUrl(e.target.value)}
              placeholder="/images/urun-adi.jpg"
              disabled={busy || images.length >= MAX_IMAGES}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            />
            <button
              type="button"
              onClick={addManual}
              disabled={busy || !manualUrl.trim() || images.length >= MAX_IMAGES}
              className="btn-press px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-700 disabled:opacity-40"
            >
              Ekle
            </button>
          </div>
        </div>

        {uploading && (
          <p className="text-sm text-blue-600 flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin inline-block" />
            Görseller yükleniyor…
          </p>
        )}

        <p className="text-xs text-gray-400">
          İlk görsel ürün kartlarında kapak olarak kullanılır. Sırayı oklarla
          değiştirebilirsiniz.
        </p>
      </div>
    </section>
  )
}
