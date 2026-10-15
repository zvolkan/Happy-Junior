/**
 * iyzico istemcisi — `fetch` tabanlı.
 *
 * ── Neden kütüphane kullanılmıyor ───────────────────────────────────────────
 *
 * `iyzipay` npm paketi Cloudflare Workers'ta ÇALIŞAMAZ. Sebep, paketin
 * kurulum kodunda (`lib/Iyzipay.js`):
 *
 *     var modelsPath = __dirname + '/resources';
 *     fs.readdirSync(modelsPath).forEach(function (fileName) {
 *         var resource = require(modelsPath + '/' + fileName);
 *
 * `new Iyzipay(...)` her çağrıldığında kütüphane kendi kaynak klasörünü
 * DİSKTEN okuyup dosyaları tek tek `require` ediyor. Workers'ta gerçek bir
 * dosya sistemi yok; ayrıca hesaplanan yollu `require` ifadesini hiçbir
 * paketleyici statik olarak çözemediği için o dosyalar pakete hiç girmiyor.
 * İstemci kurulamıyor bile.
 *
 * Bu dosya aynı işi doğrudan iyzico REST API'sine `fetch` ile yaparak
 * görüyor. Dışa verilen fonksiyonların imzaları AYNI kaldı; çağıran hiçbir
 * dosya değişmedi.
 *
 * ── Kimlik doğrulama (IYZWSv2) ──────────────────────────────────────────────
 *
 *   signature = HMAC-SHA256(secretKey, randomString + uri + JSON.stringify(body))
 *   params    = "apiKey:<apiKey>&randomKey:<rnd>&signature:<sig>"
 *   header    = "IYZWSv2 " + base64(params)
 *
 * `uri` tam adres değil, yalnızca YOL kısmıdır (örn. `/payment/detail`).
 * İmza gövdenin metin hâli üzerinden hesaplandığı için, imzalanan metnin
 * gönderilen gövdeyle BİREBİR aynı olması gerekir — bu yüzden gövde bir kez
 * `JSON.stringify` edilip hem imzada hem istekte o metin kullanılıyor.
 *
 * HMAC için Web Crypto kullanılıyor (`node:crypto` yerine); hem Workers hem
 * Node ortamında çalışır. Aynı desen `src/lib/admin-auth.ts` içinde de var.
 */

const SANDBOX_URI = 'https://sandbox-api.iyzipay.com'
const PRODUCTION_URI = 'https://api.iyzipay.com'
const CLIENT_VERSION = 'iyzipay-node-2.0.69'

let sandboxWarned = false

/**
 * Geçici iyzico hatası — yeniden denemeye değer.
 *
 * Kalıcı hatalardan (imza hatası, geçersiz istek) ayırmak için ayrı bir tip:
 * imza yanlışsa yüz kez denemek de düzeltmez, boşuna müşteriyi bekletir.
 */
class GeciciIyzicoHatasi extends Error {}

/**
 * iyzico API adresi.
 *
 * Eskiden varsayılan sandbox'tı: IYZICO_BASE_URL üretimde tanımlanmazsa
 * ödemeler sessizce test ortamına gidiyor ve para tahsil edilmiyordu.
 * Artık üretimde varsayılan canlı adres; sandbox'ta kalmak isteniyorsa
 * açıkça IYZICO_BASE_URL verilmeli.
 */
function resolveUri(): string {
  const explicit = process.env.IYZICO_BASE_URL?.trim()
  if (explicit) {
    if (process.env.NODE_ENV === 'production' && explicit.includes('sandbox') && !sandboxWarned) {
      sandboxWarned = true
      console.warn(
        '[iyzico] UYARI: Üretim ortamında sandbox adresi kullanılıyor — ' +
          'gerçek ödeme alınmayacak.',
      )
    }
    return explicit.replace(/\/+$/, '')
  }
  return process.env.NODE_ENV === 'production' ? PRODUCTION_URI : SANDBOX_URI
}

