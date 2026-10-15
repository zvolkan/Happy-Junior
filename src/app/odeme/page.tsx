import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
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

  return <CheckoutClient addresses={addresses} />
}
