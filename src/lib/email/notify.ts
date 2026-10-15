
import { prisma } from '@/lib/db'
import { sendEmailSafe, unquote } from './send'
import { deploymentTag } from '@/lib/deployment'
import { carrierTrackingUrl } from '@/lib/carrier'
import { formatOrderNo } from '@/lib/order-number'
import {
  orderConfirmationEmail,
  orderShippedEmail,
  orderRefundedEmail,
  orderDeliveredEmail,
  orderCancelledEmail,
  invoiceReadyEmail,
  adminNewOrderEmail,
  returnRequestedEmail,
  returnDecisionEmail,
  adminReturnRequestEmail,
  type OrderEmailData,
} from './templates'

/**
 * Sipariş bildirimleri.
 *
 * Hepsi "ateşle ve unut" mantığında: e-posta gönderilemezse hata fırlatmaz,
 * yalnızca log'a yazar. Sipariş akışı hiçbir koşulda e-posta yüzünden bozulmaz.
 */

async function loadOrderForEmail(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderNumber: true,
      subtotal: true,
      shippingFee: true,
      totalAmount: true,
      shipFullName: true,
      shipPhone: true,
      shipLine1: true,
      shipLine2: true,
      shipDistrict: true,
      shipCity: true,
      carrier: true,
      trackingNumber: true,
      brand: { select: { key: true } },
      user: { select: { email: true, name: true } },
      items: {
        select: {
          quantity: true,
          totalPrice: true,
          product: { select: { name: true, unit: true } },
        },
      },
    },
  })
}

type LoadedOrder = NonNullable<Awaited<ReturnType<typeof loadOrderForEmail>>>

function toEmailData(order: LoadedOrder): OrderEmailData {
  return {
    orderId: order.id,
    brandKey: order.brand.key,
    orderNo: formatOrderNo(order),
    customerName: order.shipFullName ?? order.user.name ?? 'Müşterimiz',
    items: order.items.map(
      (item: {
        quantity: number
        totalPrice: unknown
        product: { name: string; unit: string }
      }) => ({
        name: item.product.name,
        quantity: item.quantity,
        unit: item.product.unit,
        totalPrice: Number(item.totalPrice),
      }),
    ),
    subtotal: Number(order.subtotal ?? order.totalAmount),
    shippingFee: Number(order.shippingFee ?? 0),
    total: Number(order.totalAmount),
    shipFullName: order.shipFullName ?? order.user.name ?? '',
    shipPhone: order.shipPhone ?? '',
    shipLine1: order.shipLine1 ?? '',
    shipLine2: order.shipLine2,
    shipDistrict: order.shipDistrict ?? '',
    shipCity: order.shipCity ?? '',
  }
}

// ─── Sipariş onayı ───────────────────────────────────────────────────────────