function getKeys(): { apiKey: string; secretKey: string } {
  const apiKey = process.env.IYZICO_API_KEY
  const secretKey = process.env.IYZICO_SECRET_KEY
  if (!apiKey || !secretKey) {
    throw new Error('IYZICO_API_KEY veya IYZICO_SECRET_KEY eksik.')
  }
  return { apiKey, secretKey }
}

const encoder = new TextEncoder()

function toHex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function toBase64(value: string): string {
  // btoa yalnızca latin-1 kabul ediyor; imza parametreleri ASCII olduğu için
  // sorun yok, yine de güvenli tarafta kalmak adına baytlardan üretiyoruz.
  const bytes = encoder.encode(value)
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary)
}

async function hmacSha256Hex(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  return toHex(await crypto.subtle.sign('HMAC', key, encoder.encode(data)))
}

/** Kütüphanenin ürettiğiyle aynı biçimde rastgele dizi */
function randomString(): string {
  const bytes = new Uint8Array(12)
  crypto.getRandomValues(bytes)
  return Date.now().toString() + toHex(bytes.buffer).slice(0, 12)
}

/**
 * iyzico'ya imzalı bir POST atar.
 *
 * `path` yalnızca yol kısmıdır ve imzaya birebir bu değer girer.
 */
/**
 * Geçici sunucu hatalarında kaç kez tekrar denenecek.
 *
 * iyzico'nun canlı uçları Cloudflare arkasında duruyor ve Cloudflare ile
 * iyzico'nun kendi sunucuları arasındaki TLS el sıkışması zaman zaman
 * başarısız oluyor — bize HTTP 525 ve JSON yerine düz metin bir hata sayfası
 * dönüyor. Bizim tarafımızda düzeltilecek bir şey yok; dakikalar içinde
 * kendiliğinden geçiyor. Ama o dakikalarda müşteri "ödeme sistemi
 * kullanılamıyor" görüp gidiyordu.
 */
const TEKRAR_SAYISI = 2
const TEKRAR_BEKLEME_MS = [400, 1200]

/** Geçici sayılan durumlar: ağ kopması ve 5xx (525 dahil). */
function geciciMi(durum: number | null): boolean {
  return durum === null || durum >= 500
}

const bekle = (ms: number) => new Promise((c) => setTimeout(c, ms))

interface IstekSecenekleri {
  /**
   * İstek güvenle tekrarlanabilir mi?
   *
   * `true` yalnızca sonucu değiştirmeyen çağrılarda: ödeme formu başlatma
   * (kullanılmayan ikinci bir jeton zararsız) ve sorgulama (salt okunur).
   *
   * İADE ve İPTAL için ASLA true olmamalı. Orada "cevap gelmedi" ile "işlem
   * yapılmadı" aynı şey değil: istek iyzico'ya ulaşıp para iade edilmiş ama
   * cevap yolda kaybolmuş olabilir. Tekrar denemek ikinci bir iade demektir.
   */
  tekrarDenenebilir?: boolean
}

