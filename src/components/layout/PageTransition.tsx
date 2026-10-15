'use client'

import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

/**
 * Sayfa değişince içeriği yumuşakça getirir.
 *
 * layout.tsx içinde <main> sarmalayıcısı olarak kullanılır:
 *
 *   <main>
 *     <PageTransition>{children}</PageTransition>
 *   </main>
 *
 * `key={pathname}` sayesinde rota değiştiğinde alt ağaç yeniden bağlanır ve
 * CSS animasyonu baştan oynar. Aynı sayfada filtre/query değişiminde (ör.
 * /urunler?type=...) pathname sabit kaldığı için animasyon tekrar etmez —
 * liste filtrelerken ekranın yanıp sönmesi engellenmiş olur.
 */
export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  return (
    <div key={pathname} className="page-transition">
      {children}
    </div>
  )
}
