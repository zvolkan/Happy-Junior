'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { headers } from 'next/headers'
import { safeInternalPath } from '@/lib/safe-redirect'
import { rateLimit, rateLimitReset, clientIp } from '@/lib/rate-limit'

// ─── Hata mesajı çevirisi ────────────────────────────────────────────────────

/**
 * Supabase'in ham İngilizce hata metnini kullanıcıya gösterilebilir Türkçe
 * mesaja çevirir. Bilinmeyen hatalarda genel mesaj döner — böylece iç sistem
 * detayları ve hesap numaralandırmaya yarayacak ipuçları dışarı sızmaz.
 */
function mapAuthError(message: string): string {
  const m = message.toLowerCase()

  if (m.includes('invalid login credentials') || m.includes('invalid credentials'))
    return 'E-posta veya şifre hatalı.'
  if (m.includes('email not confirmed'))
    return 'E-posta adresiniz henüz doğrulanmadı. Gelen kutunuzu kontrol edin.'
  if (m.includes('user already registered') || m.includes('already been registered'))
    return 'Bu e-posta adresi zaten kayıtlı. Giriş yapmayı deneyin.'
  if (m.includes('password should be at least') || m.includes('password is too short'))
    return 'Şifre en az 8 karakter olmalıdır.'
  if (m.includes('unable to validate email') || m.includes('invalid email'))
    return 'Geçerli bir e-posta adresi girin.'
  if (m.includes('rate limit') || m.includes('too many requests'))
    return 'Çok fazla deneme yapıldı. Lütfen birkaç dakika sonra tekrar deneyin.'
  if (m.includes('weak password'))
    return 'Şifreniz çok zayıf. Büyük/küçük harf ve rakam içeren daha uzun bir şifre seçin.'

  return 'İşlem tamamlanamadı. Lütfen bilgilerinizi kontrol edip tekrar deneyin.'
}

// ─── E-posta / Şifre ile Kayıt ───────────────────────────────────────────────

/** Sunucu tarafı şifre kuralı — istemcideki minLength'e güvenilmez */
function validatePassword(password: string): string | null {
  if (!password || password.length < 8) return 'Şifre en az 8 karakter olmalıdır.'
  if (password.length > 72) return 'Şifre en fazla 72 karakter olabilir.'
  if (!/[a-zA-ZğüşıöçĞÜŞİÖÇ]/.test(password) || !/[0-9]/.test(password))
    return 'Şifre en az bir harf ve bir rakam içermelidir.'
  return null
}

/**
 * Kimlik doğrulama geri dönüşlerinde kullanılacak kök adres.
 *
 * ── Neden istek başlığına değil, sabite bakıyor ─────────────────────────────
 *
 * Eskiden önce `origin` başlığı okunuyordu, yani adres çubuğunda ne yazıyorsa
 * geri dönüş oraya kuruluyordu. Bu üretimde sorun çıkarıyor: ziyaretçi
 * `www.bayirlioglu.com` üzerinden gelirse `origin` da www'lu oluyor ve
 * Supabase'in Redirect URLs listesinde yalnızca www'suz adres varsa istek
 * REDDEDİLMİYOR — Supabase sessizce kendi "Site URL" ayarına düşüyor. Site URL
 * eski Vercel adresinde kaldığında da kullanıcı giriş sonrası
 * `bayirlioglu.vercel.app`e savruluyor. Hata mesajı yok, sadece yanlış adres.
 *
 * Üretimde artık tek bir kaynak var: `NEXT_PUBLIC_SITE_URL`. Ödeme geri
 * dönüşleri de (`getSiteUrl()`) aynı sabiti kullanıyor; ikisinin aynı adresi
 * üretmesi, "ödeme apex'e, giriş www'ya" gibi ayrışmaları baştan engelliyor.
 *
 * Geliştirmede (`next dev`) `origin` başlığı kullanılmaya devam ediyor, aksi
 * hâlde yerelde çalışırken üretim adresine yönlenirdiniz.
 */