async function iyzicoPost(
  path: string,
  body: Record<string, unknown>,
  secenekler: IstekSecenekleri = {},
): Promise<any> {
  const { apiKey, secretKey } = getKeys()

  // Gövde TEK KEZ metne çevriliyor: imzalanan metinle gönderilen metin
  // birebir aynı olmak zorunda.
  const payload = JSON.stringify(body)

  /** Tek bir istek denemesi. Geçici hatalarda `GeciciIyzicoHatasi` fırlatır. */
  async function tekDeneme(): Promise<any> {
    // Rastgele değer ve imza HER DENEMEDE yeniden üretiliyor.
    //
    // İlk hâlinde döngünün dışındaydılar. iyzico `x-iyzi-rnd` başlığına tekrar
    // koruması uyguluyorsa aynı değerle yapılan ikinci deneme baştan
    // reddedilirdi — yani tekrar deneme mekanizması hiç işe yaramazdı.
    // Fazladan bir HMAC hesabı bu riski tamamen ortadan kaldırıyor.
    const rnd = randomString()
    const signature = await hmacSha256Hex(secretKey, rnd + path + payload)
    const authorization =
      'IYZWSv2 ' + toBase64(`apiKey:${apiKey}&randomKey:${rnd}&signature:${signature}`)

    let res: Response
    try {
      res = await fetch(resolveUri() + path, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authorization,
          'x-iyzi-rnd': rnd,
          'x-iyzi-client-version': CLIENT_VERSION,
        },
        body: payload,
      })
    } catch (error) {
      // Ağ hatası — geçici sayılıyor.
      throw new GeciciIyzicoHatasi(
        `iyzico'ya ulaşılamadı (${path}): ${String(error).slice(0, 200)}`,
      )
    }

    const text = await res.text()

    let parsed: any
    try {
      parsed = JSON.parse(text)
    } catch {
      // ── Yanıt JSON değil ─────────────────────────────────────────────────
      //
      // Cloudflare'in 5xx hata sayfaları JSON değil düz metin geliyor. Bu
      // durumda hatanın KİMDEN geldiğini bilmek kritik: yanıt iyzico'nun kendi
      // sunucusundan mı, yoksa araya giren bir vekilden mi?
      //
      // `cf-ray` başlığı bunu kesin olarak söylüyor — varsa yanıtı Cloudflare
      // üretmiş demektir ve o kimlik, iyzico'nun kendi Cloudflare kayıtlarında
      // isteği bulmasını sağlıyor. Destek hattına "bir sorun var" demekle
      // "şu ray kimliğine bakın" demek arasında günler fark var.
      const kimden = [
        `server=${res.headers.get('server') ?? 'yok'}`,
        `cf-ray=${res.headers.get('cf-ray') ?? 'yok'}`,
        `cf-cache=${res.headers.get('cf-cache-status') ?? 'yok'}`,
        `content-type=${res.headers.get('content-type') ?? 'yok'}`,
      ].join(' ')
      console.error(`[iyzico] JSON olmayan yanıt (${path}, HTTP ${res.status}) — ${kimden}`)

      const mesaj =
        `iyzico beklenmeyen yanıt verdi (${path}, HTTP ${res.status}): ` + text.slice(0, 300)
      throw geciciMi(res.status) ? new GeciciIyzicoHatasi(mesaj) : new Error(mesaj)
    }

    // iyzico hataları da HTTP 200 ile döner ve gövdede `status: "failure"` olur.
    // Bu yüzden HTTP durumuna göre hata FIRLATMIYORUZ — çağıran kod zaten
    // `result.status` kontrolü yapıyor ve `errorMessage` alanını okuyor.
    // Yalnızca 5xx'te fırlatıyoruz; orada gövde anlamlı olmayabilir.
    if (res.status >= 500) {
      throw new GeciciIyzicoHatasi(
        `iyzico sunucu hatası (${path}, HTTP ${res.status}): ` +
          `${parsed?.errorMessage ?? text.slice(0, 200)}`,
      )
    }

    return parsed
  }

  const enFazla = secenekler.tekrarDenenebilir ? TEKRAR_SAYISI : 0
  let sonHata: Error | null = null

  for (let deneme = 0; deneme <= enFazla; deneme += 1) {
    if (deneme > 0) {
      await bekle(TEKRAR_BEKLEME_MS[deneme - 1] ?? 1200)
      console.warn(`[iyzico] ${path} yeniden deneniyor (${deneme}/${enFazla})`)
    }

    try {
      return await tekDeneme()
    } catch (error) {
      sonHata = error instanceof Error ? error : new Error(String(error))
      // Kalıcı hatada (imza, doğrulama) tekrar denemek anlamsız; hemen çık.
      if (!(error instanceof GeciciIyzicoHatasi)) throw sonHata
    }
  }

  throw sonHata ?? new Error(`iyzico isteği başarısız (${path})`)
}

// ─── Uç noktalar ─────────────────────────────────────────────────────────────
// Yollar iyzipay paketinin resources/ klasöründen birebir alındı.

export function initializeCheckoutForm(request: Record<string, unknown>): Promise<any> {
  // Tekrar denenebilir: başarısız bir başlatmanın yan etkisi yok, başarılı ama
  // cevabı kaybolmuş bir başlatma da yalnızca kullanılmayan bir ödeme formu
  // jetonu bırakır. Para hareketi bu çağrıda olmuyor.
  return iyzicoPost('/payment/iyzipos/checkoutform/initialize/auth/ecom', request, {
    tekrarDenenebilir: true,
  })
}

