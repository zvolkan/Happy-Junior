import { redirect } from 'next/navigation'
import { ACTIVE_BRAND_KEY } from '@/lib/constants'

/**
 * Eski (marka öncesi) blog rotası.
 * İçerik `/[brand]/blog` altında yaşıyor; bu sayfa aynı yazıların ikinci bir
 * kopyasını yayınlıyordu (arama motoru için yinelenen içerik).
 */
export default function EskiBlogPage() {
  redirect(`/${ACTIVE_BRAND_KEY}/blog`)
}
