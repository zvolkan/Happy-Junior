'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { verifyAdminToken } from '@/lib/admin-auth'
import { faturaYukle, faturaSil } from '@/lib/supabase-admin'
import { formatOrderNo } from '@/lib/order-number'
import { notifyInvoiceReady } from '@/lib/email/notify'

/**
 * Siparişe e-fatura PDF'i yükleme.
 *
 * Fatura kesme işi (GİB / e-arşiv entegrasyonu) sitenin dışında yapılıyor;
 * burada yalnızca kesilmiş faturanın PDF'i siparişe iliştiriliyor. Yüklenince
 * müşteriye bilgi e-postası gidiyor ve fatura Hesabım > Siparişlerim altında
 * indirilebilir oluyor.
 *
 * Sunucu aksiyonlarından hata FIRLATMIYORUZ: üretimde fırlatılan hatanın mesajı
 * Next tarafından gizleniyor ve yönetici "bir şeyler ters gitti" ekranı
 * görüyor. Bunun yerine sonuç nesnesi dönüyor.
 */

export type FaturaSonuc = { ok: true; mesaj: string } | { ok: false; error: string }

const AZAMI_BOYUT = 10 * 1024 * 1024 // 10 MB

async function yoneticiMi(): Promise<boolean> {
  const cookieStore = await cookies()
  return verifyAdminToken(cookieStore.get('admin_session')?.value)
}

/**
 * PDF'in gerçekten PDF olduğunu içeriğinden doğrular.
 *
 * Yalnızca dosya adına veya tarayıcının bildirdiği MIME türüne bakmak yeterli
 * değil: ikisi de istemciden geliyor ve kolayca değiştirilebiliyor. PDF dosyası
 * her zaman "%PDF-" imzasıyla başlar.
 */
function pdfMi(bytes: Uint8Array): boolean {
  return (
    bytes.length > 5 &&
    bytes[0] === 0x25 && // %
    bytes[1] === 0x50 && // P
    bytes[2] === 0x44 && // D
    bytes[3] === 0x46 && // F
    bytes[4] === 0x2d // -
  )
}

export async function faturaYukleAksiyon(formData: FormData): Promise<FaturaSonuc> {
  if (!(await yoneticiMi())) {
    return { ok: false, error: 'Oturumunuz sona ermiş görünüyor. Sayfayı yenileyip tekrar deneyin.' }
  }

  const orderId = String(formData.get('orderId') ?? '').trim()
  const faturaNo = String(formData.get('faturaNo') ?? '').trim().slice(0, 60)
  const dosya = formData.get('dosya')

  if (!orderId) return { ok: false, error: 'Sipariş bulunamadı.' }
  if (!(dosya instanceof File) || dosya.size === 0) {
    return { ok: false, error: 'Bir PDF dosyası seçin.' }
  }
  if (dosya.size > AZAMI_BOYUT) {
    return { ok: false, error: 'Dosya 10 MB sınırını aşıyor.' }
  }

  const bytes = new Uint8Array(await dosya.arrayBuffer())
  if (!pdfMi(bytes)) {
    return {
      ok: false,
      error: 'Bu dosya PDF değil. E-fatura PDF olarak yüklenmeli (Word veya görsel kabul edilmiyor).',
    }
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, orderNumber: true, invoiceFilePath: true, brand: { select: { key: true } } },
  })
  if (!order) return { ok: false, error: 'Sipariş bulunamadı.' }

  const siparisNo = formatOrderNo(order)
  // Yol tahmin edilemesin diye sipariş kimliği de giriyor; kova zaten özel ama
  // yolun kendisi de bir sır katmanı.
  const yol = `${order.brand.key}/${siparisNo}-${order.id}.pdf`
  const gorunenAd = `Fatura-${siparisNo}.pdf`

  try {
    await faturaYukle(Buffer.from(bytes), yol)
  } catch (error) {
    console.error('[fatura] yükleme hatası', orderId, error)
    return {
      ok: false,
      error:
        'Dosya depoya yüklenemedi. Supabase Storage içinde "faturalar" kovası var mı diye bakın.',
    }
  }

  await prisma.order.update({
    where: { id: orderId },
    data: {
      invoiceFilePath: yol,
      invoiceFileName: gorunenAd,
      invoiceNo: faturaNo || null,
      invoiceUploadedAt: new Date(),
    },
  })

  // E-posta gönderimi faturanın kaydedilmesini engellememeli: posta sağlayıcısı
  // düşse bile fatura yüklenmiş sayılır, hata sipariş notuna yazılır.
  await notifyInvoiceReady(orderId)

  revalidatePath(`/admin/${order.brand.key}/siparisler/${orderId}`)
  revalidatePath(`/admin/${order.brand.key}/siparisler`)
  revalidatePath(`/hesabim/siparislerim/${orderId}`)

  return { ok: true, mesaj: 'Fatura yüklendi ve müşteriye bilgi e-postası gönderildi.' }
}

export async function faturaSilAksiyon(orderId: string): Promise<FaturaSonuc> {
  if (!(await yoneticiMi())) {
    return { ok: false, error: 'Oturumunuz sona ermiş görünüyor. Sayfayı yenileyip tekrar deneyin.' }
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { invoiceFilePath: true, brand: { select: { key: true } } },
  })
  if (!order) return { ok: false, error: 'Sipariş bulunamadı.' }
  if (!order.invoiceFilePath) return { ok: false, error: 'Bu siparişte yüklü fatura yok.' }

  await faturaSil(order.invoiceFilePath)

  await prisma.order.update({
    where: { id: orderId },
    data: {
      invoiceFilePath: null,
      invoiceFileName: null,
      invoiceNo: null,
      invoiceUploadedAt: null,
    },
  })

  revalidatePath(`/admin/${order.brand.key}/siparisler/${orderId}`)
  revalidatePath(`/admin/${order.brand.key}/siparisler`)
  revalidatePath(`/hesabim/siparislerim/${orderId}`)

  return { ok: true, mesaj: 'Fatura kaldırıldı.' }
}