/**
 * Ödeme sonucunu üç kovaya ayırır: BAŞARILI, KESİN RET, BELİRSİZ.
 *
 * ── Neden gerekli ───────────────────────────────────────────────────────────
 *
 * iyzico hatalarını da HTTP 200 ile, gövdede `status: "failure"` olarak
 * döndürüyor. `iyzicoPost` yalnızca HTTP 500 ve üzerinde hata fırlattığı için,
 * callback tarafında "başarılı değilse başarısızdır" diye tek bir ayrım vardı
 * ve başarılı olmayan HER durum siparişi koşulsuz CANCELLED yapıyordu.
 *
 * Oysa "başarılı değil" ile "başarısız" aynı şey değil. Aradaki fark para:
 * 3DS tamamlanmış, banka tutarı çekmiş, ama iyzico o an geçici bir sistem
 * hatası ya da hız sınırı döndürmüşse, müşteriye "ödeme başarısız" denip
 * sipariş iptal ediliyordu. Müşteri büyük ihtimalle ikinci kez ödüyor ve
 * birinci tahsilatın sistemde hiçbir izi kalmıyordu.
 *
 * ── Sınıflandırma kuralı ────────────────────────────────────────────────────
 *
 * KESİN RET yalnızca ELİMİZDE KANIT VARSA verilir: ya `paymentStatus`
 * doğrudan FAILURE'dır, ya da errorCode bilinen bir kart reddidir (limit
 * yetersiz, kart kapalı, hatalı CVC gibi). Bunların hiçbirinde para çekilmez.
 *
 * Geri kalan her şey — bilinmeyen hata kodu, 3DS ara durumları, boş yanıt,
 * sistem hatası — BELİRSİZ sayılır. Belirsizde sipariş iptal EDİLMEZ: PENDING
 * kalır, not düşülür, müşteriye "doğrulanıyor" gösterilir.
 *
 * Bedeli şu: gerçekten ödenmemiş bazı siparişler bir süre PENDING'de bekler.
 * Bekleyen sipariş temizliği onları zaten belirli bir süre sonra iptal edip
 * stoğu geri veriyor. Yani belirsizi beklemeye almanın maliyeti gecikme;
 * yanlış iptal etmenin maliyeti müşterinin parası.
 */
export type OdemeSonucu = 'basarili' | 'kesin-ret' | 'belirsiz'

/**
 * Kart reddi anlamına gelen iyzico hata kodları. Hepsinde işlem bankada
 * reddedilmiştir; tahsilat OLMAZ, dolayısıyla iptal güvenlidir.
 *
 * Liste bilinçli olarak dar tutuldu: bir kod burada yoksa belirsiz sayılıyor
 * ve sipariş beklemeye alınıyor. Yanlış tarafa düşmenin bedeli asimetrik —
 * fazladan bekleyen sipariş zararsız, yanlış iptal edilen ödeme değil.
 */
const KART_REDDI_KODLARI = new Set([
  '10051', // Yetersiz bakiye
  '10005', // İşlem onaylanmadı (do not honour)
  '10012', // Geçersiz işlem
  '10041', // Karta el koy
  '10043', // Çalıntı kart
  '10054', // Vadesi dolmuş kart
  '10084', // CVC hatalı
  '10093', // Kart kapalı / kullanıma kapalı
  '10201', // Kart limiti yetersiz
  '10202', // Kart sahibi doğrulanamadı
  '10207', // Karta işlem izni yok
  '10211', // Kart sahibi 3DS doğrulamasını tamamlamadı
  '10051-3D',
])

