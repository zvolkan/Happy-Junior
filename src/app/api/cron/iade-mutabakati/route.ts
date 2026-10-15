import { NextResponse } from 'next/server'
import { timingSafeEqualHash } from '@/lib/admin-auth'
import { reconcilePendingRefunds } from '@/lib/refund-reconcile'

/**
 * İade mutabakatı — zamanlanmış görev.
 *
 * Sonucu öğrenilemeyen iadeler `refund_pending` durumunda bekliyor ve yarıda
 * kesilmiş işlemler `refunding` kilidini açık bırakıyor. Bu görev ikisini de
 * topluyor: kilitleri çözüyor, iyzico'ya "gerçekte ne oldu" diye soruyor ve
 * cevabı siparişin yönetici notuna yazıyor. Kararı yönetici veriyor; bu görev
 * kararın önüne kanıtı koyuyor. Ayrıntılar: src/lib/refund-reconcile.ts
 *
 * KURULUM:
 *   1. wrangler.jsonc  → "triggers": { "crons": [..., "30 * * * *"] }
 *   2. custom-worker.ts → GOREVLER tablosuna aynı ifadeyi ekleyin.
 *
 * İkinci adım atlanırsa görev sessizce hiç çalışmaz.
 *
 * Saat başı değil 30. dakikada: Cloudflare'de :00 zamanlamaları kalabalık
 * oluyor ve gecikmeli tetikleniyor.
 */

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim()

  // Sır tanımlı değilse HİÇBİR ortamda çalışmıyor (fail-closed).
  if (!secret) {
    console.error('[cron] CRON_SECRET tanımlı değil; iade mutabakatı çalıştırılmadı.')
    return NextResponse.json({ error: 'Yapılandırma eksik.' }, { status: 503 })
  }

  const header = request.headers.get('authorization') ?? ''
  const onek = 'Bearer '
  const gelen = header.startsWith(onek) ? header.slice(onek.length) : ''
  if (!(await timingSafeEqualHash(gelen, secret))) {
    return NextResponse.json({ error: 'Yetkisiz.' }, { status: 401 })
  }

  try {
    const sonuc = await reconcilePendingRefunds()
    console.log(
      `[cron] iade mutabakatı: ${sonuc.kilitCozuldu} kilit çözüldü, ` +
        `${sonuc.sorgulanan} sipariş sorgulandı, ${sonuc.bekleyen} sipariş inceleme bekliyor`,
    )
    return NextResponse.json({ ok: true, ...sonuc })
  } catch (error) {
    console.error('[cron] iade mutabakatı başarısız:', error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
