import Link from 'next/link'
import { signOut } from '@/app/actions/auth'
import { ACTIVE_BRAND_KEY } from '@/lib/constants'
import { cn } from '@/lib/utils'
import Icon, { type IconName } from '@/components/ui/Icon'

const primaryBg = 'bg-brand-600'
const primaryLight =
  'bg-brand-50 text-brand-700'

const LINKS: { href: string; label: string; icon: IconName }[] = [
  { href: '/hesabim', label: 'Hesabım', icon: 'kullanici' },
  { href: '/hesabim/siparislerim', label: 'Siparişlerim', icon: 'paket' },
  { href: '/hesabim/adreslerim', label: 'Adreslerim', icon: 'konum' },
  { href: '/hesabim/favorilerim', label: 'Favorilerim', icon: 'favori' },
]

interface Props {
  /** Aktif bağlantının href'i */
  active: string
  name: string | null
  email: string
}

/**
 * Hesap sayfalarının ortak kenar çubuğu.
 *
 * Eskiden favorilerim ve adreslerim sayfaları kendi kopyalarını taşıyordu;
 * ikisi de sabit "Ahmet Yılmaz" gösteriyor ve "Çıkış Yap" butonu signOut()
 * çağırmadan /giris'e yönlendirdiği için oturum kapanmıyordu.
 */
export default function AccountSidebar({ active, name, email }: Props) {
  const displayName = name?.trim() || email.split('@')[0]
  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <aside className="w-full md:w-64 flex-shrink-0">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className={cn('p-6', primaryBg)}>
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-white text-2xl font-bold mb-3">
            {initials || <Icon name="kullanici" className="w-7 h-7" />}
          </div>
          <p className="text-white font-semibold break-words">{displayName}</p>
          <p className="text-white/70 text-sm break-all">{email}</p>
        </div>

        <nav className="p-2">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                active === link.href ? primaryLight : 'text-gray-600 hover:bg-gray-50',
              )}
            >
              <Icon name={link.icon} className="w-5 h-5" />
              {link.label}
            </Link>
          ))}

          {/* Gerçek çıkış — oturumu sunucuda kapatır */}
          <form action={signOut}>
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors mt-1"
            >
              <Icon name="cikis" className="w-5 h-5" />
              Çıkış Yap
            </button>
          </form>
        </nav>
      </div>
    </aside>
  )
}
