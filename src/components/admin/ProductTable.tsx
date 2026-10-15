import Link from 'next/link'
import { toggleProductActive, toggleProductFeatured } from '@/app/actions/admin'
import DeleteButton from './DeleteButton'
import Icon from '@/components/ui/Icon'
import type { getProductsForAdmin } from '@/app/actions/admin'

type Product = Awaited<ReturnType<typeof getProductsForAdmin>>[number]

interface ProductTableProps {
  products: Product[]
  /** Düzenle bağlantısının hangi marka panelinde kalacağı */
  kapsam: string
}

export default function ProductTable({ products, kapsam }: ProductTableProps) {
  if (products.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-12 text-center text-sm text-gray-400">
        Henüz ürün eklenmemiş.
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Görsel
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Ürün
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Kategori
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Fiyat
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Stok
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Aktif
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Öne Çıkan
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                İşlemler
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map((product) => {
              const primaryImage = product.images[0]
              const price = Number(product.price)
              const duzenleYolu = `/admin/${kapsam}/urunler/${product.id}/duzenle`
              return (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  {/* Görsel — düzenlemeye götürür.
                      Eskiden yalnızca satırın en sağındaki "Düzenle" düğmesi
                      tıklanabilirdi; ürünü düzenlemek için gözle bulduğunuz
                      satırda imleci ta sağa taşımak gerekiyordu. Görsel ve ad
                      da aynı yere götürüyor artık. */}
                  <td className="px-4 py-3">
                    <Link
                      href={duzenleYolu}
                      className="block w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0 ring-offset-2 hover:ring-2 hover:ring-blue-400 transition"
                      title={`${product.name} — düzenle`}
                    >
                      {primaryImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={primaryImage.url}
                          alt={product.name}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <Icon name="paket" className="w-6 h-6 text-gray-300" />
                      )}
                    </Link>
                  </td>

                  {/* Ürün adı + slug — düzenlemeye götürür */}
                  <td className="px-4 py-3">
                    <Link href={duzenleYolu} className="group block">
                      <p className="text-sm font-medium text-gray-900 line-clamp-1 group-hover:text-blue-600 group-hover:underline underline-offset-2 transition-colors">
                        {product.name}
                      </p>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">{product.slug}</p>
                    </Link>
                  </td>

                  {/* Kategori */}
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-600 line-clamp-1">{product.category.name}</span>
                  </td>

                  {/* Fiyat */}
                  <td className="px-4 py-3 text-sm text-gray-800 whitespace-nowrap">
                    {price.toLocaleString('tr-TR')} ₺
                  </td>

                  {/* Stok */}
                  <td className="px-4 py-3">
                    <span className={`text-sm font-medium ${product.stockQuantity === 0 ? 'text-red-500' : 'text-gray-800'}`}>
                      {product.stockQuantity} {product.unit}
                    </span>
                  </td>

                  {/* Aktif toggle */}
                  <td className="px-4 py-3">
                    <form action={toggleProductActive.bind(null, product.id, product.isActive)}>
                      <button
                        type="submit"
                        className={`w-10 h-5 rounded-full transition-colors duration-200 relative ${
                          product.isActive ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                        title={product.isActive ? 'Pasif yap' : 'Aktif yap'}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                            product.isActive ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </form>
                  </td>

                  {/* Öne çıkan toggle */}
                  <td className="px-4 py-3">
                    <form action={toggleProductFeatured.bind(null, product.id, product.isFeatured)}>
                      <button
                        type="submit"
                        className={`w-10 h-5 rounded-full transition-colors duration-200 relative ${
                          product.isFeatured ? 'bg-yellow-400' : 'bg-gray-300'
                        }`}
                        title={product.isFeatured ? 'Öne çıkarmayı kaldır' : 'Öne çıkar'}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                            product.isFeatured ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </form>
                  </td>

                  {/* İşlemler */}
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={duzenleYolu}
                        className="px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        Düzenle
                      </Link>
                      <DeleteButton id={product.id} name={product.name} />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="sm:hidden px-4 py-2.5 text-[11px] text-gray-400 border-t border-gray-100">
        Tüm sütunları görmek için tabloyu yana kaydırın →
      </p>
    </div>
  )
}
