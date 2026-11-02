'use server'

import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { BRAND } from '@/lib/constants'
import { slugify } from '@/lib/utils'
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
//
// Form sadeleştirildi: mağaza tek (marka seçimi yok), slug ve ürün kodu
// sistemde üretiliyor, birim ve teknik özellik alanları kaldırıldı (bilgiler
// açıklamaya yazılıyor). Kategori listede yoksa formdan yenisi açılabiliyor.

/** Formdan okunan, veritabanına yazılmaya hazır alanlar */
interface ProductInput {
  name: string
  price: number
  salePrice: number | null
  stockQuantity: number
  description: string
  shortDescription: string
  isActive: boolean
  isFeatured: boolean
  vatRate: number
}

/** Kategori seçimi: mevcut bir alt kategori ya da açılacak yeni kategori(ler) */
type KategoriSecimi =
  | { tur: 'mevcut'; categoryId: number }
  | { tur: 'yeni'; anaId: number | null; yeniAnaAdi: string | null; yeniAltAdi: string }

/**
 * Ürün formu işlemlerinin dönüş tipi.
 *
 * Next.js üretim derlemesinde sunucu aksiyonundan fırlatılan hatanın mesajını
 * gizliyor; bu yüzden hata fırlatmak yerine sonuç nesnesi dönülüyor.
 * Başarı durumunda fonksiyon `redirect()` ile bittiği için hiç dönmüyor.
 */
export type ProductActionResult = { ok: false; error: string }

const YENI = 'yeni'

/** Doğrulama hatasında mesajı, başarıda ayrıştırılmış girdiyi döner */
function parseProductForm(formData: FormData): { input: ProductInput; kategori: KategoriSecimi } | string {
  const metin = (key: string) => ((formData.get(key) as string | null) ?? '').trim()
  const num = (key: string): number => {
    const value = Number(metin(key))
    return Number.isFinite(value) ? value : NaN
  }

  const name = metin('name')
  const price = num('price')
  const salePriceRaw = metin('salePrice')
  const stockRaw = metin('stockQuantity')

  if (!name || name.length < 2) return 'Ürün adı en az 2 karakter olmalıdır.'
  if (name.length > 255) return 'Ürün adı çok uzun (en fazla 255 karakter).'

  // ── Kategori ──
  const anaRaw = metin('anaKategori')
  const altRaw = metin('altKategori')
  let kategori: KategoriSecimi
  if (anaRaw === YENI || altRaw === YENI) {
    const yeniAnaAdi = anaRaw === YENI ? metin('yeniAnaKategori') : null
    const yeniAltAdi = metin('yeniAltKategori')
    const anaId = anaRaw === YENI ? null : Number(anaRaw)
    if (anaRaw === YENI && (!yeniAnaAdi || yeniAnaAdi.length < 2)) return 'Yeni ana kategorinin adını yazın.'
    if (anaId !== null && (!Number.isInteger(anaId) || anaId <= 0)) return 'Bir ana kategori seçin.'
    if (!yeniAltAdi || yeniAltAdi.length < 2) return 'Yeni alt kategorinin adını yazın.'
    if ((yeniAnaAdi?.length ?? 0) > 100 || yeniAltAdi.length > 100) return 'Kategori adı çok uzun.'
    kategori = { tur: 'yeni', anaId, yeniAnaAdi, yeniAltAdi }
  } else {
    const categoryId = Number(altRaw)
    if (!Number.isInteger(categoryId) || categoryId <= 0) return 'Bir alt kategori seçin.'
    kategori = { tur: 'mevcut', categoryId }
  }

  // Sıfır fiyat bilerek reddediliyor: ücretsiz ürün diye bir senaryo yok ve
  // sıfır, ödeme akışında satır toplamını da sıfırlıyor.
  if (!Number.isFinite(price) || price <= 0) return 'Geçerli bir fiyat girin.'
  if (price > 9_999_999) return 'Fiyat çok yüksek.'

  let salePrice: number | null = null
  if (salePriceRaw) {
    const value = Number(salePriceRaw)
    // "0" yazılırsa ürün bedavaya satılırdı; kampanyayı kapatmak için alan boş bırakılır.
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
    kategori,
    input: {
      name,
      price,
      salePrice,
      stockQuantity,
      description: metin('description').slice(0, 20000),
      shortDescription: metin('shortDescription').slice(0, 1000),
      isActive: formData.get('isActive') === 'true',
      isFeatured: formData.get('isFeatured') === 'true',
      vatRate: gecerliKdvOrani(formData.get('vatRate')),
    },
  }
}