export async function notifyOrderConfirmed(orderId: string): Promise<void> {
  let failure: string | null = null

  // Bu satır günlüklerde hiç görünmüyorsa e-posta kodu deploy edilmemiş
  // veya callback buraya kadar gelmemiş demektir.
  console.log('[e-posta] sipariş onayı tetiklendi:', orderId)

  try {
    const order = await loadOrderForEmail(orderId)
    if (!order) {
      failure = 'E-posta gönderilemedi: sipariş kaydı okunamadı.'
      return
    }
    if (!order.user.email) {
      failure = 'E-posta gönderilemedi: siparişin kullanıcısında e-posta adresi yok.'
      return
    }

    const data = toEmailData(order)

    const customer = orderConfirmationEmail(data)
    const customerResult = await sendEmailSafe({
      to: order.user.email,
      subject: customer.subject,
      html: customer.html,
      text: customer.text,
    })

    if (!customerResult.ok) {
      failure =
        customerResult.reason === 'not-configured'
          ? 'Müşteri onay e-postası GÖNDERİLMEDİ: RESEND_API_KEY veya EMAIL_FROM sunucuda tanımlı değil (Vercel değişkenlerini kontrol edip yeniden deploy alın).'
          : `Müşteri onay e-postası GÖNDERİLEMEDİ. Sağlayıcı yanıtı: ${
              customerResult.detail ?? 'bilinmiyor'
            }`
    }

    // Yöneticiye bildirim — ayrı adres tanımlıysa
    const adminTo = process.env.ADMIN_NOTIFY_EMAIL
      ? unquote(process.env.ADMIN_NOTIFY_EMAIL)
      : ''
    if (adminTo) {
      const adminMail = adminNewOrderEmail(data)
      const adminResult = await sendEmailSafe({
        to: adminTo,
        subject: adminMail.subject,
        html: adminMail.html,
        text: adminMail.text,
        replyTo: order.user.email,
      })

      if (!adminResult.ok && !failure) {
        failure = `Yönetici bildirimi gönderilemedi (${adminTo}). Sağlayıcı yanıtı: ${
          adminResult.detail ?? adminResult.reason
        }`
      }
    }
  } catch (error) {
    failure = `Onay e-postası hazırlanırken hata: ${String(error).slice(0, 200)}`
    console.error('[e-posta] sipariş onayı gönderilemedi:', orderId, error)
  } finally {
    // Sunucu günlüklerine erişmeden de görülebilsin diye başarısızlık sebebi
    // siparişin yönetici notuna yazılır. Müşteri teyit e-postası almadıysa
    // yöneticinin bunu bilmesi gerekiyor — sessizce kaybolmamalı.
    if (failure) await appendAdminNote(orderId, `${failure} [build: ${deploymentTag()}]`)
  }
}

/** Var olan yönetici notunu ezmeden sonuna ekler */
async function appendAdminNote(orderId: string, note: string): Promise<void> {
  try {
    const current = await prisma.order.findUnique({
      where: { id: orderId },
      select: { adminNote: true },
    })
    const merged = [current?.adminNote, note].filter(Boolean).join('\n')
    await prisma.order.update({
      where: { id: orderId },
      data: { adminNote: merged.slice(-1000) },
    })
  } catch (error) {
    console.error('[e-posta] yönetici notu yazılamadı:', orderId, error)
  }
}

// ─── Kargo bildirimi ─────────────────────────────────────────────────────────

export async function notifyOrderShipped(orderId: string): Promise<void> {
  let failure: string | null = null

  try {
    const order = await loadOrderForEmail(orderId)
    if (!order?.user.email) return

    // Kargo bilgisi girilmeden durum SHIPPED yapıldıysa gönderecek bir şey yok.
    // Sessizce geçmek yerine not düşülüyor: müşteri takip numarası bekliyor.
    if (!order.carrier || !order.trackingNumber) {
      failure =
        'Kargo bildirimi gönderilmedi: kargo firması veya takip numarası girilmemiş. ' +
        'Kargo bilgisini kaydettiğinizde e-posta otomatik gider.'
      return
    }

    const mail = orderShippedEmail({
      orderNo: formatOrderNo(order),
      customerName: order.shipFullName ?? order.user.name ?? 'Müşterimiz',
      carrier: order.carrier,
      trackingNumber: order.trackingNumber,
      trackingUrl: carrierTrackingUrl(order.carrier, order.trackingNumber),
    })

    const result = await sendEmailSafe({
      to: order.user.email,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    })

    if (!result.ok) {
      failure = `Kargo bildirimi GÖNDERİLEMEDİ. Sağlayıcı yanıtı: ${result.detail ?? result.reason}`
    }
  } catch (error) {
    failure = `Kargo bildirimi hazırlanırken hata: ${String(error).slice(0, 200)}`
    console.error('[e-posta] kargo bildirimi gönderilemedi:', orderId, error)
  } finally {
    if (failure) await appendAdminNote(orderId, `${failure} [build: ${deploymentTag()}]`)
  }
}

// ─── Teslim edildi ───────────────────────────────────────────────────────────

