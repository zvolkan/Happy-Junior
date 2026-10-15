import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import {
  getBrandsForAdmin,
  getCategoriesForAdmin,
  getProductForEdit,
  updateProduct,
} from '@/app/actions/admin'
import { getProductImages } from '@/app/actions/product-images'
import ProductForm from '@/components/admin/ProductForm'
import ImageManager from '@/components/admin/ImageManager'
import { gecerliKapsam, markaMi } from '@/lib/admin-kapsam'

export default async function KapsamUrunDuzenlePage({
  params,
}: {
  params: Promise<{ kapsam: string; id: string }>
}) {
  const { kapsam: ham, id } = await params
  const kapsam = gecerliKapsam(ham)
  if (!kapsam || !markaMi(kapsam)) notFound()

  const [rawBrands, rawCategories, product] = await Promise.all([
    getBrandsForAdmin(),
    getCategoriesForAdmin(),
    getProductForEdit(id),
  ])

  if (!product) notFound()

  // Adres çubuğundaki marka ürünün markasıyla uyuşmuyorsa doğru panele gönder.
  if (product.brand.key !== kapsam) {
    redirect(`/admin/${product.brand.key}/urunler/${product.id}/duzenle`)
  }

  const images = await getProductImages(product.id)

  const brands = rawBrands.map((b) => ({ id: b.id, key: b.key, name: b.name }))
  const categories = rawCategories.map((c) => ({
    id: c.id,
    name: c.name,
    parentId: c.parentId,
    brand: { id: c.brand.id, key: c.brand.key, name: c.brand.name },
  }))

  async function handleUpdate(formData: FormData) {
    'use server'
    // Sonucu DÖNDÜRMEK şart: aksiyon doğrulama hatasını sonuç nesnesiyle
    // bildiriyor, sarmalayıcı yutarsa form hatayı hiç göremez.
    return updateProduct(id, formData)
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
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Ürünü Düzenle</h1>
        <p className="text-sm text-gray-500 mt-0.5 font-mono">{product.slug}</p>
      </div>

      {/* Görseller formdan bağımsız yönetiliyor — anında kaydedilir */}
      <ImageManager
        productId={product.id}
        productName={product.name}
        initialImages={images}
      />

      <ProductForm
        brands={brands}
        categories={categories}
        action={handleUpdate}
        submitLabel="Değişiklikleri Kaydet"
        hideImageSection
        defaultValues={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description ?? '',
          shortDescription: product.shortDescription ?? '',
          price: Number(product.price),
          salePrice: product.salePrice ? Number(product.salePrice) : null,
          stock: product.stockQuantity,
          unit: product.unit,
          sku: product.sku ?? '',
          brandId: product.brandId,
          categoryId: product.categoryId,
          productBrand: product.productBrand ?? undefined,
          vatRate: product.vatRate ?? 20,
          isActive: product.isActive,
          isFeatured: product.isFeatured,
          specs: product.specs.map((s) => ({
            name: s.specName,
            value: s.specValue,
            unit: s.specUnit ?? '',
          })),
          images: product.images.map((img) => ({
            id: img.id,
            url: img.url,
            isPrimary: img.isPrimary,
          })),
        }}
      />
    </div>
  )
}
