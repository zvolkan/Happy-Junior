import type { Metadata } from 'next'
import Link from 'next/link'
import GrupLogo from '@/components/ui/GrupLogo'
import GoogleGiris from '@/components/auth/GoogleGiris'
import { signIn, signInWithGoogle } from '@/app/actions/auth'

export const metadata: Metadata = {
  // Giriş/kayıt sayfalarının arama sonuçlarında hiçbir işi yok ve
  // robots.txt tek başına yetmiyor: o yalnızca TARAMAYI engelliyor,
  // dışarıdan bağlantı verilen bir sayfa yine dizine girebiliyor.
  robots: { index: false, follow: false },
  title: 'Giriş Yap',
}

export default async function GirisPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; redirect?: string; mesaj?: string }>
}) {
  const params = await searchParams
  const redirectTo = params.redirect ?? '/hesabim'

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-4">
            {/* Eskiden "BG" harfleri yazıyordu; dört auth sayfasında da
                kopyalanmıştı. Artık markanın tam kilidi (dağ + yazı), tek
                bileşenden. Yazı logonun içinde olduğu için ayrıca metin yok. */}
            <GrupLogo />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Hesabınıza Giriş Yapın</h1>
          <p className="text-gray-500 text-sm mt-1">Sipariş geçmişinize ve profilinize erişin</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 sm:p-8">
          {/* Hata mesajı */}
          {params.error && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              {params.error === 'google'
                ? 'Google ile giriş sırasında bir hata oluştu. Lütfen tekrar deneyin.'
                : params.error === 'callback'
                ? 'Giriş işlemi tamamlanamadı. Lütfen tekrar deneyin.'
                : params.error}
            </div>
          )}

          {/* Başarı mesajı */}
          {params.mesaj === 'email-dogrulama' && (
            <div className="mb-5 p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm">
              Kayıt başarılı! E-posta adresinize bir doğrulama bağlantısı gönderdik.
            </div>
          )}

          {/*
            Google ile giriş.

            Onay ekranında artık "Bayırlıoğlu" adı, logosu ve kendi alan adımız
            görünüyor; `supabase.co` adresi hiç kullanılmıyor. Gerekçe ve akışın
            ayrıntısı components/auth/GoogleGiris.tsx içinde.
          */}
          <GoogleGiris
            hedef={redirectTo}
            yedekEtiket="Google ile Giriş Yap"
            yedekAksiyon={async () => {
              'use server'
              const { signInWithGoogle: googleSignIn } = await import('@/app/actions/auth')
              await googleSignIn(redirectTo)
            }}
          />

          <div className="flex items-center gap-3 my-5">
            <hr className="flex-1 border-gray-200" />
            <span className="text-gray-400 text-xs font-medium">veya e-posta ile</span>
            <hr className="flex-1 border-gray-200" />
          </div>

          {/* E-posta / Şifre formu */}
          <form action={signIn} className="space-y-4">
            <input type="hidden" name="redirect" value={redirectTo} />

            <div>
              <label htmlFor="giris-email" className="block text-sm font-medium text-gray-700 mb-1.5">E-posta</label>
              <input
                type="email"
                name="email"
                id="giris-email"
                required
                placeholder="ornek@email.com"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="giris-password" className="block text-sm font-medium text-gray-700 mb-1.5">Şifre</label>
              <input
                type="password"
                name="password"
                id="giris-password"
                required
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>

            <div className="flex justify-end -mt-1">
              <Link
                href="/sifremi-unuttum"
                className="text-sm text-gray-500 hover:text-gray-900 hover:underline"
              >
                Şifremi unuttum
              </Link>
            </div>

            <button
              type="submit"
              className="btn-press w-full py-3 rounded-xl bg-gray-900 text-white font-semibold text-sm hover:bg-gray-700"
            >
              Giriş Yap
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            Hesabınız yok mu?{' '}
            <Link href="/kayit" className="text-gray-900 font-semibold hover:underline">
              Kayıt Olun
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
