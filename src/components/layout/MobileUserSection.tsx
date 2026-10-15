'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Icon from '@/components/ui/Icon'
import { createClient } from '@/lib/supabase/client'

type Props = {
  accentColor: string
  cartCount: number
  onClose: () => void
}

export default function MobileUserSection({ accentColor, cartCount, onClose }: Props) {
  const [user, setUser] = useState<{ email: string; name?: string } | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser({
          email: data.user.email ?? '',
          name: data.user.user_metadata?.full_name ?? data.user.user_metadata?.name,
        })
      }
      setLoaded(true)
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

  return (
    <div className="p-4 border-t border-white/10 space-y-1">
      {loaded && user ? (
        <>
          <p className="text-white/40 text-xs px-4 pb-1 truncate">{user.email}</p>
          <Link
            href="/hesabim"
            onClick={onClose}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 text-sm font-medium transition-colors"
          >
            <Icon name="kullanici" className="w-4 h-4" /> Hesabım
          </Link>
          <Link
            href="/hesabim/siparislerim"
            onClick={onClose}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 text-sm font-medium transition-colors"
          >
            <Icon name="paket" className="w-4 h-4" /> Siparişlerim
          </Link>
          <button
            onClick={async () => {
              const supabase = createClient()
              await supabase.auth.signOut()
              window.location.href = '/'
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-red-400 hover:text-red-300 hover:bg-white/10 text-sm font-medium transition-colors"
          >
            <Icon name="cikis" className="w-4 h-4" /> Çıkış Yap
          </button>
        </>
      ) : loaded ? (
        <Link
          href="/giris"
          className={`block text-center text-sm px-4 py-3 rounded-xl font-semibold text-white transition-colors ${accentColor}`}
          onClick={onClose}
        >
          Giriş Yap
        </Link>
      ) : null}

      <Link
        href="/sepet"
        className="flex items-center justify-center gap-2 text-white/70 py-2 text-sm mt-1"
        onClick={onClose}
      >
        <Icon name="sepet" className="w-4 h-4" /> Sepetim {cartCount > 0 && `(${cartCount})`}
      </Link>
    </div>
  )
}
