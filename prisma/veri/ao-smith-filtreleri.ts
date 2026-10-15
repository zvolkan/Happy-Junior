/**
 * A.O. Smith kartuş ve membranları — Alb Su tarafında satılan yedek parçalar.
 *
 * Kaynak: A.O. Smith "2026 Ekim Perakende Satış Fiyatı" listesi, sayfa 4–9,
 * her cihazın "KARTUŞ VE MEMBRAN" tablosu. Fiyatlar listedeki **TAVSİYE
 * EDİLEN SATIŞ FİYATI (KDV DAHİL)** değerleridir, TL.
 *
 * ── Neden ayrı dosya ───────────────────────────────────────────────────────
 *
 * Yirmi sekiz kaydı `seed.ts` içine elle yazmak dosyayı iki katına çıkarıyordu
 * ve fiyat listesi her güncellendiğinde yirmi sekiz yerin tek tek bulunması
 * gerekiyordu. Burada veri tek bir dizi; `seed.ts` üzerinde döngüyle geçiyor,
 * `sql/ao-smith-filtreleri.sql` de aynı diziden üretildi.
 *
 * ── Kodların paylaşılması ──────────────────────────────────────────────────
 *
 * Listede bazı kodlar birden fazla cihazda tekrar ediyor: Daisy ile Vita Plus
 * 1/2/3/5. aşamada aynı dört kartuşu (5002131, 5002132, 5004859, 5002134),
 * Lotus 75TC ile 75M beş kartuşun tamamını, Frezya 300 S / 300 TU / 600 S de
 * dört kartuşun tamamını paylaşıyor. Aynı parça için iki ürün sayfası açmak
 * yerine tek kayıt tutuluyor; hangi cihazlara uyduğu `uyumlu` alanında ve
 * ürün sayfasındaki "Uyumlu Cihazlar" özelliğinde yazıyor.
 *
 * ── Stok ───────────────────────────────────────────────────────────────────
 *
 * `stok` değeri gerçek depo adedi DEĞİL. Arayüz 10'un altındaki stokta "Son N
 * adet!" uyarısı basıyor, 0'da sepete eklemeyi kapatıyor. Gerçek adet
 * bilinmediği için ikisi de yanlış olurdu; nötr bir değer konuldu. Doğru
 * adetleri yönetim panelinden girin.
 */

export interface AoSmithFiltre {
  id: string
  /** A.O. Smith ürün kodu — fiyat listesindeki KOD sütunu */
  kod: string
  sku: string
  slug: string
  ad: string
  /** KDV dahil tavsiye edilen satış fiyatı (TL) */
  fiyat: number
  stok: number
  asama: string
  tip: string
  uyumlu: string[]
  kisaAciklama: string
  aciklama: string
  etiketler: string[]
}

/** Fiyat listesinin tarihi — fiyatların ne zamana ait olduğunu gösterir. */
export const FIYAT_LISTESI = '2026 Ekim'

