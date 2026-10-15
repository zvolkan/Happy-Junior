import { prisma, type TransactionClient } from '@/lib/db'
import {
  refundPayment,
  cancelPayment,
  retrievePayment,
  iadeSonucunuSiniflandir,
  type IadeSonucu,
} from '@/lib/iyzico'
import { notifyOrderRefunded } from '@/lib/email/notify'
import {
  completeReturnRequestsForOrder,
  completeSingleReturnRequest,
} from '@/lib/return-requests'
import { appendOrderNote } from '@/lib/order-note'

/**
 * Sipariş iadesi — TEK KAYNAK.
 *
 * Hem admin panelindeki "İade Et" butonu hem de müşterinin ödenmiş siparişi
 * iptal etmesi buradan geçer. Eskiden müşteri iptali hiçbir iade çağrısı
 * yapmıyor, stokları da geri yüklemiyordu.
 *
 * Kritik kural: **gateway başarısız olursa sipariş REFUNDED işaretlenmez.**
 * Aksi hâlde para müşteriye dönmeden sipariş "iade edildi" görünür ve durum
 * geri alınamaz hâle gelirdi.
 */

export type RefundOutcome =
  | { ok: true; message: string; gateway: 'cancel' | 'refund' }
  | {
      ok: false
      error: string
      needsManualReview: boolean
      /**
       * Sonuç ÖĞRENİLEMEDİ — para iade edilmiş de olabilir.
       *
       * `needsManualReview`'dan ayrı bir bayrak: o, "yönetici bir baksın"
       * demek ve kesin retlerde de doğru olabiliyor. Bu ise "iyzico'ya istek
       * gitti, cevabı alamadık" demek. Çağıran kodun müşteriye söylediği şey
       * bu ikisinde farklı olmak zorunda: kesin rette "iptal edilemedi, tekrar
       * deneyin", belirsizde "işleniyor, tekrar denemeyin".
       */
      belirsiz?: boolean
    }

/** İade sonucu öğrenilemeyen siparişin ödeme durumu. */
export const IADE_BELIRSIZ_DURUMU = 'refund_pending'

interface RefundOptions {
  orderId: string
  ip?: string
  /** Gateway başarısız olsa bile siparişi REFUNDED yap (yalnızca admin, elle iade sonrası) */
  force?: boolean
  /**
   * iyzico'ya HİÇ DOKUNMA, yalnızca kaydı kapat.
   *
   * "iyzico panelinden elle iade ettim" için. `force` tek başına yetmiyordu:
   * iptal ve iade çağrıları yine yapılıyor, yalnızca sonuçları yok sayılıyordu.
   * Yöneticinin elle iade ettiği bir ödemeye ikinci bir para hareketi isteği
   * göndermek, en iyi hâlde gereksiz — istemediğimiz bir şeyi istemek.
   */
  gatewayAtla?: boolean
  /** İade sebebi — admin notuna yazılır */
  reason?: string
  /**
   * KISMİ İADE: verilirse yalnızca bu iade talebindeki kalemler iade edilir.
   *
   * Eskiden böyle bir seçenek yoktu: müşteri 5 kalemlik siparişin 1 kalemi için
   * talep açsa bile `order.totalAmount`'ın TAMAMI iade ediliyor ve BÜTÜN
   * kalemlerin stoğu geri yükleniyordu. Doğrudan gelir kaybıydı.
   */
  returnRequestId?: string
}

/** Kısmi iadede sipariş REFUNDED olmaz; bu ara durumu alır. */
const KISMI_IADE_DURUMU = 'partially_refunded'

type TalepKalemi = { orderItemId: string; quantity: number }

function talepKalemleriniOku(raw: unknown): TalepKalemi[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((r) => {
      const o = r as { orderItemId?: unknown; quantity?: unknown }
      const id = typeof o?.orderItemId === 'string' ? o.orderItemId : null
      const qty = Number(o?.quantity)
      return id && Number.isInteger(qty) && qty > 0 ? { orderItemId: id, quantity: qty } : null
    })
    .filter((x): x is TalepKalemi => x !== null)
}

