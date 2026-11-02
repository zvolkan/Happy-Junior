import { kuponlariGetir } from '@/app/actions/admin-kupon'
import KuponYonetimi from '@/components/admin/KuponYonetimi'

export const dynamic = 'force-dynamic'

export default async function KuponlarPage() {
  const kuponlar = await kuponlariGetir()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">İndirim Kuponları</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Müşteri kodu ödeme sayfasındaki &quot;İndirim kuponu&quot; alanına yazar; indirim ürün tutarına uygulanır, kargoya
          uygulanmaz.
        </p>
      </div>
      <KuponYonetimi kuponlar={kuponlar} />
    </div>
  )
}