/** Formda seçilebilen KDV oranları. */
const KDV_ORANLARI = [0, 10, 20] as const

/**
 * Form alanından KDV oranını okur. Alan hiç gönderilmemişse `Number(null)`
 * 0 olur ve ürün sessizce KDV'siz kalırdı; bu yüzden önce değerin gerçekten
 * gönderilmiş bir metin olduğu doğrulanıyor.
 */
function gecerliKdvOrani(deger: FormDataEntryValue | null): number {
  if (typeof deger !== 'string' || deger.trim() === '') return 20
  const oran = Number(deger)
  return (KDV_ORANLARI as readonly number[]).includes(oran) ? oran : 20
}

/** Prisma'nın benzersizlik/ilişki hatalarını okunabilir mesaja çevirir */
function friendlyPrismaError(error: unknown): string {
  const code = (error as { code?: string })?.code
  if (code === 'P2002') return 'Bu değer başka bir kayıtta kullanılıyor.'
  if (code === 'P2003') return 'Seçilen kategori bulunamadı.'
  if (code === 'P2025') return 'Kayıt bulunamadı.'
  return 'İşlem tamamlanamadı. Lütfen bilgileri kontrol edip tekrar deneyin.'
}

/** Mağazanın veritabanındaki marka kaydı (tek mağaza) */
async function magazaBrandId(): Promise<number> {
  const brand = await prisma.brand.findUnique({ where: { key: BRAND.key }, select: { id: true } })
  if (!brand) throw new Error(`Marka kaydı yok: ${BRAND.key}`)
  return brand.id
}

/** Tabloda henüz kullanılmayan bir slug üretir: ad, ad-2, ad-3 … */
async function bosSlug(
  taban: string,
  kullanimda: (slug: string) => Promise<boolean>,
): Promise<string> {
  const kok = (slugify(taban) || 'urun').slice(0, 90)
  for (let i = 1; i < 500; i++) {
    const aday = i === 1 ? kok : `${kok}-${i}`
    if (!(await kullanimda(aday))) return aday
  }
  return `${kok}-${Date.now()}`
}

/**
 * Sıradaki ürün kodu: HJ-00001, HJ-00002 …
 * Aynı anda iki ürün kaydedilirse ikisi aynı kodu alabilir; benzersizlik
 * kısıtı ikinciyi reddeder ve createProduct yeniden dener.
 */
async function siradakiUrunKodu(): Promise<string> {
  const son = await prisma.product.findFirst({
    where: { sku: { startsWith: 'HJ-' } },
    orderBy: { sku: 'desc' },
    select: { sku: true },
  })
  const n = son?.sku ? Number(son.sku.slice(3)) || 0 : 0
  return `HJ-${String(n + 1).padStart(5, '0')}`
}

/**
 * Seçilen kategoriyi çözer; "Diğer" seçildiyse yeni kategori(ler)i açar.
 * Aynı adlı kategori zaten varsa yenisi açılmaz, mevcut olan kullanılır.
 */
async function kategoriCoz(secim: KategoriSecimi, brandId: number): Promise<number | string> {
  if (secim.tur === 'mevcut') {
    const kat = await prisma.category.findUnique({ where: { id: secim.categoryId }, select: { id: true } })
    return kat ? kat.id : 'Seçilen kategori bulunamadı.'
  }

  const adlaBul = (ad: string, parentId: number | null) =>
    prisma.category.findFirst({
      where: { brandId, parentId, name: { equals: ad, mode: 'insensitive' } },
      select: { id: true },
    })

  const kategoriAc = async (ad: string, parentId: number | null) => {
    const slug = await bosSlug(ad, async (s) => !!(await prisma.category.findUnique({ where: { slug: s }, select: { id: true } })))
    const sonSira = await prisma.category.aggregate({ where: { brandId, parentId }, _max: { sortOrder: true } })
    const yeni = await prisma.category.create({
      data: { brandId, parentId, name: ad, slug, sortOrder: (sonSira._max.sortOrder ?? 0) + 1 },
      select: { id: true },
    })
    return yeni.id
  }

  let anaId = secim.anaId
  if (anaId === null) {
    anaId = (await adlaBul(secim.yeniAnaAdi!, null))?.id ?? (await kategoriAc(secim.yeniAnaAdi!, null))
  } else if (!(await prisma.category.findUnique({ where: { id: anaId }, select: { id: true } }))) {
    return 'Seçilen ana kategori bulunamadı.'
  }

  return (await adlaBul(secim.yeniAltAdi, anaId))?.id ?? (await kategoriAc(secim.yeniAltAdi, anaId))
}

