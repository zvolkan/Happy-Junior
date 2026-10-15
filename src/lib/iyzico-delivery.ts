import { prisma } from '@/lib/db'
import { approvePaymentItem, retrievePayment, retrieveCheckoutForm } from '@/lib/iyzico'

/**
 * Teslimat bildirimi (Korumalı Alışveriş kalem onayı).
 *
 * ÖNEMLİ — bu her hesapta gerekli DEĞİL:
 *
 * iyzico'nun standart tek satıcılı akışında "teslim edildi" diye bir bildirim
 * adımı yoktur. Ödeme alındıktan sonra para, hesabınızın ödeme takvimine göre
 * otomatik olarak aktarılır (panelde görünen "Para Gönderilecek Tarih" budur).
 *
 * Bildirim yalnızca **Korumalı Alışveriş** modeli açık olan hesaplarda
 * anlamlıdır. Orada para, satıcı kalemi onaylayana kadar iyzico'da bekletilir;
 * onay gelmezse belirli süre sonra alıcıya iade edilir.
 *
 * Bu yüzden özellik `IYZICO_KORUMALI_ALISVERIS=true` ortam değişkeniyle
 * KAPALI geliyor. Kapalıyken hiçbir istek gönderilmiyor.
 */

export type DeliveryApprovalOutcome =
  | { attempted: false }
  | { attempted: true; approved: number; failed: number; note: string | null }

interface ItemTransaction {
  itemId?: string
  paymentTransactionId?: string | number
}

function isEnabled(): boolean {
  return (process.env.IYZICO_KORUMALI_ALISVERIS ?? '').trim().toLowerCase() === 'true'
}

/**
 * Kalem işlem kimlikleri eksik olan siparişler için iyzico'dan geri çeker.
 *
 * Kimlikler ödeme geri dönüşünde kaydedilmeye yeni başlandı; daha önce
 * oluşturulmuş siparişlerde alan boş. Bunları "elle onaylayın" diye bırakmak
 * yerine iyzico'dan tekrar isteyip kaydediyoruz.
 *
 * Önce `paymentId` ile ödeme detayı deneniyor (en doğrudan yol), o yoksa
 * ödeme jetonuyla form sonucu okunuyor.
 */
async function backfillTransactionIds(order: {
  id: string
  paymentId: string | null
  paymentToken: string | null
}): Promise<number> {
  let transactions: ItemTransaction[] = []

  try {
    if (order.paymentId) {
      const result = await retrievePayment({
        paymentId: order.paymentId,
        conversationId: order.id,
      })
      if (Array.isArray(result?.itemTransactions)) {
        transactions = result.itemTransactions as ItemTransaction[]
      }
    }

    if (transactions.length === 0 && order.paymentToken) {
      const result = await retrieveCheckoutForm(order.paymentToken, order.id)
      if (Array.isArray(result?.itemTransactions)) {
        transactions = result.itemTransactions as ItemTransaction[]
      }
    }
  } catch (error) {
    console.error('[iyzico] kalem kimlikleri geri çekilemedi:', order.id, error)
    return 0
  }

  let written = 0

  for (const tx of transactions) {
    if (!tx.itemId || !tx.paymentTransactionId) continue

    // `itemId` ödeme başlatılırken ürün kimliği olarak gönderilmişti
    const updated = await prisma.orderItem.updateMany({
      where: { orderId: order.id, productId: tx.itemId, paymentTransactionId: null },
      data: { paymentTransactionId: String(tx.paymentTransactionId) },
    })
    written += updated.count
  }

  return written
}

/**
 * Siparişin tüm kalemlerini iyzico'da onaylar.
 *
 * Hiçbir koşulda hata fırlatmaz: teslimat durumunun kaydedilmesi bu isteğe
 * bağlı olmamalı. Başarısızlık siparişin yönetici notuna yazılır.
 */
export async function approveDeliveredOrder(orderId: string): Promise<DeliveryApprovalOutcome> {
  if (!isEnabled()) return { attempted: false }

  try {
    let order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        paymentStatus: true,
        paymentId: true,
        paymentToken: true,
        items: { select: { id: true, paymentTransactionId: true } },
      },
    })

    if (!order || order.paymentStatus !== 'paid') return { attempted: false }

    const eksik = order.items.some(
      (i: { paymentTransactionId: string | null }) => !i.paymentTransactionId,
    )

    // Eski siparişlerde kimlik yok — iyzico'dan geri çekip kaydet
    if (eksik) {
      const written = await backfillTransactionIds(order)

      if (written > 0) {
        order = await prisma.order.findUnique({
          where: { id: orderId },
          select: {
            id: true,
            paymentStatus: true,
            paymentId: true,
            paymentToken: true,
            items: { select: { id: true, paymentTransactionId: true } },
          },
        })
      }
    }

    const items = (order?.items ?? []).filter(
      (i: { paymentTransactionId: string | null }) => Boolean(i.paymentTransactionId),
    )

    if (items.length === 0) {
      return {
        attempted: true,
        approved: 0,
        failed: 0,
        note:
          'iyzico teslimat onayı gönderilemedi: kalem işlem kimliği bulunamadı ve ' +
          'iyzico\'dan da geri çekilemedi. Ödeme kaydı silinmiş veya çok eski olabilir. ' +
          'Korumalı Alışveriş kullanıyorsanız bu siparişi iyzico panelinden elle onaylayın.',
      }
    }

    let approved = 0
    const errors: string[] = []

    for (const item of items) {
      try {
        const result = await approvePaymentItem({
          paymentTransactionId: item.paymentTransactionId!,
          conversationId: orderId,
        })

        if (result?.status === 'success') {
          approved++
        } else {
          errors.push(String(result?.errorMessage ?? 'bilinmeyen hata'))
        }
      } catch (error) {
        errors.push(String(error).slice(0, 120))
      }
    }

    const failed = items.length - approved

    return {
      attempted: true,
      approved,
      failed,
      note:
        failed > 0
          ? `iyzico teslimat onayı kısmen başarısız: ${approved}/${items.length} kalem onaylandı. ` +
            `Hata: ${errors.slice(0, 2).join(' | ')}. ` +
            'Hesabınızda Korumalı Alışveriş kapalıysa bu istek zaten hata döner — ' +
            'o durumda IYZICO_KORUMALI_ALISVERIS değişkenini kaldırın.'
          : null,
    }
  } catch (error) {
    console.error('[iyzico] teslimat onayı başarısız:', orderId, error)
    return {
      attempted: true,
      approved: 0,
      failed: 0,
      note: `iyzico teslimat onayı gönderilemedi: ${String(error).slice(0, 150)}`,
    }
  }
}