export function odemeSonucunuSiniflandir(result: unknown): OdemeSonucu {
  const r = (result ?? {}) as {
    status?: unknown
    paymentStatus?: unknown
    errorCode?: unknown
  }

  const status = String(r.status ?? '')
  const paymentStatus = String(r.paymentStatus ?? '')
  const errorCode = String(r.errorCode ?? '')

  if (status === 'success' && paymentStatus === 'SUCCESS') return 'basarili'

  // iyzico "sorgu başarılı" diyor ve ödeme durumunu FAILURE olarak bildiriyor:
  // bu kesin bilgi.
  if (status === 'success' && paymentStatus === 'FAILURE') return 'kesin-ret'

  // Sorgu başarısız; yalnızca bilinen bir kart reddiyse kesin sayıyoruz.
  if (status === 'failure' && KART_REDDI_KODLARI.has(errorCode)) return 'kesin-ret'

  return 'belirsiz'
}

/* ─── İade / iptal sonucunun sınıflandırılması ────────────────────────────────
 *
 * Ödeme sonucu için yukarıda kurulan üç kovalı mantığın aynısı, bu kez para
 * GERİ giderken. Fark, hatanın yönünde: ödemede yanlış karar müşterinin
 * parasını sistemde izsiz bırakıyordu; iadede yanlış karar ÇİFT İADE demek —
 * yani aynı parayı iki kez geri vermek.
 *
 * Bu yüzden `belirsiz` kovası burada çok daha ciddi. "Cevap gelmedi" ile
 * "işlem yapılmadı" aynı şey değildir: istek iyzico'ya ulaşmış, para geri
 * gönderilmiş, ama yanıt yolda kaybolmuş olabilir. Yaşanan olay tam olarak
 * buydu. Belirsizde İKİNCİ BİR PARA HAREKETİ DENENMEZ; sipariş "iade sonucu
 * belirsiz" durumuna alınıp yöneticiye bırakılır.
 */
export type IadeSonucu = 'basarili' | 'kesin-ret' | 'belirsiz'

/**
 * "Bu ödeme zaten iptal/iade edilmiş" anlamına gelen yanıtlar.
 *
 * Kayıp cevaptan sonra aynı iptal isteği tekrar gönderilirse iyzico bunu
 * reddediyor — ama bu ret, aslında İŞİN YAPILDIĞININ kanıtı. Hata mesajını
 * "başarısız" saymak, yapılmış bir iadeyi yapılmamış göstermek olur.
 *
 * Eşleştirme mesaj metnine bakıyor çünkü iyzico'nun bu durum için döndürdüğü
 * hata kodu belgelenmiş değil ve sürümler arasında değişebiliyor. Kaçırırsak
 * sonuç `belirsiz` olur — yani güvenli tarafa düşeriz, yöneticiye gider.
 */
function zatenIadeEdilmisMi(errorMessage: string): boolean {
  const m = errorMessage.toLocaleLowerCase('tr')
  const iadeSozu = m.includes('iptal') || m.includes('iade') || m.includes('refund') || m.includes('cancel')
  const gecmisZaman =
    m.includes('zaten') ||
    m.includes('mevcut') ||
    m.includes('edilmiş') ||
    m.includes('edilmis') ||
    m.includes('daha önce') ||
    m.includes('already')
  return iadeSozu && gecmisZaman
}

/**
 * İade/iptal yanıtını sınıflandırır.
 *
 * @param result  iyzico'nun JSON yanıtı. `null` ise çağrı İSTİSNA fırlattı —
 *                yani yanıt hiç alınamadı ve sonuç zorunlu olarak belirsizdir.
 */
export function iadeSonucunuSiniflandir(result: unknown | null): IadeSonucu {
  // Yanıt yok: ağ kopması, 5xx, JSON olmayan hata sayfası. İstek iyzico'ya
  // ulaşmış olabilir de olmayabilir de — bilmiyoruz.
  if (result == null) return 'belirsiz'

  const r = result as { status?: unknown; errorMessage?: unknown }
  const status = String(r.status ?? '')
  const errorMessage = String(r.errorMessage ?? '')

  if (status === 'success') return 'basarili'

  // iyzico cevap verdi ve "zaten yapılmış" dedi: iş bitmiş demektir.
  if (status === 'failure' && zatenIadeEdilmisMi(errorMessage)) return 'basarili'

  // iyzico cevap verip reddetti. Cevap ELİMİZDE olduğu için bu kesin bilgi:
  // para hareket etmedi.
  if (status === 'failure') return 'kesin-ret'

  return 'belirsiz'
}

