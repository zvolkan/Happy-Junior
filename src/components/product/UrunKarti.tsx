'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { useCartStore } from '@/store/cartStore'
import FavoriteButton from '@/components/product/FavoriteButton'
import Icon from '@/components/ui/Icon'
import type { Product } from '@/lib/types'

/**
 * Ürün kartı — ana sayfa ve ürün listesi aynı kartı kullanıyor.
 *
 * Hareketler kullanıcının yaptığı işe cevap veriyor:
 *  - Üzerine gelince ikinci fotoğrafa (genelde çocuk üzerinde çekim) geçer.
 *  - "Sepete ekle"ye basınca buton esner, yazı "Eklendi" onayına döner ve
 *    header'daki sepet simgesi zıplar (bkz. `sepet-eklendi` olayı, Header.tsx).
 */

interface Props {
  urun: Product
  /** Kart ızgarada kaçıncı; ilk birkaç görsel öncelikli yüklenir */
  sira?: number
  /** Kartın üstündeki küçük etiket (ör. üretici markası) */
  etiket?: string
}

export default function UrunKarti({ urun, sira = 99, etiket }: Props) {
  const addItem = useCartStore((s) => s.addItem)
  const [eklendi, setEklendi] = useState(false)
  const [ziplat, setZiplat] = useState(0)

  const gorseller = [...(urun.images ?? [])].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary))
  const a = gorseller[0]?.url
  const b = gorseller[1]?.url
  const fiyat = urun.salePrice ?? urun.price
  const indirim = urun.salePrice ? Math.round((1 - urun.salePrice / urun.price) * 100) : null
  const tukendi = urun.stock === 0
  // Beden seçimi gereken ürün listeden doğrudan sepete atılmaz; ürün sayfasına gider.
  const bedenli = (urun.variants?.length ?? 0) > 0

  const sepeteEkle = () => {
    if (tukendi) return
    const once = useCartStore.getState().items.find((i) => i.product.id === urun.id)?.quantity ?? 0
    addItem(urun, 1)
    const sonra = useCartStore.getState().items.find((i) => i.product.id === urun.id)?.quantity ?? 0
    if (sonra > once) {
      setEklendi(true)
      setZiplat((n) => n + 1)
      window.dispatchEvent(new CustomEvent('sepet-eklendi'))
      window.setTimeout(() => setEklendi(false), 1600)
    } else {
      toast.error(`Sepetinizde bu üründen en fazla ${urun.stock} ${urun.unit} olabilir.`)
    }
  }

  return (
    <article className="hj-card group relative flex h-full flex-col overflow-hidden rounded-[22px] bg-white ring-1 ring-ink/5">
      <Link href={`/urunler/${urun.slug}`} className="hj-swap block relative aspect-[4/5] overflow-hidden bg-brand-50">
        {a ? (
          <Image
            src={a}
            alt={gorseller[0]?.alt || urun.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
            className="object-cover"
            priority={sira < 4}
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center">
            <Icon name="paket" className="h-10 w-10 text-brand-200" />
          </span>
        )}
        {b && (
          <Image
            src={b}
            alt=""
            aria-hidden="true"
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
            className="hj-swap-b object-cover"
          />
        )}

        <span className="absolute left-3 top-3 z-10 flex flex-col items-start gap-1.5">
          {indirim && (
            <span className="rounded-full bg-sun px-2.5 py-1 text-xs font-extrabold text-ink shadow-sm">
              %{indirim} indirim
            </span>
          )}
          {tukendi && (
            <span className="rounded-full bg-ink px-2.5 py-1 text-xs font-bold text-white">Tükendi</span>
          )}
        </span>
      </Link>

      <div className="absolute right-3 top-3 z-20">
        <FavoriteButton productId={urun.id} />
      </div>

      <div className="flex flex-1 flex-col p-4">
        {etiket && <p className="mb-1 truncate text-xs font-bold text-aqua">{etiket}</p>}
        <Link href={`/urunler/${urun.slug}`}>
          <h3 className="font-display text-[15px] font-bold leading-snug text-ink line-clamp-2">{urun.name}</h3>
        </Link>

        <div className="mt-auto pt-3">
          <p className="mb-3 flex items-baseline gap-2">
            <span className="font-display text-xl font-extrabold text-brand-700">
              {fiyat.toLocaleString('tr-TR')} ₺
            </span>
            {urun.salePrice && (
              <span className="text-sm text-ink/45 line-through">{urun.price.toLocaleString('tr-TR')} ₺</span>
            )}
          </p>

          {bedenli && !tukendi ? (
            <Link
              href={`/urunler/${urun.slug}`}
              className="btn-sticker btn-acik w-full py-2.5 text-sm"
            >
              Beden seç
            </Link>
          ) : (
            <button
              type="button"
              onClick={sepeteEkle}
              disabled={tukendi}
              key={ziplat}
              className={`btn-sticker w-full py-2.5 text-sm ${eklendi ? 'btn-eklendi' : ''} ${ziplat ? 'hj-bounce' : ''}`}
            >
              {tukendi ? (
                'Tükendi'
              ) : eklendi ? (
                <span className="btn-ok inline-flex items-center gap-1.5">
                  <Icon name="onay" className="h-4 w-4" /> Eklendi
                </span>
              ) : (
                'Sepete ekle'
              )}
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
