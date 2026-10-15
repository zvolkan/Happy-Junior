import { getCloudflareContext } from '@opennextjs/cloudflare'

/**
 * Hangi sürümün çalıştığını gösteren kısa etiket.
 *
 * Bir uç nokta ortam değişkenlerini görürken diğerinin görmemesi neredeyse her
 * zaman iki isteğin FARKLI dağıtımlara gitmesinden kaynaklanır: değişken
 * eklendikten sonra alınan yeni sürüm ile, iyzico'nun geri döndüğü eski sürüm
 * aynı olmayabiliyor. Hata notlarına bu etiketi de yazınca hangi sürümün
 * yazdığı tartışmasız oluyor.
 *
 * Vercel'de `VERCEL_DEPLOYMENT_ID` kullanılıyordu. Cloudflare'deki karşılığı
 * `version_metadata` bağlaması; `wrangler.jsonc` içinde tanımlı.
 *
 * DİKKAT: Commit SHA yeterli DEĞİL. Aynı commit'i yeniden dağıttığınızda SHA
 * aynı kalır ama sürüm (ve ona bağlanan ortam değişkenleri) değişir.
 */
export function deploymentTag(): string {
  try {
    const { env } = getCloudflareContext()
    const meta = (env as unknown as {
      CF_VERSION_METADATA?: { id?: string; tag?: string }
    }).CF_VERSION_METADATA

    const id = meta?.id?.slice(0, 8)
    const tag = meta?.tag
    const ortam = process.env.NODE_ENV === 'production' ? 'production' : 'preview'

    return [ortam, id, tag].filter(Boolean).join(' · ') || ortam
  } catch {
    // İstek bağlamı yok (yerel geliştirme, derleme zamanı)
    return 'local'
  }
}
