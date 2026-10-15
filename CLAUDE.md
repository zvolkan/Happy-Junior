# Happy Junior — proje notları

Tek mağazalı çocuk giyim e-ticaret sitesi. Kod, ALB'nin iki markalı
bayirlioglu.com kodundan türetildi; bazı fonksiyonlar hâlâ `brandKey` /
`kapsam` parametresi alıyor ama tek değer var: `'happy-junior'`
(`ACTIVE_BRAND_KEY`, `KAPSAM`). Yeni kodda doğrudan `BRAND` kullanın;
markaya göre dallanan kod yazmayın.

## Kurallar

- Arayüz dili Türkçe. Kod içi açıklamalar da Türkçe.
- Mağaza bilgileri yalnızca `src/lib/constants.ts`, satıcı künyesi ve sözleşme
  metinleri yalnızca `src/lib/legal.ts` içinde tutulur; sayfalara elle yazılmaz.
- Sözleşme metni değişirse `src/app/api/odeme/initialize/route.ts` içindeki
  `CONTRACT_VERSION` artırılır.
- Renkler `bg-brand-*` / `text-brand-*` sınıflarıyla; değerler `src/styles/brand.css`.
- Şema değişikliği: `npm run db:push` (migrate kullanılmıyor).
- Bitirmeden önce: `npm run type-check`.
- `.env`, `.dev.vars` ve gizli anahtarlar repoya girmez.

## Ortam notu

Bulut oturumunda Prisma motor indirmesi engelli olabilir. Bu durumda
`prisma generate` için `PRISMA_SCHEMA_ENGINE_BINARY` ve
`PRISMA_QUERY_ENGINE_LIBRARY` boş dosyalara yönlendirilip
`PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1` verilir. `next build` Google
Fonts'a erişemezse derleme yalnızca o yüzden düşer.
