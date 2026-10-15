import { prisma } from '@/lib/db'

/**
 * Supabase ücretsiz plan kotası — ölçüm ve eşik kontrolü.
 *
 * ── Neden kendimiz yazıyoruz ────────────────────────────────────────────────
 *
 * Supabase kota dolmaya yaklaşınca kendi e-postasını gönderiyor, ama eşiği siz
 * belirleyemiyorsunuz ve uyarı çoğu zaman iş işten geçmeye yakın geliyor.
 * "%70'te haber ver" gibi bir ayar panelde yok. Bu dosya o eksiği kapatıyor:
 * günlük çalışan bir görev veritabanına ölçüyü soruyor, eşiği aşan varsa
 * e-posta gidiyor.
 *
 * ── Neyi ölçebiliyoruz, neyi ölçemiyoruz ────────────────────────────────────
 *
 * Veritabanı boyutu, depolama ve aylık aktif kullanıcı sayısı doğrudan
 * veritabanından okunabiliyor. EGRESS (dışa giden trafik) OKUNAMIYOR — o
 * ölçüm Supabase'in kendi altyapısında tutuluyor ve SQL ile erişilemiyor.
 * Ücretsiz planda çoğu projeyi ilk zorlayan kalem de genelde egress olduğu
 * için bu bir eksiklik; onun için Supabase panelindeki Usage sayfasına ara ara
 * bakmak ve Supabase'in kendi uyarı e-postalarını açık tutmak gerekiyor.
 *
 * ── Limitler ────────────────────────────────────────────────────────────────
 *
 * Aşağıdaki değerler ücretsiz planın 2026 başındaki sınırları. Supabase bunları
 * değiştirebilir; panelde farklı bir rakam görürseniz BURAYI güncelleyin, uyarı
 * eşiği kendiliğinden ona göre hesaplanır.
 */

/** Ücretsiz plan sınırları. Panelle uyuşmuyorsa burayı güncelleyin. */
export const KOTA_LIMITLERI = {
  /** Proje başına veritabanı boyutu — 500 MB */
  veritabaniBayt: 500 * 1024 * 1024,
  /** Dosya depolama — 1 GB */
  depolamaBayt: 1024 * 1024 * 1024,
  /** Aylık aktif kullanıcı — 50.000 */
  aylikAktifKullanici: 50_000,
} as const

/** Uyarı eşiği. %70'e ulaşınca haber veriyoruz. */
export const UYARI_ESIGI = 0.7

/** "Artık ciddi" eşiği — konu satırı buna göre değişiyor. */
export const KRITIK_ESIK = 0.9

export interface KotaOlcumu {
  ad: string
  kullanilan: number
  limit: number
  oran: number
  /** İnsan okunur değer, ör. "312 MB / 500 MB" */
  ozet: string
}

function mb(bayt: number): string {
  return `${(bayt / 1024 / 1024).toFixed(1)} MB`
}

/**
 * Üç kalemi ölçer.
 *
 * Sorgular bilerek ayrı ayrı try/catch içinde: `storage.objects` ya da
 * `auth.users` okunamazsa (yetki, şema değişikliği) diğer ölçümler yine
 * çalışsın, görev tamamen sessize düşmesin.
 */
