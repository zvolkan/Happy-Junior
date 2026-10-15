/**
 * prisma/restructure-tarim-v2.ts
 * ALB Tarım kategori hiyerarşisini yeniden yapılandırır:
 *   - Toptancısı Olunanlar + Bayilik Olunanlar → deaktive
 *   - Sulama Sistemleri → deaktive
 *   - ALB Tarım Ürünleri → 7 alt kategori oluştur
 *   - İthal Ürünler → Toprak İyileştirici ekle (eksikti)
 *   - Mevcut ürünleri uygun yeni kategorilere taşı
 *
 * Çalıştır: npx tsx prisma/restructure-tarim-v2.ts
 */

import { PrismaClient } from '@prisma/client'

// Local script'ler için pooler (6543) yerine direct bağlantı (5432) kullan.
// DIRECT_URL = Supabase "Direct connection" URL'i (Settings → Database → Connection string → URI)
const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DIRECT_URL ?? process.env.DATABASE_URL },
  },
})

async function main() {
  console.log('🔄 ALB Tarım kategori yeniden yapılandırması başlatıldı...\n')

  const albTarim = await prisma.brand.findUniqueOrThrow({ where: { key: 'alb-tarim' } })

  // ── Mevcut parent kategorileri bul ────────────────────────────────────────
  const albTarimUrunleri = await prisma.category.findUniqueOrThrow({ where: { slug: 'alb-tarim-urunleri' } })
  const ithalUrunler = await prisma.category.findUniqueOrThrow({ where: { slug: 'ithal-urunler' } })

  // ─────────────────────────────────────────────────────────────────────────
  // 1. ALB Tarım Ürünleri altına 7 alt kategori oluştur
  // ─────────────────────────────────────────────────────────────────────────
  console.log('📂 ALB Tarım Ürünleri alt kategorileri oluşturuluyor...')

  const albToprak = await prisma.category.upsert({
    where: { slug: 'alb-toprak-iyilestirici' },
    update: { parentId: albTarimUrunleri.id, sortOrder: 0, isActive: true },
    create: {
      brandId: albTarim.id, name: 'Toprak İyileştirici', slug: 'alb-toprak-iyilestirici',
      icon: '🪨', sortOrder: 0, parentId: albTarimUrunleri.id,
      description: 'pH düzenleyici, humik asit ve toprak kondisyonerleri',
    },
  })

  const albTabanGubre = await prisma.category.upsert({
    where: { slug: 'alb-taban-gubresi' },
    update: { parentId: albTarimUrunleri.id, sortOrder: 1, isActive: true },
    create: {
      brandId: albTarim.id, name: 'Taban Gübresi', slug: 'alb-taban-gubresi',
      icon: '🌾', sortOrder: 1, parentId: albTarimUrunleri.id,
      description: 'Ekim ve dikim öncesi taban gübreleri',
    },
  })

  const albDamla = await prisma.category.upsert({
    where: { slug: 'alb-damla-sulama-gubreleri' },
    update: { parentId: albTarimUrunleri.id, sortOrder: 2, isActive: true },
    create: {
      brandId: albTarim.id, name: 'Damla Sulama Gübreleri', slug: 'alb-damla-sulama-gubreleri',
      icon: '💧', sortOrder: 2, parentId: albTarimUrunleri.id,
      description: 'Fertigasyon ve damla sulama uyumlu suda çözünür gübreler',
    },
  })

  const albYaprak = await prisma.category.upsert({
    where: { slug: 'alb-yaprak-gubreleri' },
    update: { parentId: albTarimUrunleri.id, sortOrder: 3, isActive: true },
    create: {
      brandId: albTarim.id, name: 'Yaprak Gübreleri', slug: 'alb-yaprak-gubreleri',
      icon: '🌿', sortOrder: 3, parentId: albTarimUrunleri.id,
      description: 'Yapraktan uygulanan hızlı etkili gübreler',
    },
  })

  const albMikro = await prisma.category.upsert({
    where: { slug: 'alb-mikro-elementler' },
    update: { parentId: albTarimUrunleri.id, sortOrder: 4, isActive: true },
    create: {
      brandId: albTarim.id, name: 'Mikro Elementler', slug: 'alb-mikro-elementler',
      icon: '🔬', sortOrder: 4, parentId: albTarimUrunleri.id,
      description: 'Çinko, demir, mangan, bor ve diğer iz elementler',
    },
  })

  const albSivi = await prisma.category.upsert({
    where: { slug: 'alb-sivi-gubreler-amino' },
    update: { parentId: albTarimUrunleri.id, sortOrder: 5, isActive: true },
    create: {
      brandId: albTarim.id, name: 'Sıvı Gübreler ve Amino Asitler', slug: 'alb-sivi-gubreler-amino',
      icon: '🧪', sortOrder: 5, parentId: albTarimUrunleri.id,
      description: 'Sıvı NPK, amino asit ve biostimulant formülasyonlar',
    },
  })

  const albDeniz = await prisma.category.upsert({
    where: { slug: 'alb-deniz-yosunu-organik' },
    update: { parentId: albTarimUrunleri.id, sortOrder: 6, isActive: true },
    create: {
      brandId: albTarim.id, name: 'Deniz Yosunu ve Organik Gübreler', slug: 'alb-deniz-yosunu-organik',
      icon: '🌊', sortOrder: 6, parentId: albTarimUrunleri.id,
      description: 'Doğal kaynaklı organik biostimulantlar ve deniz yosunu özleri',
    },
  })

  console.log('  ✅ 7 alt kategori oluşturuldu')

  // ─────────────────────────────────────────────────────────────────────────
  // 2. İthal Ürünler — Toprak İyileştirici ekle (eksikti) + sıraları düzelt
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n📂 İthal Ürünler güncelleniyor...')

  const ithalToprak = await prisma.category.upsert({
    where: { slug: 'ithal-toprak-iyilestirici' },
    update: { parentId: ithalUrunler.id, sortOrder: 0, isActive: true },
    create: {
      brandId: albTarim.id, name: 'Toprak İyileştirici', slug: 'ithal-toprak-iyilestirici',
      icon: '🪨', sortOrder: 0, parentId: ithalUrunler.id,
      description: 'İthal pH düzenleyici, humik asit ve toprak kondisyonerleri',
    },
  })
  void ithalToprak

  // Mevcut ithal alt kategorilerin sort order'larını güncelle
  await prisma.category.update({ where: { slug: 'taban-gubresi' }, data: { sortOrder: 1 } })
  await prisma.category.update({ where: { slug: 'damla-sulama-gubreleri' }, data: { sortOrder: 2 } })
  await prisma.category.update({ where: { slug: 'yaprak-gubreleri' }, data: { sortOrder: 3 } })
  await prisma.category.update({ where: { slug: 'mikro-elementler' }, data: { sortOrder: 4 } })
  await prisma.category.update({ where: { slug: 'sivi-gubreler-amino' }, data: { sortOrder: 5 } })
  await prisma.category.update({ where: { slug: 'deniz-yosunu-organik' }, data: { sortOrder: 6 } })
  // Diğer ürünler → deaktive
  await prisma.category.updateMany({
    where: { slug: 'diger-ithal-urunler' },
    data: { isActive: false },
  })

  // İthal alt kategorileri için ID'leri bul (ürün taşıma adımında lazım)
  const ithalTabanGubre = await prisma.category.findUniqueOrThrow({ where: { slug: 'taban-gubresi' } })
  const ithalDamla = await prisma.category.findUniqueOrThrow({ where: { slug: 'damla-sulama-gubreleri' } })
  const ithalYaprak = await prisma.category.findUniqueOrThrow({ where: { slug: 'yaprak-gubreleri' } })
  const ithalMikro = await prisma.category.findUniqueOrThrow({ where: { slug: 'mikro-elementler' } })
  const ithalSivi = await prisma.category.findUniqueOrThrow({ where: { slug: 'sivi-gubreler-amino' } })
  const ithalDeniz = await prisma.category.findUniqueOrThrow({ where: { slug: 'deniz-yosunu-organik' } })

  console.log('  ✅ İthal Ürünler güncellendi (Toprak İyileştirici eklendi)')

  // ─────────────────────────────────────────────────────────────────────────
  // 3. Seed'deki bilinen ALB Tarım ürünlerini yeni kategorilere taşı
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n📦 Bilinen ALB Tarım ürünleri yeni kategorilere taşınıyor...')

  const knownMoves: Array<{ slug: string; catId: number; reason: string }> = [
    { slug: 'baroute', catId: albYaprak.id, reason: 'Yaprak gübresi → Yaprak Gübreleri' },
    { slug: 'cloud', catId: albSivi.id, reason: 'Yayıcı yapıştırıcı → Sıvı Gübreler ve Amino Asitler' },
    { slug: 'phoska', catId: albTabanGubre.id, reason: 'NPK granül → Taban Gübresi' },
    { slug: 'stamin', catId: albDeniz.id, reason: 'Amino asit+deniz yosunu → Deniz Yosunu ve Organik Gübreler' },
    { slug: 'calm', catId: albSivi.id, reason: 'Ca+Mg sıvı gübre → Sıvı Gübreler ve Amino Asitler' },
    { slug: 'tracer', catId: albYaprak.id, reason: 'Yapraktan uygulama → Yaprak Gübreleri' },
    { slug: '25-5-5-npk-gubre', catId: albTabanGubre.id, reason: 'NPK granül → Taban Gübresi' },
    { slug: 'potassio', catId: albDamla.id, reason: 'Kristal çözünür K → Damla Sulama Gübreleri' },
    { slug: 'pre-feed', catId: albToprak.id, reason: 'Ekim öncesi → Toprak İyileştirici' },
    { slug: 'bazasul', catId: albSivi.id, reason: 'Sıvı azotlu gübre → Sıvı Gübreler ve Amino Asitler' },
  ]

  for (const m of knownMoves) {
    try {
      await prisma.product.update({ where: { slug: m.slug }, data: { categoryId: m.catId } })
      console.log(`  ✅ ${m.slug} → ${m.reason}`)
    } catch {
      console.log(`  ⚠️  ${m.slug} bulunamadı (atlandı)`)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 4. Toptancısı / Bayilik marka kategorilerindeki ürünleri İthal Ürünler'e taşı
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n📦 Toptancı/Bayilik ürünleri İthal Ürünler altına taşınıyor...')

  // Her eski marka kategorisi → en mantıklı ithal alt kategori
  const brandCatMoves: Array<{ slug: string; catId: number }> = [
    { slug: 'timac-agro', catId: ithalDamla.id },          // Timac Agro → Damla Sulama Gübreleri
    { slug: 'bazachem', catId: ithalSivi.id },              // Bazachem → Sıvı Gübreler ve Amino Asitler
    { slug: 'haifa-cal', catId: ithalDamla.id },            // Haifa Cal → Damla Sulama Gübreleri
    { slug: 'stoller', catId: ithalDeniz.id },              // Stoller → Deniz Yosunu ve Organik Gübreler
    { slug: 'atlantica-agricola', catId: ithalDeniz.id },   // Atlantica → Deniz Yosunu ve Organik Gübreler
    { slug: 'unittar', catId: ithalDamla.id },              // Unittar → Damla Sulama Gübreleri
    { slug: 'lances-link', catId: ithalYaprak.id },         // Lance's Link → Yaprak Gübreleri
    { slug: 'lebosol', catId: ithalMikro.id },              // Lebosol → Mikro Elementler
    { slug: 'tamagro', catId: ithalTabanGubre.id },         // Tamagro → Taban Gübresi
  ]

  for (const m of brandCatMoves) {
    const cat = await prisma.category.findUnique({ where: { slug: m.slug } })
    if (!cat) continue
    const moved = await prisma.product.updateMany({
      where: { categoryId: cat.id },
      data: { categoryId: m.catId },
    })
    if (moved.count > 0) {
      console.log(`  ✅ ${m.slug} → ${moved.count} ürün taşındı`)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 5. Eski flat kategorilerdeki kalan ürünleri taşı (gubreler, ilac, toprak, sulama)
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n📦 Eski flat kategori ürünleri taşınıyor...')

  const flatMoves: Array<{ slug: string; catId: number }> = [
    { slug: 'gubreler', catId: albTabanGubre.id },   // Gübreler → Taban Gübresi (fallback)
    { slug: 'ilac', catId: albYaprak.id },            // Tarım İlaçları → Yaprak Gübreleri (fallback)
    { slug: 'toprak', catId: albToprak.id },          // Toprak İyileştirici (eski) → yeni Toprak İyileştirici
    { slug: 'sulama', catId: albDamla.id },           // Sulama → Damla Sulama Gübreleri (fallback)
  ]

  for (const m of flatMoves) {
    const cat = await prisma.category.findUnique({ where: { slug: m.slug } })
    if (!cat) continue
    const moved = await prisma.product.updateMany({
      where: { categoryId: cat.id },
      data: { categoryId: m.catId },
    })
    if (moved.count > 0) {
      console.log(`  ✅ ${m.slug} → ${moved.count} ürün taşındı`)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 6. Artık kullanılmayan kategorileri deaktive et
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n🗑️  Eski kategoriler deaktive ediliyor...')

  const toDeactivate = [
    // Parent kategoriler
    'toptanci-olunanlar',
    'bayilik-olunanlar',
    // Toptancı alt kategorileri
    'atlantica-agricola', 'unittar', 'lances-link', 'lebosol', 'tamagro',
    // Bayilik alt kategorileri
    'timac-agro', 'bazachem', 'haifa-cal', 'stoller',
    // Eski flat kategoriler
    'sulama', 'gubreler', 'ilac', 'toprak',
    // Diğer
    'diger-ithal-urunler',
  ]

  const result = await prisma.category.updateMany({
    where: { slug: { in: toDeactivate } },
    data: { isActive: false },
  })
  console.log(`  ✅ ${result.count} kategori deaktive edildi`)

  // ─────────────────────────────────────────────────────────────────────────
  // 7. Sonuç özeti
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n📊 Aktif ALB Tarım Kategori Yapısı:')
  const activeCats = await prisma.category.findMany({
    where: { brand: { key: 'alb-tarim' }, isActive: true },
    orderBy: [{ parentId: 'asc' }, { sortOrder: 'asc' }],
  })

  for (const cat of activeCats) {
    const prefix = cat.parentId == null ? '📁 ' : '   └─ '
    console.log(`${prefix}${cat.name} [${cat.slug}]`)
  }

  const productCount = await prisma.product.count({ where: { brand: { key: 'alb-tarim' }, isActive: true } })
  console.log(`\n✅ Toplam aktif ALB Tarım ürünü: ${productCount}`)
  console.log('\n🎉 Yeniden yapılandırma tamamlandı!')
}

main()
  .catch((e) => {
    console.error('❌ Hata:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
