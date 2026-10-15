import { prisma } from '@/lib/db'

/**
 * İade taleplerinin sunucu-içi yardımcıları.
 *
 * NEDEN AYRI BİR DOSYA: bu fonksiyon eskiden `src/app/actions/returns.ts`
 * içindeydi. O dosya `'use server'` ile başlıyor ve orada export edilen HER
 * fonksiyon Next.js tarafından tarayıcıdan POST edilebilen bir HTTP uç
 * noktasına dönüştürülüyor. Fonksiyonun içinde hiçbir yetki kontrolü yoktu
 * (yalnızca sunucudan çağrıldığı varsayılmıştı), dolayısıyla sipariş kimliğini
 * bilen herkes bir müşterinin açık iade talebini —parası iade edilmeden—
 * "tamamlandı" işaretleyebiliyordu. Talep yönetici kuyruğundan sessizce
 * düşüyordu.
 *
 * `'use server'` dosyalarında "iç yardımcı fonksiyon" diye bir şey yoktur.
 * Bu yüzden burada, normal bir sunucu modülünde duruyor.
 *
 * `src/lib/returns.ts` yerine ayrı bir dosya: orası saf (veritabanı bağımlılığı
 * olmayan) yardımcıları tutuyor ve istemci bileşenlerinden de import
 * edilebilmeli.
 */

/** Para iadesi tamamlandığında ilgili talepleri kapatır. */
export async function completeReturnRequestsForOrder(orderId: string): Promise<void> {
  try {
    await prisma.returnRequest.updateMany({
      where: { orderId, status: { in: ['PENDING', 'APPROVED'] } },
      data: { status: 'COMPLETED', resolvedAt: new Date() },
    })
  } catch (error) {
    console.error('[iade] talep kapatılamadı:', orderId, error)
  }
}

/**
 * Tek bir iade talebini kapatır — kısmi iade içindir.
 *
 * `completeReturnRequestsForOrder` siparişin BÜTÜN açık taleplerini kapatıyor;
 * kısmi iadede yalnızca parası ödenen talep kapanmalı, diğerleri açık kalmalı.
 */
export async function completeSingleReturnRequest(requestId: string): Promise<void> {
  try {
    await prisma.returnRequest.updateMany({
      where: { id: requestId, status: { in: ['PENDING', 'APPROVED'] } },
      data: { status: 'COMPLETED', resolvedAt: new Date() },
    })
  } catch (error) {
    console.error('[iade] talep kapatılamadı:', requestId, error)
  }
}
