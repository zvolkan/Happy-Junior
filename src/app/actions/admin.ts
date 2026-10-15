'use server'

import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { deleteProductImage, getSignedUploadUrl } from '@/lib/supabase-admin'
import { createAdminToken, verifyAdminToken, timingSafeEqualHash } from '@/lib/admin-auth'
import { safeInternalPath } from '@/lib/safe-redirect'
import { clientIp, rateLimit, rateLimitReset } from '@/lib/rate-limit'

const ADMIN_COOKIE = 'admin_session'
const COOKIE_MAX_AGE = 60 * 60 * 8 // 8 saat

// ─── YETKİ KONTROLÜ ──────────────────────────────────────────────────────────

/**
 * Her admin server action'ının BAŞINDA çağrılmalı.
 *
 * Middleware yalnızca yol (pathname) bazlı koruma yapar; server action'lar ise
 * herhangi bir herkese açık sayfaya POST edilerek çağrılabilir. Dolayısıyla
 * yetki kontrolünün action'ın kendi içinde olması şart.
 */
async function requireAdmin(): Promise<void> {
  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_COOKIE)?.value
  if (!(await verifyAdminToken(token))) {
    throw new Error('Yetkisiz erişim: admin oturumu gerekli')
  }
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────

// Brute-force yavaşlatma — ayrıntılar ve sınırları için `src/lib/rate-limit.ts`.
// IP başına 5, ayrıca IP'DEN BAĞIMSIZ olarak 15 dakikada toplam 20 deneme.
// İkinci sayaç şart: IP taklit edilebildiği için tek başına IP sayacı
// atlatılabiliyordu.
const MAX_ATTEMPTS = 5
const MAX_ATTEMPTS_GLOBAL = 20
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000

export async function adminLogin(formData: FormData) {
  const password = formData.get('password') as string
  const redirectTo = safeInternalPath(formData.get('redirect') as string, '/admin')

  const headerList = await headers()
  const ip = clientIp(headerList)

  const perIp = await rateLimit('admin-login', ip, MAX_ATTEMPTS, ATTEMPT_WINDOW_MS)
  const global = await rateLimit('admin-login', '__global__', MAX_ATTEMPTS_GLOBAL, ATTEMPT_WINDOW_MS)

  if (!perIp.ok || !global.ok) {
    if (!global.ok) console.warn('[admin] küresel giriş hız sınırı doldu')
    redirect('/admin/giris?error=rate-limit')
  }

  const expected = process.env.ADMIN_PASSWORD

  // Sunucuda şifre tanımlı değilse girişe asla izin verme
  if (!expected) {
    console.error('[admin] ADMIN_PASSWORD ortam değişkeni tanımlı değil')
    redirect('/admin/giris?error=config')
  }

  if (!password || !(await timingSafeEqualHash(password, expected))) {
    // Otomatik denemeleri yavaşlatmak için sabit gecikme
    await new Promise((resolve) => setTimeout(resolve, 600))
    redirect('/admin/giris?error=1')
  }

  await rateLimitReset('admin-login', ip)

  const cookieStore = await cookies()
  cookieStore.set(ADMIN_COOKIE, await createAdminToken(COOKIE_MAX_AGE), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  })

  redirect(redirectTo)
}

export async function adminLogout() {
  const cookieStore = await cookies()
  cookieStore.delete(ADMIN_COOKIE)
  redirect('/admin/giris')
}

// ─── UPLOAD ───────────────────────────────────────────────────────────────────

/**
 * İstemcinin Supabase Storage'a doğrudan yüklemesi için signed URL üretir.
 * Dosya Vercel serverless function'dan geçmez → 4.5 MB payload limiti aşılmaz.
 */
