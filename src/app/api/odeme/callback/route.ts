import { NextRequest, NextResponse } from 'next/server'
import { retrieveCheckoutForm, odemeSonucunuSiniflandir } from '@/lib/iyzico'
import { prisma } from '@/lib/db'
import { getSiteUrl } from '@/lib/site-url'
import { notifyOrderConfirmed } from '@/lib/email/notify'
import { appendOrderNote } from '@/lib/order-note'
import { restoreStock } from '@/lib/stock'

/**
 * iyzico ödeme geri dönüşü.
 *
 * ÖNEMLİ: iyzico buraya POST atar. `NextResponse.redirect` varsayılan olarak
 * 307 döner ve 307 HTTP metodunu KORUR — yani tarayıcı sonuç sayfasına da POST
 * atar ve App Router sayfası POST kabul etmediği için 405 hatası verir.
 * Bu yüzden 303 (See Other) kullanılıyor: tarayıcıyı GET'e zorlar.
 */
function redirectGet(url: string) {
  return NextResponse.redirect(url, 303)
}

export async function POST(req: NextRequest) {
  const siteUrl = getSiteUrl()
  let token: string | null = null

  // ── Token al ──────────────────────────────────────────────────────────────
  try {
    const contentType = req.headers.get('content-type') ?? ''
    if (contentType.includes('application/json')) {
      // Cloudflare çalışma zamanı tipleriyle `json()` artık `unknown` dönüyor
      // (Node tiplerinde `any` idi). Tür daraltması bilerek yapılıyor:
      // gövde dışarıdan geliyor, körü körüne güvenilmemeli.
      const body = (await req.json()) as { token?: unknown }
      token = typeof body?.token === 'string' ? body.token : null
    } else {
      const formData = await req.formData()
      token = formData.get('token') as string
    }
  } catch (e) {
    console.error('[callback] token okunamadı:', e)
    return redirectGet(`${siteUrl}/odeme/basarisiz?hata=token`)
  }

  if (!token) {
    return redirectGet(`${siteUrl}/odeme/basarisiz?hata=token`)
  }

  // ── Siparişi bul ──────────────────────────────────────────────────────────
  let order: {
    id: string
    orderNumber: string | null
    status: string
    paymentStatus: string | null
    totalAmount: unknown
    stockReduced: boolean
  } | null = null

  try {
    order = await prisma.order.findFirst({
      where: { paymentToken: token },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentStatus: true,
        totalAmount: true,
        stockReduced: true,
      },
    })
  } catch (e) {
    console.error('[callback] sipariş sorgulanamadı:', e)
    return redirectGet(`${siteUrl}/odeme/basarisiz?hata=sistem`)
  }

  if (!order) {
    return redirectGet(`${siteUrl}/odeme/basarisiz?hata=siparis`)
  }

  // ── Tekrar koruması ───────────────────────────────────────────────────────
  //
  // Burası BEYAZ liste: yalnızca ödeme bekleyen bakir bir sipariş işlenir.
  //
  // Eskiden kara listeydi ("paid ise çık, CANCELLED ise çık") ve iade edilmiş
  // sipariş (status=REFUNDED, paymentStatus=refunded) ile iade sürerken olan
  // sipariş (paymentStatus=refunding) bu iki kontrolden de geçiyordu. Ödeme
  // token'ı da hiç silinmediği ve müşteri onu adres çubuğunda gördüğü için,
  // parasını iade aldıktan sonra kendi token'ıyla bu adrese POST atan biri
  // siparişi yeniden "ödendi" yapabiliyor, stok ikinci kez düşüyor ve ikinci
  // onay e-postası gidiyordu.
  const bakir = order.status === 'PENDING' && order.paymentStatus === 'pending'

  if (!bakir) {
    if (order.paymentStatus === 'paid') {
      // Aynı callback'in ikinci kez gelmesi — normal, sessizce sonuç sayfasına
      return redirectGet(`${siteUrl}/odeme/basarili?siparis=${order.id}`)
    }
    console.warn(
      `[callback] işlenmeyecek sipariş durumu sipariş=${order.id} ` +
        `status=${order.status} paymentStatus=${order.paymentStatus}`,
    )
    return redirectGet(`${siteUrl}/odeme/basarisiz?hata=odeme`)
  }

  // ── iyzico doğrulama ──────────────────────────────────────────────────────
  try {
    // conversationId ödeme başlatılırken sipariş numarasıyla gönderilmişti
    const result = await retrieveCheckoutForm(token, order.orderNumber ?? order.id)

    // ── Sonuç üç kovaya ayrılıyor ────────────────────────────────────────
    //
    // Eskiden burada tek bir ayrım vardı: "başarılı değilse başarısızdır" ve
    // sipariş koşulsuz iptal ediliyordu. Ama iyzico geçici sistem hatalarını,
    // hız sınırını ve 3DS ara durumlarını da HTTP 200 + status:"failure" ile
    // döndürüyor. 3DS tamamlanmış, banka parayı çekmişken böyle bir yanıt
    // gelirse müşteriye "ödeme başarısız" deniyor, muhtemelen ikinci kez ödüyor
    // ve birinci tahsilatın sistemde hiçbir izi kalmıyordu.
    //
    // Sınıflandırma kuralı `src/lib/iyzico.ts` içinde açıklandı.
    const sonuc = odemeSonucunuSiniflandir(result)

    if (sonuc === 'kesin-ret') {
      console.warn('[callback] ödeme reddedildi:', order.id, result?.errorCode, result?.errorMessage)
      await prisma.order
        .update({
          where: { id: order.id },
          // Token da siliniyor: başarısız ödemenin token'ı bir daha kullanılamasın
          data: { status: 'CANCELLED', paymentStatus: 'failed', paymentToken: null },
        })
        .catch((e) => console.error('[callback] iptal kaydedilemedi:', order!.id, e))
      // Sipariş oluşturulurken rezerve edilen stoğu serbest bırak
      await restoreStock(order.id, 'ödeme reddedildi')
      return redirectGet(`${siteUrl}/odeme/basarisiz?hata=odeme`)
    }

    if (sonuc === 'belirsiz') {
      // Para çekilmiş OLABİLİR. Sipariş PENDING kalıyor, stok rezerve kalıyor,
      // müşteriye "doğrulanıyor" gösteriliyor. Aşağıdaki catch bloğu da aynı
      // davranışı uyguluyor — ikisi bilerek aynı.
      console.error(
        `[callback] BELİRSİZ ÖDEME SONUCU sipariş=${order.id} ` +
          `status=${result?.status} paymentStatus=${result?.paymentStatus} ` +
          `errorCode=${result?.errorCode} errorMessage=${result?.errorMessage}`,
      )
      await appendOrderNote(
        order.id,
        `Ödeme sonucu belirsiz (errorCode: ${result?.errorCode ?? 'yok'}, ` +
          `durum: ${result?.paymentStatus ?? 'yok'}). Sipariş iptal EDİLMEDİ; ` +
          `para çekilmiş olabilir. iyzico panelinden bu siparişi kontrol edin.`,
      )
      return redirectGet(`${siteUrl}/odeme/beklemede?siparis=${order.id}`)
    }

    // ── Tahsil edilen tutar sipariş tutarıyla uyuşuyor mu? ────────────────
    //
    // Karşılaştırma `price` ile yapılıyor, `paidPrice` ile DEĞİL: taksit açık
    // (1-12 taksit) ve taksitli işlemde `paidPrice` vade farkını içerdiği için
    // her taksitli siparişte sahte uyarı üretiyordu. `price` sepet tutarıdır ve
    // gönderdiğimiz tutarla kuruşu kuruşuna eşleşmelidir.
    const expected = Number(order.totalAmount)
    const sepetTutari = Number(result?.price ?? result?.paidPrice ?? 0)
    const fark = Number.isFinite(sepetTutari) ? sepetTutari - expected : 0

    if (Number.isFinite(sepetTutari) && Math.abs(fark) > 0.05) {
      console.error(
        `[callback] TUTAR UYUŞMAZLIĞI sipariş=${order.id} beklenen=${expected} ` +
          `iyzico=${sepetTutari} (ödenen=${result?.paidPrice})`,
      )

      // EKSİK tahsilat: siparişi ONAYLAMIYORUZ. Para çekilmiş olabileceği için
      // iptal de etmiyoruz — PENDING bırakıp yöneticiye bırakıyoruz ve müşteriye
      // "doğrulanıyor" ekranını gösteriyoruz. Eskiden bu durumda sipariş normal
      // şekilde onaylanıp kargoya hazırlanıyordu.
      if (fark < 0) {
        await appendOrderNote(
          order.id,
          `EKSİK TAHSİLAT — beklenen ${expected} TL, iyzico ${sepetTutari} TL. ` +
            `Sipariş onaylanmadı; iyzico panelinden kontrol edip elle onaylayın.`,
        )
        return redirectGet(`${siteUrl}/odeme/beklemede?siparis=${order.id}`)
      }

      // FAZLA tahsilat: müşteri mağdur değil, sipariş akışını durdurmuyoruz.
      await appendOrderNote(
        order.id,
        `Fazla tahsilat: beklenen ${expected} TL, iyzico ${sepetTutari} TL. İnceleyin.`,
      )
    }

    // ── ÖNCE siparişi onayla ─────────────────────────────────────────────
    // Para tahsil edildi; bu kaydın atılmaması her şeyden önemli. Tek başına
    // ve hızlı bir güncelleme olduğu için transaction'a sokulmuyor.
    // Koşul yukarıdaki beyaz listeyle aynı: iki callback aynı anda gelirse
    // ikincisi 0 satır günceller ve stok düşümüne hiç girmez.
    // `paymentToken` da burada siliniyor — token tek kullanımlık olsun, ileride
    // yeniden oynatılamasın.
    const confirmed = await prisma.order.updateMany({
      where: { id: order.id, status: 'PENDING', paymentStatus: 'pending' },
      data: {
        status: 'CONFIRMED',
        paymentStatus: 'paid',
        paymentId: result?.paymentId ? String(result.paymentId) : null,
        paymentToken: null,
      },
    })

    // ── iyzico kalem işlem kimliklerini sakla ────────────────────────────
    // Korumalı Alışveriş teslimat onayı ve kalem bazlı iade bu kimliği
    // istiyor; sonradan hiçbir yerden öğrenilemiyor, yalnızca burada geliyor.
    // Sipariş onayını bozmaması için ayrı ve sessiz bir blokta.
    try {
      const transactions = Array.isArray(result?.itemTransactions)
        ? (result.itemTransactions as Array<{ itemId?: string; paymentTransactionId?: string }>)
        : []

      for (const tx of transactions) {
        if (!tx.itemId || !tx.paymentTransactionId) continue
        // `itemId` initialize sırasında ürün kimliği olarak gönderilmişti
        await prisma.orderItem.updateMany({
          where: { orderId: order.id, productId: tx.itemId },
          data: { paymentTransactionId: String(tx.paymentTransactionId) },
        })
      }
    } catch (txError) {
      console.error('[callback] kalem işlem kimlikleri kaydedilemedi:', order.id, txError)
    }

    // Başka bir callback bizden önce işlediyse ikinci kez e-posta gönderme
    if (confirmed.count === 0) {
      return redirectGet(`${siteUrl}/odeme/basarili?siparis=${order.id}`)
    }

    // ── Stok ─────────────────────────────────────────────────────────────
    // Burada stok DÜŞÜLMÜYOR. Artık sipariş oluşturulurken (initialize)
    // atomik olarak rezerve ediliyor; `stockReduced` zaten true. Eskiden stok
    // burada düşülüyordu ve aynı ürün için aynı anda ödemeye giren herkes
    // stok kontrolünü geçtiği için aşırı satış oluyordu.

    // Sipariş onay e-postası — başarısız olsa bile akışı durdurmaz
    await notifyOrderConfirmed(order.id)

    return redirectGet(`${siteUrl}/odeme/basarili?siparis=${order.id}`)
  } catch (err) {
    // Buraya yalnızca iyzico doğrulaması sırasındaki hatalar düşer.
    // Ödeme durumu belirsiz olduğu için siparişi iptal ETMİYORUZ — para
    // çekilmiş olabilir; yönetici incelemesi için işaretleyip müşteriye
    // "doğrulanıyor" mesajı gösteriyoruz.
    console.error('[callback] doğrulama hatası:', order.id, err)
    await appendOrderNote(
      order.id,
      'Ödeme doğrulaması sırasında hata oluştu. iyzico panelinden bu siparişin ödemesini kontrol edin.',
    )
    return redirectGet(`${siteUrl}/odeme/beklemede?siparis=${order.id}`)
  }
}