export function retrieveCheckoutForm(token: string, conversationId: string): Promise<any> {
  // Salt okunur sorgu; tekrar denemek güvenli. Üstelik burada ısrar etmek
  // önemli: bu çağrı başarısız olursa ödeme sonucu "belirsiz" sayılıyor ve
  // sipariş elle incelenmek üzere askıda kalıyor.
  return iyzicoPost(
    '/payment/iyzipos/checkoutform/auth/ecom/detail',
    { locale: 'tr', conversationId, token },
    { tekrarDenenebilir: true },
  )
}

/**
 * Ödeme iadesi — v2 API (tüm ödemeyi tek seferde iade eder).
 *
 * DİKKAT: v1 `/payment/refund` uç noktası `paymentTransactionId` bekler; bu,
 * sepet KALEMİ bazındaki işlem kimliğidir ve `paymentId` ile AYNI DEĞİLDİR.
 * Yanlışlıkla `paymentId` gönderilirse iyzico "işlem bulunamadı" döner ve para
 * asla iade edilmez. v2 uç noktası (`/v2/payment/refund`) doğrudan `paymentId`
 * ile çalıştığı ve tüm ödemeyi kapsadığı için onu kullanıyoruz.
 */
export function refundPayment(params: {
  paymentId: string
  price: string
  conversationId: string
  ip?: string
}): Promise<any> {
  return iyzicoPost('/v2/payment/refund', {
    locale: 'tr',
    conversationId: params.conversationId,
    paymentId: params.paymentId,
    price: params.price,
    currency: 'TRY',
    ip: params.ip ?? '127.0.0.1',
  })
}

/** Ödemenin tamamını iptal eder (aynı gün içinde, henüz kapanmamış işlemler için) */
export function cancelPayment(params: {
  paymentId: string
  conversationId: string
  ip?: string
}): Promise<any> {
  return iyzicoPost('/payment/cancel', {
    locale: 'tr',
    conversationId: params.conversationId,
    paymentId: params.paymentId,
    ip: params.ip ?? '127.0.0.1',
  })
}

/**
 * Korumalı Alışveriş — kalem onayı (teslimat bildirimi).
 *
 * iyzico'nun standart tek satıcılı akışında teslimat bildirimi diye bir adım
 * YOKTUR; para, hesabınızın ödeme takvimine göre otomatik aktarılır. Bu uç
 * nokta yalnızca **Korumalı Alışveriş** (pazaryeri / escrow) modeli açık olan
 * hesaplarda anlamlıdır: orada para, siz kalemi onaylayana kadar iyzico'da
 * bekletilir.
 *
 * DİKKAT: `paymentTransactionId` sepet KALEMİNE ait kimliktir, `paymentId`
 * değildir. İkisi karıştırılırsa iyzico "işlem bulunamadı" döner.
 */
export function approvePaymentItem(params: {
  paymentTransactionId: string
  conversationId: string
}): Promise<any> {
  return iyzicoPost('/payment/iyzipos/item/approve', {
    locale: 'tr',
    conversationId: params.conversationId,
    paymentTransactionId: params.paymentTransactionId,
  })
}

/**
 * Ödeme detayını `paymentId` ile çeker.
 *
 * `itemTransactions` dizisi burada da geliyor; kalem işlem kimlikleri
 * kaydedilmeden önce oluşturulmuş siparişler için tek geri kazanma yolu bu.
 */
export function retrievePayment(params: {
  paymentId: string
  conversationId: string
}): Promise<any> {
  // Salt okunur; tekrar denemek güvenli ve burada ısrar etmek önemli. Bu
  // sorgu, iadesi belirsiz kalmış bir siparişte "gerçekte ne oldu" sorusunun
  // tek cevabı. Tek denemede vazgeçilirse sipariş boşuna askıda kalıyor.
  return iyzicoPost(
    '/payment/detail',
    {
      locale: 'tr',
      conversationId: params.conversationId,
      paymentId: params.paymentId,
    },
    { tekrarDenenebilir: true },
  )
}
