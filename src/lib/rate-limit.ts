import { getCloudflareContext } from '@opennextjs/cloudflare'

/**
 * Hız sınırlayıcı — Cloudflare Durable Object destekli.
 *
 * ── Neden değişti ───────────────────────────────────────────────────────────
 *
 * Eski hâli sayaçları süreç belleğinde bir `Map` içinde tutuyordu. Vercel'de
 * zaten zayıftı (her sunucusuz örnek kendi sayacını tutuyordu); Workers'ta
 * izolatlar çok daha kısa ömürlü ve çok daha fazla olduğu için sınır
 * **pratikte hiç devreye girmezdi**. Admin paneli tek parolayla korunduğu için
 * bu sessiz bir güvenlik gerilemesi olurdu.
 *
 * Durable Object seçildi çünkü hız sınırı KESİN sayım ister. Workers KV
 * tutarlılığı nihai (eventual) olduğu için kısa pencerelerde sayım kaçırır —
 * tam da kaba kuvvet saldırısının olduğu anda.
 *
 * ── Değişen imza ────────────────────────────────────────────────────────────
 *
 * `rateLimit()` ve `rateLimitReset()` artık ASENKRON. Çağıran üç dosya buna
 * göre güncellendi.
 *
 * ── Yerel geliştirme ────────────────────────────────────────────────────────
 *
 * Durable Object bağlaması yoksa (örneğin `next dev` ile çalışırken) bellekteki
 * eski davranışa düşülüyor. Üretimde bağlama her zaman var.
 */

export type HizSonucu = { ok: boolean; kalanMs: number }

// ─── Yerel yedek (yalnızca geliştirme) ───────────────────────────────────────

type Kayit = { count: number; firstAt: number }
const yerelKovalar = new Map<string, Map<string, Kayit>>()

function yerelKova(ad: string): Map<string, Kayit> {
  let m = yerelKovalar.get(ad)
  if (!m) {
    m = new Map()
    yerelKovalar.set(ad, m)
  }
  if (m.size > 5000) m.clear()
  return m
}

function yerelSay(bucket: string, key: string, max: number, windowMs: number): HizSonucu {
  const now = Date.now()
  const m = yerelKova(bucket)
  const record = m.get(key)

  if (!record || now - record.firstAt > windowMs) {
    m.set(key, { count: 1, firstAt: now })
    return { ok: true, kalanMs: 0 }
  }

  record.count += 1
  if (record.count <= max) return { ok: true, kalanMs: 0 }
  return { ok: false, kalanMs: windowMs - (now - record.firstAt) }
}

// ─── Durable Object erişimi ──────────────────────────────────────────────────

type SayacStub = {
  fetch: (input: Request | string, init?: RequestInit) => Promise<Response>
}

function sayacStub(bucket: string, key: string): SayacStub | null {
  try {
    const { env } = getCloudflareContext()
    const ns = (env as unknown as { HIZ_SAYACI?: DurableObjectNamespace }).HIZ_SAYACI
    if (!ns) return null
    // Her (kova, anahtar) çifti kendi nesnesine gider; sayım orada kesindir.
    return ns.get(ns.idFromName(`${bucket}:${key}`)) as unknown as SayacStub
  } catch {
    // İstek bağlamı yoksa (derleme sırasında vb.) yedeğe düş
    return null
  }
}

/** `key` için `windowMs` içinde en fazla `max` istek. */
export async function rateLimit(
  bucket: string,
  key: string,
  max: number,
  windowMs: number,
): Promise<HizSonucu> {
  const stub = sayacStub(bucket, key)
  if (!stub) return yerelSay(bucket, key, max, windowMs)

  try {
    const res = await stub.fetch('https://sayac/artir', {
      method: 'POST',
      body: JSON.stringify({ max, windowMs }),
    })
    return (await res.json()) as HizSonucu
  } catch (error) {
    // Sayaca ulaşılamazsa isteği ENGELLEMİYORUZ — hız sınırı bir güvenlik
    // katmanı, tek başına kapı değil. Erişilemediğinde siteyi kapatmak
    // saldırganın işine yarar.
    console.error('[hiz-siniri] sayaca ulaşılamadı:', bucket, error)
    return { ok: true, kalanMs: 0 }
  }
}

/** Başarılı işlemden sonra sayacı sıfırlar. */
export async function rateLimitReset(bucket: string, key: string): Promise<void> {
  const stub = sayacStub(bucket, key)
  if (!stub) {
    yerelKova(bucket).delete(key)
    return
  }
  try {
    await stub.fetch('https://sayac/sifirla', { method: 'POST' })
  } catch (error) {
    console.error('[hiz-siniri] sayaç sıfırlanamadı:', bucket, error)
  }
}

/**
 * İstemci IP'si.
 *
 * Sıra önemli:
 *
 * 1. `cf-connecting-ip` — Cloudflare'in kendi kenar ağında yazdığı başlık.
 *    İstemci tarafından EZİLEMEZ; bu yüzden en güvenilir kaynak.
 * 2. `x-vercel-forwarded-for` — Vercel'in karşılığı. Geçiş döneminde iki ortam
 *    da ayakta olabileceği için bırakıldı.
 * 3. `x-forwarded-for` zincirinin İLK değil SON öğesi — zincire istemci baştan
 *    ekleme yapabilir, sona ekleme yapamaz.
 */
export function clientIp(headerList: Headers): string {
  const cf = headerList.get('cf-connecting-ip')?.trim()
  if (cf) return cf

  const vercel = headerList.get('x-vercel-forwarded-for')?.trim()
  if (vercel) return vercel.split(',')[0].trim()

  const chain = headerList.get('x-forwarded-for')
  if (chain) {
    const parts = chain.split(',').map((p) => p.trim()).filter(Boolean)
    if (parts.length > 0) return parts[parts.length - 1]
  }

  return headerList.get('x-real-ip')?.trim() || 'unknown'
}