export async function createSignedUploadUrl(fileName: string) {
  await requireAdmin()

  // Dosya adını temizle: yol geçişi (../), eğik çizgi ve tehlikeli karakterler
  const safeName = fileName
    .split(/[/\\]/)
    .pop()!
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/^\.+/, '')
    .slice(0, 120)

  // SVG kabul edilmez: Storage aynı origin'den servis edilirse SVG içine
  // gömülü script depolanmış XSS'e dönüşebilir.
  if (!safeName || !/\.(jpg|jpeg|png|webp|avif)$/i.test(safeName)) {
    throw new Error('Yalnızca JPG, PNG, WEBP ve AVIF görselleri yüklenebilir.')
  }

  return getSignedUploadUrl(safeName)
}

/**
 * Görsel adresini şema açısından doğrular.
 *
 * Eskiden serbest metin kutusundan gelen değer doğrudan veritabanına
 * yazılıyordu; `javascript:` veya `data:` şemalı bir adres kabul ediliyordu.
 * `next/image` zaten host beyaz listesiyle kısıtlı olduğu için pratik etkisi
 * sınırlıydı, ama geçersiz adres bozuk görsel olarak kalıyordu.
 */
function gecerliGorselAdresi(raw: string | null): string | null {
  const url = (raw ?? '').trim()
  if (!url) return null
  if (url.length > 500) return null
  // Yalnızca https ve site-içi mutlak yol
  if (!/^(https:\/\/|\/)/i.test(url)) return null
  if (/^\/\//.test(url)) return null // protokol-göreli
  return url
}

// ─── BRANDS & CATEGORIES ─────────────────────────────────────────────────────

export async function getBrandsForAdmin() {
  await requireAdmin()

  return prisma.brand.findMany({ orderBy: { name: 'asc' } })
}

export async function getCategoriesForAdmin(brandId?: number) {
  await requireAdmin()

  return prisma.category.findMany({
    where: {
      isActive: true,
      ...(brandId ? { brandId } : {}),
    },
    orderBy: [{ brand: { name: 'asc' } }, { sortOrder: 'asc' }],
    include: { brand: true },
  })
}

// ─── PRODUCT LIST ─────────────────────────────────────────────────────────────

export async function getProductsForAdmin(brandKey?: string) {
  await requireAdmin()

  return prisma.product.findMany({
    where: brandKey ? { brand: { key: brandKey } } : undefined,
    include: {
      brand: true,
      category: true,
      images: { where: { isPrimary: true }, take: 1 },
    },
    orderBy: [{ createdAt: 'desc' }],
  })
}

export async function getProductForEdit(id: string) {
  await requireAdmin()

  return prisma.product.findUnique({
    where: { id },
    include: {
      brand: true,
      category: true,
      images: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }] },
      specs: { orderBy: { sortOrder: 'asc' } },
      tags: { include: { tag: true } },
    },
  })
}


// ─── ÜRÜN FORMU DOĞRULAMA ────────────────────────────────────────────────────

interface ProductInput {
  slug: string
  name: string
  categoryId: number
  brandId: number
  price: number
  salePrice: number | null
  stockQuantity: number
  unit: string
  sku: string | null
  description: string
  shortDescription: string
  isActive: boolean
  isFeatured: boolean
  productBrand: string | null
  vatRate: number
}

/**
 * Form verisini doğrular.
 *
 * Eskiden `parseFloat(formData.get('price'))` doğrudan Prisma'ya gidiyordu;
 * boş veya geçersiz girdide NaN oluşup "Invalid value" hatasıyla admin genel
 * hata sayfasına düşüyordu.
 */
/**
 * Ürün formu işlemlerinin dönüş tipi.
 *
 * Bu aksiyonlar eskiden `throw new Error('İndirimli fiyat, normal fiyattan
 * düşük olmalıdır.')` gibi net mesajlar fırlatıyordu. Next.js üretim
 * derlemesinde sunucu aksiyonundan fırlatılan hatanın MESAJINI GİZLİYOR;
 * istemciye yalnızca anlamsız bir digest ulaşıyor. Yani yönetici formu
 * kaydedemiyor ama neden kaydedemediğini de göremiyordu. Hata fırlatmak
 * yerine sonuç nesnesi dönülüyor.
 *
 * Başarı durumunda fonksiyon `redirect()` ile bittiği için hiç dönmüyor.
 */
