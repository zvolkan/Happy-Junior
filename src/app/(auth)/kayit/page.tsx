import type { Metadata } from 'next'
import Link from 'next/link'
import MagazaLogo from '@/components/ui/MagazaLogo'
import GoogleGiris from '@/components/auth/GoogleGiris'
import { signUp, signInWithGoogle } from '@/app/actions/auth'

export const metadata: Metadata = {
  // Giriş/kayıt sayfalarının arama sonuçlarında hiçbir işi yok ve
  // robots.txt tek başına yetmiyor: o yalnızca TARAMAYI engelliyor,
  // dışarıdan bağlantı verilen bir sayfa yine dizine girebiliyor.
  robots: { index: false, follow: false },
  title: 'Kayıt Ol',
}

export default async function KayitPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-4">
            <MagazaLogo />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Hesap Oluşturun</h1>
          <p className="text-gray-500 text-sm mt-1">Sipariş takibi ve hızlı alışveriş için kayıt olun</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 sm:p-8">
          {params.error && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              {params.error}
            </div>
          )}

          {/*
            Google ile kayıt — giriş sayfasıyla aynı akış.
            Onay ekranında mağaza adı, logosu ve kendi alan adımız
            görünüyor. Ayrıntı: components/auth/GoogleGiris.tsx
          */}
          <GoogleGiris
            hedef="/hesabim"
            yedekEtiket="Google ile Kayıt Ol"
            yedekAksiyon={async () => {
              'use server'
              const { signInWithGoogle: googleSignIn } = await import('@/app/actions/auth')
              await googleSignIn('/hesabim')
            }}
          />

          <div className="flex items-center gap-3 my-5">
            <hr className="flex-1 border-gray-200" />
            <span className="text-gray-400 text-xs font-medium">veya e-posta ile</span>
            <hr className="flex-1 border-gray-200" />
          </div>

          <form action={signUp} className="space-y-4">
            <div>
              <label htmlFor="kayit-name" className="block text-sm font-medium text-gray-700 mb-1.5">Ad Soyad</label>
              <input
                type="text"
                name="name"
                id="kayit-name"
                required
                placeholder="Ahmet Yılmaz"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="kayit-email" className="block text-sm font-medium text-gray-700 mb-1.5">E-posta</label>
              <input
                type="email"
                name="email"
                id="kayit-email"
                required
                placeholder="ornek@email.com"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>

            {/* Şifre kuralı sunucu tarafıyla aynı olmalı (actions/auth.ts:41):
                en az 8 karakter, bir harf ve bir rakam. Burada minLength={6} ve
                "En az 6 karakter" yazıyordu; kullanıcı 6 haneli şifre girip
                formu gönderiyor, sunucudan hata alıp geri dönüyordu. */}
            <div>
              <label htmlFor="kayit-password" className="block text-sm font-medium text-gray-700 mb-1.5">Şifre</label>
              <input
                type="password"
                name="password"
                id="kayit-password"
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
              <p className="text-xs text-gray-400 mt-1.5">
                En az 8 karakter, bir harf ve bir rakam içermeli.
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gray-900 text-white font-semibold text-sm hover:bg-gray-700 transition-colors"
            >
              Kayıt Ol
            </button>

            <p className="text-xs text-gray-400 text-center">
              Kayıt olarak{' '}
              <Link href="/kullanim-kosullari" className="underline">Kullanım Koşulları</Link>'nı ve{' '}
              <Link href="/gizlilik" className="underline">Gizlilik ve Güvenlik</Link> metnini kabul etmiş olursunuz.
            </p>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            Zaten hesabınız var mı?{' '}
            <Link href="/giris" className="text-gray-900 font-semibold hover:underline">
              Giriş Yapın
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
