import { permanentRedirect } from 'next/navigation'
import { ACTIVE_BRAND_KEY } from '@/lib/constants'

/**
 * Eski (marka öncesi) ürün listesi rotası.
 *
 * Bu sayfa `src/data/mock.ts` içindeki sahte ürünleri gösteriyordu ve Next.js
 * statik rotayı `[brand]` dinamik rotasından önce eşleştirdiği için ziyaretçiler
 * gerçek veritabanı ürünleri yerine bu listeyi görüyordu.
 *
 * Artık aktif markanın gerçek ürün sayfasına yönlendiriyor. Footer ve eski
 * bağlantılar çalışmaya devam eder.
 */
export default async function EskiUrunlerPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams

  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') query.set(key, value)
    else if (Array.isArray(value) && value[0]) query.set(key, value[0])
  }

  const qs = query.toString()
  // Kalıcı taşınma → 308. `redirect` 307 (geçici) döndürüyordu ve arama
  // motoru eski adresi dizinde tutmaya devam ediyordu.
  permanentRedirect(`/${ACTIVE_BRAND_KEY}/urunler${qs ? `?${qs}` : ''}`)
}
