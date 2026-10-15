'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { faturaYukleAksiyon, faturaSilAksiyon } from '@/app/actions/invoices'

/**
 * Siparişe e-fatura PDF'i yükleme paneli.
 *
 * Fatura kesme işi sitenin dışında (e-arşiv/GİB portalı veya muhasebe programı)
 * yapılıyor; burada yalnızca çıkan PDF siparişe iliştiriliyor.
 */

interface Props {
  orderId: string
  dosyaAdi: string | null
  faturaNo: string | null
  yuklenmeTarihi: string | null
}

export default function InvoicePanel({ orderId, dosyaAdi, faturaNo, yuklenmeTarihi }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [secilen, setSecilen] = useState<File | null>(null)
  const [no, setNo] = useState(faturaNo ?? '')
  const [silmeOnayi, setSilmeOnayi] = useState(false)
  const dosyaRef = useRef<HTMLInputElement>(null)

  const yukle = () => {
    if (!secilen) {
      toast.error('Önce bir PDF seçin.')
      return
    }

    const formData = new FormData()
    formData.set('orderId', orderId)
    formData.set('faturaNo', no)
    formData.set('dosya', secilen)

    startTransition(async () => {
      const sonuc = await faturaYukleAksiyon(formData)
      if (!sonuc.ok) {
        toast.error(sonuc.error, { duration: 7000 })
        return
      }
      toast.success(sonuc.mesaj, { duration: 5000 })
      setSecilen(null)
      if (dosyaRef.current) dosyaRef.current.value = ''
      router.refresh()
    })
  }

  const sil = () => {
    startTransition(async () => {
      const sonuc = await faturaSilAksiyon(orderId)
      setSilmeOnayi(false)
      if (!sonuc.ok) {
        toast.error(sonuc.error)
        return
      }
      toast.success(sonuc.mesaj)
      router.refresh()
    })
  }

  return (
    <section className="bg-white rounded-2xl shadow-sm p-6">
      <h2 className="font-semibold text-gray-800 border-b pb-3 mb-4">E-Fatura</h2>

      {dosyaAdi ? (
        <div className="space-y-3">
          <div className="flex items-start gap-3 rounded-xl bg-emerald-50 border border-emerald-100 p-3">
            <span className="mt-0.5 text-emerald-600 text-lg leading-none">✓</span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-emerald-800 break-all">{dosyaAdi}</p>
              <p className="text-xs text-emerald-700/80 mt-0.5">
                {faturaNo ? `Fatura no: ${faturaNo} · ` : ''}
                {yuklenmeTarihi ? `${yuklenmeTarihi} tarihinde yüklendi` : 'Yüklendi'}
              </p>
            </div>
          </div>

          <a
            href={`/api/fatura/${orderId}`}
            className="btn-press block w-full text-center bg-gray-900 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-gray-700"
          >
            Faturayı İndir
          </a>

          {silmeOnayi ? (
            <div className="flex gap-2">
              <button
                onClick={sil}
                disabled={isPending}
                className="btn-press flex-1 bg-red-600 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-red-500 disabled:opacity-40"
              >
                {isPending ? 'Siliniyor…' : 'Evet, kaldır'}
              </button>
              <button
                onClick={() => setSilmeOnayi(false)}
                disabled={isPending}
                className="flex-1 border border-gray-300 text-gray-600 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-50"
              >
                Vazgeç
              </button>
            </div>
          ) : (
            <button
              onClick={() => setSilmeOnayi(true)}
              className="w-full border border-gray-200 text-gray-500 text-xs font-semibold py-2 rounded-xl hover:bg-gray-50 hover:text-red-600"
            >
              Faturayı kaldır / değiştir
            </button>
          )}

          <p className="text-xs text-gray-400 leading-relaxed">
            Müşteri bu faturayı Hesabım &gt; Siparişlerim sayfasından indirebiliyor.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-gray-500 leading-relaxed">
            Kestiğiniz e-fatura PDF&apos;ini buraya yükleyin. Yükleyince müşteriye
            &quot;faturanız hazır&quot; e-postası gider ve fatura hesabından indirilebilir olur.
          </p>

          <div>
            <label
              htmlFor="fatura-no"
              className="block text-xs font-medium text-gray-600 mb-1"
            >
              Fatura No <span className="text-gray-400">(isteğe bağlı)</span>
            </label>
            <input
              id="fatura-no"
              value={no}
              onChange={(e) => setNo(e.target.value)}
              placeholder="Örn: ALB2026000000123"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
            />
          </div>

          <div>
            <label
              htmlFor="fatura-dosya"
              className="block text-xs font-medium text-gray-600 mb-1"
            >
              PDF Dosyası
            </label>
            <input
              ref={dosyaRef}
              id="fatura-dosya"
              type="file"
              accept="application/pdf,.pdf"
              onChange={(e) => setSecilen(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
            />
            {secilen && (
              <p className="text-xs text-gray-500 mt-1.5 break-all">
                {secilen.name} · {(secilen.size / 1024).toFixed(0)} KB
              </p>
            )}
          </div>

          <button
            onClick={yukle}
            disabled={isPending || !secilen}
            className="btn-press w-full bg-emerald-600 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isPending ? 'Yükleniyor…' : 'Faturayı Yükle'}
          </button>
        </div>
      )}
    </section>
  )
}
