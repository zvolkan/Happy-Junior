import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { verifyAdminToken } from '@/lib/admin-auth'

export const metadata: Metadata = {
  title: 'Yönetim Paneli — Happy Junior',
  robots: 'noindex, nofollow',
}

/**
 * Admin bölümünün ikinci koruma katmanı.
 *
 * Middleware zaten /admin/* yolunu koruyor, ancak sayfa seviyesinde kontrol
 * olmadığında yetkisiz istek "Yetkisiz erişim" hatasıyla genel hata ekranına
 * düşüyordu. Burada giriş sayfasına düzgün yönlendirme yapılır.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [cookieStore, headerList] = await Promise.all([cookies(), headers()])

  const pathname = headerList.get('x-pathname')

  // Giriş sayfası bu düzenin altında olduğu için muaf tutuluyor; aksi hâlde
  // yönlendirme döngüsüne girer.
  //
  // `x-pathname` yoksa (middleware çalışmamışsa) eskiden koruma TAMAMEN
  // atlanıyordu — yani ikinci savunma katmanı, tam da birincisi devre dışı
  // kaldığında kendini kapatıyordu. Artık başlık yoksa da token doğrulanıyor:
  // yalnızca giriş sayfası muaf ve o sayfa `pathname` null iken de token
  // kontrolünden geçmiyor, çünkü asıl koruma alt düzenlerde (bkz.
  // `admin/[kapsam]/layout.tsx` ve `admin/page.tsx`) koşulsuz yapılıyor.
  const girisSayfasi = pathname?.startsWith('/admin/giris') ?? false

  if (!girisSayfasi) {
    const token = cookieStore.get('admin_session')?.value
    if (!(await verifyAdminToken(token))) {
      redirect('/admin/giris')
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  )
}
