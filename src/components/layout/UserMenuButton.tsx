'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Icon from '@/components/ui/Icon'
import { createClient } from '@/lib/supabase/client'

export default function UserMenuButton({ accentColor }: { accentColor: string }) {
  const [user, setUser] = useState<{ email: string; name?: string } | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser({
          email: data.user.email ?? '',
          name: data.user.user_metadata?.full_name ?? data.user.user_metadata?.name,
        })
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          email: session.user.email ?? '',
          name: session.user.user_metadata?.full_name ?? session.user.user_metadata?.name,
        })
      } else {
        setUser(null)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  if (!user) {
    return (
      <Link
        href="/giris"
        className={`btn-sticker hidden sm:inline-flex text-sm px-5 py-2 ml-2`}
      >
        Giriş Yap
      </Link>
    )
  }

  const initials = user.name
    ? user.name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
    : user.email[0].toUpperCase()

  return (
    <div className="relative hidden sm:block ml-1">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-ink hover:text-brand-600 text-sm font-bold transition-colors"
        aria-label="Hesabım"
      >
        <div className="w-8 h-8 rounded-full bg-sun border-2 border-ink flex items-center justify-center text-xs font-extrabold text-ink">
          {initials}
        </div>
        <span className="hidden md:inline max-w-[100px] truncate">{user.name?.split(' ')[0] ?? 'Hesabım'}</span>
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-20">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-500 truncate">{user.email}</p>
            </div>
            <Link
              href="/hesabim"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Icon name="kullanici" className="w-4 h-4" /> Hesabım
            </Link>
            <Link
              href="/hesabim/siparislerim"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Icon name="paket" className="w-4 h-4" /> Siparişlerim
            </Link>
            <div className="border-t border-gray-100">
              <div>
                <button
                  type="button"
                  onClick={async () => {
                    const supabase = createClient()
                    await supabase.auth.signOut()
                    window.location.href = '/'
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Icon name="cikis" className="w-4 h-4" /> Çıkış Yap
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