export async function notifyOrderDelivered(orderId: string): Promise<void> {
  let failure: string | null = null

  try {
    const order = await loadOrderForEmail(orderId)
    if (!order?.user.email) return

    const mail = orderDeliveredEmail({
      orderNo: formatOrderNo(order),
      customerName: order.shipFullName ?? order.user.name ?? 'Müşterimiz',
    })

    const result = await sendEmailSafe({
      to: order.user.email,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    })

    if (!result.ok) {
      failure = `Teslimat bildirimi GÖNDERİLEMEDİ. Sağlayıcı yanıtı: ${result.detail ?? result.reason}`
    }
  } catch (error) {
    failure = `Teslimat bildirimi hazırlanırken hata: ${String(error).slice(0, 200)}`
    console.error('[e-posta] teslimat bildirimi gönderilemedi:', orderId, error)
  } finally {
    if (failure) await appendAdminNote(orderId, `${failure} [build: ${deploymentTag()}]`)
  }
}

// ─── E-fatura yüklendi ───────────────────────────────────────────────────────

export async function notifyInvoiceReady(orderId: string): Promise<void> {
  let failure: string | null = null

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        invoiceNo: true,
        shipFullName: true,
        // Fatura e-postası varsa oraya gönderiliyor: kurumsal müşteride sipariş
        // hesabı ile muhasebe adresi çoğu zaman farklı oluyor.
        invoiceEmail: true,
        user: { select: { email: true, name: true } },
      },
    })

    const alici = order?.invoiceEmail || order?.user.email
    if (!order || !alici) return

    const mail = invoiceReadyEmail({
      orderId: order.id,
      orderNo: formatOrderNo(order),
      customerName: order.shipFullName ?? order.user.name ?? 'Müşterimiz',
      invoiceNo: order.invoiceNo,
    })

    const result = await sendEmailSafe({
      to: alici,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    })

    if (!result.ok) {
      failure = `Fatura bildirimi GÖNDERİLEMEDİ. Sağlayıcı yanıtı: ${result.detail ?? result.reason}`
    }
  } catch (error) {
    failure = `Fatura bildirimi hazırlanırken hata: ${String(error).slice(0, 200)}`
    console.error('[e-posta] fatura bildirimi gönderilemedi:', orderId, error)
  } finally {
    if (failure) await appendAdminNote(orderId, `${failure} [build: ${deploymentTag()}]`)
  }
}

// ─── Ödemesiz iptal ──────────────────────────────────────────────────────────

/** Ödemesi alınmamış siparişin iptali. Para iadesi olan iptal için notifyOrderRefunded. */
export async function notifyOrderCancelled(orderId: string, reason?: string): Promise<void> {
  let failure: string | null = null

  try {
    const order = await loadOrderForEmail(orderId)
    if (!order?.user.email) return

    const mail = orderCancelledEmail({
      orderNo: formatOrderNo(order),
      customerName: order.shipFullName ?? order.user.name ?? 'Müşterimiz',
      reason,
    })

    const result = await sendEmailSafe({
      to: order.user.email,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    })

    if (!result.ok) {
      failure = `İptal bildirimi GÖNDERİLEMEDİ. Sağlayıcı yanıtı: ${result.detail ?? result.reason}`
    }
  } catch (error) {
    failure = `İptal bildirimi hazırlanırken hata: ${String(error).slice(0, 200)}`
    console.error('[e-posta] iptal bildirimi gönderilemedi:', orderId, error)
  } finally {
    if (failure) await appendAdminNote(orderId, `${failure} [build: ${deploymentTag()}]`)
  }
}

// ─── İade / iptal bildirimi ──────────────────────────────────────────────────

