'use client'

import { useRef, useState, useTransition } from 'react'
import toast from 'react-hot-toast'
import { kuponAktiflik, kuponOlustur, kuponSil, type KuponSatiri } from '@/app/actions/admin-kupon'

const alan =
  'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent'
const etiket = 'block text-sm font-medium text-gray-700 mb-1'

const tl = (n: number) => n.toLocaleString('tr-TR', { maximumFractionDigits: 2 }) + ' ₺'
const tarih = (iso: string) =>
  new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso))

export default function KuponYonetimi({ kuponlar }: { kuponlar: KuponSatiri[] }) {
  const [bekliyor, baslat] = useTransition()
  const [hata, setHata] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  function olustur(formData: FormData) {
    setHata(null)
    baslat(async () => {
      const sonuc = await kuponOlustur(formData)
      if (!sonuc.ok) {
        setHata(sonuc.error)
        return
      }
      toast.success('Kupon oluşturuldu')
      formRef.current?.reset()
    })
  }

  function kopyala(kod: string) {
    navigator.clipboard?.writeText(kod).then(
      () => toast.success(`${kod} kopyalandı`),
      () => {},
    )
  }

  return (
    <div className="space-y-6">
      {/* ── Yeni kupon ── */}
      <form ref={formRef} action={olustur} className="bg-white rounded-xl shadow-sm p-6 space-y-5">
        <h2 className="font-semibold text-gray-800 text-base border-b pb-3">Yeni Kupon</h2>

        {hata && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{hata}</div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div>
            <label htmlFor="kupon-code" className={etiket}>Kupon Kodu *</label>
            <input
              id="kupon-code"
              name="code"
              required
              minLength={3}
              maxLength={40}
              autoCapitalize="characters"
              className={`${alan} uppercase`}
            />
            <p className="mt-1 text-xs text-gray-400">Harf ve rakam; Türkçe karakter kullanmayın.</p>
          </div>
          <div>
            <label htmlFor="kupon-percent" className={etiket}>İndirim (%) *</label>
            <input id="kupon-percent" name="percent" type="number" min={1} max={90} required inputMode="numeric" className={alan} />
          </div>
          <div>
            <label htmlFor="kupon-endsAt" className={etiket}>Son Geçerlilik Günü</label>
            <input id="kupon-endsAt" name="endsAt" type="date" className={alan} />
            <p className="mt-1 text-xs text-gray-400">Boşsa süresiz.</p>
          </div>
          <div>
            <label htmlFor="kupon-minAmount" className={etiket}>En Düşük Sepet (₺)</label>
            <input id="kupon-minAmount" name="minAmount" type="number" min={0} step="0.01" inputMode="decimal" className={alan} />
            <p className="mt-1 text-xs text-gray-400">Boşsa alt sınır yok.</p>
          </div>
          <div>
            <label htmlFor="kupon-maxUses" className={etiket}>Toplam Kullanım Sınırı</label>
            <input id="kupon-maxUses" name="maxUses" type="number" min={1} inputMode="numeric" className={alan} />
            <p className="mt-1 text-xs text-gray-400">Boşsa sınırsız.</p>
          </div>
          <div>
            <label htmlFor="kupon-perUserLimit" className={etiket}>Kişi Başı Kullanım *</label>
            <input
              id="kupon-perUserLimit"
              name="perUserLimit"
              type="number"
              min={1}
              max={100}
              defaultValue={1}
              required
              inputMode="numeric"
              className={alan}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="kupon-description" className={etiket}>Not</label>
            <input id="kupon-description" name="description" maxLength={200} className={alan} />
            <p className="mt-1 text-xs text-gray-400">Yalnızca sizin için; ör. &quot;Instagram Kasım kampanyası&quot;.</p>
          </div>
        </div>

        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            name="onlyNewMembers"
            className="mt-0.5 w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
          />
          <span className="text-sm text-gray-700">
            Yalnızca ilk siparişte geçerli (yeni üye kuponu)
            <span className="block text-xs text-gray-400">
              Bu işaretli aktif kupon, yeni üyelere hesap sayfasında ve sepette &quot;ilk siparişine özel&quot; diye
              gösterilir.
            </span>
          </span>
        </label>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={bekliyor}
            className="px-6 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-700 disabled:opacity-50"
          >
            {bekliyor ? 'Kaydediliyor…' : 'Kuponu Oluştur'}
          </button>
        </div>
      </form>

      {/* ── Liste ── */}
      <section className="bg-white rounded-xl shadow-sm overflow-hidden">
        <h2 className="font-semibold text-gray-800 text-base px-6 pt-5 pb-3 border-b">Kuponlar</h2>
        {kuponlar.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-gray-500">Henüz kupon yok.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {kuponlar.map((k) => (
              <li key={k.id} className={`flex flex-wrap items-center gap-x-6 gap-y-2 px-6 py-4 ${k.isActive ? '' : 'opacity-55'}`}>
                <button
                  type="button"
                  onClick={() => kopyala(k.code)}
                  title="Kopyala"
                  className="font-mono text-base font-bold tracking-wide text-gray-900 hover:text-brand-700"
                >
                  {k.code}
                </button>
                <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-sm font-bold text-brand-700">%{k.percent}</span>
                <div className="min-w-0 flex-1 text-xs text-gray-500 space-y-0.5">
                  <p>
                    {[
                      k.onlyNewMembers ? 'İlk siparişe özel' : null,
                      k.minAmount ? `${tl(k.minAmount)} ve üzeri` : null,
                      k.endsAt ? `${tarih(k.endsAt)} tarihine kadar` : 'Süresiz',
                      k.maxUses ? `toplam ${k.maxUses} kullanım` : null,
                      `kişi başı ${k.perUserLimit}`,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                  {k.description && <p className="text-gray-400">{k.description}</p>}
                </div>
                <p className="text-xs text-gray-600 whitespace-nowrap">
                  <span className="font-semibold">{k.kullanim}</span> sipariş
                  {k.toplamIndirim > 0 && <> · {tl(k.toplamIndirim)} indirim</>}
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={bekliyor}
                    onClick={() =>
                      baslat(async () => {
                        const s = await kuponAktiflik(k.id, !k.isActive)
                        if (!s.ok) toast.error(s.error)
                      })
                    }
                    className="text-sm font-medium text-gray-700 hover:text-gray-900 disabled:opacity-40"
                  >
                    {k.isActive ? 'Durdur' : 'Etkinleştir'}
                  </button>
                  <button
                    type="button"
                    disabled={bekliyor}
                    onClick={() => {
                      if (!window.confirm(`${k.code} kuponu silinsin mi?`)) return
                      baslat(async () => {
                        const s = await kuponSil(k.id)
                        if (!s.ok) toast.error(s.error)
                        else if ('pasif' in s) toast('Kupon kullanıldığı için silinmedi, durduruldu.')
                        else toast.success('Kupon silindi')
                      })
                    }}
                    className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-40"
                  >
                    Sil
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
