'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/**
 * Google ile giriş — onay ekranında ALAN ADIMIZ görünen sürüm.
 *
 * ── Neden yeniden yazıldı ───────────────────────────────────────────────────
 *
 * Eski düğme `signInWithOAuth` kullanıyordu: tarayıcı Google'a gidiyor, oradan
 * `<proje-kimliği>.supabase.co/auth/v1/callback` adresine dönüyordu. Google,
 * kullanıcıyı nereye göndereceğini söylemek zorunda olduğu için onay ekranında
 * o adresi yazıyordu. Uygulama adını ve logoyu doğrulatmak bunu değiştirmiyor,
 * çünkü ekranda görünen ad değil ADRES.
 *
 * Bu sürümde tarayıcı supabase.co'ya hiç uğramıyor. Google'ın kendi giriş
 * bileşeni sitemizin üzerinde çalışıyor, kullanıcı onayı bizim alan adımızdan
 * açılan pencerede veriyor, Google bize bir kimlik jetonu (ID token) veriyor ve
 * o jeton `signInWithIdToken` ile Supabase'e uzatılıyor. Supabase belgeleri bu
 * akışta yalnızca "Authorized JavaScript origins" tanımlanmasını istiyor;
 * yönlendirme adresi hiç kullanılmıyor. Kullanılmayan adres de ekranda
 * görünemiyor.
 *
 * ── Nonce neden iki biçimde ─────────────────────────────────────────────────
 *
 * Tekrar oynatma saldırısına karşı tek kullanımlık bir değer üretiliyor.
 * Google'a bu değerin SHA-256 ÖZETİ veriliyor, Supabase'e ise HAM hâli.
 * Supabase jetonun içindeki özeti kendi hesapladığıyla karşılaştırıyor; ikisi
 * tutmazsa jeton başka bir yerden çalınmış demektir. Yanlış tarafa yanlış
 * biçimi vermek "nonce mismatch" hatasının klasik sebebi.
 *
 * ── Yedek düğme neden duruyor ───────────────────────────────────────────────
 *
 * Google'ın betiği reklam engelleyiciler tarafından bloke edilebiliyor ve bazı
 * tarayıcılarda üçüncü taraf çerez kısıtları bu akışı durduruyor. Giriş ekranı,
 * bir aksilikte müşteriyi tamamen dışarıda bırakacak tek yer. Bu yüzden betik
 * yüklenemezse ya da istemci kimliği tanımlı değilse eski yönlendirmeli düğme
 * görünüyor: ekranda `supabase.co` yazar ama kullanıcı içeri girer.
 */

/** Google'ın web istemci kimliği. Derleme zamanında paketin içine gömülür. */
const ISTEMCI_KIMLIGI = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

const GSI_BETIK = 'https://accounts.google.com/gsi/client'

type GoogleKimlik = {
  accounts: {
    id: {
      initialize: (ayar: Record<string, unknown>) => void
      renderButton: (hedef: HTMLElement, ayar: Record<string, unknown>) => void
    }
  }
}

declare global {
  interface Window {
    google?: GoogleKimlik
  }
}

/** Rastgele nonce üretir; ham ve SHA-256 özetli hâlini birlikte döndürür. */
async function nonceUret(): Promise<{ ham: string; ozet: string }> {
  const bayt = crypto.getRandomValues(new Uint8Array(32))
  const ham = btoa(String.fromCharCode(...bayt))
  const sayisal = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ham))
  const ozet = Array.from(new Uint8Array(sayisal))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return { ham, ozet }
}

interface Props {
  /** Giriş başarılı olunca gidilecek site içi adres. */
  hedef: string
  /** Yedek düğmenin metni — giriş ve kayıt sayfalarında farklı. */
  yedekEtiket: string
  /** Yedek düğmeye basıldığında çalışacak sunucu aksiyonu. */
  yedekAksiyon: () => Promise<void>
}