export async function notifyOrderRefunded(
  orderId: string,
  reason?: string,
  /** Kısmi iadede gerçekten iade edilen tutar. Verilmezse sipariş toplamı. */
  amount?: number,
): Promise<void> {
  try {
    const order = await loadOrderForEmail(orderId)
    if (!order?.user.email) return

    const mail = orderRefundedEmail({
      orderNo: formatOrderNo(order),
      customerName: order.shipFullName ?? order.user.name ?? 'Müşterimiz',
      amount: typeof amount === 'number' ? amount : Number(order.totalAmount),
      reason,
    })

    await sendEmailSafe({
      to: order.user.email,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    })
  } catch (error) {
    console.error('[e-posta] iade bildirimi gönderilemedi:', orderId, error)
  }
}

// ─── İade talebi ─────────────────────────────────────────────────────────────

async function loadReturnRequest(requestId: string) {
  return prisma.returnRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      reason: true,
      status: true,
      adminNote: true,
      items: true,
      order: {
        select: {
          id: true,
          orderNumber: true,
          shipFullName: true,
          brand: { select: { key: true } },
          items: { select: { id: true, quantity: true, product: { select: { name: true } } } },
        },
      },
      user: { select: { email: true, name: true } },
    },
  })
}

/** Talepteki kalem id'lerini okunabilir ürün adlarına çevirir */
function returnItemNames(request: {
  items: unknown
  order: { items: Array<{ id: string; quantity: number; product: { name: string } }> }
}): string[] {
  const selected = Array.isArray(request.items)
    ? (request.items as Array<{ orderItemId?: string }>)
    : []
  const ids = new Set(selected.map((i) => i.orderItemId).filter(Boolean))

  const matched = request.order.items.filter((i) => ids.has(i.id))
  const source = matched.length > 0 ? matched : request.order.items

  return source.map((i) => `${i.product.name} × ${i.quantity}`)
}

/** Müşteriye "talebiniz alındı", yöneticiye "yeni talep var" */
export async function notifyReturnRequested(requestId: string): Promise<void> {
  try {
    const request = await loadReturnRequest(requestId)
    if (!request?.user.email) return

    const customerName = request.order.shipFullName ?? request.user.name ?? 'Müşterimiz'
    const itemNames = returnItemNames(request)

    const customer = returnRequestedEmail({
      orderNo: formatOrderNo(request.order),
      customerName,
      itemNames,
    })
    await sendEmailSafe({
      to: request.user.email,
      subject: customer.subject,
      html: customer.html,
      text: customer.text,
    })

    const adminTo = process.env.ADMIN_NOTIFY_EMAIL
      ? unquote(process.env.ADMIN_NOTIFY_EMAIL)
      : ''
    if (adminTo) {
      const adminMail = adminReturnRequestEmail({
        orderNo: formatOrderNo(request.order),
        customerName,
        customerEmail: request.user.email,
        reason: request.reason,
        itemNames,
        brandKey: request.order.brand.key,
      })
      await sendEmailSafe({
        to: adminTo,
        subject: adminMail.subject,
        html: adminMail.html,
        text: adminMail.text,
        replyTo: request.user.email,
      })
    }
  } catch (error) {
    console.error('[e-posta] iade talebi bildirimi gönderilemedi:', requestId, error)
  }
}

/** Yöneticinin kararını müşteriye bildirir */
export async function notifyReturnDecision(requestId: string): Promise<void> {
  try {
    const request = await loadReturnRequest(requestId)
    if (!request?.user.email) return

    const mail = returnDecisionEmail({
      orderNo: formatOrderNo(request.order),
      customerName: request.order.shipFullName ?? request.user.name ?? 'Müşterimiz',
      approved: request.status === 'APPROVED',
      adminNote: request.adminNote,
    })

    const result = await sendEmailSafe({
      to: request.user.email,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    })

    if (!result.ok) {
      await appendAdminNote(
        request.order.id,
        `İade kararı bildirimi GÖNDERİLEMEDİ. Sağlayıcı yanıtı: ${result.detail ?? result.reason}`,
      )
    }
  } catch (error) {
    console.error('[e-posta] iade kararı bildirimi gönderilemedi:', requestId, error)
  }
}
