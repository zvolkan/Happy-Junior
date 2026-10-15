import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'KVKK Aydınlatma Metni',
  description: 'Kişisel Verilerin Korunması Kanunu kapsamında aydınlatma metni.',
  alternates: { canonical: '/kvkk' },
}

const sections = [
  {
    title: '1. Veri Sorumlusunun Kimliği',
    content:
      'Bayırlıoğlu (ALB Tarım ve Alb Su Teknolojileri markaları), 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca veri sorumlusu sıfatıyla aşağıdaki bilgileri paylaşmaktadır.\n\nAdres: Saçkan Kavşağı Doğusu Savcı-Şok Market Yanı, Yeşilyurt, Akdeniz Cd. No:20/22, 33640 Anamur/Mersin\nE-posta: kvkk@bayirlioglu.com',
  },
  {
    title: '2. İşlenen Kişisel Veriler',
    content:
      'Ad-soyad, e-posta adresi, telefon numarası, teslimat adresi, ödeme bilgileri (kart numarası şifrelenerek saklanır), IP adresi ve çerez verileri işlenmektedir.',
  },
  {
    title: '3. Kişisel Verilerin İşlenme Amaçları',
    content:
      'Kişisel verileriniz; sipariş ve teslimat süreçlerinin yürütülmesi, müşteri hizmetleri ve teknik destek sağlanması, yasal yükümlülüklerin yerine getirilmesi, pazarlama ve tanıtım faaliyetleri (açık rızanız olması halinde) amacıyla işlenmektedir.',
  },
  {
    title: '4. Hukuki Sebepler',
    content:
      "Kişisel verileriniz; sözleşmenin kurulması ve ifası, kanuni yükümlülüklerin yerine getirilmesi ve meşru menfaat kapsamında KVKK'nın 5. maddesi uyarınca işlenmektedir.",
  },
  {
    title: '5. Verilerin Aktarılması',
    content:
      'Kişisel verileriniz; kargo ve lojistik şirketleri, ödeme altyapı sağlayıcıları ve yasal mercilerle paylaşılabilir. Yurt dışına aktarım yapılmaz.',
  },
  {
    title: '6. Saklama Süresi',
    content:
      'Kişisel verileriniz, işlenme amacının sona ermesiyle birlikte ilgili mevzuatta öngörülen süreler boyunca saklanır; ardından silinir veya anonim hale getirilir.',
  },
  {
    title: '7. Haklarınız',
    content:
      "KVKK'nın 11. maddesi uyarınca; kişisel verilerinizin işlenip işlenmediğini öğrenme, düzeltme talep etme, silinmesini isteme, işlemeye itiraz etme ve zararın giderilmesini talep etme haklarına sahipsiniz. Taleplerinizi kvkk@bayirlioglu.com adresine iletebilirsiniz.",
  },
]

export default function KvkkPage() {
  return (
    <main className="py-16 sm:py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
        <div className="mb-10">
          <p className="text-gray-400 text-sm font-semibold uppercase tracking-widest mb-2">
            Bayırlıoğlu
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
            KVKK Aydınlatma Metni
          </h1>
          <p className="text-gray-500 text-sm mt-2">Son güncelleme: Ocak 2026</p>
        </div>

        <div className="space-y-8">
          {sections.map((s) => (
            <div key={s.title}>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">{s.title}</h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line text-sm">{s.content}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 p-5 bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-sm text-gray-600">
            Kişisel veri talepleriniz için:{' '}
            <a href="mailto:kvkk@bayirlioglu.com" className="text-blue-600 hover:underline font-medium">
              kvkk@bayirlioglu.com
            </a>
          </p>
        </div>
      </div>
    </main>
  )
}
