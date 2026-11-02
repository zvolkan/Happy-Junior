import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCategoriesForAdmin, getProductForEdit, updateProduct } from '@/app/actions/admin'
import { getProductImages } from '@/app/actions/product-images'
import ProductForm from '@/components/admin/ProductForm'
import ImageManager from '@/components/admin/ImageManager'

export const dynamic = 'force-dynamic'

export default async function UrunDuzenlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [rawCategories, product] = await Promise.all([getCategoriesForAdmin(), getProductForEdit(id)])
  if (!product) notFound()

  const images = await getProductImages(product.id)
  const kategoriler = rawCategories.map((c) => ({ id: c.id, name: c.name, parentId: c.parentId }))

  async function handleUpdate(formData: FormData) {
    'use server'
    // Sonucu DÖNDÜRMEK şart: doğrulama hatası sonuç nesnesiyle geliyor.
    return updateProduct(id, formData)
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/urunler" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
          ← Ürünlere Dön
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Ürünü Düzenle</h1>
        {product.sku && <p className="text-sm text-gray-500 mt-0.5">Ürün kodu: {product.sku}</p>}
      </div>

      {/* Görseller formdan bağımsız yönetiliyor — anında kaydedilir */}
      <ImageManager productId={product.id} productName={product.name} initialImages={images} />

      <ProductForm
        categories={kategoriler}
        action={handleUpdate}
        submitLabel="Değişiklikleri Kaydet"
        hideImageSection
        defaultValues={{
          id: product.id,
          name: product.name,
          description: product.description ?? '',
          shortDescription: product.shortDescription ?? '',
          price: Number(product.price),
          salePrice: product.salePrice ? Number(product.salePrice) : null,
          stock: product.stockQuantity,
          categoryId: product.categoryId,
          vatRate: product.vatRate ?? 10,
          isActive: product.isActive,
          isFeatured: product.isFeatured,
        }}
      />
    </div>
  )
}
