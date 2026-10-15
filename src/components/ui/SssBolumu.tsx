import { jsonLdScript } from '@/lib/sanitize'
import { sssVerisi } from '@/lib/seo'
import { sssListesi, sssAltBaslik } from '@/lib/faq'
import type { BrandKey } from '@/lib/types'

/**
 * Sıkça sorulan sorular bölümü — görünür içerik VE `FAQPage` yapısal verisi.
 *
 * İkisi aynı diziden üretiliyor. Google, yapısal veride sayfada görünmeyen
 * bir cevap bulursa zengin sonucu iptal ediyor; ayrı ayrı yazılan bir görünür
 * bölüm ile bir JSON bloğu er geç birbirinden ayrı düşer.
 *
 * Açılır panel `<details>`/`<summary>` ile: JavaScript gerekmiyor, klavyeyle
 * çalışıyor, ekran okuyucu durumu kendiliğinden bildiriyor ve sayfa
 * yüklenmeden de açılabiliyor. Bir akordeon bileşeni yazmanın buna göre
 * hiçbir üstünlüğü yok.
 */
export default function SssBolumu({
  marka,
  className = 'py-16 sm:py-20 bg-white',
}: {
  marka?: BrandKey
  className?: string
}) {
  const sorular = sssListesi(marka)

  return (
    <section className={className}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Sık Sorulan Sorular
          </h2>
          <p className="text-gray-600 text-lg">{sssAltBaslik(marka)}</p>
        </div>

        <div className="space-y-4">
          {sorular.map((item) => (
            <details key={item.question} className="bg-gray-50 rounded-2xl group">
              <summary className="flex items-center justify-between gap-4 p-6 cursor-pointer font-semibold text-gray-900 list-none">
                {item.question}
                <span
                  aria-hidden="true"
                  className="text-gray-400 group-open:rotate-180 transition-transform duration-200 flex-shrink-0"
                >
                  ▼
                </span>
              </summary>
              <div className="px-6 pb-6 text-gray-600 leading-relaxed">{item.answer}</div>
            </details>
          ))}
        </div>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(sssVerisi(sorular)) }}
      />
    </section>
  )
}
