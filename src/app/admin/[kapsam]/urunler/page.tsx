import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getProductsForAdmin } from '@/app/actions/admin'
import ProductTable from '@/components/admin/ProductTable'
import { gecerliKapsam, kapsamAdi, kapsamRengi, markaMi } from '@/lib/admin-kapsam'

export const dynamic = 'force-dynamic'

export default async function KapsamUrunlerPage({
  params,
}: {
  params: Promise<{ kapsam: string }>
}) {
  const { kapsam: ham } = await params
  const kapsam = gecerliKapsam(ham)
  // Ürün her zaman bir markaya ait.
  if (!kapsam || !markaMi(kapsam)) notFound()

  const products = await getProductsForAdmin(kapsam)
  const renk = kapsamRengi(kapsam)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ürünler</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {kapsamAdi(kapsam)} · {products.length} ürün
          </p>
        </div>
        <Link
          href={`/admin/${kapsam}/urunler/yeni`}
          className={`btn-press px-4 py-2 ${renk.dolgu} ${renk.dolguHover} text-white text-sm font-semibold rounded-xl transition-colors`}
        >
          + Yeni Ürün
        </Link>
      </div>

      <ProductTable products={products} kapsam={kapsam} />
    </div>
  )
}
