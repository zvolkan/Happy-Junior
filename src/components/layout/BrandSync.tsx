'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { brandFromPath } from '@/lib/brand-path'

/**
 * Marka renklerini gezinme sırasında güncel tutar.
 *
 * SORUN: `data-brand` yalnızca kök düzende (`app/layout.tsx`) sunucu tarafında
 * yazılıyordu. Next.js kök düzeni rotalar arası PAYLAŞIYOR ve istemci tarafı
 * gezinmede yeniden render ETMİYOR. Yani kullanıcı grup ana sayfasından
 * ("grup" = nötr gri) ALB Tarım'a geçtiğinde `data-brand` "grup" olarak
 * kalıyor ve bütün site gri görünüyordu. Yalnızca sayfayı yenilemek düzeltiyordu
 * — bu yüzden hata yerel geliştirmede kolayca gözden kaçıyor.
 *
 * Sunucudaki ilk değer korunuyor (ilk boyamada renk sıçraması olmasın diye),
 * bu bileşen yalnızca sonraki gezinmelerde niteliği tazeliyor.
 */
export default function BrandSync() {
  const pathname = usePathname()

  useEffect(() => {
    const next = brandFromPath(pathname)
    if (document.documentElement.dataset.brand !== next) {
      document.documentElement.dataset.brand = next
    }
  }, [pathname])

  return null
}
