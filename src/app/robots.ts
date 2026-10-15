import { MetadataRoute } from 'next'
import { SITE_CONFIG } from '@/lib/constants'

/**
 * robots.txt
 *
 * ── Sondaki eğik çizgi tuzağı ───────────────────────────────────────────────
 *
 * Kalıplar `'/hesabim/'` gibi sondaki eğik çizgiyle yazılmıştı. robots.txt
 * kuralları ÖN EK eşleşmesi yapar: `/hesabim/` kalıbı `/hesabim/siparislerim`
 * adresini tutar ama `/hesabim` adresini TUTMAZ — aradaki tek karakter fark
 * yüzünden bölümün kendi ana sayfası taranabilir kalıyordu. `/giris`,
 * `/kayit` ve `/sepet` gibi tekil sayfalar da listede hiç yoktu.
 *
 * Kalıplar artık eğik çizgisiz; hem `/hesabim` hem `/hesabim/...` kapsanıyor.
 *
 * NOT: robots.txt taramayı engeller, DİZİNE GİRMEYİ değil. Başka bir siteden
 * bağlantı verilen, taraması engellenmiş bir sayfa yine de sonuçlarda
 * görünebilir. Kesin çözüm `noindex` meta etiketidir; kişisel sayfalara ayrıca
 * eklendi (bkz. src/app/hesabim/layout.tsx ve giriş/kayıt sayfaları).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/hesabim',
          '/sepet',
          '/odeme',
          '/api',
          '/giris',
          '/kayit',
          '/sifremi-unuttum',
          '/sifre-yenile',
        ],
      },
    ],
    sitemap: `${SITE_CONFIG.url}/sitemap.xml`,
  }
}
