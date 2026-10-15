import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createClient } from '@/lib/supabase/server'

/**
 * iyzico ödeme formunu barındıran sayfa.
 *
 * Güvenlik: form içeriği yalnızca siparişin SAHİBİNE gösterilir. Eskiden
 * yalnızca token kontrolü vardı; token'ı ele geçiren (tarayıcı geçmişi,
 * referer, paylaşılan bağlantı) biri başkasının ödeme formunu açabiliyordu.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')

  if (!token) {
    return new NextResponse('Token eksik.', { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return new NextResponse('Bu sayfayı görüntülemek için giriş yapmalısınız.', { status: 401 })
  }

  const order = await prisma.order.findFirst({
    where: {
      paymentToken: token,
      status: 'PENDING',
      userId: user.id, // yalnızca kendi siparişi
    },
    select: { formContent: true },
  })

  if (!order?.formContent) {
    return new NextResponse('Ödeme formu bulunamadı veya süresi doldu.', { status: 404 })
  }

  const html = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="robots" content="noindex, nofollow" />
  <meta name="referrer" content="no-referrer" />
  <title>Güvenli Ödeme — Bayırlıoğlu</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9fafb; min-height: 100vh; }
  </style>
</head>
<body>
  ${order.formContent}
</body>
</html>`

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Referrer-Policy': 'no-referrer',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  })
}
