import { prisma, type TransactionClient } from '@/lib/db'
import { appendOrderNote } from '@/lib/order-note'

/**
 * Stok rezervasyonu.
 *
 * ESKİ DAVRANIŞ: stok yalnızca ödeme geri dönüşünde (callback) düşülüyordu.
 * Ödeme BAŞLARKEN sadece "yeterli mi?" diye okunuyor, hiçbir şey rezerve
 * edilmiyordu. Stokta 1 adet kalan üründe aynı anda 20 kişi ödemeye girerse
 * hepsi kontrolü geçiyor, hepsi ödüyor ve 19'u karşılanamıyordu. Callback
 * tarafındaki kod bu durumu "aşırı satış" diye not edip siparişi yine de
 * geçiriyordu.
 *
 * YENİ DAVRANIŞ: stok, PENDING sipariş oluşturulurken atomik olarak düşülür
 * (rezerve edilir). Ödeme başarısız olursa, sipariş iptal edilirse veya 24 saat
 * içinde tamamlanmazsa geri yüklenir. Böylece aşırı satış mümkün değil.
 *
 * Bedeli: ödeme ekranını açıp kapatan kullanıcı stoğu en fazla 24 saat tutar.
 * Bu, satılamayan ürün göndermekten çok daha iyi bir sorun.
 */

export type StokKalemi = { productId: string; quantity: number }

/**
 * Verilen kalemlerin stoğunu atomik olarak düşürür.
 * Herhangi biri yetmezse hiçbiri düşmez (transaction geri alınır) ve
 * yetersiz kalan ürünün kimliği fırlatılan hatada döner.
 */
export class YetersizStokHatasi extends Error {
  constructor(public productId: string) {
    super(`Yetersiz stok: ${productId}`)
    this.name = 'YetersizStokHatasi'
  }
}

export async function reserveStock(
  tx: TransactionClient,
  items: StokKalemi[],
): Promise<void> {
  for (const item of items) {
    // Koşullu güncelleme: okuma-yazma yarışını kapatır. `gte` koşulu
    // tutmuyorsa 0 satır güncellenir ve stok asla eksiye düşmez.
    const reduced = await tx.product.updateMany({
      where: { id: item.productId, stockQuantity: { gte: item.quantity } },
      data: { stockQuantity: { decrement: item.quantity } },
    })
    if (reduced.count === 0) throw new YetersizStokHatasi(item.productId)
  }
}

/**
 * Siparişin rezerve ettiği stoğu geri yükler.
 *
 * `stockReduced` bayrağına bakar ve işini bitirince bayrağı düşürür; iki kez
 * çağrılırsa ikincisi hiçbir şey yapmaz.
 */
export async function restoreStock(orderId: string, sebep: string): Promise<void> {
  try {
    await prisma.$transaction(async (tx: TransactionClient) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        select: {
          stockReduced: true,
          items: { select: { productId: true, quantity: true } },
        },
      })

      if (!order?.stockReduced) return

      // Bayrağı ÖNCE düşür ve koşula bağla: iki eşzamanlı çağrıdan yalnızca
      // biri stoğu geri yükleyebilsin.
      const claimed = await tx.order.updateMany({
        where: { id: orderId, stockReduced: true },
        data: { stockReduced: false },
      })
      if (claimed.count === 0) return

      for (const item of order.items) {
        await tx.product.updateMany({
          where: { id: item.productId },
          data: { stockQuantity: { increment: item.quantity } },
        })
      }
    })
  } catch (error) {
    console.error('[stok] geri yükleme başarısız:', orderId, error)
    await appendOrderNote(
      orderId,
      `Stok geri yüklemesi başarısız (${sebep}). Stokları elle kontrol edin.`,
    )
  }
}
