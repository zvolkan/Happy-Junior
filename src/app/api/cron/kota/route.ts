import { NextResponse } from 'next/server'
import { timingSafeEqualHash } from '@/lib/admin-auth'
import { sendEmailSafe, unquote } from '@/lib/email/send'
import { kotayiOlc, esigiAsanlar, kotaUyarisiEmail, UYARI_ESIGI } from '@/lib/kota'

/**
 * Supabase kota kontrolü — günlük.
 *
 * Ücretsiz planın sınırlarına yaklaşıldığında yöneticiye e-posta atar.
 * Ölçüm ve eşik mantığı `src/lib/kota.ts` içinde; burası yalnızca yetki
 * kontrolü, çağrı ve e-posta gönderimi yapıyor.
 *
 * ── Neden her gün, ama her gün e-posta değil ────────────────────────────────
 *
 * Görev her gün çalışıyor, ama e-posta YALNIZCA eşiği aşan bir kalem varken
 * gidiyor. Eşiğin altındayken sessiz. Eşiği aştıktan sonra siz plan
 * yükseltene ya da yer açana kadar günlük hatırlatma gelir — bu bilinçli:
 * "%70'i geçti" bilgisini bir kez gönderip susmak, o e-postayı kaçırdığınızda
 * sizi kotanın dolduğu güne kadar habersiz bırakırdı.
 *
 * Gönderim durumu hiçbir yerde saklanmıyor; bu sayede ek tablo, KV veya
 * Durable Object gerekmiyor. Bedeli günde bir e-posta.
 *
 * `CRON_SECRET` ile korunuyor; sır tanımlı değilse üretimde çalışmıyor.
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
    console.error('[kota] CRON_SECRET tanımlı değil; görev çalıştırılmadı.')
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
    const olcumler = await kotayiOlc()

    if (olcumler.length === 0) {
      console.error('[kota] hiçbir ölçüm alınamadı')
      return NextResponse.json({ ok: false, sebep: 'olcum-yok' }, { status: 500 })
    }

    const ozet = olcumler.map((o) => `${o.ad}=%${Math.round(o.oran * 100)}`).join(' · ')
    const asanlar = esigiAsanlar(olcumler)

    if (asanlar.length === 0) {
      console.log(`[kota] eşik altında (%${Math.round(UYARI_ESIGI * 100)}): ${ozet}`)
      return NextResponse.json({ ok: true, uyari: false, olcumler })
    }

    const alici = process.env.ADMIN_NOTIFY_EMAIL ? unquote(process.env.ADMIN_NOTIFY_EMAIL) : ''
    if (!alici) {
      console.error(`[kota] EŞİK AŞILDI ama ADMIN_NOTIFY_EMAIL tanımlı değil: ${ozet}`)
      return NextResponse.json({ ok: false, sebep: 'alici-yok', olcumler }, { status: 503 })
    }

    const mail = kotaUyarisiEmail(olcumler, asanlar)
    const sonuc = await sendEmailSafe({
      to: alici,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    })

    console.warn(`[kota] uyarı gönderildi (${sonuc.ok ? 'ok' : 'başarısız'}): ${ozet}`)
    return NextResponse.json({ ok: true, uyari: true, gonderildi: sonuc.ok, olcumler })
  } catch (error) {
    console.error('[kota] kontrol başarısız:', error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