export default function GoogleGiris({ hedef, yedekEtiket, yedekAksiyon }: Props) {
  const router = useRouter()
  const kapsayici = useRef<HTMLDivElement>(null)
  const hamNonce = useRef<string>('')

  // 'yukleniyor' → betik bekleniyor, hiçbir şey çizilmiyor (düğmenin bir anlık
  // görünüp kaybolmasını önlüyor). 'hazir' → Google düğmesi çizildi.
  // 'yedek' → betik gelmedi veya kimlik yok; eski düğme gösteriliyor.
  const [durum, setDurum] = useState<'yukleniyor' | 'hazir' | 'yedek'>(
    ISTEMCI_KIMLIGI ? 'yukleniyor' : 'yedek',
  )
  const [hata, setHata] = useState<string | null>(null)
  const [bekliyor, setBekliyor] = useState(false)

  const jetonuIsle = useCallback(
    async (jeton: string) => {
      setBekliyor(true)
      setHata(null)
      try {
        const supabase = createClient()
        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: jeton,
          nonce: hamNonce.current,
        })

        if (error) {
          console.error('[google-giris] signInWithIdToken hatası:', error.message)
          setHata('Google ile giriş tamamlanamadı. Aşağıdaki e-posta formunu kullanabilirsiniz.')
          setBekliyor(false)
          return
        }

        // Oturum çerezi yazıldı; sunucu bileşenleri bunu görebilsin diye
        // önce tazeleyip sonra yönlendiriyoruz. Sıra ters olursa hedef sayfa
        // kullanıcıyı hâlâ oturumsuz görüp girişe geri atıyor.
        router.refresh()
        router.replace(hedef)
      } catch (e) {
        console.error('[google-giris] beklenmeyen hata:', e)
        setHata('Google ile giriş tamamlanamadı. Aşağıdaki e-posta formunu kullanabilirsiniz.')
        setBekliyor(false)
      }
    },
    [router, hedef],
  )

  useEffect(() => {
    if (!ISTEMCI_KIMLIGI) return

    let iptal = false

    const baslat = async () => {
      if (iptal || !window.google || !kapsayici.current) return

      const { ham, ozet } = await nonceUret()
      if (iptal) return
      hamNonce.current = ham

      window.google.accounts.id.initialize({
        client_id: ISTEMCI_KIMLIGI,
        callback: (yanit: { credential?: string }) => {
          if (yanit?.credential) void jetonuIsle(yanit.credential)
        },
        nonce: ozet,
        // Google One Tap'i FedCM'e taşıdı; yeni tarayıcılarda bu bayrak
        // olmadan pencere hiç açılmıyor.
        use_fedcm_for_prompt: true,
        // Otomatik oturum açmayı kapatıyoruz: kullanıcı hangi hesapla
        // gireceğini kendisi seçsin, sessizce giriş yapılmış olmasın.
        auto_select: false,
      })

      // Düğmeyi Google'ın kendisi çiziyor. Genişliği kapsayıcıya uyduruyoruz;
      // Google piksel değeri istiyor, yüzde kabul etmiyor.
      const genislik = Math.min(kapsayici.current.offsetWidth || 360, 400)
      window.google.accounts.id.renderButton(kapsayici.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        shape: 'rectangular',
        text: 'continue_with',
        logo_alignment: 'center',
        locale: 'tr',
        width: genislik,
      })

      setDurum('hazir')
    }

    // Betik zaten yüklüyse (sayfalar arası gezinme) tekrar eklemiyoruz.
    if (window.google) {
      void baslat()
      return
    }

    const mevcut = document.querySelector<HTMLScriptElement>(`script[src="${GSI_BETIK}"]`)
    const betik = mevcut ?? document.createElement('script')

    const yuklendi = () => void baslat()
    const basarisiz = () => {
      console.warn('[google-giris] Google betiği yüklenemedi; yedek düğmeye geçiliyor.')
      if (!iptal) setDurum('yedek')
    }

    betik.addEventListener('load', yuklendi)
    betik.addEventListener('error', basarisiz)

    if (!mevcut) {
      betik.src = GSI_BETIK
      betik.async = true
      betik.defer = true
      document.head.appendChild(betik)
    }

    // Betik engellenirse 'error' olayı her zaman tetiklenmiyor — sessizce
    // hiçbir şey olmuyor. Zaman aşımı bu sessiz hâli yakalıyor.
    const zamanAsimi = window.setTimeout(() => {
      if (!iptal && !window.google) basarisiz()
    }, 4000)

    return () => {
      iptal = true
      window.clearTimeout(zamanAsimi)
      betik.removeEventListener('load', yuklendi)
      betik.removeEventListener('error', basarisiz)
    }
  }, [jetonuIsle])

  return (
    <div className="flex flex-col gap-3">
      {hata && (
        <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {hata}
        </p>
      )}

      {/* Google'ın çizdiği düğme. Yükleme sırasında yerini tutan bir iskelet
          duruyor ki sayfa zıplamasın. */}
      {durum !== 'yedek' && (
        <div className="relative">
          <div ref={kapsayici} className="flex justify-center min-h-[44px]" />
          {durum === 'yukleniyor' && (
            <div className="absolute inset-0 rounded-xl border border-gray-200 bg-gray-50 animate-pulse" />
          )}
          {bekliyor && (
            <div className="absolute inset-0 rounded-xl bg-white/70 flex items-center justify-center text-sm text-gray-600">
              Giriş yapılıyor…
            </div>
          )}
        </div>
      )}

      {/* Yedek: eski yönlendirmeli akış. */}
      {durum === 'yedek' && (
        <form action={yedekAksiyon}>
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-xl px-4 py-3 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            {yedekEtiket}
          </button>
        </form>
      )}
    </div>
  )
}