export const AO_SMITH_FILTRELERI: AoSmithFiltre[] = [
  {
    id: 'albsu-f-5006332', kod: '5006332', sku: 'AOS-5006332',
    slug: 'ao-smith-600df-1-asama-filtre-kartusu',
    ad: 'A.O. Smith 600DF 1. Aşama Filtre Kartuşu',
    fiyat: 3208, stok: 20,
    asama: '1. Aşama', tip: 'Filtre kartuşu',
    uyumlu: ['600DF Direkt Akışlı Su Arıtma Sistemi'],
    kisaAciklama: '600DF Direkt Akışlı Su Arıtma Sistemi için orijinal A.O. Smith yedek parçası. 1. Aşama, filtre kartuşu. Ürün kodu 5006332.',
    aciklama: 'A.O. Smith 600DF 1. Aşama Filtre Kartuşu, 600DF Direkt Akışlı Su Arıtma Sistemi cihazlarının 1. aşama yedek parçasıdır. Tip: filtre kartuşu. Ürün kodu: 5006332. Orijinal A.O. Smith parçasıdır; muadil parça kullanımı arıtma performansını ve cihazın garantisini etkileyebilir. Değişim sırasında servis ücreti ayrıca hesaplanır; buradaki fiyat yalnızca parça bedelidir.',
    etiketler: ['AO Smith', 'filtre kartuşu', 'yedek kartuş', '600DF'],
  },
  {
    id: 'albsu-f-5006334', kod: '5006334', sku: 'AOS-5006334',
    slug: 'ao-smith-600df-2-asama-side-stream-membran',
    ad: 'A.O. Smith 600DF 2. Aşama Side Stream Membran',
    fiyat: 10364, stok: 20,
    asama: '2. Aşama', tip: 'RO membran',
    uyumlu: ['600DF Direkt Akışlı Su Arıtma Sistemi'],
    kisaAciklama: '600DF Direkt Akışlı Su Arıtma Sistemi için orijinal A.O. Smith yedek parçası. 2. Aşama, RO membran. Ürün kodu 5006334.',
    aciklama: 'A.O. Smith 600DF 2. Aşama Side Stream Membran, 600DF Direkt Akışlı Su Arıtma Sistemi cihazlarının 2. aşama yedek parçasıdır. Tip: RO membran. Ürün kodu: 5006334. Orijinal A.O. Smith parçasıdır; muadil parça kullanımı arıtma performansını ve cihazın garantisini etkileyebilir. Değişim sırasında servis ücreti ayrıca hesaplanır; buradaki fiyat yalnızca parça bedelidir.',
    etiketler: ['AO Smith', 'RO membran', 'membran', '600DF'],
  },
  {
    id: 'albsu-f-5006333', kod: '5006333', sku: 'AOS-5006333',
    slug: 'ao-smith-600df-3-asama-filtre-kartusu',
    ad: 'A.O. Smith 600DF 3. Aşama Filtre Kartuşu',
    fiyat: 1826, stok: 20,
    asama: '3. Aşama', tip: 'Filtre kartuşu',
    uyumlu: ['600DF Direkt Akışlı Su Arıtma Sistemi'],
    kisaAciklama: '600DF Direkt Akışlı Su Arıtma Sistemi için orijinal A.O. Smith yedek parçası. 3. Aşama, filtre kartuşu. Ürün kodu 5006333.',
    aciklama: 'A.O. Smith 600DF 3. Aşama Filtre Kartuşu, 600DF Direkt Akışlı Su Arıtma Sistemi cihazlarının 3. aşama yedek parçasıdır. Tip: filtre kartuşu. Ürün kodu: 5006333. Orijinal A.O. Smith parçasıdır; muadil parça kullanımı arıtma performansını ve cihazın garantisini etkileyebilir. Değişim sırasında servis ücreti ayrıca hesaplanır; buradaki fiyat yalnızca parça bedelidir.',
    etiketler: ['AO Smith', 'filtre kartuşu', 'yedek kartuş', '600DF'],
  },
  {
    id: 'albsu-f-5002131', kod: '5002131', sku: 'AOS-5002131',
    slug: 'ao-smith-daisy-vita-plus-1-asama-filtre-kartusu-qc',
    ad: 'A.O. Smith Daisy / Vita Plus 1. Aşama Filtre Kartuşu (QC)',
    fiyat: 629, stok: 20,
    asama: '1. Aşama', tip: 'Sediment filtre',
    uyumlu: ['Daisy İçme Suyu Sistemi', 'Vita Plus İçme Suyu Sistemi'],
    kisaAciklama: 'Daisy İçme Suyu Sistemi, Vita Plus İçme Suyu Sistemi için orijinal A.O. Smith yedek parçası. 1. Aşama, sediment filtre. Ürün kodu 5002131.',
    aciklama: 'A.O. Smith Daisy / Vita Plus 1. Aşama Filtre Kartuşu (QC), Daisy İçme Suyu Sistemi, Vita Plus İçme Suyu Sistemi cihazlarının 1. aşama yedek parçasıdır. Tip: sediment filtre. Ürün kodu: 5002131. Orijinal A.O. Smith parçasıdır; muadil parça kullanımı arıtma performansını ve cihazın garantisini etkileyebilir. Daisy ve Lotus modellerinde yedek kartuş siparişinde kartuşun QC mi vidalı mı olduğunu belirtmeniz gerekiyor; siparişinizin notuna yazabilir ya da bize ulaşabilirsiniz. Değişim sırasında servis ücreti ayrıca hesaplanır; buradaki fiyat yalnızca parça bedelidir.',
    etiketler: ['AO Smith', 'sediment filtre', 'yedek kartuş', 'DAISY', 'Vita Plus'],
  },
  {
    id: 'albsu-f-5002132', kod: '5002132', sku: 'AOS-5002132',
    slug: 'ao-smith-daisy-vita-plus-2-asama-kartus-qc',
    ad: 'A.O. Smith Daisy / Vita Plus 2. Aşama Kartuş (QC)',
    fiyat: 694, stok: 20,
    asama: '2. Aşama', tip: 'Karbon filtre',
    uyumlu: ['Daisy İçme Suyu Sistemi', 'Vita Plus İçme Suyu Sistemi'],
    kisaAciklama: 'Daisy İçme Suyu Sistemi, Vita Plus İçme Suyu Sistemi için orijinal A.O. Smith yedek parçası. 2. Aşama, karbon filtre. Ürün kodu 5002132.',
    aciklama: 'A.O. Smith Daisy / Vita Plus 2. Aşama Kartuş (QC), Daisy İçme Suyu Sistemi, Vita Plus İçme Suyu Sistemi cihazlarının 2. aşama yedek parçasıdır. Tip: karbon filtre. Ürün kodu: 5002132. Orijinal A.O. Smith parçasıdır; muadil parça kullanımı arıtma performansını ve cihazın garantisini etkileyebilir. Daisy ve Lotus modellerinde yedek kartuş siparişinde kartuşun QC mi vidalı mı olduğunu belirtmeniz gerekiyor; siparişinizin notuna yazabilir ya da bize ulaşabilirsiniz. Değişim sırasında servis ücreti ayrıca hesaplanır; buradaki fiyat yalnızca parça bedelidir.',
    etiketler: ['AO Smith', 'karbon filtre', 'yedek kartuş', 'DAISY', 'Vita Plus'],
  },
  {
    id: 'albsu-f-5004859', kod: '5004859', sku: 'AOS-5004859',
    slug: 'ao-smith-daisy-vita-plus-3-asama-filtre-kartusu-qc',
    ad: 'A.O. Smith Daisy / Vita Plus 3. Aşama Filtre Kartuşu (QC)',
    fiyat: 1029, stok: 20,
    asama: '3. Aşama', tip: 'Filtre kartuşu',
    uyumlu: ['Daisy İçme Suyu Sistemi', 'Vita Plus İçme Suyu Sistemi'],
    kisaAciklama: 'Daisy İçme Suyu Sistemi, Vita Plus İçme Suyu Sistemi için orijinal A.O. Smith yedek parçası. 3. Aşama, filtre kartuşu. Ürün kodu 5004859.',
    aciklama: 'A.O. Smith Daisy / Vita Plus 3. Aşama Filtre Kartuşu (QC), Daisy İçme Suyu Sistemi, Vita Plus İçme Suyu Sistemi cihazlarının 3. aşama yedek parçasıdır. Tip: filtre kartuşu. Ürün kodu: 5004859. Orijinal A.O. Smith parçasıdır; muadil parça kullanımı arıtma performansını ve cihazın garantisini etkileyebilir. Daisy ve Lotus modellerinde yedek kartuş siparişinde kartuşun QC mi vidalı mı olduğunu belirtmeniz gerekiyor; siparişinizin notuna yazabilir ya da bize ulaşabilirsiniz. Değişim sırasında servis ücreti ayrıca hesaplanır; buradaki fiyat yalnızca parça bedelidir.',
    etiketler: ['AO Smith', 'filtre kartuşu', 'yedek kartuş', 'DAISY', 'Vita Plus'],
  },
  {
    id: 'albsu-f-5002134', kod: '5002134', sku: 'AOS-5002134',
    slug: 'ao-smith-daisy-vita-plus-5-asama-filtre-kartusu-qc',
    ad: 'A.O. Smith Daisy / Vita Plus 5. Aşama Filtre Kartuşu (QC)',
    fiyat: 504, stok: 20,
    asama: '5. Aşama', tip: 'Post karbon filtre',
    uyumlu: ['Daisy İçme Suyu Sistemi', 'Vita Plus İçme Suyu Sistemi'],
    kisaAciklama: 'Daisy İçme Suyu Sistemi, Vita Plus İçme Suyu Sistemi için orijinal A.O. Smith yedek parçası. 5. Aşama, post karbon filtre. Ürün kodu 5002134.',
    aciklama: 'A.O. Smith Daisy / Vita Plus 5. Aşama Filtre Kartuşu (QC), Daisy İçme Suyu Sistemi, Vita Plus İçme Suyu Sistemi cihazlarının 5. aşama yedek parçasıdır. Tip: post karbon filtre. Ürün kodu: 5002134. Orijinal A.O. Smith parçasıdır; muadil parça kullanımı arıtma performansını ve cihazın garantisini etkileyebilir. Daisy ve Lotus modellerinde yedek kartuş siparişinde kartuşun QC mi vidalı mı olduğunu belirtmeniz gerekiyor; siparişinizin notuna yazabilir ya da bize ulaşabilirsiniz. Değişim sırasında servis ücreti ayrıca hesaplanır; buradaki fiyat yalnızca parça bedelidir.',
    etiketler: ['AO Smith', 'post karbon filtre', 'yedek kartuş', 'DAISY', 'Vita Plus'],
  },
  {
    id: 'albsu-f-5001500', kod: '5001500', sku: 'AOS-5001500',
    slug: 'ao-smith-daisy-4-asama-side-stream-membran',
    ad: 'A.O. Smith Daisy 4. Aşama Side Stream Membran',
    fiyat: 1702, stok: 20,
    asama: '4. Aşama', tip: 'RO membran',
    uyumlu: ['Daisy İçme Suyu Sistemi'],
    kisaAciklama: 'Daisy İçme Suyu Sistemi için orijinal A.O. Smith yedek parçası. 4. Aşama, RO membran. Ürün kodu 5001500.',
    aciklama: 'A.O. Smith Daisy 4. Aşama Side Stream Membran, Daisy İçme Suyu Sistemi cihazlarının 4. aşama yedek parçasıdır. Tip: RO membran. Ürün kodu: 5001500. Orijinal A.O. Smith parçasıdır; muadil parça kullanımı arıtma performansını ve cihazın garantisini etkileyebilir. Değişim sırasında servis ücreti ayrıca hesaplanır; buradaki fiyat yalnızca parça bedelidir.',
    etiketler: ['AO Smith', 'RO membran', 'membran', 'DAISY'],
  },
  {
    id: 'albsu-f-5007377', kod: '5007377', sku: 'AOS-5007377',
    slug: 'ao-smith-vita-plus-4-asama-mineral-ro-membran',
    ad: 'A.O. Smith Vita Plus 4. Aşama Mineral RO Membran',
    fiyat: 2262, stok: 20,
    asama: '4. Aşama', tip: 'RO membran',
    uyumlu: ['Vita Plus İçme Suyu Sistemi'],
    kisaAciklama: 'Vita Plus İçme Suyu Sistemi için orijinal A.O. Smith yedek parçası. 4. Aşama, RO membran. Ürün kodu 5007377.',
    aciklama: 'A.O. Smith Vita Plus 4. Aşama Mineral RO Membran, Vita Plus İçme Suyu Sistemi cihazlarının 4. aşama yedek parçasıdır. Tip: RO membran. Ürün kodu: 5007377. Orijinal A.O. Smith parçasıdır; muadil parça kullanımı arıtma performansını ve cihazın garantisini etkileyebilir. Değişim sırasında servis ücreti ayrıca hesaplanır; buradaki fiyat yalnızca parça bedelidir.',
    etiketler: ['AO Smith', 'RO membran', 'membran', 'Vita Plus'],
  },
  {
    id: 'albsu-f-5003288', kod: '5003288', sku: 'AOS-5003288',
    slug: 'ao-smith-lily-1-asama-filtre-kartusu',
    ad: 'A.O. Smith Lily 1. Aşama Filtre Kartuşu',
    fiyat: 458, stok: 20,
    asama: '1. Aşama', tip: 'Sediment filtre',
    uyumlu: ['Lily İçme Suyu Sistemi'],
    kisaAciklama: 'Lily İçme Suyu Sistemi için orijinal A.O. Smith yedek parçası. 1. Aşama, sediment filtre. Ürün kodu 5003288.',
    aciklama: 'A.O. Smith Lily 1. Aşama Filtre Kartuşu, Lily İçme Suyu Sistemi cihazlarının 1. aşama yedek parçasıdır. Tip: sediment filtre. Ürün kodu: 5003288. Orijinal A.O. Smith parçasıdır; muadil parça kullanımı arıtma performansını ve cihazın garantisini etkileyebilir. Lily modelinde fiyat kartuşun kendisine aittir; filtre kabı (haznesi) dahil değildir. Değişim sırasında servis ücreti ayrıca hesaplanır; buradaki fiyat yalnızca parça bedelidir.',
    etiketler: ['AO Smith', 'sediment filtre', 'yedek kartuş', 'Lily'],
  },
  {
    id: 'albsu-f-5003287', kod: '5003287', sku: 'AOS-5003287',
    slug: 'ao-smith-lily-2-asama-filtre-kartusu',
    ad: 'A.O. Smith Lily 2. Aşama Filtre Kartuşu',
    fiyat: 630, stok: 20,
    asama: '2. Aşama', tip: 'Karbon filtre',
    uyumlu: ['Lily İçme Suyu Sistemi'],
    kisaAciklama: 'Lily İçme Suyu Sistemi için orijinal A.O. Smith yedek parçası. 2. Aşama, karbon filtre. Ürün kodu 5003287.',
    aciklama: 'A.O. Smith Lily 2. Aşama Filtre Kartuşu, Lily İçme Suyu Sistemi cihazlarının 2. aşama yedek parçasıdır. Tip: karbon filtre. Ürün kodu: 5003287. Orijinal A.O. Smith parçasıdır; muadil parça kullanımı arıtma performansını ve cihazın garantisini etkileyebilir. Lily modelinde fiyat kartuşun kendisine aittir; filtre kabı (haznesi) dahil değildir. Değişim sırasında servis ücreti ayrıca hesaplanır; buradaki fiyat yalnızca parça bedelidir.',
    etiketler: ['AO Smith', 'karbon filtre', 'yedek kartuş', 'Lily'],
  },
  {
    id: 'albsu-f-5003286', kod: '5003286', sku: 'AOS-5003286',
    slug: 'ao-smith-lily-4-asama-filtre-kartusu',
    ad: 'A.O. Smith Lily 4. Aşama Filtre Kartuşu',
    fiyat: 630, stok: 20,
    asama: '4. Aşama', tip: 'Filtre kartuşu',
    uyumlu: ['Lily İçme Suyu Sistemi'],
    kisaAciklama: 'Lily İçme Suyu Sistemi için orijinal A.O. Smith yedek parçası. 4. Aşama, filtre kartuşu. Ürün kodu 5003286.',
    aciklama: 'A.O. Smith Lily 4. Aşama Filtre Kartuşu, Lily İçme Suyu Sistemi cihazlarının 4. aşama yedek parçasıdır. Tip: filtre kartuşu. Ürün kodu: 5003286. Orijinal A.O. Smith parçasıdır; muadil parça kullanımı arıtma performansını ve cihazın garantisini etkileyebilir. Lily modelinde fiyat kartuşun kendisine aittir; filtre kabı (haznesi) dahil değildir. Değişim sırasında servis ücreti ayrıca hesaplanır; buradaki fiyat yalnızca parça bedelidir.',
    etiketler: ['AO Smith', 'filtre kartuşu', 'yedek kartuş', 'Lily'],
  },
  {
    id: 'albsu-f-5003289', kod: '5003289', sku: 'AOS-5003289',
    slug: 'ao-smith-lily-5-asama-uv-lamba',
    ad: 'A.O. Smith Lily 5. Aşama UV Lamba',
    fiyat: 563, stok: 20,
    asama: '5. Aşama', tip: 'UV lamba',
    uyumlu: ['Lily İçme Suyu Sistemi'],
    kisaAciklama: 'Lily İçme Suyu Sistemi için orijinal A.O. Smith yedek parçası. 5. Aşama, UV lamba. Ürün kodu 5003289.',
    aciklama: 'A.O. Smith Lily 5. Aşama UV Lamba, Lily İçme Suyu Sistemi cihazlarının 5. aşama yedek parçasıdır. Tip: UV lamba. Ürün kodu: 5003289. Orijinal A.O. Smith parçasıdır; muadil parça kullanımı arıtma performansını ve cihazın garantisini etkileyebilir. Lily modelinde fiyat kartuşun kendisine aittir; filtre kabı (haznesi) dahil değildir. Değişim sırasında servis ücreti ayrıca hesaplanır; buradaki fiyat yalnızca parça bedelidir.',
    etiketler: ['AO Smith', 'UV lamba', 'yedek parça', 'Lily'],
  },
  {
    id: 'albsu-f-5003291', kod: '5003291', sku: 'AOS-5003291',
    slug: 'ao-smith-lily-3-asama-side-stream-membran',
    ad: 'A.O. Smith Lily 3. Aşama Side Stream Membran',
    fiyat: 2718, stok: 20,
    asama: '3. Aşama', tip: 'RO membran',
    uyumlu: ['Lily İçme Suyu Sistemi'],
    kisaAciklama: 'Lily İçme Suyu Sistemi için orijinal A.O. Smith yedek parçası. 3. Aşama, RO membran. Ürün kodu 5003291.',
    aciklama: 'A.O. Smith Lily 3. Aşama Side Stream Membran, Lily İçme Suyu Sistemi cihazlarının 3. aşama yedek parçasıdır. Tip: RO membran. Ürün kodu: 5003291. Orijinal A.O. Smith parçasıdır; muadil parça kullanımı arıtma performansını ve cihazın garantisini etkileyebilir. Lily modelinde fiyat kartuşun kendisine aittir; filtre kabı (haznesi) dahil değildir. Değişim sırasında servis ücreti ayrıca hesaplanır; buradaki fiyat yalnızca parça bedelidir.',
    etiketler: ['AO Smith', 'RO membran', 'membran', 'Lily'],
  },
  {
    id: 'albsu-f-5006624', kod: '5006624', sku: 'AOS-5006624',
    slug: 'ao-smith-lts-75-1-asama-sediment-filtre-kartusu',
    ad: 'A.O. Smith LTS 75 1. Aşama Sediment Filtre Kartuşu',
    fiyat: 284, stok: 20,
    asama: '1. Aşama', tip: 'Sediment filtre',
    uyumlu: ['LTS 75 LX', 'LTS 75 SX'],
    kisaAciklama: 'LTS 75 LX, LTS 75 SX için orijinal A.O. Smith yedek parçası. 1. Aşama, sediment filtre. Ürün kodu 5006624.',
    aciklama: 'A.O. Smith LTS 75 1. Aşama Sediment Filtre Kartuşu, LTS 75 LX, LTS 75 SX cihazlarının 1. aşama yedek parçasıdır. Tip: sediment filtre. Ürün kodu: 5006624. Orijinal A.O. Smith parçasıdır; muadil parça kullanımı arıtma performansını ve cihazın garantisini etkileyebilir. Değişim sırasında servis ücreti ayrıca hesaplanır; buradaki fiyat yalnızca parça bedelidir.',
    etiketler: ['AO Smith', 'sediment filtre', 'yedek kartuş', 'LTS'],
  },
  {
    id: 'albsu-f-5006625', kod: '5006625', sku: 'AOS-5006625',
    slug: 'ao-smith-lts-75-2-asama-gac-filtre-kartusu',
    ad: 'A.O. Smith LTS 75 2. Aşama GAC Filtre Kartuşu',
    fiyat: 399, stok: 20,
    asama: '2. Aşama', tip: 'GAC karbon filtre',
    uyumlu: ['LTS 75 LX', 'LTS 75 SX'],
    kisaAciklama: 'LTS 75 LX, LTS 75 SX için orijinal A.O. Smith yedek parçası. 2. Aşama, GAC karbon filtre. Ürün kodu 5006625.',
    aciklama: 'A.O. Smith LTS 75 2. Aşama GAC Filtre Kartuşu, LTS 75 LX, LTS 75 SX cihazlarının 2. aşama yedek parçasıdır. Tip: GAC karbon filtre. Ürün kodu: 5006625. Orijinal A.O. Smith parçasıdır; muadil parça kullanımı arıtma performansını ve cihazın garantisini etkileyebilir. Değişim sırasında servis ücreti ayrıca hesaplanır; buradaki fiyat yalnızca parça bedelidir.',
    etiketler: ['AO Smith', 'GAC karbon filtre', 'yedek kartuş', 'LTS'],
  },
  {
    id: 'albsu-f-5006628', kod: '5006628', sku: 'AOS-5006628',
    slug: 'ao-smith-lts-75-3-asama-blok-karbon-filtre-kartusu',
    ad: 'A.O. Smith LTS 75 3. Aşama Blok Karbon Filtre Kartuşu',
    fiyat: 441, stok: 20,
    asama: '3. Aşama', tip: 'Blok karbon filtre',
    uyumlu: ['LTS 75 LX', 'LTS 75 SX'],
    kisaAciklama: 'LTS 75 LX, LTS 75 SX için orijinal A.O. Smith yedek parçası. 3. Aşama, blok karbon filtre. Ürün kodu 5006628.',
    aciklama: 'A.O. Smith LTS 75 3. Aşama Blok Karbon Filtre Kartuşu, LTS 75 LX, LTS 75 SX cihazlarının 3. aşama yedek parçasıdır. Tip: blok karbon filtre. Ürün kodu: 5006628. Orijinal A.O. Smith parçasıdır; muadil parça kullanımı arıtma performansını ve cihazın garantisini etkileyebilir. Değişim sırasında servis ücreti ayrıca hesaplanır; buradaki fiyat yalnızca parça bedelidir.',
    etiketler: ['AO Smith', 'blok karbon filtre', 'yedek kartuş', 'LTS'],
  },
  {
    id: 'albsu-f-5006629', kod: '5006629', sku: 'AOS-5006629',
    slug: 'ao-smith-lts-75-5-asama-post-karbon-filtre-kartusu',
    ad: 'A.O. Smith LTS 75 5. Aşama Post Karbon Filtre Kartuşu',
    fiyat: 273, stok: 20,
    asama: '5. Aşama', tip: 'Post karbon filtre',
    uyumlu: ['LTS 75 LX', 'LTS 75 SX'],
    kisaAciklama: 'LTS 75 LX, LTS 75 SX için orijinal A.O. Smith yedek parçası. 5. Aşama, post karbon filtre. Ürün kodu 5006629.',
    aciklama: 'A.O. Smith LTS 75 5. Aşama Post Karbon Filtre Kartuşu, LTS 75 LX, LTS 75 SX cihazlarının 5. aşama yedek parçasıdır. Tip: post karbon filtre. Ürün kodu: 5006629. Orijinal A.O. Smith parçasıdır; muadil parça kullanımı arıtma performansını ve cihazın garantisini etkileyebilir. Değişim sırasında servis ücreti ayrıca hesaplanır; buradaki fiyat yalnızca parça bedelidir.',
    etiketler: ['AO Smith', 'post karbon filtre', 'yedek kartuş', 'LTS'],
  },
  {
    id: 'albsu-f-5006861', kod: '5006861', sku: 'AOS-5006861',
    slug: 'ao-smith-lts-75-4-asama-ro-membran',
    ad: 'A.O. Smith LTS 75 4. Aşama RO Membran',
    fiyat: 970, stok: 20,
    asama: '4. Aşama', tip: 'RO membran',
    uyumlu: ['LTS 75 LX', 'LTS 75 SX'],
    kisaAciklama: 'LTS 75 LX, LTS 75 SX için orijinal A.O. Smith yedek parçası. 4. Aşama, RO membran. Ürün kodu 5006861.',
    aciklama: 'A.O. Smith LTS 75 4. Aşama RO Membran, LTS 75 LX, LTS 75 SX cihazlarının 4. aşama yedek parçasıdır. Tip: RO membran. Ürün kodu: 5006861. Orijinal A.O. Smith parçasıdır; muadil parça kullanımı arıtma performansını ve cihazın garantisini etkileyebilir. Değişim sırasında servis ücreti ayrıca hesaplanır; buradaki fiyat yalnızca parça bedelidir.',
    etiketler: ['AO Smith', 'RO membran', 'membran', 'LTS'],
  },
  {
    id: 'albsu-f-5003731', kod: '5003731', sku: 'AOS-5003731',
    slug: 'ao-smith-lotus-1-asama-filtre-kartusu-qc',
    ad: 'A.O. Smith Lotus 1. Aşama Filtre Kartuşu (QC)',
    fiyat: 602, stok: 20,
    asama: '1. Aşama', tip: 'Sediment filtre',
    uyumlu: ['Lotus 75TC İçme Suyu Sistemi', 'Lotus 75M İçme Suyu Sistemi'],
    kisaAciklama: 'Lotus 75TC İçme Suyu Sistemi, Lotus 75M İçme Suyu Sistemi için orijinal A.O. Smith yedek parçası. 1. Aşama, sediment filtre. Ürün kodu 5003731.',
    aciklama: 'A.O. Smith Lotus 1. Aşama Filtre Kartuşu (QC), Lotus 75TC İçme Suyu Sistemi, Lotus 75M İçme Suyu Sistemi cihazlarının 1. aşama yedek parçasıdır. Tip: sediment filtre. Ürün kodu: 5003731. Orijinal A.O. Smith parçasıdır; muadil parça kullanımı arıtma performansını ve cihazın garantisini etkileyebilir. Daisy ve Lotus modellerinde yedek kartuş siparişinde kartuşun QC mi vidalı mı olduğunu belirtmeniz gerekiyor; siparişinizin notuna yazabilir ya da bize ulaşabilirsiniz. Değişim sırasında servis ücreti ayrıca hesaplanır; buradaki fiyat yalnızca parça bedelidir.',
    etiketler: ['AO Smith', 'sediment filtre', 'yedek kartuş', 'LOTUS'],
  },
  {
    id: 'albsu-f-5003732', kod: '5003732', sku: 'AOS-5003732',
    slug: 'ao-smith-lotus-2-asama-filtre-kartusu-qc',
    ad: 'A.O. Smith Lotus 2. Aşama Filtre Kartuşu (QC)',
    fiyat: 629, stok: 20,
    asama: '2. Aşama', tip: 'Karbon filtre',
    uyumlu: ['Lotus 75TC İçme Suyu Sistemi', 'Lotus 75M İçme Suyu Sistemi'],
    kisaAciklama: 'Lotus 75TC İçme Suyu Sistemi, Lotus 75M İçme Suyu Sistemi için orijinal A.O. Smith yedek parçası. 2. Aşama, karbon filtre. Ürün kodu 5003732.',
    aciklama: 'A.O. Smith Lotus 2. Aşama Filtre Kartuşu (QC), Lotus 75TC İçme Suyu Sistemi, Lotus 75M İçme Suyu Sistemi cihazlarının 2. aşama yedek parçasıdır. Tip: karbon filtre. Ürün kodu: 5003732. Orijinal A.O. Smith parçasıdır; muadil parça kullanımı arıtma performansını ve cihazın garantisini etkileyebilir. Daisy ve Lotus modellerinde yedek kartuş siparişinde kartuşun QC mi vidalı mı olduğunu belirtmeniz gerekiyor; siparişinizin notuna yazabilir ya da bize ulaşabilirsiniz. Değişim sırasında servis ücreti ayrıca hesaplanır; buradaki fiyat yalnızca parça bedelidir.',
    etiketler: ['AO Smith', 'karbon filtre', 'yedek kartuş', 'LOTUS'],
  },
  {
    id: 'albsu-f-5004858', kod: '5004858', sku: 'AOS-5004858',
    slug: 'ao-smith-lotus-3-asama-filtre-kartusu-qc',
    ad: 'A.O. Smith Lotus 3. Aşama Filtre Kartuşu (QC)',
    fiyat: 928, stok: 20,
    asama: '3. Aşama', tip: 'Filtre kartuşu',
    uyumlu: ['Lotus 75TC İçme Suyu Sistemi', 'Lotus 75M İçme Suyu Sistemi'],
    kisaAciklama: 'Lotus 75TC İçme Suyu Sistemi, Lotus 75M İçme Suyu Sistemi için orijinal A.O. Smith yedek parçası. 3. Aşama, filtre kartuşu. Ürün kodu 5004858.',
    aciklama: 'A.O. Smith Lotus 3. Aşama Filtre Kartuşu (QC), Lotus 75TC İçme Suyu Sistemi, Lotus 75M İçme Suyu Sistemi cihazlarının 3. aşama yedek parçasıdır. Tip: filtre kartuşu. Ürün kodu: 5004858. Orijinal A.O. Smith parçasıdır; muadil parça kullanımı arıtma performansını ve cihazın garantisini etkileyebilir. Daisy ve Lotus modellerinde yedek kartuş siparişinde kartuşun QC mi vidalı mı olduğunu belirtmeniz gerekiyor; siparişinizin notuna yazabilir ya da bize ulaşabilirsiniz. Değişim sırasında servis ücreti ayrıca hesaplanır; buradaki fiyat yalnızca parça bedelidir.',
    etiketler: ['AO Smith', 'filtre kartuşu', 'yedek kartuş', 'LOTUS'],
  },
  {
    id: 'albsu-f-5003734', kod: '5003734', sku: 'AOS-5003734',
    slug: 'ao-smith-lotus-5-asama-filtre-kartusu-qc',
    ad: 'A.O. Smith Lotus 5. Aşama Filtre Kartuşu (QC)',
    fiyat: 452, stok: 20,
    asama: '5. Aşama', tip: 'Post karbon filtre',
    uyumlu: ['Lotus 75TC İçme Suyu Sistemi', 'Lotus 75M İçme Suyu Sistemi'],
    kisaAciklama: 'Lotus 75TC İçme Suyu Sistemi, Lotus 75M İçme Suyu Sistemi için orijinal A.O. Smith yedek parçası. 5. Aşama, post karbon filtre. Ürün kodu 5003734.',
    aciklama: 'A.O. Smith Lotus 5. Aşama Filtre Kartuşu (QC), Lotus 75TC İçme Suyu Sistemi, Lotus 75M İçme Suyu Sistemi cihazlarının 5. aşama yedek parçasıdır. Tip: post karbon filtre. Ürün kodu: 5003734. Orijinal A.O. Smith parçasıdır; muadil parça kullanımı arıtma performansını ve cihazın garantisini etkileyebilir. Daisy ve Lotus modellerinde yedek kartuş siparişinde kartuşun QC mi vidalı mı olduğunu belirtmeniz gerekiyor; siparişinizin notuna yazabilir ya da bize ulaşabilirsiniz. Değişim sırasında servis ücreti ayrıca hesaplanır; buradaki fiyat yalnızca parça bedelidir.',
    etiketler: ['AO Smith', 'post karbon filtre', 'yedek kartuş', 'LOTUS'],
  },
  {
    id: 'albsu-f-5004705', kod: '5004705', sku: 'AOS-5004705',
    slug: 'ao-smith-lotus-4-asama-membran',
    ad: 'A.O. Smith Lotus 4. Aşama Membran',
    fiyat: 1056, stok: 20,
    asama: '4. Aşama', tip: 'RO membran',
    uyumlu: ['Lotus 75TC İçme Suyu Sistemi', 'Lotus 75M İçme Suyu Sistemi'],
    kisaAciklama: 'Lotus 75TC İçme Suyu Sistemi, Lotus 75M İçme Suyu Sistemi için orijinal A.O. Smith yedek parçası. 4. Aşama, RO membran. Ürün kodu 5004705.',
    aciklama: 'A.O. Smith Lotus 4. Aşama Membran, Lotus 75TC İçme Suyu Sistemi, Lotus 75M İçme Suyu Sistemi cihazlarının 4. aşama yedek parçasıdır. Tip: RO membran. Ürün kodu: 5004705. Orijinal A.O. Smith parçasıdır; muadil parça kullanımı arıtma performansını ve cihazın garantisini etkileyebilir. Değişim sırasında servis ücreti ayrıca hesaplanır; buradaki fiyat yalnızca parça bedelidir.',
    etiketler: ['AO Smith', 'RO membran', 'membran', 'LOTUS'],
  },
  {
    id: 'albsu-f-5002818', kod: '5002818', sku: 'AOS-5002818',
    slug: 'ao-smith-frezya-300-600s-1-asama-filtre-kartusu',
    ad: 'A.O. Smith Frezya 300 / 600S 1. Aşama Filtre Kartuşu',
    fiyat: 730, stok: 20,
    asama: '1. Aşama', tip: 'Sediment filtre',
    uyumlu: ['Frezya 300 S', 'Frezya 300 TU', 'Frezya 600 S'],
    kisaAciklama: 'Frezya 300 S, Frezya 300 TU, Frezya 600 S için orijinal A.O. Smith yedek parçası. 1. Aşama, sediment filtre. Ürün kodu 5002818.',
    aciklama: 'A.O. Smith Frezya 300 / 600S 1. Aşama Filtre Kartuşu, Frezya 300 S, Frezya 300 TU, Frezya 600 S cihazlarının 1. aşama yedek parçasıdır. Tip: sediment filtre. Ürün kodu: 5002818. Orijinal A.O. Smith parçasıdır; muadil parça kullanımı arıtma performansını ve cihazın garantisini etkileyebilir. Değişim sırasında servis ücreti ayrıca hesaplanır; buradaki fiyat yalnızca parça bedelidir.',
    etiketler: ['AO Smith', 'sediment filtre', 'yedek kartuş', 'Frezya'],
  },
  {
    id: 'albsu-f-5002819', kod: '5002819', sku: 'AOS-5002819',
    slug: 'ao-smith-frezya-300-600s-2-asama-filtre-kartusu',
    ad: 'A.O. Smith Frezya 300 / 600S 2. Aşama Filtre Kartuşu',
    fiyat: 730, stok: 20,
    asama: '2. Aşama', tip: 'Karbon filtre',
    uyumlu: ['Frezya 300 S', 'Frezya 300 TU', 'Frezya 600 S'],
    kisaAciklama: 'Frezya 300 S, Frezya 300 TU, Frezya 600 S için orijinal A.O. Smith yedek parçası. 2. Aşama, karbon filtre. Ürün kodu 5002819.',
    aciklama: 'A.O. Smith Frezya 300 / 600S 2. Aşama Filtre Kartuşu, Frezya 300 S, Frezya 300 TU, Frezya 600 S cihazlarının 2. aşama yedek parçasıdır. Tip: karbon filtre. Ürün kodu: 5002819. Orijinal A.O. Smith parçasıdır; muadil parça kullanımı arıtma performansını ve cihazın garantisini etkileyebilir. Değişim sırasında servis ücreti ayrıca hesaplanır; buradaki fiyat yalnızca parça bedelidir.',
    etiketler: ['AO Smith', 'karbon filtre', 'yedek kartuş', 'Frezya'],
  },
  {
    id: 'albsu-f-5004520', kod: '5004520', sku: 'AOS-5004520',
    slug: 'ao-smith-frezya-300-600s-4-asama-filtre-kartusu',
    ad: 'A.O. Smith Frezya 300 / 600S 4. Aşama Filtre Kartuşu',
    fiyat: 1409, stok: 20,
    asama: '4. Aşama', tip: 'Post karbon filtre',
    uyumlu: ['Frezya 300 S', 'Frezya 300 TU', 'Frezya 600 S'],
    kisaAciklama: 'Frezya 300 S, Frezya 300 TU, Frezya 600 S için orijinal A.O. Smith yedek parçası. 4. Aşama, post karbon filtre. Ürün kodu 5004520.',
    aciklama: 'A.O. Smith Frezya 300 / 600S 4. Aşama Filtre Kartuşu, Frezya 300 S, Frezya 300 TU, Frezya 600 S cihazlarının 4. aşama yedek parçasıdır. Tip: post karbon filtre. Ürün kodu: 5004520. Orijinal A.O. Smith parçasıdır; muadil parça kullanımı arıtma performansını ve cihazın garantisini etkileyebilir. Değişim sırasında servis ücreti ayrıca hesaplanır; buradaki fiyat yalnızca parça bedelidir.',
    etiketler: ['AO Smith', 'post karbon filtre', 'yedek kartuş', 'Frezya'],
  },
  {
    id: 'albsu-f-5002821', kod: '5002821', sku: 'AOS-5002821',
    slug: 'ao-smith-frezya-300-600s-3-asama-membran',
    ad: 'A.O. Smith Frezya 300 / 600S 3. Aşama Membran',
    fiyat: 3494, stok: 20,
    asama: '3. Aşama', tip: 'RO membran',
    uyumlu: ['Frezya 300 S', 'Frezya 300 TU', 'Frezya 600 S'],
    kisaAciklama: 'Frezya 300 S, Frezya 300 TU, Frezya 600 S için orijinal A.O. Smith yedek parçası. 3. Aşama, RO membran. Ürün kodu 5002821.',
    aciklama: 'A.O. Smith Frezya 300 / 600S 3. Aşama Membran, Frezya 300 S, Frezya 300 TU, Frezya 600 S cihazlarının 3. aşama yedek parçasıdır. Tip: RO membran. Ürün kodu: 5002821. Orijinal A.O. Smith parçasıdır; muadil parça kullanımı arıtma performansını ve cihazın garantisini etkileyebilir. Değişim sırasında servis ücreti ayrıca hesaplanır; buradaki fiyat yalnızca parça bedelidir.',
    etiketler: ['AO Smith', 'RO membran', 'membran', 'Frezya'],
  },
]
