// `.open-next/worker.js` derleme çıktısıdır; kaynak ağacında yoktur, bu yüzden
// TypeScript onu bulamaz. Derleme sırasında üretiliyor.
// @ts-ignore — derleme çıktısı olduğu için temiz bir çalışma kopyasında yok,
// derlemeden sonra var. `@ts-expect-error` kullanılamaz: dosya varken
// "kullanılmayan yönerge" hatası verir.
import { default as handler } from './.open-next/worker.js'

/**
 * Worker giriş noktası.
 *
 * OpenNext'in ürettiği worker yalnızca `fetch` handler'ı dışa veriyor. Buraya
 * iki şey daha ekliyoruz: zamanlanmış görev (cron) ve hız sayacı Durable
 * Object'i.
 *
 * ── Cron neden HTTP isteğiyle çalışıyor? ────────────────────────────────────
 *
 * Temizlik işi `cancelAllStalePendingOrders()` fonksiyonunda ve o fonksiyon
 * Prisma üzerinden veritabanına gidiyor. Prisma istemcisi ise istek bağlamına
 * bağlı (bkz. src/lib/db.ts): `getCloudflareContext()` ve React `cache()`
 * yalnızca bir istek içinde doğru çalışıyor. `scheduled` handler'da böyle bir
 * bağlam yok.
 *
 * Fonksiyonu doğrudan çağırmak yerine kendi HTTP uç noktamıza istek atıyoruz.
 * Böylece iş, halihazırda çalıştığı bilinen normal istek yolundan geçiyor ve
 * `src/lib/stale-orders.ts` ile `src/app/api/cron/...` dosyalarına hiç
 * dokunmamış oluyoruz. `CRON_SECRET` kontrolü de anlamını koruyor.
 *
 * ── Birden çok zamanlanmış görev ────────────────────────────────────────────
 *
 * Artık iki görev var ve ikisi de aynı `scheduled` handler'a düşüyor. Hangisi
 * olduğunu `controller.cron` söylüyor: wrangler.jsonc'taki ifadenin BİREBİR
 * aynısı geliyor. Aşağıdaki tablo ifadeyi çağrılacak yola eşliyor.
 *
 * DİKKAT: wrangler.jsonc'a yeni bir cron eklerken buraya da karşılığını
 * yazın. Eşleşme bulunamazsa görev sessizce hiçbir şey yapmaz — bu yüzden
 * eşleşmeyen ifade log'a hata olarak düşüyor.
 */

// Durable Object sınıfı buradan dışa verilmeli ki wrangler bağlamayı bulabilsin
export { HizSayaci } from './src/lib/hiz-sayaci'

/** Cron ifadesi → çağrılacak uç nokta. wrangler.jsonc ile birebir aynı olmalı. */
const GOREVLER: Record<string, { yol: string; ad: string }> = {
  // Her gece 03:00 UTC (TR 06:00) — ödemesi yarım kalmış siparişleri iptal et
  '0 3 * * *': { yol: '/api/cron/bekleyen-siparisler', ad: 'bekleyen sipariş temizliği' },
  // Her sabah 06:00 UTC (TR 09:00) — Supabase kota kontrolü
  '0 6 * * *': { yol: '/api/cron/kota', ad: 'Supabase kota kontrolü' },
  // Her saat :30 — sonucu öğrenilemeyen iadelerin takibi.
  //
  // Saat başı değil 30. dakikada: Cloudflare'de :00 zamanlamaları kalabalık
  // ve gecikmeli tetikleniyor. Sık çalışması gerekiyor çünkü bekleyen her
  // dakika müşterinin parasının askıda kaldığı bir dakika.
  '30 * * * *': { yol: '/api/cron/iade-mutabakati', ad: 'iade mutabakatı' },
}

export default {
  fetch: handler.fetch,

  async scheduled(controller: ScheduledController, env: CloudflareEnv, ctx: ExecutionContext) {
    const gorev = GOREVLER[controller.cron]

    if (!gorev) {
      console.error(
        `[cron] tanımsız zamanlama: "${controller.cron}". ` +
          'wrangler.jsonc\'a cron eklenmiş ama custom-worker.ts\'teki GOREVLER tablosuna eklenmemiş.',
      )
      return
    }

    const is = (async () => {
      const e = env as unknown as { CRON_SECRET?: string; NEXT_PUBLIC_SITE_URL?: string }
      const secret = e.CRON_SECRET

      if (!secret) {
        console.error(`[cron] CRON_SECRET tanımlı değil; ${gorev.ad} çalıştırılmadı.`)
        return
      }

      const taban = e.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, '') || 'https://happyjunioranamur.com'
      const url = new URL(gorev.yol, taban)

      const self = env.WORKER_SELF_REFERENCE
      if (!self) {
        console.error('[cron] WORKER_SELF_REFERENCE bağlaması yok.')
        return
      }

      try {
        const res = await self.fetch(
          new Request(url, { headers: { authorization: `Bearer ${secret}` } }),
        )
        const govde = await res.text()
        console.log(`[cron] ${gorev.ad} → ${res.status} ${govde.slice(0, 200)}`)
      } catch (error) {
        console.error(`[cron] ${gorev.ad} isteği başarısız:`, error)
      }
    })()

    // waitUntil olmadan handler dönünce iş yarıda kesilebilir
    ctx.waitUntil(is)
  },
} satisfies ExportedHandler<CloudflareEnv>
