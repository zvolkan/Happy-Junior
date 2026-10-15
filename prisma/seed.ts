/**
 * prisma/seed.ts — Happy Junior başlangıç verisi
 *
 * Çalıştır:  npm run db:seed   (DIRECT_URL veya DATABASE_URL tanımlı olmalı)
 *
 * Yalnızca mağaza kaydını ve kategori ağacını kurar; ürün eklemez. Ürünler
 * yönetim panelinden girilir. Betik tekrar çalıştırılabilir (upsert): var olan
 * kategorilerin adı/sırası güncellenir, silinmez.
 *
 * Kategori adresleri (slug) `src/lib/constants.ts` içindeki menü bağlantılarıyla
 * ve `src/lib/category-icon.ts` ile eşleşmeli.
 */
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DIRECT_URL veya DATABASE_URL tanımlı değil.')
}

// Şema `engineType = "client"` kullandığı için istemci sürücü bağdaştırıcısı
// (adapter) olmadan açılmaz.
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) })

type KategoriTanimi = { ad: string; slug: string; alt?: { ad: string; slug: string }[] }

/** Ana kategori → alt kategoriler. Sıra, listedeki sıradır. */
const KATEGORILER: KategoriTanimi[] = [
  {
    ad: 'Bebek (0–24 Ay)',
    slug: 'bebek',
    alt: [
      { ad: 'Kız Bebek', slug: 'bebek-kiz' },
      { ad: 'Erkek Bebek', slug: 'bebek-erkek' },
      { ad: 'Zıbın & Tulum', slug: 'bebek-zibin-tulum' },
      { ad: 'Bebek Takımları', slug: 'bebek-takim' },
    ],
  },
  {
    ad: 'Kız Çocuk',
    slug: 'kiz-cocuk',
    alt: [
      { ad: 'Takımlar', slug: 'kiz-takim' },
      { ad: 'Üst Giyim', slug: 'kiz-ust-giyim' },
      { ad: 'Alt Giyim', slug: 'kiz-alt-giyim' },
      { ad: 'Elbise', slug: 'kiz-elbise' },
      { ad: 'Dış Giyim', slug: 'kiz-dis-giyim' },
    ],
  },
  {
    ad: 'Erkek Çocuk',
    slug: 'erkek-cocuk',
    alt: [
      { ad: 'Takımlar', slug: 'erkek-takim' },
      { ad: 'Üst Giyim', slug: 'erkek-ust-giyim' },
      { ad: 'Alt Giyim', slug: 'erkek-alt-giyim' },
      { ad: 'Dış Giyim', slug: 'erkek-dis-giyim' },
    ],
  },
  {
    ad: 'Ayakkabı',
    slug: 'ayakkabi',
    alt: [
      { ad: 'Sandalet', slug: 'ayakkabi-sandalet' },
      { ad: 'Ayakkabı & Bot', slug: 'ayakkabi-bot' },
    ],
  },
  {
    ad: 'Araç-Gereç & Aksesuar',
    slug: 'arac-gerec',
    alt: [
      { ad: 'Matara & Beslenme', slug: 'arac-matara-beslenme' },
      { ad: 'Bebek Bakım', slug: 'arac-bebek-bakim' },
      { ad: 'Aksesuar', slug: 'arac-aksesuar' },
    ],
  },
  { ad: 'Oyuncak', slug: 'oyuncak' },
]

async function main() {
  const magaza = await prisma.brand.upsert({
    where: { key: 'happy-junior' },
    update: { name: 'Happy Junior' },
    create: {
      key: 'happy-junior',
      name: 'Happy Junior',
      description: '0–15 yaş bebek ve çocuk giyimi, araç-gereç ve oyuncak',
    },
  })

  for (const [i, kok] of KATEGORILER.entries()) {
    const ana = await prisma.category.upsert({
      where: { slug: kok.slug },
      update: { name: kok.ad, sortOrder: i, parentId: null, brandId: magaza.id },
      create: { name: kok.ad, slug: kok.slug, sortOrder: i, brandId: magaza.id },
    })

    for (const [j, alt] of (kok.alt ?? []).entries()) {
      await prisma.category.upsert({
        where: { slug: alt.slug },
        update: { name: alt.ad, sortOrder: j, parentId: ana.id, brandId: magaza.id },
        create: { name: alt.ad, slug: alt.slug, sortOrder: j, parentId: ana.id, brandId: magaza.id },
      })
    }
  }

  const sayi = await prisma.category.count({ where: { brandId: magaza.id } })
  console.log(`✔ Mağaza hazır: ${magaza.name} · ${sayi} kategori`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
