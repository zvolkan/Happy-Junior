import { redirect } from 'next/navigation'

/**
 * Eski (marka seçimsiz) adres.
 *
 * Panel artık marka bazlı çalışıyor: /admin/<marka>/urunler
 * Eski yer imleri 404 almasın diye marka seçim ekranına yönlendiriliyor.
 */
export default function EskiAdres() {
  redirect('/admin')
}
