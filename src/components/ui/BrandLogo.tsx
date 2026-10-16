import Image from 'next/image'
import { BRANDS } from '@/lib/constants'
import Icon, { type IconName } from '@/components/ui/Icon'
import type { BrandKey } from '@/lib/types'

/**
 * Marka logosu — TEK KAYNAK.
 *
 * ── Neden var ───────────────────────────────────────────────────────────────
 *
 * Marka rozetleri site içinde on üç ayrı dosyada elle yazılıydı: header
 * sekmeleri (masaüstü + mobil), footer'daki "Markalarımız" listesi, ana sayfa
 * hero kartları, ana sayfa marka kartları, hakkımızda, hizmetler, hesabım,
 * siparişlerim ve yönetim panelinin iki ekranı. Kimi yerde markanın baş harfi
 * ("A" — iki marka da aynı harfle başlıyordu, yani hiçbir şey ayırt
 * etmiyordu), kimi yerde genel bir ikon (filiz / damla) gösteriliyordu.
 *
 * Artık hepsi buradan geçiyor ve görselin kaynağı `constants.ts` içindeki
 * marka tanımı. Logo değiştiğinde tek satır güncelleniyor.
 *
 * ── Oran koruması ───────────────────────────────────────────────────────────
 *
 * İki logonun oranı birbirinin tersi: Alb Su damlası DİKEY (694×969), ALB
 * Tarım bulut+yaprak YATAY (512×308). Bu yüzden "yüksekliği sabitle, genişliği
 * serbest bırak" yaklaşımı yetmiyor — yatay logo kutudan taşardı. Görsel,
 * kutunun içine iki eksende birden sığdırılıyor: `max-h-full max-w-full` +
 * `object-contain`. Böylece hangi oran gelirse gelsin logo ne eziliyor ne
 * taşıyor.
 */

type Boyut = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

/** Kutu ölçüleri — logo bu kutunun içine oranı korunarak yerleşir. */
const KUTU: Record<Boyut, string> = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-14 h-14',
  xl: 'w-20 h-20',
}

/** Kutunun piksel karşılığı — `Image`in çözünürlük ipucu buradan hesaplanıyor. */
const KUTU_PX: Record<Boyut, number> = { xs: 24, sm: 32, md: 40, lg: 56, xl: 80 }

/** Logo ile kutu kenarı arasındaki nefes payı. */
const IC_BOSLUK: Record<Boyut, string> = {
  xs: 'p-0',
  sm: 'p-0.5',
  md: 'p-0.5',
  lg: 'p-1',
  xl: 'p-1.5',
}

/** Yedek ikonun ölçüsü — logosu olmayan markada kullanılır. */
const IKON_OLCU: Record<Boyut, string> = {
  xs: 'w-4 h-4',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-8 h-8',
  xl: 'w-10 h-10',
}

/** Logosu olmayan markalar için eski genel ikonlar. */
const YEDEK_IKON: Record<BrandKey, IconName> = {
  'happy-junior': 'yildiz',
}

interface Props {
  brand?: BrandKey
  boyut?: Boyut
  /**
   * Logo YOKKEN ikonun arkasına çizilecek renkli kutunun sınıfları
   * (ör. `bg-green-600 rounded-xl`).
   *
   * Bilerek yalnızca yedek durumda uygulanıyor: gerçek logonun kendi rengi var
   * ve onu ayrıca renkli bir kareye oturtmak logoyu boğar.
   */
  kutuSinifi?: string
  className?: string
  /** Yedek ikonun rengi — logo yokken kullanılır. */
  ikonSinifi?: string
}

export default function BrandLogo({
  brand = 'happy-junior',
  boyut = 'md',
  kutuSinifi,
  className = '',
  ikonSinifi = 'text-white',
}: Props) {
  const cfg = BRANDS[brand]
  const ortak = `${KUTU[boyut]} flex items-center justify-center flex-shrink-0`

  // ── Logo varsa: renkli kutu YOK, logo kendi başına ────────────────────────
  if (cfg.logo && cfg.logoAspect) {
    const { width, height } = cfg.logoAspect
    // Retina için kutunun iki katı; uzun kenarı bu değere sabitliyoruz.
    const hedef = KUTU_PX[boyut] * 2
    const yatay = width >= height
    const w = yatay ? hedef : Math.round((hedef * width) / height)
    const h = yatay ? Math.round((hedef * height) / width) : hedef

    return (
      <span className={`${ortak} ${IC_BOSLUK[boyut]} ${className}`}>
        <Image
          src={cfg.logo}
          alt={cfg.name}
          width={w}
          height={h}
          className="max-h-full max-w-full w-auto h-auto object-contain"
        />
      </span>
    )
  }

  // ── Logo yoksa: eski renkli kutu + genel ikon ─────────────────────────────
  return (
    <span className={`${ortak} ${kutuSinifi ?? 'bg-brand-600 rounded-full'} ${className}`}>
      <Icon name={YEDEK_IKON[brand]} className={`${IKON_OLCU[boyut]} ${ikonSinifi}`} />
    </span>
  )
}
