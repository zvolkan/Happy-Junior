'use server'

import { headers } from 'next/headers'
import { prisma } from '@/lib/db'
import { clientIp, rateLimit } from '@/lib/rate-limit'
import { formatOrderNo, normalizeOrderNoInput } from '@/lib/order-number'
import type { IconName } from '@/components/ui/Icon'

/**
 * Sipariş takibi.
 *
 * Eskiden bu sayfa `MOCK_CARGO` sabitini döndürüyordu; girilen sipariş
 * numarası ne olursa olsun aynı sahte kargo bilgisi gösteriliyordu. Artık
 * gerçek Order tablosu sorgulanıyor.
 *
 * Giriş yapmamış kullanıcılar için: sipariş numarası + e-posta eşleşmesi
 * aranır. Yalnızca numarayı bilen biri başkasının siparişini göremez.
 */

export interface TrackingStep {
  id: number
  label: string
  icon: IconName
  date: string | null
  done: boolean
}

export interface TrackingResult {
  orderNo: string
  status: string
  statusLabel: string
  createdAt: string
  carrier: string | null
  trackingNo: string | null
  itemCount: number
  totalAmount: string
  steps: TrackingStep[]
  activeStep: number
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Ödeme Bekleniyor',
  CONFIRMED: 'Onaylandı',
  PROCESSING: 'Hazırlanıyor',
  SHIPPED: 'Kargoya Verildi',
  DELIVERED: 'Teslim Edildi',
  CANCELLED: 'İptal Edildi',
  REFUNDED: 'İade Edildi',
}

/** Sipariş durumunun adım sırasındaki karşılığı */
const STATUS_STEP: Record<string, number> = {
  PENDING: 1,
  CONFIRMED: 2,
  PROCESSING: 3,
  SHIPPED: 4,
  DELIVERED: 5,
  CANCELLED: 0,
  REFUNDED: 0,
}

function formatDateTime(date: Date | null): string | null {
  if (!date) return null
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export type TrackOrderResponse =
  | { ok: true; data: TrackingResult }
  | { ok: false; error: string }

export async function trackOrder(
  orderNumber: string,
  email: string,
): Promise<TrackOrderResponse> {
  // ── Hız sınırı ───────────────────────────────────────────────────────────
  // Bu uç noktada hiç sınır yoktu. Sipariş numarası tarih öneki + rastgele
  // hane olduğu için, kurbanın e-postasını bilen biri bir günü tarayarak
  // sipariş durumunu, tutarı ve KARGO TAKİP NUMARASINI öğrenebiliyordu.
  // (Numara uzayı da 4 haneden 6 haneye çıkarıldı; bkz. lib/order-number.ts.)
  const limit = await rateLimit('siparis-takip', clientIp(await headers()), 10, 10 * 60 * 1000)
  if (!limit.ok) {
    return {
      ok: false,
      error: 'Çok fazla sorgulama yaptınız. Lütfen birkaç dakika sonra tekrar deneyin.',
    }
  }

  const { digits, raw: orderNo } = normalizeOrderNoInput(orderNumber ?? '')
  const mail = (email ?? '').trim().toLowerCase()

  if (!orderNo || !mail) {
    return { ok: false, error: 'Lütfen sipariş numaranızı ve e-posta adresinizi girin.' }
  }

  try {
    const order = await prisma.order.findFirst({
      where: {
        // Numara ile de eski cuid ile de bulunabilsin: e-postalardan
        // kopyalanan eski kimlikler çalışmaya devam etsin.
        OR: [...(digits ? [{ orderNumber: digits }] : []), { id: orderNo }],
        user: { email: { equals: mail, mode: 'insensitive' } },
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        shippedAt: true,
        deliveredAt: true,
        carrier: true,
        trackingNumber: true,
        totalAmount: true,
        paymentStatus: true,
        items: { select: { quantity: true } },
      },
    })

    if (!order) {
      return {
        ok: false,
        error:
          'Bu bilgilerle eşleşen bir sipariş bulunamadı. Sipariş numaranızı ve e-posta adresinizi kontrol edin.',
      }
    }

    const activeStep = STATUS_STEP[order.status] ?? 0
    const isCancelled = order.status === 'CANCELLED' || order.status === 'REFUNDED'

    const paidAt = order.paymentStatus === 'paid' ? order.updatedAt : null

    const steps: TrackingStep[] = [
      {
        id: 1,
        label: 'Sipariş Alındı',
        icon: 'belge',
        date: formatDateTime(order.createdAt),
        done: activeStep >= 1,
      },
      {
        id: 2,
        label: 'Onaylandı',
        icon: 'onay-daire',
        date: activeStep >= 2 ? formatDateTime(paidAt) : null,
        done: activeStep >= 2,
      },
      {
        id: 3,
        label: 'Hazırlanıyor',
        icon: 'paket',
        date: null,
        done: activeStep >= 3,
      },
      {
        id: 4,
        label: 'Kargoya Verildi',
        icon: 'kargo',
        date: formatDateTime(order.shippedAt),
        done: activeStep >= 4,
      },
      {
        id: 5,
        label: 'Teslim Edildi',
        icon: 'ev',
        date: formatDateTime(order.deliveredAt),
        done: activeStep >= 5,
      },
    ]

    return {
      ok: true,
      data: {
        orderNo: formatOrderNo(order),
        status: order.status,
        statusLabel: STATUS_LABELS[order.status] ?? order.status,
        createdAt: formatDateTime(order.createdAt) ?? '',
        carrier: order.carrier,
        trackingNo: order.trackingNumber,
        itemCount: order.items.reduce((sum: number, i: { quantity: number }) => sum + i.quantity, 0),
        totalAmount: Number(order.totalAmount).toLocaleString('tr-TR', {
          style: 'currency',
          currency: 'TRY',
        }),
        steps: isCancelled ? [] : steps,
        activeStep,
      },
    }
  } catch (error) {
    console.error('[siparis-takibi] sorgu hatası:', error)
    return { ok: false, error: 'Sorgulama sırasında bir hata oluştu. Lütfen tekrar deneyin.' }
  }
}