/** İstemcinin Supabase'e yüklediği görsellerin adresleri (sıralı, en fazla 10) */
function gorselAdresleri(formData: FormData): string[] {
  try {
    const liste = JSON.parse((formData.get('imageUrls') as string) || '[]') as unknown
    if (!Array.isArray(liste)) return []
    return liste
      .map((u) => gecerliGorselAdresi(typeof u === 'string' ? u : null))
      .filter((u): u is string => !!u)
      .slice(0, 10)
  } catch {
    return []
  }
}

// ─── CREATE ───────────────────────────────────────────────────────────────────

export async function createProduct(formData: FormData): Promise<ProductActionResult | void> {
  try {
    await requireAdmin()
  } catch {
    return { ok: false, error: 'Oturumunuz sona ermiş görünüyor. Lütfen yeniden giriş yapın.' }
  }

  const parsed = parseProductForm(formData)
  if (typeof parsed === 'string') return { ok: false, error: parsed }
  const { input, kategori } = parsed
  const gorseller = gorselAdresleri(formData)

  try {
    const brandId = await magazaBrandId()
    const categoryId = await kategoriCoz(kategori, brandId)
    if (typeof categoryId === 'string') return { ok: false, error: categoryId }

    const slug = await bosSlug(input.name, async (s) => !!(await prisma.product.findUnique({ where: { slug: s }, select: { id: true } })))

    // Ürün kodu çakışırsa (aynı anda iki kayıt) birkaç kez yeniden dene
    for (let deneme = 0; ; deneme++) {
      try {
        await prisma.product.create({
          data: {
            ...input,
            slug,
            brandId,
            categoryId,
            sku: await siradakiUrunKodu(),
            images: gorseller.length
              ? {
                  create: gorseller.map((url, i) => ({
                    url,
                    altText: input.name,
                    isPrimary: i === 0,
                    sortOrder: i,
                  })),
                }
              : undefined,
          },
          select: { id: true },
        })
        break
      } catch (error) {
        const hedef = String((error as { meta?: { target?: unknown } })?.meta?.target ?? '')
        if ((error as { code?: string })?.code === 'P2002' && hedef.includes('sku') && deneme < 3) continue
        throw error
      }
    }
  } catch (error) {
    console.error('[admin] ürün oluşturulamadı:', error)
    return { ok: false, error: friendlyPrismaError(error) }
  }

  revalidatePath('/admin/urunler')
  revalidatePath('/urunler')
  redirect('/admin/urunler')
}

// ─── UPDATE ───────────────────────────────────────────────────────────────────

/**
 * Ürünü günceller. Slug ve ürün kodu DEĞİŞMEZ: ad değişse bile ürünün adresi
 * aynı kalır, paylaşılmış bağlantılar ve arama motoru kayıtları bozulmaz.
 * Görseller bu formdan değil ImageManager'dan yönetiliyor.
 */
export async function updateProduct(
  id: string,
  formData: FormData,
): Promise<ProductActionResult | void> {
  try {
    await requireAdmin()
  } catch {
    return { ok: false, error: 'Oturumunuz sona ermiş görünüyor. Lütfen yeniden giriş yapın.' }
  }

  const parsed = parseProductForm(formData)
  if (typeof parsed === 'string') return { ok: false, error: parsed }
  const { input, kategori } = parsed

  try {
    const categoryId = await kategoriCoz(kategori, await magazaBrandId())
    if (typeof categoryId === 'string') return { ok: false, error: categoryId }
    await prisma.product.update({ where: { id }, data: { ...input, categoryId } })
  } catch (error) {
    console.error('[admin] ürün güncellenemedi:', id, error)
    return { ok: false, error: friendlyPrismaError(error) }
  }

  revalidatePath('/admin/urunler')
  revalidatePath('/urunler')
  redirect('/admin/urunler')
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
  revalidatePath('/admin/urunler')
    revalidatePath('/urunler')
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
  revalidatePath('/admin/urunler')
    revalidatePath('/urunler')
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
  revalidatePath('/admin/urunler')
}

export async function toggleProductFeatured(id: string, current: boolean) {
  await requireAdmin()

  await prisma.product.update({ where: { id }, data: { isFeatured: !current } })
  // Panel marka bazlı: listeler /admin/<marka>/urunler adresinde.
  revalidatePath('/admin/urunler')
}
