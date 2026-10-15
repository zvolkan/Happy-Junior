import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { safeInternalPath } from '@/lib/safe-redirect'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // Açık yönlendirme koruması: yalnızca site içi göreli yollar
  const next = safeInternalPath(searchParams.get('next'), '/hesabim')

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Supabase kullanıcısını kendi DB'mize senkronize et.
      //
      // try/catch ŞART: bu çağrı korumasızken veritabanına yazılamadığında
      // Google girişi veya e-posta doğrulama bağlantısı 500 ile bitiyordu —
      // oysa Supabase oturumu o noktada ZATEN kurulmuş oluyor. Senkronizasyon
      // başarısız olsa da kullanıcıyı içeri alıyoruz; kayıt bir sonraki
      // girişte tamamlanır.
      try {
        await prisma.user.upsert({
          where: { id: data.user.id },
          // DİKKAT: `name` bilerek güncellenmiyor. Her giriş/şifre sıfırlamada
          // Supabase metadata'sından üzerine yazılırsa kullanıcının profil
          // ekranından girdiği ad sessizce kayboluyordu.
          update: {
            email: data.user.email!,
          },
          create: {
            id: data.user.id,
            email: data.user.email!,
            name: data.user.user_metadata?.full_name ?? data.user.user_metadata?.name ?? null,
          },
        })
      } catch (dbError) {
        console.error('[auth] kullanıcı senkronizasyonu başarısız:', data.user.id, dbError)
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/giris?error=callback`)
}
