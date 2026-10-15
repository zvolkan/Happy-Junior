import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import { createClient } from '@/lib/supabase/server'
import { verifyAdminToken } from '@/lib/admin-auth'
import { faturaImzaliUrl } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/**
 * E-fatura PDF indirme.
 *
 * Fatura özel kovada duruyor, doğrudan URL'i yok. Bu uç nokta her istekte
 * kimliği doğrular, sonra iki dakikalık imzalı bağlantı üretip oraya yönlendirir.
 *
 * İzin verilenler: siparişin sahibi olan müşteri ve yönetici. Başkası — giriş
 * yapmış başka bir müşteri dahil — 404 alır. Bilerek 404: 403 dönmek "bu
 * siparişin faturası var ama sana ait değil" bilgisini sızdırırdı.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await params

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { userId: true, invoiceFilePath: true, invoiceFileName: true },
  })

  if (!order?.invoiceFilePath) {
    return new NextResponse('Fatura bulunamadı.', { status: 404 })
  }

  const cookieStore = await cookies()
  const yonetici = await verifyAdminToken(cookieStore.get('admin_session')?.value)

  let yetkili = yonetici
  if (!yetkili) {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    yetkili = Boolean(user && user.id === order.userId)
  }

  if (!yetkili) {
    return new NextResponse('Fatura bulunamadı.', { status: 404 })
  }

  try {
    const url = await faturaImzaliUrl(
      order.invoiceFilePath,
      order.invoiceFileName ?? 'fatura.pdf',
    )
    // Yönlendirmenin ÖNBELLEĞE ALINMAMASI şart: imzalı bağlantı iki dakika
    // sonra ölüyor, önbellekten dönen eski bağlantı "erişim reddedildi" verir.
    // Ayrıca önbellekteki bir kopya başka bir kullanıcıya servis edilebilirdi.
    return NextResponse.redirect(url, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
  } catch (error) {
    console.error('[fatura] imzalı bağlantı üretilemedi', orderId, error)
    return new NextResponse('Fatura şu anda indirilemiyor. Lütfen daha sonra tekrar deneyin.', {
      status: 503,
    })
  }
}
