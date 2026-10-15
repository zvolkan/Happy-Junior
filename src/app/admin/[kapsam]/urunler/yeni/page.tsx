import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getBrandsForAdmin, getCategoriesForAdmin, createProduct } from '@/app/actions/admin'
import ProductForm from '@/components/admin/ProductForm'
import { gecerliKapsam, kapsamAdi, markaMi } from '@/lib/admin-kapsam'

export const dynamic = 'force-dynamic'

export default async function KapsamYeniUrunPage({
  params,
}: {
  params: Promise<{ kapsam: string }>
}) {
  const { kapsam: ham } = await params
  const kapsam = gecerliKapsam(ham)
  if (!kapsam || !markaMi(kapsam)) notFound()

  const [rawBrands, rawCategories] = await Promise.all([
    getBrandsForAdmin(),
    getCategoriesForAdmin(),
  ])

  const brands = rawBrands.map((b) => ({ id: b.id, key: b.key, name: b.name }))
  const categories = rawCategories.map((c) => ({
    id: c.id,
    name: c.name,
    parentId: c.parentId,
    brand: { id: c.brand.id, key: c.brand.key, name: c.brand.name },
  }))

  const seciliMarka = rawBrands.find((b) => b.key === kapsam)

  async function handleCreate(formData: FormData) {
    'use server'
    // Sonucu DÖNDÜRMEK şart: aksiyon doğrulama hatasını sonuç nesnesiyle
    // bildiriyor, sarmalayıcı yutarsa form hatayı hiç göremez.
    return createProduct(formData)
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/admin/${kapsam}/urunler`}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          ← Ürünlere Dön
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Yeni Ürün</h1>
        <p className="text-sm text-gray-500 mt-0.5">{kapsamAdi(kapsam)}</p>
      </div>

      <ProductForm
        brands={brands}
        categories={categories}
        action={handleCreate}
        submitLabel="Ürünü Kaydet"
        defaultValues={{ brandId: seciliMarka?.id }}
      />
    </div>
  )
}
