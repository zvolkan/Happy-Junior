import { useCartStore } from '@/store/cartStore'

export function useCart() {
  const store = useCartStore()
  return {
    ...store,
    isInCart: (productId: string) => store.items.some((i) => i.product.id === productId),
    getItemQuantity: (productId: string) =>
      store.items.find((i) => i.product.id === productId)?.quantity ?? 0,
    isEmpty: store.items.length === 0,
    getTotalItems: () => store.items.reduce((sum, item) => sum + item.quantity, 0),
    getTotalPrice: () => store.totalAmount(),
  }
}