export type ProductActionResult = { ok: false; error: string }

/** Doğrulama hatasında mesajı, başarıda ayrıştırılmış girdiyi döner */
function parseProductForm(formData: FormData): ProductInput | string {
  const num = (key: string): number => {
    const raw = (formData.get(key) as string | null)?.trim()
    const value = Number(raw)
    return Number.isFinite(value) ? value : NaN
  }

  const slug = ((formData.get('slug') as string) ?? '').trim().toLowerCase()
  const name = ((formData.get('name') as string) ?? '').trim()
  const categoryId = num('categoryId')
  const brandId = num('brandId')
  const price = num('price')
  const salePriceRaw = (formData.get('salePrice') as string | null)?.trim()
  const stockRaw = (formData.get('stockQuantity') as string | null)?.trim()

  if (!name || name.length < 2) return 'Ürün adı en az 2 karakter olmalıdır.'
  if (name.length > 255) return 'Ürün adı çok uzun (en fazla 255 karakter).'

  if (!slug) return 'Slug (URL adı) zorunludur.'
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return 'Slug yalnızca küçük harf, rakam ve tire içerebilir (örn. "taban-gubresi").'
  }

  if (!Number.isInteger(categoryId) || categoryId <= 0) return 'Geçerli bir alt kategori seçin.'
  if (!Number.isInteger(brandId) || brandId <= 0) return 'Geçerli bir marka seçin.'

  // Sıfır fiyat bilerek reddediliyor: ücretsiz ürün diye bir senaryo yok ve
  // sıfır, ödeme akışında satır toplamını da sıfırlıyor.
  if (!Number.isFinite(price) || price <= 0) return 'Geçerli bir fiyat girin.'
  if (price > 9_999_999) return 'Fiyat çok yüksek.'

  let salePrice: number | null = null
  if (salePriceRaw) {
    const value = Number(salePriceRaw)
    // DİKKAT: "0" boş olmayan bir metin olduğu için yukarıdaki koşuldan geçiyor.
    // Sıfır kontrolü olmadığında indirimli fiyat 0 kaydediliyordu; sepet
    // `salePrice > 0` kuralıyla dolu fiyatı gösterirken ödeme tarafı `??` ile
    // sıfırı geçirdiği için ürün bedavaya satılıyordu ve fark hiçbir ekranda
    // görünmüyordu. Kampanyayı kapatmak için alan BOŞ bırakılmalı, 0 yazılmamalı.
    if (!Number.isFinite(value) || value <= 0)
      return 'İndirimli fiyat sıfırdan büyük olmalıdır. Kampanyayı kaldırmak için alanı boş bırakın.'
    if (value >= price) return 'İndirimli fiyat, normal fiyattan düşük olmalıdır.'
    salePrice = value
  }

  const stockQuantity = stockRaw ? Number(stockRaw) : 0
  if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
    return 'Stok adedi 0 veya daha büyük bir tam sayı olmalıdır.'
  }

  return {
    slug,
    name,
    categoryId,
    brandId,
    price,
    salePrice,
    stockQuantity,
    unit: ((formData.get('unit') as string) || 'adet').slice(0, 50),
    sku: ((formData.get('sku') as string) || '').trim().slice(0, 100) || null,
    description: ((formData.get('description') as string) || '').slice(0, 20000),
    shortDescription: ((formData.get('shortDescription') as string) || '').slice(0, 1000),
    isActive: formData.get('isActive') === 'true',
    isFeatured: formData.get('isFeatured') === 'true',
    productBrand: ((formData.get('productBrand') as string) || '').trim().slice(0, 100) || null,
    vatRate: gecerliKdvOrani(formData.get('vatRate')),
  }
}

/** Formda seçilebilen KDV oranları. %1 kaldırıldı, yerine %0 geldi. */
const KDV_ORANLARI = [0, 10, 20] as const

