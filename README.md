# Happy Junior E-Ticaret

Anamur'daki Happy Junior mağazasının (0–15 yaş bebek/çocuk giyim, ayakkabı,
araç-gereç, oyuncak) e-ticaret sitesi. Alan adı: `happyjunioranamur.com`.

Kod tabanı, bayirlioglu.com için yazılmış ve canlıda çalışan e-ticaret kodundan
(`zvolkan/bayirlioglu`, 7 Ekim 2026) türetildi; çoklu marka yapısı kaldırılıp
tek mağazaya indirildi.

Planlama raporu: https://claude.ai/code/artifact/195742e2-1596-4a5e-8259-c49ae060a2f6

## Teknoloji

| Katman | Kullanılan |
| --- | --- |
| Uygulama | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS |
| Veritabanı | Supabase Postgres + Prisma (`engineType = "client"`, `@prisma/adapter-pg`) |
| Giriş / dosya | Supabase Auth (e-posta + Google), Supabase Storage |
| Barındırma | Cloudflare Workers (`@opennextjs/cloudflare`), veritabanı önünde Hyperdrive |
| E-posta | Resend |
| Ödeme | Havale/EFT (1. aşama), iyzico (2. aşama, kod hazır) |

## Klasör yapısı (önemli yerler)

```
src/app/                 Sayfalar: /, /urunler, /urunler/[slug], /sepet, /odeme, /hesabim, /blog …
src/app/admin/(panel)/   Yönetim paneli (giriş: /admin/giris)
src/app/actions/         Sunucu aksiyonları (sipariş, ürün, iade, form …)
src/lib/constants.ts     Mağaza bilgileri, menü, iletişim, IBAN — TEK KAYNAK
src/lib/legal.ts         Satıcı künyesi ve sözleşme metinleri
src/styles/brand.css     Mağaza renk paleti (bg-brand-* sınıfları buradan)
prisma/schema.prisma     Veritabanı şeması
prisma/seed.ts           Mağaza kaydı + kategori ağacı
```

## Kurulum

1. Bağımlılıklar: `npm ci`
2. `.env.example` dosyasını `.env.local` olarak kopyalayıp doldurun (yeni Supabase projesi).
3. Şemayı veritabanına uygulayın: `npm run db:push`
   (Bu projede `prisma migrate` kullanılmıyor, bkz. `prisma/migrations/README.md`.)
4. Kategorileri yükleyin: `npm run db:seed`
5. Geliştirme sunucusu: `npm run dev`

Cloudflare'e dağıtım: `wrangler.jsonc` içindeki Hyperdrive kimliğini doldurun,
gizli değerleri `wrangler secret put` ile girin, `NEXT_PUBLIC_*` değerlerini
Cloudflare panelinde **Settings → Build → Variables** bölümüne ekleyin, sonra
`npm run deploy`.

## Yol haritası

- [x] 1. İskelet: ALB kodu alındı, çoklu marka / bayi / hizmet yapısı temizlendi
- [x] Veritabanı: `ProductVariant` (beden/yaş + stok), sipariş kaleminde varyasyon,
      `Order.paymentMethod = "havale"`, `paidAt`, `deliveryMethod`
- [ ] 2. Özellikler
  - [ ] Ürün sayfasında beden/yaş seçimi, sepet ve siparişte varyasyon, varyasyon stoğu
  - [ ] Panelde beden-stok tablosu (telefondan kolay giriş)
  - [ ] Havale/EFT akışı: IBAN gösterimi, "ödeme bekleniyor", panelde "ödeme alındı"
  - [ ] Mağazadan teslim al seçeneği
  - [ ] Beden rehberi, `?indirim=1` filtresi
- [ ] 3. Tasarım ve içerik: logo, renkler, hero görseli, OG görseli, metinler
- [ ] 4. Kurulum ve test: Supabase, Cloudflare, domain DNS, deneme siparişi
- [ ] 5. Yayın ve müşteri eğitimi

## Müşteriden beklenenler

Kodda `TODO(müşteri)` ile işaretli: yasal unvan ve vergi bilgileri, açık adres,
e-posta, çalışma saatleri, IBAN, logo, kargo firması ve ücretleri, marka listesi.