export async function kotayiOlc(): Promise<KotaOlcumu[]> {
  const olcumler: KotaOlcumu[] = []

  // ── Veritabanı boyutu ────────────────────────────────────────────────────
  try {
    // Jenerik parametre yerine sonuç dönüştürülüyor. `$queryRawUnsafe` gerçek
    // Prisma istemcisinde `unknown` döner; jenerik yazmak yerine dönüştürmek
    // hem orada hem istemcinin üretilemediği ortamlarda derleniyor.
    const satir = (await prisma.$queryRawUnsafe(
      'select pg_database_size(current_database()) as bayt',
    )) as { bayt: bigint | number | null }[]
    const kullanilan = Number(satir[0]?.bayt ?? 0)
    const limit = KOTA_LIMITLERI.veritabaniBayt
    olcumler.push({
      ad: 'Veritabanı boyutu',
      kullanilan,
      limit,
      oran: kullanilan / limit,
      ozet: `${mb(kullanilan)} / ${mb(limit)}`,
    })
  } catch (e) {
    console.error('[kota] veritabanı boyutu okunamadı:', e)
  }

  // ── Depolama ─────────────────────────────────────────────────────────────
  // Dosya boyutu `storage.objects.metadata` içinde JSON alan olarak duruyor.
  try {
    const satir = (await prisma.$queryRawUnsafe(
      "select coalesce(sum((metadata->>'size')::bigint), 0) as bayt from storage.objects",
    )) as { bayt: bigint | number | null }[]
    const kullanilan = Number(satir[0]?.bayt ?? 0)
    const limit = KOTA_LIMITLERI.depolamaBayt
    olcumler.push({
      ad: 'Dosya depolama',
      kullanilan,
      limit,
      oran: kullanilan / limit,
      ozet: `${mb(kullanilan)} / ${mb(limit)}`,
    })
  } catch (e) {
    console.error('[kota] depolama boyutu okunamadı:', e)
  }

  // ── Aylık aktif kullanıcı ────────────────────────────────────────────────
  // Supabase'in MAU tanımının birebir aynısı değil; son 30 günde oturum açmış
  // kullanıcı sayısı üzerinden YAKLAŞIK bir değer. Bu projede kullanıcı sayısı
  // limitin çok altında olduğu için yaklaşık olması sorun değil, ölçüm daha
  // çok "beklenmedik bir sıçrama var mı" sorusunu cevaplıyor.
  try {
    const satir = (await prisma.$queryRawUnsafe(
      'select count(*)::bigint as adet from auth.users ' +
        "where last_sign_in_at > now() - interval '30 days'",
    )) as { adet: bigint | number | null }[]
    const kullanilan = Number(satir[0]?.adet ?? 0)
    const limit = KOTA_LIMITLERI.aylikAktifKullanici
    olcumler.push({
      ad: 'Aylık aktif kullanıcı (yaklaşık)',
      kullanilan,
      limit,
      oran: kullanilan / limit,
      ozet: `${kullanilan.toLocaleString('tr-TR')} / ${limit.toLocaleString('tr-TR')}`,
    })
  } catch (e) {
    console.error('[kota] aktif kullanıcı sayısı okunamadı:', e)
  }

  return olcumler
}

/** Eşiği aşan ölçümler — boşsa uyarıya gerek yok. */
export function esigiAsanlar(olcumler: KotaOlcumu[]): KotaOlcumu[] {
  return olcumler.filter((o) => o.oran >= UYARI_ESIGI)
}

/** Uyarı e-postasının konusu ve gövdesi. */
export function kotaUyarisiEmail(olcumler: KotaOlcumu[], asanlar: KotaOlcumu[]) {
  const enYuksek = Math.max(...asanlar.map((o) => o.oran))
  const kritik = enYuksek >= KRITIK_ESIK
  const yuzde = Math.round(enYuksek * 100)

  const satirlar = olcumler
    .map((o) => {
      const p = Math.round(o.oran * 100)
      const renk = o.oran >= KRITIK_ESIK ? '#dc2626' : o.oran >= UYARI_ESIGI ? '#d97706' : '#16a34a'
      return `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #e4e4e7;font-size:14px;color:#3f3f46;">${o.ad}</td>
        <td style="padding:8px 0;border-bottom:1px solid #e4e4e7;font-size:14px;color:#71717a;text-align:right;">${o.ozet}</td>
        <td style="padding:8px 0 8px 16px;border-bottom:1px solid #e4e4e7;font-size:14px;font-weight:700;color:${renk};text-align:right;">%${p}</td>
      </tr>`
    })
    .join('')

  const html = `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#18181b;max-width:560px;">
  <p style="margin:0 0 16px;font-size:16px;font-weight:700;">
    Supabase ücretsiz plan kullanımı %${yuzde} seviyesinde
  </p>
  <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#3f3f46;">
    Aşağıdaki kalemlerden en az biri uyarı eşiğini (%${Math.round(UYARI_ESIGI * 100)}) aştı.
    ${kritik ? 'Bu seviyede plan yükseltmeyi ertelemeyin: kota dolduğunda site yazma işlemlerini yapamaz.' : 'Henüz acil değil, ama takip edin.'}
  </p>
  <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">${satirlar}</table>
  <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#71717a;">
    Bu ölçüm veritabanından alınıyor. <strong>Egress (dışa giden trafik) bu listede yok</strong> —
    o değer yalnızca Supabase panelindeki Usage sayfasında görünüyor ve ücretsiz planda
    ilk dolan kalem genelde odur. Ara ara oraya da bakın.
  </p>
  <p style="margin:0;font-size:13px;color:#a1a1aa;">
    Bu e-posta günlük çalışan kota kontrolünden geliyor; eşiğin altına inince kendiliğinden kesilir.
  </p>
</div>`

  const text = [
    `Supabase ücretsiz plan kullanımı %${yuzde} seviyesinde.`,
    '',
    ...olcumler.map((o) => `${o.ad}: ${o.ozet} (%${Math.round(o.oran * 100)})`),
    '',
    'Egress bu listede yok; Supabase panelindeki Usage sayfasından bakın.',
  ].join('\n')

  return {
    subject: kritik
      ? `KRİTİK — Supabase kotası %${yuzde}`
      : `Supabase kotası %${yuzde} seviyesinde`,
    html,
    text,
  }
}
