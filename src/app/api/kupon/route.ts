import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { etkinBirimFiyat, money } from '@/lib/checkout'
import { kuponDogrula } from '@/lib/kupon'
import { rateLimit } from '@/lib/rate-limit'

/**
 * Ödeme sayfasındaki "Uygula" düğmesi. Yalnızca ekranda gösterim içindir;
 * sipariş oluşturulurken kupon /api/odeme/initialize içinde yeniden doğrulanır.
 *
 * Ara toplam istemciden alınmaz, sepetteki ürünlerin veritabanı fiyatından
 * hesaplanır; böylece "en az X TL" koşulu ekranda da doğru değerlendirilir.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Kupon kullanmak için giriş yapın.' }, { status: 401 })

  // Kod tahminini zorlaştırmak için deneme sınırı
  const limit = await rateLimit('kupon-dene', user.id, 20, 10 * 60 * 1000)
  if (!limit.ok) {
    return NextResponse.json({ error: 'Çok fazla deneme yaptınız. Biraz sonra tekrar deneyin.' }, { status: 429 })
  }

  let body: { code?: unknown; cartItems?: { id?: unknown; quantity?: unknown }[] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 })
  }

  const istenen = new Map<string, number>()
  for (const item of Array.isArray(body.cartItems) ? body.cartItems.slice(0, 100) : []) {
    const qty = Number(item?.quantity)
    if (typeof item?.id === 'string' && Number.isInteger(qty) && qty > 0 && qty < 1000) {
      istenen.set(item.id, (istenen.get(item.id) ?? 0) + qty)
    }
  }
  if (istenen.size === 0) return NextResponse.json({ error: 'Sepetiniz boş.' }, { status: 400 })

  const urunler = await prisma.product.findMany({
    where: { id: { in: [...istenen.keys()] }, isActive: true },
    select: { id: true, price: true, salePrice: true },
  })
  const araToplam = money(
    urunler.reduce((t, u) => t + money(etkinBirimFiyat(Number(u.price), Number(u.salePrice)) * istenen.get(u.id)!), 0),
  )

  const sonuc = await kuponDogrula(body.code, user.id, araToplam)
  if (!sonuc.ok) return NextResponse.json({ error: sonuc.hata }, { status: 400 })

  return NextResponse.json({ code: sonuc.kod, percent: sonuc.yuzde, description: sonuc.aciklama })
}
