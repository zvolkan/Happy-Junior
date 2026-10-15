import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { ACTIVE_BRAND_KEY } from '@/lib/constants'
import { cn } from '@/lib/utils'
import Icon from '@/components/ui/Icon'
import AccountSidebar from '../_components/AccountSidebar'
import AddressCardActions from './_components/AddressCardActions'

export const metadata: Metadata = {
  title: 'Adreslerim',
  robots: { index: false, follow: false },
}

const primaryBg = 'bg-brand-600'
const primaryHoverBg =
  'hover:bg-brand-500'
const primaryLight =
  'bg-brand-50 text-brand-700'
const primaryBorder =
  'border-brand-200'

/**
 * Adreslerim.
 *
 * Eskiden bu sayfa sabit `INITIAL_ADDRESSES` dizisiyle "Ahmet Yılmaz"ın
 * uydurma adreslerini gösteriyordu; kullanıcının /hesabim/adres-ekle ile
 * kaydettiği gerçek adresler burada hiç görünmüyor, yapılan düzenlemeler de
 * kaydedilmiyordu. Artık doğrudan veritabanından okunuyor.
 */
export default async function AdreslerimPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/giris?redirect=/hesabim/adreslerim')

  const [dbUser, addresses] = await Promise.all([
    prisma.user.findUnique({ where: { id: user.id }, select: { name: true } }),
    prisma.address.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    }),
  ])

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-main">
        <nav className="text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-gray-900">
            Ana Sayfa
          </Link>
          <span className="mx-2">/</span>
          <Link href="/hesabim" className="hover:text-gray-900">
            Hesabım
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900 font-medium">Adreslerim</span>
        </nav>

        <div className="flex flex-col md:flex-row gap-6">
          <AccountSidebar
            active="/hesabim/adreslerim"
            name={dbUser?.name ?? null}
            email={user.email ?? ''}
          />

          <div className="flex-1">
            <div className="flex items-center justify-between mb-5">
              <h1 className="text-2xl font-bold text-gray-900">Adreslerim</h1>
              <Link
                href="/hesabim/adres-ekle"
                className={cn(
                  'btn-press text-white text-sm font-semibold px-4 py-2.5 rounded-xl',
                  primaryBg,
                  primaryHoverBg,
                )}
              >
                + Yeni Adres
              </Link>
            </div>

            {addresses.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                <Icon name="konum" className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Kayıtlı adresiniz yok
                </h3>
                <p className="text-gray-500 mb-6">
                  Sipariş verirken hızlıca seçebilmek için teslimat adresi ekleyin.
                </p>
                <Link
                  href="/hesabim/adres-ekle"
                  className={cn(
                    'btn-press inline-flex px-6 py-3 rounded-xl text-white font-semibold',
                    primaryBg,
                    primaryHoverBg,
                  )}
                >
                  İlk Adresimi Ekle
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {addresses.map((address) => (
                  <div
                    key={address.id}
                    className={cn(
                      'bg-white rounded-2xl border shadow-sm p-5 flex flex-col',
                      address.isDefault ? primaryBorder : 'border-gray-100',
                    )}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900">{address.label}</span>
                        {address.isDefault && (
                          <span
                            className={cn(
                              'text-[11px] font-bold px-2 py-0.5 rounded-full',
                              primaryLight,
                            )}
                          >
                            Varsayılan
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-sm text-gray-600 space-y-1 flex-1">
                      <p className="font-medium text-gray-800">{address.fullName}</p>
                      <p>{address.phone}</p>
                      <p className="leading-relaxed">
                        {address.line1}
                        {address.line2 ? `, ${address.line2}` : ''}
                      </p>
                      <p>
                        {address.district} / {address.city}
                        {address.postalCode ? ` — ${address.postalCode}` : ''}
                      </p>
                    </div>

                    <AddressCardActions
                      addressId={address.id}
                      label={address.label}
                      isDefault={address.isDefault}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