/**
 * Form alanından KDV oranını okur.
 *
 * DİKKAT — buradaki tip kontrolü şart. Eskiden kod şöyleydi:
 *
 *   [1, 10, 20].includes(Number(formData.get('vatRate'))) ? ... : 20
 *
 * `formData.get()` alan yoksa `null` döner ve `Number(null)` 0'dır. Liste
 * `[1, 10, 20]` iken 0 listede olmadığı için sessizce 20'ye düşüyordu, yani
 * kaza sonucu doğru davranıyordu. Liste `[0, 10, 20]` olunca aynı kod, alan
 * hiç gönderilmemiş bir formda ürünü KDV'siz yapardı. Bu yüzden önce değerin
 * gerçekten gönderilmiş bir metin olduğunu doğruluyoruz.
 */
function gecerliKdvOrani(deger: FormDataEntryValue | null): number {
  if (typeof deger !== 'string' || deger.trim() === '') return 20

  const oran = Number(deger)
  return (KDV_ORANLARI as readonly number[]).includes(oran) ? oran : 20
}

/** Prisma'nın benzersizlik/ilişki hatalarını okunabilir mesaja çevirir */
function friendlyPrismaError(error: unknown): string {
  const code = (error as { code?: string })?.code
  const target = ((error as { meta?: { target?: string[] } })?.meta?.target ?? []).join(', ')

  if (code === 'P2002') {
    if (target.includes('slug')) return 'Bu slug başka bir üründe kullanılıyor. Farklı bir slug girin.'
    if (target.includes('sku')) return 'Bu SKU başka bir üründe kullanılıyor.'
    return 'Bu değer başka bir kayıtta kullanılıyor.'
  }
  if (code === 'P2003') return 'Seçilen kategori veya marka bulunamadı.'
  if (code === 'P2025') return 'Kayıt bulunamadı.'
  return 'İşlem tamamlanamadı. Lütfen bilgileri kontrol edip tekrar deneyin.'
}

// ─── CREATE ───────────────────────────────────────────────────────────────────

export async function createProduct(formData: FormData): Promise<ProductActionResult | void> {
  try {
    await requireAdmin()
  } catch {
    return { ok: false, error: 'Oturumunuz sona ermiş görünüyor. Lütfen yeniden giriş yapın.' }
  }

  // NOT: Eskiden burada `formData.get('imageFile')` ile ikinci bir yükleme yolu
  // vardı. O yolda ne uzantı beyaz listesi, ne MIME kontrolü, ne boyut sınırı
  // vardı; uzantı doğrudan istemcinin verdiği dosya adından türüyor ve
  // `contentType` olarak yine istemcinin bildirdiği tür kullanılıyordu — yani
  // herkese açık kovaya `text/html` içerikli bir dosya yazılabiliyordu.
  // Arayüz bu yolu zaten kullanmıyor (ProductForm gönderimden önce alanı
  // siliyor, dosya doğrudan `createSignedUploadUrl` ile Supabase'e gidiyor).
  // Ölü ve tehlikeli olduğu için kaldırıldı.
  let imageUrl = gecerliGorselAdresi(formData.get('imageUrl') as string | null)

  const parsed = parseProductForm(formData)
  if (typeof parsed === 'string') return { ok: false, error: parsed }
  const input = parsed

  let product: { id: string }
  try {
    product = await prisma.product.create({
      data: {
        ...input,
        images: imageUrl
          ? {
              create: [{ url: imageUrl, altText: input.name, isPrimary: true, sortOrder: 0 }],
            }
          : undefined,
      },
      select: { id: true },
    })
  } catch (error) {
    console.error('[admin] ürün oluşturulamadı:', error)
    return { ok: false, error: friendlyPrismaError(error) }
  }

  // Teknik özellikler — buradaki bir hata ürünü geri almaz, ürün kaydedildi.
  // Bu yüzden sessizce loglanıp akış sürdürülüyor.
  try {
  const specsRaw = formData.get('specs') as string
  if (specsRaw) {
    const specs = JSON.parse(specsRaw) as Array<{ name: string; value: string; unit?: string }>
    for (let i = 0; i < specs.length; i++) {
      const s = specs[i]
      if (s.name && s.value) {
        await prisma.productSpec.create({
          data: {
            productId: product.id,
            specName: s.name,
            specValue: s.value,
            specUnit: s.unit || null,
            sortOrder: i,
          },
        })
      }
    }
  }
  } catch (error) {
    console.error('[admin] teknik özellikler kaydedilemedi:', error)
  }

  const redirectBrand = (formData.get('redirectBrand') as string) || 'alb-tarim'
  // Panel marka bazlı: listeler /admin/<marka>/urunler adresinde.
  revalidatePath('/admin/alb-tarim/urunler')
  revalidatePath('/admin/alb-su-aritma/urunler')
  revalidatePath(`/alb-tarim/urunler`)
  revalidatePath(`/alb-su-aritma/urunler`)
  redirect(`/admin/${redirectBrand}/urunler`)
}

