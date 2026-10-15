import type { Metadata } from 'next'

// Sayfa bir istemci bileşeni olduğu için `metadata` dışa aktaramıyor; sekme
// başlığı bu yüzden yalnızca "Bayırlıoğlu" görünüyordu.
export const metadata: Metadata = { title: 'Adres Ekle' }

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
