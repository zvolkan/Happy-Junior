/**
 * Hız sınırı sayacı — Cloudflare Durable Object.
 *
 * Her (kova, anahtar) çifti kendi nesnesine düşüyor ve o nesne tek bir yerde,
 * tek iş parçacığında çalışıyor. Bu yüzden sayım KESİN: aynı anda gelen iki
 * istek birbirini ezmiyor. Workers KV'de bu garanti yok — tutarlılığı nihai
 * olduğu için tam da kaba kuvvet saldırısı anında sayım kaçırırdı.
 *
 * Sınıf `custom-worker.ts` üzerinden dışa veriliyor ve `wrangler.jsonc`
 * içindeki `durable_objects` bağlamasıyla eşleşiyor.
 */
export class HizSayaci {
  private state: DurableObjectState

  constructor(state: DurableObjectState) {
    this.state = state
  }

  async fetch(request: Request): Promise<Response> {
    const yol = new URL(request.url).pathname

    if (yol === '/sifirla') {
      await this.state.storage.deleteAll()
      return Response.json({ ok: true })
    }

    const { max, windowMs } = (await request.json()) as { max: number; windowMs: number }
    const now = Date.now()

    const count = (await this.state.storage.get<number>('count')) ?? 0
    const firstAt = (await this.state.storage.get<number>('firstAt')) ?? 0

    // Pencere dolduysa baştan başla
    if (!firstAt || now - firstAt > windowMs) {
      await this.state.storage.put({ count: 1, firstAt: now })
      // Pencere bitince nesne kendini temizlesin; depolama şişmesin
      await this.state.storage.setAlarm(now + windowMs)
      return Response.json({ ok: true, kalanMs: 0 })
    }

    const yeni = count + 1
    await this.state.storage.put('count', yeni)

    if (yeni <= max) return Response.json({ ok: true, kalanMs: 0 })
    return Response.json({ ok: false, kalanMs: windowMs - (now - firstAt) })
  }

  /** Pencere dolunca sayaç kaydını sil */
  async alarm(): Promise<void> {
    await this.state.storage.deleteAll()
  }
}
