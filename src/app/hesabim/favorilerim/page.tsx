import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { ACTIVE_BRAND_KEY } from '@/lib/constants'
import { cn } from '@/lib/utils'
import Icon from '@/components/ui/Icon'
import AccountSidebar from '../_components/AccountSidebar'
import FavoriteCardActions from './_components/FavoriteCardActions'

export const metadata: Metadata = {
  title: 'Favorilerim',
  robots: { index: false, follow: false },
}

const primaryBg = ACTIVE_BRAND_KEY === 'alb-tarim' ? 'bg-green-600' : 'bg-blue-600'
const primaryHover = ACTIVE_BRAND_KEY === 'alb-tarim' ? 'hover:bg-green-500' : 'hover:bg-blue-500'
const primaryColor = ACTIVE_BRAND_KEY === 'alb-tarim' ? 'text-green-600' : 'text-blue-600'

function formatPrice(value: unknown): string {
  return Number(value).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
}

export default async function FavorilerimPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/giris?redirect=/hesabim/favorilerim')

  const [dbUser, favorites] = await Promise.all([
    prisma.user.findUnique({ where: { id: user.id }, select: { name: true } }),
    prisma.favorite.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          include: {
            brand: { select: { key: true } },
            category: { select: { name: true, icon: true } },
            images: { where: { isPrimary: true }, take: 1, select: { url: true } },
          },
        },
      },
    }),
  ])

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-main">
        <nav className="text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-gray-900">
            Ana Sayfa
          </Link>
          <span className="mx-2">/</span>
          <Link href="/hesabim" className="hover:text-gray-900">
            Hesabım
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900 font-medium">Favorilerim</span>
        </nav>

        <div className="flex flex-col md:flex-row gap-6">
          <AccountSidebar
            active="/hesabim/favorilerim"
            name={dbUser?.name ?? null}
            email={user.email ?? ''}
          />

          <div className="flex-1">
            <div className="flex items-center justify-between mb-5">
              <h1 className="text-2xl font-bold text-gray-900">Favorilerim</h1>
              <span className="text-sm text-gray-500">{favorites.length} ürün</span>
            </div>

            {favorites.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                <Icon name="kalp-bos" className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Favori listeniz boş</h3>
                <p className="text-gray-500 mb-6">
                  Beğendiğiniz ürünlerin kalp simgesine dokunarak favorilerinize ekleyebilir,
                  daha sonra buradan kolayca bulabilirsiniz.
                </p>
                <Link
                  href={`/${ACTIVE_BRAND_KEY}/urunler`}
                  className={cn(
                    'btn-press inline-flex px-6 py-3 rounded-xl text-white font-semibold',
                    primaryBg,
                    primaryHover,
                  )}
                >
                  Ürünleri Keşfet
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {favorites.map(({ product }) => {
                  const image = product.images[0]?.url
                  const price = Number(product.salePrice ?? product.price)
                  const hasDiscount =
                    product.salePrice !== null &&
                    Number(product.salePrice) < Number(product.price)
                  const href = `/${product.brand.key}/urunler/${product.slug}`

                  return (
                    <div
                      key={product.id}
                      className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover-lift flex flex-col"
                    >
                      <Link
                        href={href}
                        className="relative aspect-square bg-gray-50 flex items-center justify-center overflow-hidden"
                      >
                        {image ? (
                          <Image
                            src={image}
                            alt={product.name}
                            fill
                            sizes="(max-width: 640px) 100vw, 33vw"
                            className="object-contain p-4 transition-transform duration-500 group-hover:scale-110"
                          />
                        ) : (
                          <Icon name="paket" className="w-9 h-9 text-gray-300" />
                        )}
                      </Link>

                      <div className="p-4 flex flex-col flex-1">
                        <p className="text-[11px] uppercase tracking-wide text-gray-400 truncate">
                          {product.category.name}
                        </p>
                        <Link href={href}>
                          <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 mt-1 mb-3">
                            {product.name}
                          </h3>
                        </Link>

                        <div className="mt-auto">
                          <div className="flex items-baseline gap-2 mb-3">
                            <span className={cn('font-black text-lg', primaryColor)}>
                              {formatPrice(price)}
                            </span>
                            {hasDiscount && (
                              <span className="text-xs text-gray-500 line-through">
                                {formatPrice(product.price)}
                              </span>
                            )}
                          </div>

                          <FavoriteCardActions
                            product={{
                              id: product.id,
                              name: product.name,
                              slug: product.slug,
                              price: Number(product.price),
                              salePrice:
                                product.salePrice !== null ? Number(product.salePrice) : undefined,
                              stock: product.stockQuantity,
                              unit: product.unit,
                              brandKey: product.brand.key,
                              categoryName: product.category.name,
                              image: image ?? null,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