async function getSiteOrigin(): Promise<string> {
  const sabit = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, '')

  if (process.env.NODE_ENV === 'production' && sabit) return sabit

  const headersList = await headers()
  return headersList.get('origin') ?? sabit ?? 'http://localhost:3000'
}

export async function signUp(formData: FormData) {
  const email = ((formData.get('email') as string) ?? '').trim().toLowerCase()
  const password = formData.get('password') as string
  const name = ((formData.get('name') as string) ?? '').trim()

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    redirect(`/kayit?error=${encodeURIComponent('Geçerli bir e-posta adresi girin.')}`)
  }

  const passwordError = validatePassword(password)
  if (passwordError) {
    redirect(`/kayit?error=${encodeURIComponent(passwordError)}`)
  }

  const supabase = await createClient()
  const origin = await getSiteOrigin()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name },
      emailRedirectTo: `${origin}/api/auth/callback?next=/hesabim`,
    },
  })

  if (error) {
    // Ham Supabase mesajını (İngilizce, teknik) kullanıcıya gösterme
    console.error('[auth] signUp hatası:', error.message)
    redirect(`/kayit?error=${encodeURIComponent(mapAuthError(error.message))}`)
  }

  if (data.user) {
    // Kullanıcıyı kendi DB'ye kaydet.
    //
    // try/catch ŞART: Supabase hesabı bu noktada ZATEN oluşturulmuş oluyor.
    // Bu yazma korumasızken patladığında kullanıcı genel hata ekranı görüyor,
    // tekrar kayıt olmayı denediğinde "Bu e-posta adresi zaten kayıtlı"
    // yanıtını alıyor ve kilitleniyordu.
    try {
      await prisma.user.upsert({
        where: { id: data.user.id },
        update: { email, name },
        create: { id: data.user.id, email, name },
      })
    } catch (dbError) {
      console.error('[auth] kayıt senkronizasyonu başarısız:', data.user.id, dbError)
    }
  }

  redirect('/giris?mesaj=email-dogrulama')
}

// ─── E-posta / Şifre ile Giriş ───────────────────────────────────────────────

/**
 * Müşteri girişi hız sınırı.
 *
 * Yönetici girişi örnek biçimde korunmuştu (IP başına 5 + global 20 / 15 dk),
 * müşteri girişi ise yalnızca Supabase'in kendi varsayılanlarına bağlıydı.
 * Oysa deneme yanılma saldırısının hedefi çoğu zaman müşteri hesapları olur:
 * içlerinde adres, telefon ve sipariş geçmişi var.
 *
 * Anahtar IP; e-posta DEĞİL. E-postayı saldırgan yazıyor ve her denemede
 * değiştirerek sınırı atlayabilirdi. IP ile sınırlamak aynı ağdaki birden çok
 * kullanıcıyı da etkiliyor — bu yüzden pencere kısa ve sınır cömert tutuldu:
 * gerçek kullanıcı parolasını üç kez yanlış yazsa bile takılmıyor.
 */
const GIRIS_MAX = 8
const GIRIS_PENCERE_MS = 10 * 60 * 1000

export async function signIn(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const redirectTo = safeInternalPath(formData.get('redirect') as string, '/hesabim')

  const ip = clientIp(await headers())
  const sinir = await rateLimit('musteri-girisi', ip, GIRIS_MAX, GIRIS_PENCERE_MS)
  if (!sinir.ok) {
    const dakika = Math.max(1, Math.ceil(sinir.kalanMs / 60000))
    redirect(
      `/giris?error=${encodeURIComponent(
        `Çok fazla giriş denemesi yapıldı. ${dakika} dakika sonra tekrar deneyin.`,
      )}`,
    )
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    console.error('[auth] signIn hatası:', error.message)
    redirect(`/giris?error=${encodeURIComponent(mapAuthError(error.message))}`)
  }

  // Başarılı girişte sayaç sıfırlanıyor; yoksa parolasını bir kez yanlış yazıp
  // sonra doğru giren kullanıcı, bir sonraki gerçek denemesinde sınıra
  // yaklaşmış oluyordu.
  await rateLimitReset('musteri-girisi', ip)

  redirect(redirectTo)
}

