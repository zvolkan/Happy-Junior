import Image from 'next/image'

/**
 * Bayırlıoğlu grup logosu — marka logosundan AYRI.
 *
 * `BrandLogo` iki iş kolunu (ALB Tarım / Alb Su) temsil ediyor; bu bileşen ise
 * çatı şirketi. Kimlik doğrulama sayfalarında (giriş, kayıt, şifremi unuttum,
 * şifre yenile) logo yerine koyu bir kareye yazılmış "BG" harfleri vardı — dört
 * dosyada birebir kopyalanmış hâlde. Müşterinin logoyu ilk gördüğü yerlerden
 * biri giriş ekranı olduğu için orada baş harf göstermek zayıf duruyordu.
 *
 * ── Neden tam kilit (dağ + yazı) ────────────────────────────────────────────
 *
 * Header, footer ve hero'da logonun yanında zaten "Bayırlıoğlu" yazısı var, o
 * yüzden oralarda yalnız dağ markası kullanılıyor. Burada ise logo tek başına
 * duruyor; markanın yazısını da içeren tam kilit doğru olan. Böylece ayrıca
 * metin basmaya gerek kalmıyor.
 *
 * Görselin oranı 2:1'e yakın yatay. Yükseklik sabitlenip genişlik serbest
 * bırakılıyor — sabit kare kutu logoyu ezerdi.
 */

interface Props {
  /** Koyu zeminde mi duruyor? Kimlik sayfaları açık zeminli, varsayılan hayır. */
  koyuZemin?: boolean
  className?: string
}

export default function GrupLogo({ koyuZemin = false, className = '' }: Props) {
  return (
    <Image
      src={koyuZemin ? '/images/bayirlioglu-logo-beyaz.svg' : '/images/bayirlioglu-logo.svg'}
      alt="Bayırlıoğlu"
      width={2080}
      height={1048}
      className={`h-12 w-auto object-contain ${className}`}
      priority
    />
  )
}
