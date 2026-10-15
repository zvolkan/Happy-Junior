import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Product, CartItem } from '@/lib/types'
import { etkinBirimFiyat } from '@/lib/checkout'

/**
 * Bir ürünün sepete eklenebilecek azami adedi.
 * Stok bilgisi yoksa (undefined/null) sınır uygulanmaz; 0 ise ürün eklenemez.
 */
function stockCap(product: Product): number {
  if (typeof product.stock !== 'number' || Number.isNaN(product.stock)) return Infinity
  return Math.max(0, product.stock)
}

interface CartState {
  items: CartItem[]
  /** localStorage'dan okuma tamamlandı mı — SSR uyumsuzluğunu önlemek için */
  hasHydrated: boolean
  setHydrated: () => void
  /** Sunucudan gelen güncel fiyat/stok ile sepeti tazeler */
  syncWithServer: (
    fresh: Array<{ id: string; price: number; salePrice?: number; stock: number; isActive: boolean }>,
  ) => { removed: string[]; priceChanged: string[] }
  addItem: (product: Product, quantity?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  totalAmount: () => number
  itemCount: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      hasHydrated: false,

      setHydrated: () => set({ hasHydrated: true }),

      /**
       * Sepetteki ürünlerin fiyat ve stok bilgisini sunucudakiyle günceller.
       *
       * Sepet localStorage'da kalıcı olduğu için fiyat değişse bile eski fiyat
       * gösteriliyordu; kullanıcı 100 TL görüp ödeme ekranında 150 TL ile
       * karşılaşıyordu. Artık sepet açılışında tazeleniyor.
       */
      syncWithServer: (fresh) => {
        const byId = new Map(fresh.map((f) => [f.id, f]))
        const removed: string[] = []
        const priceChanged: string[] = []

        set((state) => ({
          items: state.items.flatMap((item) => {
            const server = byId.get(item.product.id)

            // Sunucuda yok veya satıştan kaldırılmış → sepetten çıkar
            if (!server || !server.isActive || server.stock === 0) {
              removed.push(item.product.name)
              return []
            }

            // Ortak kural (bkz. lib/checkout.ts): sıfır indirimli fiyat
            // geçerli sayılmıyor. Burada `??` kullanılıyordu ve aynı ürün için
            // sepet deposunun iki ayrı yeri farklı fiyat hesaplıyordu.
            const oldPrice = etkinBirimFiyat(item.product.price, item.product.salePrice)
            const newPrice = etkinBirimFiyat(server.price, server.salePrice)
            if (Math.abs(oldPrice - newPrice) > 0.001) priceChanged.push(item.product.name)

            return [
              {
                ...item,
                quantity: Math.min(item.quantity, server.stock),
                product: {
                  ...item.product,
                  price: server.price,
                  salePrice: server.salePrice,
                  stock: server.stock,
                },
              },
            ]
          }),
        }))

        return { removed, priceChanged }
      },

      addItem: (product: Product, quantity: number = 1) => {
        set((state) => {
          // Stok tavanı: sepete stoktan fazlası eklenemesin.
          // DİKKAT: stok 0 ise limit de 0'dır. Daha önce `stock > 0 ? stock : Infinity`
          // yazıldığı için tükenmiş ürün SINIRSIZ eklenebiliyordu.
          const stockLimit = stockCap(product)

          if (stockLimit === 0) return state // tükenmiş ürün sepete girmez

          const existing = state.items.find((i) => i.product.id === product.id)

          if (existing) {
            const nextQuantity = Math.min(existing.quantity + quantity, stockLimit)
            return {
              items: state.items.map((i) =>
                i.product.id === product.id
                  ? { ...i, product, quantity: nextQuantity }
                  : i
              ),
            }
          }

          return {
            items: [...state.items, { product, quantity: Math.min(quantity, stockLimit) }],
          }
        })
      },

      removeItem: (productId: string) => {
        set((state) => ({
          items: state.items.filter((i) => i.product.id !== productId),
        }))
      },

      updateQuantity: (productId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(productId)
          return
        }
        set((state) => ({
          items: state.items.map((i) => {
            if (i.product.id !== productId) return i
            const stockLimit = stockCap(i.product)
            return { ...i, quantity: Math.max(1, Math.min(quantity, stockLimit || 1)) }
          }),
        }))
      },

      clearCart: () => {
        set({ items: [] })
      },

      totalAmount: () => {
        // İndirimli fiyat varsa o kullanılır. Eskiden burası her zaman `price`
        // okuduğu için sepet satırları indirimli fiyatı gösterirken ara toplam
        // indirimsiz hesaplanıyor ve iki rakam tutmuyordu.
        return get().items.reduce((sum, item) => {
          const unitPrice =
            etkinBirimFiyat(item.product.price, item.product.salePrice)
          return sum + unitPrice * item.quantity
        }, 0)
      },

      itemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0)
      },
    }),
    {
      name: 'bayirlioglu-cart',
      // Yalnızca sepet içeriği saklanır; fonksiyonlar ve hydration bayrağı değil
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => (state) => state?.setHydrated(),
      // createJSONStorage, localStorage'a yalnızca tarayıcı ortamında erişir;
      // SSR sırasında window.localStorage undefined hatası vermez.
      storage: createJSONStorage(() => localStorage),
    }
  )
)
