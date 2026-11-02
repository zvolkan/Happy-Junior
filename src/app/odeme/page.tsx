import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { hosgeldinKuponu, KUPON_SAYILAN_SIPARIS } from '@/lib/kupon'
import CheckoutClient from './_components/CheckoutClient'

export default async function OdemePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const raw = await prisma.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  })

  const addresses = raw.map((a) => ({
    id: a.id,
    label: a.label,
    fullName: a.fullName,
    phone: a.phone,
    line1: a.line1,
    line2: a.line2 ?? null,
    district: a.district,
    city: a.city,
    postalCode: a.postalCode ?? null,
    isDefault: a.isDefault,
  }))

  // Hiç siparişi olmayan üyeye hoş geldin kuponunu hatırlat
  const [hosgeldin, siparisSayisi] = await Promise.all([
    hosgeldinKuponu(),
    prisma.order.count({ where: { userId: user.id, ...KUPON_SAYILAN_SIPARIS } }),
  ])

  return <CheckoutClient addresses={addresses} hosgeldinKuponu={siparisSayisi === 0 ? hosgeldin : null} />
}