// ─── UPDATE ───────────────────────────────────────────────────────────────────

export async function updateProduct(
  id: string,
  formData: FormData,
): Promise<ProductActionResult | void> {
  try {
    await requireAdmin()
  } catch {
    return { ok: false, error: 'Oturumunuz sona ermiş görünüyor. Lütfen yeniden giriş yapın.' }
  }

  // NOT: Eskiden burada `formData.get('imageFile')` ile ikinci bir yükleme yolu
  // vardı. O yolda ne uzantı beyaz listesi, ne MIME kontrolü, ne boyut sınırı
  // vardı; uzantı doğrudan istemcinin verdiği dosya adından türüyor ve
  // `contentType` olarak yine istemcinin bildirdiği tür kullanılıyordu — yani
  // herkese açık kovaya `text/html` içerikli bir dosya yazılabiliyordu.
  // Arayüz bu yolu zaten kullanmıyor (ProductForm gönderimden önce alanı
  // siliyor, dosya doğrudan `createSignedUploadUrl` ile Supabase'e gidiyor).
  // Ölü ve tehlikeli olduğu için kaldırıldı.
  let imageUrl = gecerliGorselAdresi(formData.get('imageUrl') as string | null)
  const replaceImage = formData.get('replaceImage') === 'true'

  const parsed = parseProductForm(formData)
  if (typeof parsed === 'string') return { ok: false, error: parsed }
  const input = parsed

  try {
    await prisma.product.update({ where: { id }, data: input })
  } catch (error) {
    console.error('[admin] ürün güncellenemedi:', id, error)
    return { ok: false, error: friendlyPrismaError(error) }
  }

  // Kapak görselini güncelle.
  //
  // Önceden burada `deleteMany` ile ürünün TÜM görselleri siliniyordu. Çoklu
  // görsel desteğiyle birlikte bu, formu her kaydedişte galerinin silinmesi
  // anlamına gelirdi. Artık yalnızca kapak değiştirilir; diğer görseller kalır.
  if (imageUrl && replaceImage) {
    const current = await prisma.productImage.findFirst({
      where: { productId: id, isPrimary: true },
      select: { id: true, url: true },
    })

    if (current) {
      if (current.url !== imageUrl) {
        await prisma.productImage.update({
          where: { id: current.id },
          data: { url: imageUrl, altText: input.name },
        })
        // Storage'daki eski dosyayı temizle (public/ içindekilere dokunma)
        if (current.url.includes('supabase')) {
          const fileName = current.url.split('/').pop()
          if (fileName) await deleteProductImage(fileName).catch(() => {})
        }
      }
    } else {
      await prisma.productImage.create({
        data: { productId: id, url: imageUrl, altText: input.name, isPrimary: true, sortOrder: 0 },
      })
    }
  }

  // Teknik özellikler: sil + yeniden oluştur
  const specsRaw = formData.get('specs') as string
  if (specsRaw) {
    const specs = JSON.parse(specsRaw) as Array<{ name: string; value: string; unit?: string }>
    await prisma.productSpec.deleteMany({ where: { productId: id } })
    for (let i = 0; i < specs.length; i++) {
      const s = specs[i]
      if (s.name && s.value) {
        await prisma.productSpec.create({
          data: {
            productId: id,
            specName: s.name,
            specValue: s.value,
            specUnit: s.unit || null,
            sortOrder: i,
          },
        })
      }
    }
  }

  const redirectBrand = (formData.get('redirectBrand') as string) || 'alb-tarim'
  // Panel marka bazlı: listeler /admin/<marka>/urunler adresinde.
  revalidatePath('/admin/alb-tarim/urunler')
  revalidatePath('/admin/alb-su-aritma/urunler')
  revalidatePath(`/alb-tarim/urunler`)
  revalidatePath(`/alb-su-aritma/urunler`)
  redirect(`/admin/${redirectBrand}/urunler`)
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

export type DeleteProductResult =
  | { ok: true; archived: false }
  | { ok: true; archived: true; orderCount: number }
  | { ok: false; error: string }

/**
 * Ürünü siler.
 *
 * Siparişi olan ürün SİLİNEMEZ (OrderItem yabancı anahtarı engeller ve geçmiş
 * siparişlerin bozulmaması gerekir) — bu durumda ürün pasife alınır (arşivlenir).
 *
 * Eskiden görseller silme denemesinden ÖNCE Storage'dan kaldırılıyordu; yabancı
 * anahtar hatası verince ürün DB'de kalıyor ama görselleri yok oluyordu.
 */
export async function deleteProduct(id: string): Promise<DeleteProductResult> {
  await requireAdmin()

  // Önce siparişte kullanılmış mı bak — görsellere dokunmadan
  const orderCount = await prisma.orderItem.count({ where: { productId: id } })

  if (orderCount > 0) {
    // Geçmiş siparişleri korumak için sil değil, arşivle
    await prisma.product.update({
      where: { id },
      data: { isActive: false, isFeatured: false },
    })
    // Panel marka bazlı: listeler /admin/<marka>/urunler adresinde.
  revalidatePath('/admin/alb-tarim/urunler')
  revalidatePath('/admin/alb-su-aritma/urunler')
    revalidatePath('/alb-tarim/urunler')
    revalidatePath('/alb-su-aritma/urunler')
    return { ok: true, archived: true, orderCount }
  }

  try {
    // Önce kaydı sil; başarılıysa görselleri temizle
    const images = await prisma.productImage.findMany({ where: { productId: id } })

    await prisma.product.delete({ where: { id } })

    for (const img of images) {
      // Sadece Supabase Storage URL'lerini sil (public/ içindekiler değil)
      if (img.url.includes('supabase')) {
        const fileName = img.url.split('/').pop()
        if (fileName) await deleteProductImage(fileName).catch(() => {})
      }
    }

    // Panel marka bazlı: listeler /admin/<marka>/urunler adresinde.
  revalidatePath('/admin/alb-tarim/urunler')
  revalidatePath('/admin/alb-su-aritma/urunler')
    revalidatePath('/alb-tarim/urunler')
    revalidatePath('/alb-su-aritma/urunler')
    return { ok: true, archived: false }
  } catch (error) {
    console.error('[admin] ürün silinemedi:', id, error)
    return {
      ok: false,
      error: 'Ürün silinemedi. Başka bir kayıtla ilişkili olabilir; pasife almayı deneyin.',
    }
  }
}

// ─── TOGGLE ───────────────────────────────────────────────────────────────────

export async function toggleProductActive(id: string, current: boolean) {
  await requireAdmin()

  await prisma.product.update({ where: { id }, data: { isActive: !current } })
  // Panel marka bazlı: listeler /admin/<marka>/urunler adresinde.
  revalidatePath('/admin/alb-tarim/urunler')
  revalidatePath('/admin/alb-su-aritma/urunler')
}

export async function toggleProductFeatured(id: string, current: boolean) {
  await requireAdmin()

  await prisma.product.update({ where: { id }, data: { isFeatured: !current } })
  // Panel marka bazlı: listeler /admin/<marka>/urunler adresinde.
  revalidatePath('/admin/alb-tarim/urunler')
  revalidatePath('/admin/alb-su-aritma/urunler')
}
