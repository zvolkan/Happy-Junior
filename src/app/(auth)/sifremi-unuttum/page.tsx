import type { Metadata } from 'next'
import Link from 'next/link'
import GrupLogo from '@/components/ui/GrupLogo'
import { requestPasswordReset } from '@/app/actions/auth'
import Icon from '@/components/ui/Icon'

export const metadata: Metadata = {
  title: 'Şifremi Unuttum',
  description: 'Hesabınızın şifresini sıfırlamak için e-posta adresinizi girin.',
  robots: { index: false, follow: false },
}

export default async function SifremiUnuttumPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; gonderildi?: string }>
}) {
  const params = await searchParams

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
          <h1 className="text-2xl font-bold text-gray-900">Şifrenizi mi Unuttunuz?</h1>
          <p className="text-gray-500 text-sm mt-1">
            E-posta adresinizi girin, sıfırlama bağlantısı gönderelim.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 sm:p-8">
          {params.gonderildi ? (
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center text-3xl mx-auto mb-4">
                <Icon name="eposta" className="w-7 h-7 text-green-600" />
              </div>
              <p className="text-gray-800 font-semibold mb-2">Bağlantı gönderildi</p>
              <p className="text-gray-500 text-sm leading-relaxed">
                Girdiğiniz adrese kayıtlı bir hesap varsa, şifre sıfırlama bağlantısını
                e-posta ile gönderdik. Gelen kutunuzu ve spam klasörünüzü kontrol edin.
              </p>
              <Link
                href="/giris"
                className="btn-press inline-block mt-6 bg-gray-900 hover:bg-gray-800 text-white px-5 py-2.5 rounded-xl font-semibold text-sm"
              >
                Giriş sayfasına dön
              </Link>
            </div>
          ) : (
            <>
              {params.error && (
                <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                  {params.error}
                </div>
              )}

              <form action={requestPasswordReset} className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-1.5"
                  >
                    E-posta adresiniz
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="ornek@email.com"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>

                <button
                  type="submit"
                  className="btn-press w-full bg-gray-900 hover:bg-gray-800 text-white py-3 rounded-xl font-semibold text-sm"
                >
                  Sıfırlama Bağlantısı Gönder
                </button>
              </form>

              <p className="text-center text-sm text-gray-500 mt-6">
                Şifrenizi hatırladınız mı?{' '}
                <Link href="/giris" className="text-gray-900 font-semibold hover:underline">
                  Giriş yapın
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
