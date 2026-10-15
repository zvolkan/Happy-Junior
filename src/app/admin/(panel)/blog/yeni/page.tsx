import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getBrandsForAdmin } from '@/app/actions/admin'
import BlogForm from '@/components/admin/BlogForm'
import { KAPSAM, kapsamAdi, markaMi } from '@/lib/admin-kapsam'

export const dynamic = 'force-dynamic'

export default async function KapsamYeniBlogPage() {
  const kapsam = KAPSAM

  const rawBrands = await getBrandsForAdmin()
  const brands = rawBrands.map((b: { id: number; key: string; name: string }) => ({
    id: b.id,
    key: b.key,
    name: b.name,
  }))

  // Marka seçili panelde çalışıldığı için form o markayla açılıyor; yönetici
  // isterse formdan değiştirebilir.
  const varsayilanMarka = brands.find((b) => b.key === kapsam)

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/admin/blog`}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Blog Yazıları
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Yeni Yazı</h1>
        <p className="text-sm text-gray-500 mt-0.5">{kapsamAdi(kapsam)}</p>
      </div>
      <BlogForm
        brands={brands}
        kapsam={kapsam}
        defaultValues={{ brandId: varsayilanMarka?.id }}
      />
    </div>
  )
}
