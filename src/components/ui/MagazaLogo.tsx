import BrandLogo from '@/components/ui/BrandLogo'
import { BRAND } from '@/lib/constants'

/**
 * Logo + mağaza adı kilidi (giriş/kayıt gibi sade sayfalarda).
 * Logo dosyası `constants.ts` içinde tanımlanınca kendiliğinden görünür.
 */
export default function MagazaLogo({ koyuZemin = false, className = '' }: { koyuZemin?: boolean; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <BrandLogo boyut="lg" kutuSinifi="bg-brand-600 rounded-2xl" />
      <span className={`text-2xl font-extrabold tracking-tight ${koyuZemin ? 'text-white' : 'text-brand-800'}`}>
        {BRAND.name}
      </span>
    </span>
  )
}
