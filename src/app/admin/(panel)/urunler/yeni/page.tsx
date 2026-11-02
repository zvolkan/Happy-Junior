import Link from 'next/link'
import { getCategoriesForAdmin, createProduct } from '@/app/actions/admin'
import ProductForm from '@/components/admin/ProductForm'

export const dynamic = 'force-dynamic'

export default async function YeniUrunPage() {
  const kategoriler = (await getCategoriesForAdmin()).map((c) => ({
    id: c.id,
    name: c.name,
    parentId: c.parentId,
  }))

  async function handleCreate(formData: FormData) {
    'use server'
    // Sonucu DÖNDÜRMEK şart: doğrulama hatası sonuç nesnesiyle geliyor.
    return createProduct(formData)
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/urunler" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
          ← Ürünlere Dön
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Yeni Ürün</h1>
      </div>

      <ProductForm categories={kategoriler} action={handleCreate} submitLabel="Ürünü Kaydet" />
    </div>
  )
}
