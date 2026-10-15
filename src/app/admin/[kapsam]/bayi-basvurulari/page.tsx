import { notFound } from 'next/navigation'
import { getDealerApplications } from '@/app/actions/admin-orders'
import ApplicationRow from '@/components/admin/ApplicationRow'
import Icon from '@/components/ui/Icon'
import { gecerliKapsam, kapsamAdi } from '@/lib/admin-kapsam'

export const dynamic = 'force-dynamic'

export default async function KapsamBayiBasvurulariPage({
  params,
}: {
  params: Promise<{ kapsam: string }>
}) {
  const { kapsam: ham } = await params
  const kapsam = gecerliKapsam(ham)
  if (!kapsam) notFound()

  const applications = await getDealerApplications(kapsam)
  const newCount = applications.filter((a: { status: string }) => a.status === 'new').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bayi Başvuruları</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {kapsamAdi(kapsam)} · {applications.length} başvuru · {newCount} yeni
        </p>
        <p className="text-sm text-gray-500 mt-2 max-w-2xl leading-relaxed">
          {kapsam === 'belirtilmemis'
            ? 'Marka seçilmeden yapılmış başvurular.'
            : '"Her İkisi" seçilerek yapılan başvurular her iki markanın listesinde de görünür.'}
        </p>
      </div>

      {applications.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-16 text-center">
          <Icon name="garanti" className="w-9 h-9 mb-3 mx-auto text-gray-300" />
          <p className="text-gray-500">Bu kapsamda bayi başvurusu yok.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map((application) => (
            <ApplicationRow
              key={application.id}
              application={{
                id: application.id,
                companyName: application.companyName,
                firstName: application.firstName,
                lastName: application.lastName,
                email: application.email,
                phone: application.phone,
                city: application.city,
                district: application.district,
                brandInterest: application.brandInterest,
                businessType: application.businessType,
                annualRevenue: application.annualRevenue,
                message: application.message,
                status: application.status,
                createdAt: new Intl.DateTimeFormat('tr-TR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                }).format(new Date(application.createdAt)),
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
