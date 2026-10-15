'use server'

import { prisma } from '@/lib/db'

/**
 * Sepetteki ürünlerin GÜNCEL fiyat ve stok bilgisi.
 *
 * Sepet localStorage'da kalıcı olduğu için içindeki ürün nesneleri (fiyat, stok)
 * eklendiği andaki hâlinde donuyordu. Fiyat değiştiğinde kullanıcı sepette eski
 * fiyatı görüyor, ödeme ekranında sunucunun hesapladığı farklı tutarla
 * karşılaşıyordu. Sepet sayfası açılışında bu fonksiyonla tazeleniyor.
 */
export async function getFreshCartData(productIds: string[]) {
  if (!Array.isArray(productIds) || productIds.length === 0) return []

  // Aşırı büyük istekleri kes
  const ids = productIds.filter((id) => typeof id === 'string').slice(0, 100)
  if (ids.length === 0) return []

  try {
    const products = await prisma.product.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        price: true,
        salePrice: true,
        stockQuantity: true,
        isActive: true,
      },
    })

    return products.map(
      (p: {
        id: string
        price: unknown
        salePrice: unknown
        stockQuantity: number
        isActive: boolean
      }) => ({
        id: p.id,
        price: Number(p.price),
        salePrice: p.salePrice !== null ? Number(p.salePrice) : undefined,
        stock: p.stockQuantity,
        isActive: p.isActive,
      }),
    )
  } catch (error) {
    console.error('[sepet] güncel veri alınamadı:', error)
    return []
  }
}