// ─── Google ile Giriş ────────────────────────────────────────────────────────

export async function signInWithGoogle(redirectTo?: string) {
  const supabase = await createClient()
  // Kendi `origin` okumasını yapıyordu; artık diğer akışlarla aynı kaynağı
  // kullanıyor (bkz. getSiteOrigin). Google girişinde yanlış kök adres,
  // Supabase'i sessizce "Site URL"e düşürdüğü için en çok burada canımızı
  // yakan yerdi.
  const origin = await getSiteOrigin()

  const next = safeInternalPath(redirectTo, '/hesabim')

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/api/auth/callback?next=${encodeURIComponent(next)}`,
    },
  })

  if (error || !data.url) {
    redirect('/giris?error=google')
  }

  redirect(data.url)
}

// ─── Çıkış ───────────────────────────────────────────────────────────────────

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}

// ─── Şifremi Unuttum ─────────────────────────────────────────────────────────

/**
 * Şifre sıfırlama bağlantısı gönderir.
 *
 * Hesabın var olup olmadığını ele vermemek için sonuç ne olursa olsun aynı
 * mesajla döner (kullanıcı numaralandırma / user enumeration koruması).
 */
export async function requestPasswordReset(formData: FormData) {
  const email = ((formData.get('email') as string) ?? '').trim().toLowerCase()

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    redirect(`/sifremi-unuttum?error=${encodeURIComponent('Geçerli bir e-posta adresi girin.')}`)
  }

  // Sıfırlama e-postası isteği de sınırlı: aksi hâlde bu uç, başkalarının
  // adresine e-posta yağdırmak için kullanılabilir bir araca dönüşüyor.
  // Yanıt her durumda aynı olduğu için (hesap var mı yok mu söylemiyoruz)
  // sınıra takılmak da hesap varlığını ele vermiyor.
  const ip = clientIp(await headers())
  const sinir = await rateLimit('sifre-sifirlama', ip, 3, 15 * 60 * 1000)
  if (!sinir.ok) {
    redirect('/sifremi-unuttum?gonderildi=1')
  }

  const supabase = await createClient()
  const origin = await getSiteOrigin()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/api/auth/callback?next=/sifre-yenile`,
  })

  if (error) {
    console.error('[auth] resetPasswordForEmail hatası:', error.message)
  }

  redirect('/sifremi-unuttum?gonderildi=1')
}

// ─── Şifre Belirleme / Değiştirme ────────────────────────────────────────────

/**
 * Oturum açmış kullanıcının şifresini günceller.
 * Hem sıfırlama bağlantısıyla gelen kullanıcı hem de hesap ayarları için.
 */
export async function updatePassword(formData: FormData) {
  const password = formData.get('password') as string
  const passwordConfirm = formData.get('passwordConfirm') as string
  const returnTo = safeInternalPath(formData.get('returnTo') as string, '/sifre-yenile')

  if (password !== passwordConfirm) {
    redirect(`${returnTo}?error=${encodeURIComponent('Şifreler eşleşmiyor.')}`)
  }

  const passwordError = validatePassword(password)
  if (passwordError) {
    redirect(`${returnTo}?error=${encodeURIComponent(passwordError)}`)
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(
      `/giris?error=${encodeURIComponent(
        'Şifre sıfırlama bağlantısının süresi dolmuş. Lütfen yeniden talep edin.',
      )}`,
    )
  }

  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    console.error('[auth] updateUser hatası:', error.message)
    redirect(`${returnTo}?error=${encodeURIComponent(mapAuthError(error.message))}`)
  }

  redirect('/hesabim?mesaj=sifre-guncellendi')
}
