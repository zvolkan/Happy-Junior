import { createClient } from '@supabase/supabase-js'

const BUCKET = 'product-images'

function getClient() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('SUPABASE_URL veya SUPABASE_SERVICE_ROLE_KEY env var eksik.')
  }
  return createClient(url, key, { auth: { persistSession: false } })
}

/**
 * Supabase Storage'a doğrudan tarayıcıdan yükleme yapmak için signed upload URL üretir.
 * İstemci bu URL'ye PUT isteği ile dosyayı Vercel üzerinden geçirmeden yükler.
 */
export async function getSignedUploadUrl(
  fileName: string,
): Promise<{ signedUrl: string; publicUrl: string }> {
  const client = getClient()

  const { data, error } = await client.storage.from(BUCKET).createSignedUploadUrl(fileName)
  if (error) throw new Error(`Signed URL hatası: ${error.message}`)

  const { data: urlData } = client.storage.from(BUCKET).getPublicUrl(fileName)
  return { signedUrl: data.signedUrl, publicUrl: urlData.publicUrl }
}

/** Dosyayı Supabase Storage'a yükler, public URL döner */
export async function uploadProductImage(file: File, fileName: string): Promise<string> {
  const client = getClient()
  const { error } = await client.storage
    .from(BUCKET)
    .upload(fileName, file, { upsert: true, contentType: file.type })

  if (error) throw new Error(`Upload hatası: ${error.message}`)

  const { data } = client.storage.from(BUCKET).getPublicUrl(fileName)
  return data.publicUrl
}

/** Storage'dan dosya siler */
export async function deleteProductImage(fileName: string): Promise<void> {
  const client = getClient()
  const { error } = await client.storage.from(BUCKET).remove([fileName])
  if (error) console.error('Silme hatası:', error.message)
}

// ─── E-fatura PDF'leri ───────────────────────────────────────────────────────
//
// Ürün görselleri herkese açık kovada; faturalar OLAMAZ. Fatura müşterinin adı,
// adresi ve TCKN/VKN'sini taşıyor. Bu yüzden ayrı ve ÖZEL bir kova kullanılıyor:
// dosyaya doğrudan URL ile erişilemez, her indirme için kısa ömürlü imzalı
// bağlantı üretilir.
//
// Kovanın Supabase panelinden bir kez oluşturulması gerekiyor:
//   Storage → New bucket → adı: faturalar → Public bucket: KAPALI
// (Kurulum SQL'i `prisma/migrations/manual/002-e-fatura.sql` içinde de var.)

const FATURA_KOVASI = 'faturalar'

export async function faturaYukle(
  dosya: File | Buffer | ArrayBuffer,
  yol: string,
): Promise<void> {
  const client = getClient()
  const { error } = await client.storage.from(FATURA_KOVASI).upload(yol, dosya, {
    upsert: true,
    contentType: 'application/pdf',
  })
  if (error) throw new Error(`Fatura yüklenemedi: ${error.message}`)
}

/**
 * İndirme için kısa ömürlü imzalı bağlantı üretir.
 * @param saniye Bağlantının geçerlilik süresi. Kısa tutuluyor: bağlantı
 *               kopyalanıp paylaşılsa bile birkaç dakika sonra ölür.
 */
export async function faturaImzaliUrl(
  yol: string,
  dosyaAdi: string,
  saniye = 120,
): Promise<string> {
  const client = getClient()
  const { data, error } = await client.storage
    .from(FATURA_KOVASI)
    .createSignedUrl(yol, saniye, { download: dosyaAdi })

  if (error || !data?.signedUrl) {
    throw new Error(`Fatura bağlantısı üretilemedi: ${error?.message ?? 'bilinmeyen hata'}`)
  }
  return data.signedUrl
}

export async function faturaSil(yol: string): Promise<void> {
  const client = getClient()
  const { error } = await client.storage.from(FATURA_KOVASI).remove([yol])
  if (error) console.error('Fatura silinemedi:', error.message)
}
