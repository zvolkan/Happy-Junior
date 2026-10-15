import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyAdminToken } from '@/lib/admin-auth'

/**
 * Sayfa/düzen seviyesinde yönetici kontrolü.
 *
 * `admin/layout.tsx` giriş sayfasını muaf tutabilmek için `x-pathname`
 * başlığına bakmak zorunda ve başlık yoksa (middleware çalışmamışsa) eskiden
 * korumayı TAMAMEN atlıyordu — yani ikinci savunma katmanı, tam da birincisi
 * devre dışı kaldığında kendini kapatıyordu.
 *
 * Bu yardımcı hiçbir istisna tanımıyor; giriş sayfası dışındaki admin
 * ekranlarının kökünde koşulsuz çağrılıyor.
 */
export async function yoneticiGerekli(): Promise<void> {
  const cookieStore = await cookies()
  if (!(await verifyAdminToken(cookieStore.get('admin_session')?.value))) {
    redirect('/admin/giris')
  }
}
