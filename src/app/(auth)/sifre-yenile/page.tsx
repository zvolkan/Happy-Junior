import type { Metadata } from 'next'
import Link from 'next/link'
import GrupLogo from '@/components/ui/GrupLogo'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { updatePassword } from '@/app/actions/auth'

export const metadata: Metadata = {
  title: 'Yeni Şifre Belirle',
  robots: { index: false, follow: false },
}

export default async function SifreYenilePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams

  // Sıfırlama bağlantısı geçerli bir oturum açar; yoksa buraya erişilemez
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(
      `/sifremi-unuttum?error=${encodeURIComponent(
        'Bağlantının süresi dolmuş veya geçersiz. Lütfen yeniden talep edin.',
      )}`,
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-4">
            {/* Eskiden "BG" harfleri yazıyordu; dört auth sayfasında da
                kopyalanmıştı. Artık markanın tam kilidi (dağ + yazı), tek
                bileşenden. Yazı logonun içinde olduğu için ayrıca metin yok. */}
            <GrupLogo />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Yeni Şifre Belirleyin</h1>
          <p className="text-gray-500 text-sm mt-1">{user.email}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 sm:p-8">
          {params.error && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              {params.error}
            </div>
          )}

          <form action={updatePassword} className="space-y-4">
            <input type="hidden" name="returnTo" value="/sifre-yenile" />

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Yeni şifre
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
              <p className="text-xs text-gray-400 mt-1.5">
                En az 8 karakter, bir harf ve bir rakam içermeli.
              </p>
            </div>

            <div>
              <label
                htmlFor="passwordConfirm"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Yeni şifre (tekrar)
              </label>
              <input
                id="passwordConfirm"
                name="passwordConfirm"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              className="btn-press w-full bg-gray-900 hover:bg-gray-800 text-white py-3 rounded-xl font-semibold text-sm"
            >
              Şifreyi Güncelle
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