/** Kuruş hassasiyetinde yuvarlama */
function para(v: number): number {
  return Math.round((v + Number.EPSILON) * 100) / 100
}

export async function processRefund(options: RefundOptions): Promise<RefundOutcome> {
  const {
    orderId,
    ip = '127.0.0.1',
    force = false,
    gatewayAtla = false,
    reason,
    returnRequestId,
  } = options

  // Kilitten önceki ödeme durumu — başarısızlıkta buraya geri dönülecek.
  const oncekiKayit = await prisma.order.findUnique({
    where: { id: orderId },
    select: { paymentStatus: true },
  })
  // `refunding` ASLA geri dönülecek bir durum değil: o bir kilit, bir hâl
  // değil. Yarıda kesilmiş bir denemeden kalmışsa oraya geri dönmek siparişi
  // tekrar aynı kilide hapsetmek olur. Belirsiz durumuna alıyoruz — orası
  // yöneticinin göreceği, çıkışı olan bir hâl.
  const hamOncekiDurum = oncekiKayit?.paymentStatus ?? 'paid'
  const oncekiOdemeDurumu = hamOncekiDurum === 'refunding' ? IADE_BELIRSIZ_DURUMU : hamOncekiDurum

  // ── Kilitle: yalnızca ödenmiş ve henüz iade edilmemiş siparişi işleme al ──
  // Bu koşullu güncelleme, iki sekmeden aynı anda basılan "İade Et" butonunun
  // çift iadeye ve çift stok artışına yol açmasını engeller.
  //
  // ── `force` neden daha geniş bir kapı açıyor ─────────────────────────────
  //
  // Elle iade (yönetici "iyzico panelinden iade ettim" diyor) askıda kalmış
  // siparişleri KURTARMAK için var. Askıda kalma iki biçimde oluyor:
  // `refunding` (işlem yarıda kesildi, kilit bırakılamadı) ve
  // `refund_pending` (istek gitti, cevap gelmedi). Kapı yalnızca `paid`'e
  // açıksa yönetici tam da bu iki durumda hiçbir şey yapamıyor — oysa
  // kurtarılması gereken siparişler yalnızca bunlar.
  //
  // `refund_pending` NORMAL iadeye de açık: yönetici iyzico panelinde iade
  // OLMADIĞINI görüp yeniden denemek isteyecek ve askıda kalmış siparişin tek
  // çıkışı bu. Çift iade riski `iadeSonucunuSiniflandir` tarafından
  // kapatılıyor: gerçekten iptal edilmiş bir ödemeye ikinci istek gidince
  // iyzico "zaten iptal edilmiş" diyor ve biz bunu başarı sayıyoruz.
  //
  // `refunding` yalnızca `force` ile açık — o bir kilit, bir hâl değil; şu an
  // gerçekten süren bir işlemin üstüne gitmek çift iade demek.
  const kabulEdilenDurumlar = force
    ? ['paid', KISMI_IADE_DURUMU, 'refunding', IADE_BELIRSIZ_DURUMU]
    : returnRequestId
      ? // Kısmi iade sonrası sipariş `partially_refunded` durumunda kalıyor;
        // aynı siparişin ikinci bir kalemi de iade edilebilmeli.
        ['paid', KISMI_IADE_DURUMU, IADE_BELIRSIZ_DURUMU]
      : ['paid', IADE_BELIRSIZ_DURUMU]

  const claimed = await prisma.order.updateMany({
    where: {
      id: orderId,
      paymentStatus: { in: kabulEdilenDurumlar },
      status: { not: 'REFUNDED' },
    },
    data: { paymentStatus: 'refunding' },
  })

  if (claimed.count === 0) {
    const existing = await prisma.order.findUnique({
      where: { id: orderId },
      select: { status: true, paymentStatus: true },
    })

    if (!existing) return { ok: false, error: 'Sipariş bulunamadı.', needsManualReview: false }
    if (existing.status === 'REFUNDED' || existing.paymentStatus === 'refunded') {
      return { ok: false, error: 'Bu sipariş zaten iade edilmiş.', needsManualReview: false }
    }
    if (existing.paymentStatus === 'refunding') {
      return {
        ok: false,
        error: 'Bu sipariş için iade işlemi hâlihazırda sürüyor.',
        needsManualReview: false,
      }
    }
    return {
      ok: false,
      error: 'Bu sipariş için tahsil edilmiş bir ödeme yok.',
      needsManualReview: false,
    }
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderNumber: true,
      paymentId: true,
      totalAmount: true,
      stockReduced: true,
      items: { select: { id: true, productId: true, quantity: true, totalPrice: true } },
      returnRequests: { select: { id: true, status: true, items: true } },
    },
  }) as {
    id: string
    orderNumber: string | null
    paymentId: string | null
    totalAmount: unknown
    stockReduced: boolean
    items: { id: string; productId: string; quantity: number; totalPrice: unknown }[]
    returnRequests: { id: string; status: string; items: unknown }[]
  } | null

  if (!order) {
    return { ok: false, error: 'Sipariş bulunamadı.', needsManualReview: false }
  }

  /** Başarısızlıkta kilidi bırak — sipariş tekrar denenebilir kalsın */
  async function releaseLock(note?: string) {
    await prisma.order
      .update({
        where: { id: orderId },
        // Kilitten önceki duruma dön. Kısmi iade denemesi başarısız olursa
        // sipariş `paid` değil, bulunduğu ara duruma dönmeli.
        data: { paymentStatus: oncekiOdemeDurumu },
      })
      .catch((e) => console.error('[iade] kilit bırakılamadı:', orderId, e))
    // Not, adminNote'u EZMEDEN ekleniyor
    if (note) await appendOrderNote(orderId, note)
  }

  // ── Kısmi iade hesabı ────────────────────────────────────────────────────
  const siparisToplami = para(Number(order.totalAmount))
  let kismi = false
  let iadeTutari = siparisToplami
  /** Stoğu geri yüklenecek kalemler */
  let iadeKalemleri = order.items.map((i) => ({
    productId: i.productId,
    quantity: i.quantity,
  }))

  if (returnRequestId) {
    const talep = order.returnRequests.find((r) => r.id === returnRequestId)
    if (!talep) {
      await releaseLock()
      return { ok: false, error: 'İade talebi bu siparişe ait değil.', needsManualReview: false }
    }
    if (talep.status === 'COMPLETED' || talep.status === 'REJECTED') {
      await releaseLock()
      return { ok: false, error: 'Bu iade talebi zaten sonuçlandırılmış.', needsManualReview: false }
    }

    const secilen = talepKalemleriniOku(talep.items)
    const kalemHaritasi = new Map(order.items.map((i) => [i.id, i]))

    const eslesen = secilen
      .map((s) => {
        const kalem = kalemHaritasi.get(s.orderItemId)
        if (!kalem) return null
        const adet = Math.min(s.quantity, kalem.quantity)
        // Satır toplamından birim fiyat türetiliyor; ürün fiyatı sonradan
        // değişmiş olabilir, sipariş anındaki tutar esas alınmalı.
        const birim = Number(kalem.totalPrice) / kalem.quantity
        return { productId: kalem.productId, quantity: adet, tutar: para(birim * adet) }
      })
      .filter((x): x is { productId: string; quantity: number; tutar: number } => x !== null)

    if (eslesen.length === 0) {
      await releaseLock()
      return { ok: false, error: 'İade talebinde geçerli kalem yok.', needsManualReview: false }
    }

    const hesaplanan = para(eslesen.reduce((t, e) => t + e.tutar, 0))

    // Daha önce kısmi iade yapıldıysa toplam sipariş tutarını aşmasın
    const oncekiTamamlanan = order.returnRequests
      .filter((r) => r.status === 'COMPLETED')
      .flatMap((r) => talepKalemleriniOku(r.items))
      .reduce((t, s) => {
        const kalem = kalemHaritasi.get(s.orderItemId)
        if (!kalem) return t
        const birim = Number(kalem.totalPrice) / kalem.quantity
        return t + birim * Math.min(s.quantity, kalem.quantity)
      }, 0)

    if (para(oncekiTamamlanan + hesaplanan) > siparisToplami + 0.01) {
      await releaseLock(
        `Kısmi iade reddedildi: talep tutarı (${hesaplanan} TL) önceki iadelerle birlikte ` +
          `sipariş tutarını (${siparisToplami} TL) aşıyor.`,
      )
      return {
        ok: false,
        error: 'İade tutarı sipariş tutarını aşıyor. Siparişi elle kontrol edin.',
        needsManualReview: true,
      }
    }

    // Talep siparişin BÜTÜN kalemlerini TAM adetle kapsıyor mu?
    // Kapsıyorsa bu bir tam iadedir ve KARGO BEDELİ de iade edilmelidir
    // (Mesafeli Sözleşmeler Yönetmeliği: tam cayma hâlinde teslim masrafı da
    // iade edilir). Kalem toplamı sipariş toplamından kargo kadar düşük
    // olduğu için, bunu kontrol etmeden "kısmi iade" sanılırdı.
    const talepAdetleri = new Map<string, number>()
    for (const e of eslesen) talepAdetleri.set(e.productId, (talepAdetleri.get(e.productId) ?? 0) + e.quantity)
    const tumKalemlerKapsandi = order.items.every(
      (i) => (talepAdetleri.get(i.productId) ?? 0) >= i.quantity,
    )

    if (tumKalemlerKapsandi && oncekiTamamlanan === 0) {
      iadeTutari = siparisToplami
      kismi = false
    } else {
      iadeTutari = hesaplanan
      kismi = true
    }

    iadeKalemleri = eslesen.map((e) => ({ productId: e.productId, quantity: e.quantity }))
  }

  // ── Gateway ──────────────────────────────────────────────────────────────
  let gateway: 'cancel' | 'refund' | null = null
  let gatewayError = 'Ödeme sağlayıcısına ulaşılamadı.'
  /** Sonucu öğrenilemeyen bir para hareketi denendi mi? */
  let belirsizKaldi = false

  /**
   * İade sonucu belirsizken siparişi askıya al.
   *
   * ── Neden "geri al" değil ─────────────────────────────────────────────────
   *
   * Eskiden buradaki tek davranış `releaseLock()` idi: sipariş `paid`'e,
   * durumu CONFIRMED'e dönüyor ve müşteriye "iptal edilemedi" deniyordu. Ama
   * cevabın gelmemesi iyzico'nun işi yapmadığı anlamına gelmiyor. Gerçekte
   * olan şuydu: iyzico ödemeyi iptal etti, cevap Cloudflare ile iyzico
   * arasındaki TLS sorununda kayboldu, biz siparişi eski hâline döndürdük.
   * İyzico panelinde sipariş iptal, sitede "Siparişi İptal Et" düğmesi duruyor.
   *
   * Doğru davranış üçüncü bir hâl: ne başarılı ne başarısız. Sipariş
   * `refund_pending` oluyor — müşteri düğmeyi görmüyor ("işleniyor" yazısını
   * görüyor), yönetici panelinde sipariş işaretli duruyor, mutabakat görevi
   * her saat iyzico'ya gerçekte ne olduğunu soruyor
   * (bkz. src/lib/refund-reconcile.ts).
   */
  async function askiyaAl(kanit: string): Promise<RefundOutcome> {
    await prisma.order
      .update({
        where: { id: orderId },
        data: { paymentStatus: IADE_BELIRSIZ_DURUMU },
      })
      .catch((e) => console.error('[iade] belirsiz durumu yazılamadı:', orderId, e))

    await appendOrderNote(
      orderId,
      `İADE SONUCU BELİRSİZ (${new Date().toISOString()}): ${kanit} ` +
        'Para iade edilmiş OLABİLİR. iyzico panelinden ödemeyi kontrol edin: ' +
        'iade görünüyorsa "elle iade edildi" ile işaretleyin, görünmüyorsa iadeyi tekrar başlatın.',
    )

    console.error('[iade] sonuç belirsiz, sipariş askıya alındı:', orderId, kanit)

    return {
      ok: false,
      error:
        'İptal talebiniz alındı ancak ödeme sağlayıcısından onay henüz gelmedi. ' +
        'Talebiniz işleme alındı; tekrar denemeyin. Sonuçlandığında sipariş durumunuz güncellenecek.',
      needsManualReview: true,
      belirsiz: true,
    }
  }

  /**
   * Belirsiz kalan bir para hareketinden sonra "gerçekte ne oldu" sorusu.
   *
   * `/payment/detail` salt okunur; çağırmanın hiçbir yan etkisi yok. Yanıtı
   * olduğu gibi yorumlamaya ÇALIŞMIYORUZ — iyzico'nun iade alanlarının adları
   * ve anlamları sürümler arasında değişiyor, yanlış okumak çift iadeden beter.
   * Yaptığımız şey daha mütevazı ve daha sağlam: yanıtın özetini siparişin
   * yönetici notuna yazıyoruz ki panelde bakan kişi tahmin etmek zorunda
   * kalmasın.
   */
  async function detayiKanitOlarakTopla(paymentId: string): Promise<string> {
    try {
      const detay = await retrievePayment({
        paymentId,
        conversationId: order?.orderNumber ?? orderId,
      })
      const ozet = {
        status: detay?.status,
        errorCode: detay?.errorCode,
        errorMessage: detay?.errorMessage,
        paymentStatus: detay?.paymentStatus,
        price: detay?.price,
        paidPrice: detay?.paidPrice,
      }
      return `iyzico ödeme sorgusu: ${JSON.stringify(ozet)}.`
    } catch (error) {
      return `iyzico ödeme sorgusu da yapılamadı (${String(error).slice(0, 160)}).`
    }
  }

  if (gatewayAtla) {
    // Yönetici "ben iyzico'da hallettim" diyor. iyzico'ya hiçbir istek
    // gitmiyor; aşağıdaki blok atlanıp doğrudan kaydın kapatılmasına geçiliyor.
    console.log('[iade] gateway atlandı (elle iade):', orderId)
  } else if (!order.paymentId) {
    if (!force) {
      await releaseLock(
        'İade denendi ancak siparişte ödeme kimliği (paymentId) yok. Ödeme iyzico panelinden elle iade edilmeli.',
      )
      return {
        ok: false,
        error:
          'Bu siparişte ödeme kimliği kayıtlı değil; otomatik iade yapılamıyor. iyzico panelinden elle iade edip "elle iade edildi" seçeneğiyle işaretleyin.',
        needsManualReview: true,
      }
    }
  } else {
    const amount = iadeTutari.toFixed(2)

    // Önce aynı gün iptali (komisyon iadesi de alınır), olmazsa iade.
    /**
     * Tek bir para hareketi çağrısını yapar ve ÜÇ KOVAYA ayırır.
     *
     * İstisna yakalanıp `null` olarak sınıflandırıcıya veriliyor: "yanıt yok"
     * ile "yanıt var, ret" arasındaki fark, bu fonksiyonun bütün varlık sebebi.
     */
    async function dene(
      etiket: string,
      cagri: () => Promise<any>,
    ): Promise<IadeSonucu> {
      let yanit: unknown | null = null
      try {
        yanit = await cagri()
      } catch (error) {
        console.error(`[iade] ${etiket} çağrısı yanıt vermedi:`, orderId, error)
        gatewayError = `${etiket}: yanıt alınamadı (${String(error).slice(0, 160)})`
        return 'belirsiz'
      }

      const sonuc = iadeSonucunuSiniflandir(yanit)
      const mesaj = (yanit as { errorMessage?: unknown })?.errorMessage
      if (sonuc !== 'basarili' && mesaj) gatewayError = `${etiket}: ${String(mesaj)}`
      return sonuc
    }

    // ── 1) Aynı gün iptali ───────────────────────────────────────────────────
    //
    // KISMİ İADEDE İPTAL DENENMİYOR: `cancelPayment` her zaman ödemenin
    // TAMAMINI iptal eder. Kısmi iadede kullanılırsa müşteriye tüm sipariş
    // tutarı geri gider — düzeltmeye çalıştığımız hatanın ta kendisi.
    if (!kismi) {
      const sonuc = await dene('iptal', () =>
        cancelPayment({
          paymentId: order!.paymentId!,
          conversationId: order!.orderNumber ?? order!.id,
          ip,
        }),
      )

      if (sonuc === 'basarili') gateway = 'cancel'
      else if (sonuc === 'belirsiz') belirsizKaldi = true
      // 'kesin-ret' → iyzico cevap verip reddetti (ör. gün kapandı). Para
      // hareket etmedi; aşağıda iade denenebilir.
    }

    // ── 2) İade ──────────────────────────────────────────────────────────────
    //
    // ── Belirsizden sonra NEDEN İADE DENENMİYOR ──────────────────────────────
    //
    // Eskiden iptal çağrısı istisna fırlattığında akış olduğu gibi iadeye
    // devam ediyordu. Oysa "iptal isteğinin cevabı gelmedi" demek, "iptal
    // yapılmadı" demek değil. Yapılmışsa, arkasından iade göndermek aynı parayı
    // ikinci kez geri vermek olur — ya da iyzico ikincisini reddedip bize
    // "başarısız" dedirtir. İkisi de kötü. Belirsizde para hareketi durur.
    if (!gateway && !belirsizKaldi) {
      const sonuc = await dene('iade', () =>
        refundPayment({
          paymentId: order!.paymentId!,
          price: amount,
          conversationId: order!.orderNumber ?? order!.id,
          ip,
        }),
      )

      if (sonuc === 'basarili') gateway = 'refund'
      else if (sonuc === 'belirsiz') belirsizKaldi = true
    }

    // ── 3) Sonuç yoksa: belirsiz mi, kesin ret mi? ───────────────────────────
    if (!gateway && !force) {
      if (belirsizKaldi) {
        const kanit = await detayiKanitOlarakTopla(order.paymentId)
        return await askiyaAl(`${gatewayError} ${kanit}`)
      }

      // iyzico cevap verip reddetti. Para hareket etmedi, siparişi güvenle
      // eski durumuna döndürebiliriz.
      await releaseLock(`İade reddedildi: ${gatewayError} (${new Date().toISOString()})`)
      return {
        ok: false,
        error: `Ödeme sağlayıcısı iadeyi reddetti: ${gatewayError}. Sipariş değiştirilmedi; iyzico panelinden kontrol edin.`,
        needsManualReview: true,
      }
    }
  }

  // ── Stokları geri yükle + siparişi kapat ─────────────────────────────────
  const gatewayAciklamasi =
    gateway === 'cancel'
      ? 'Ödeme aynı gün iptaliyle iade edildi.'
      : gateway === 'refund'
        ? 'Ödeme iyzico üzerinden iade edildi.'
        : 'Elle iade olarak işaretlendi (gateway çağrısı yapılmadı/başarısız).'

  try {
    await prisma.$transaction(async (tx: TransactionClient) => {
      // ── `stockReduced` İŞLEM İÇİNDE yeniden okunuyor ────────────────────
      //
      // Yukarıdaki `order` nesnesi, iyzico'ya yapılan ağ çağrılarından ÖNCE
      // okunmuştu. O çağrılar saniyeler sürebiliyor ve arada müşteri siparişi
      // iptal edip stoğu geri yükletmiş olabilir. Bayat anlık görüntüyle
      // devam edilirse stok ikinci kez artıyor — yani envanterde olmayan mal
      // görünüyor ve satılamayacak ürün satılıyor.
      //
      // Kalan yarış aralığı yalnızca bu işlemin süresi kadar; tam kilit için
      // satır kilidi (SELECT ... FOR UPDATE) gerekir, o da ham SQL demek.
      // Buradaki kazanç/karmaşıklık dengesi bu okumadan yana.
      const guncel = await tx.order.findUnique({
        where: { id: order.id },
        select: { stockReduced: true },
      })

      // Stok yalnızca İADE EDİLEN kalemler için geri yükleniyor. Eskiden
      // koşulsuz olarak siparişin bütün kalemleri artırılıyordu.
      if (guncel?.stockReduced) {
        for (const item of iadeKalemleri) {
          await tx.product.updateMany({
            where: { id: item.productId },
            data: { stockQuantity: { increment: item.quantity } },
          })
        }
      }

      await tx.order.update({
        where: { id: order.id },
        data: kismi
          ? {
              // Kısmi iadede sipariş REFUNDED OLMAZ: müşterinin elinde kalan
              // kalemler var, sipariş "iade edildi" görünmemeli.
              paymentStatus: KISMI_IADE_DURUMU,
              // Kalan kalemlerin stoğu hâlâ düşülmüş durumda
              stockReduced: guncel?.stockReduced ?? order.stockReduced,
            }
          : {
              status: 'REFUNDED',
              paymentStatus: 'refunded',
              stockReduced: false,
            },
      })
    })
  } catch (error) {
    console.error('[iade] DB güncellenemedi (para iade EDİLDİ):', orderId, error)
    return {
      ok: false,
      error:
        'Para iade edildi ancak sipariş kaydı güncellenemedi. Lütfen siparişi elle kontrol edin.',
      needsManualReview: true,
    }
  }

  // ── Bu noktadan sonrası İADEYİ GEÇERSİZ KILAMAZ ──────────────────────────
  //
  // Para iade edildi ve sipariş kaydı güncellendi; iş bitti. Aşağıdakiler yan
  // işler: not yazmak, iade talebini kapatmak, müşteriye e-posta atmak. Biri
  // patlarsa `processRefund` istisna fırlatıyordu ve çağıran kod bunu
  // "iade başarısız" olarak yorumluyordu — oysa para çoktan dönmüştü. Müşteri
  // ekranında hata görüyor, iptal düğmesi duruyor, tekrar deniyordu.
  //
  // Her biri ayrı ayrı yakalanıyor ki ilkinin hatası ikincisini engellemesin.
  // Fonksiyon olarak tutuluyorlar, hazır Promise olarak değil: hepsi hemen
  // başlatılsa, biri henüz `await` edilmeden reddedilirse workerd bunu
  // "yakalanmamış ret" sayıp isteği düşürebilir.
  const notMetni = [
    kismi ? `KISMİ İADE: ${iadeTutari.toFixed(2)} TL` : `İADE: ${iadeTutari.toFixed(2)} TL`,
    reason ? `Sebep: ${reason}` : null,
    gatewayAciklamasi,
  ]
    .filter(Boolean)
    .join(' · ')

  const yanIsler: Array<[string, () => Promise<unknown>]> = [
    // Yönetici notu — var olanı ezmeden
    ['yönetici notu', () => appendOrderNote(orderId, notMetni)],
    // Açık iade talebi varsa kapat — yönetici ayrıca kapatmak zorunda kalmasın.
    // Kısmi iadede YALNIZCA işlenen talep kapatılır; siparişin diğer açık
    // talepleri (varsa) dokunulmadan kalır.
    [
      'iade talebi kapatma',
      () =>
        returnRequestId
          ? completeSingleReturnRequest(returnRequestId)
          : completeReturnRequestsForOrder(orderId),
    ],
    // Müşteriye iade bildirimi
    ['iade bildirimi', () => notifyOrderRefunded(orderId, reason, iadeTutari)],
  ]

  for (const [ad, is] of yanIsler) {
    try {
      await is()
    } catch (error) {
      console.error(`[iade] ${ad} başarısız (iade GEÇERLİ):`, orderId, error)
    }
  }

  const tutarMetni = `${iadeTutari.toFixed(2)} TL`

  return {
    ok: true,
    gateway: gateway ?? 'refund',
    message: kismi
      ? `Kısmi iade yapıldı: ${tutarMetni}. Siparişin kalan kalemleri etkilenmedi.`
      : gateway === 'cancel'
        ? `Ödeme iptal edildi, ${tutarMetni} müşteriye iade edilecek.`
        : gateway === 'refund'
          ? `İade talebi iyzico'ya iletildi, ${tutarMetni} müşteriye iade edilecek.`
          : `Sipariş elle iade edilmiş olarak işaretlendi (${tutarMetni}).`,
  }
}
