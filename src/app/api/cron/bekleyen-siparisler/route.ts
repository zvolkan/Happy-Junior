import { NextResponse } from 'next/server'
import { timingSafeEqualHash } from '@/lib/admin-auth'
import { cancelAllStalePendingOrders } from '@/lib/stale-orders'

/**
 * Ödemesi yarım kalmış siparişlerin zamanlanmış temizliği.
 *
 * Temizlik eskiden YALNIZCA müşteri kendi sipariş listesini açtığında
 * çalışıyordu. Ödeme ekranını kapatıp bir daha dönmeyen kullanıcıların
 * siparişleri yönetici listesinde sonsuza kadar birikiyordu — ve stok artık
 * ödeme başlarken rezerve edildiği için (bkz. `src/lib/stock.ts`) o stok da
 * boşuna kilitli kalıyordu.
 *
 * KURULUM — `vercel.json` dosyanıza ekleyin (yoksa oluşturun):
 *
 *   {
 *     "crons": [
 *       { "path": "/api/cron/bekleyen-siparisler", "schedule": "0 3 * * *" }
 *     ]
 *   }
 *
 * Vercel Cron istekleri `Authorization: Bearer <CRON_SECRET>` başlığıyla gelir.
 * `CRON_SECRET` ortam değişkenini tanımlayın; tanımlı değilse uç nokta
 * üretimde çalışmaz (fail-closed) — aksi hâlde herkes tetikleyebilirdi.
 */

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim()

  // Sır tanımlı değilse HİÇBİR ortamda çalışmıyor.
  //
  // Eskiden bu kontrol yalnızca `NODE_ENV === 'production'` ise 503 dönüyor,
  // değilse akış aşağı devam ediyordu — yani `return` yoktu. Sonuç: sırrın
  // tanımlanmadığı her önizleme (preview) ya da hazırlık (staging) dağıtımında
  // kimliksiz tek bir GET isteği yüzlerce bekleyen siparişi iptal edip
  // stoklarını serbest bırakabiliyordu. Önizleme adresleri tahmin edilebilir
  // olduğu için bu teorik bir risk değil.
  if (!secret) {
    console.error('[cron] CRON_SECRET tanımlı değil; görev çalıştırılmadı.')
    return NextResponse.json({ error: 'Yapılandırma eksik.' }, { status: 503 })
  }

  // Sabit zamanlı karşılaştırma: `!==` ilk farklı karakterde durduğu için
  // sırrın ne kadarının doğru tahmin edildiğini zamanlamayla sızdırıyordu.
  const header = request.headers.get('authorization') ?? ''
  const onek = 'Bearer '
  const gelen = header.startsWith(onek) ? header.slice(onek.length) : ''
  if (!(await timingSafeEqualHash(gelen, secret))) {
    return NextResponse.json({ error: 'Yetkisiz.' }, { status: 401 })
  }

  try {
    const iptal = await cancelAllStalePendingOrders()
    console.log(`[cron] bekleyen sipariş temizliği: ${iptal} sipariş iptal edildi`)
    return NextResponse.json({ ok: true, iptal })
  } catch (error) {
    console.error('[cron] bekleyen sipariş temizliği başarısız:', error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
