import { prisma } from '@/lib/db'

/**
 * Yönetici notunu EZMEDEN sonuna ekler.
 *
 * Eskiden üç ayrı yerde (ödeme geri dönüşü, e-posta bildirimleri, sipariş
 * işlemleri) doğrudan `data: { adminNote: '...' }` yazılıyordu. Aynı siparişe
 * arka arkaya iki not düşen durumlarda ikincisi birincisini siliyordu —
 * örneğin "tutar uyuşmazlığı" uyarısı, hemen ardından gelen "stok yetersiz"
 * notuyla kayboluyordu ve yönetici para uyuşmazlığından hiç haberdar olmuyordu.
 *
 * Not başına zaman damgası konuyor; hangi uyarının ne zaman düştüğü panelden
 * görülebilsin diye.
 */
export async function appendOrderNote(orderId: string, note: string): Promise<void> {
  try {
    const current = await prisma.order.findUnique({
      where: { id: orderId },
      select: { adminNote: true },
    })
    const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ')
    const merged = [current?.adminNote, `[${stamp}] ${note}`].filter(Boolean).join('\n')
    // Kolon Text; yine de sınırsız büyümesin. En YENİ notlar korunuyor.
    await prisma.order.update({
      where: { id: orderId },
      data: { adminNote: merged.slice(-4000) },
    })
  } catch (error) {
    console.error('[sipariş] yönetici notu yazılamadı:', orderId, error)
  }
}
