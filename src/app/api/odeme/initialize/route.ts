import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { prisma, type TransactionClient } from '@/lib/db'
import { initializeCheckoutForm } from '@/lib/iyzico'
import { calculateTotals, money, extractVat } from '@/lib/checkout'
import { generateOrderNumber, isUniqueConstraintError } from '@/lib/order-number'
import { getSiteUrl } from '@/lib/site-url'
import { reserveStock, YetersizStokHatasi } from '@/lib/stock'
import { rateLimit } from '@/lib/rate-limit'

/** Sözleşme metinleri değiştiğinde artırılmalı — hangi sürümün onaylandığı kaydedilir */
const CONTRACT_VERSION = '2026-09-1'

interface IncomingItem {
  id?: unknown
  quantity?: unknown
}

/** Türk cep numarasını iyzico'nun beklediği +90XXXXXXXXXX biçimine çevirir */
function normalizeGsm(raw: string | null | undefined): string | null {
  if (!raw) return null
  const digits = raw.replace(/\D/g, '')
  // 0555..., 555..., 90555..., 0090555...
  const local = digits.replace(/^0+/, '').replace(/^90/, '')
  if (local.length !== 10) return null
  return `+90${local}`
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Giriş yapmanız gerekiyor.' }, { status: 401 })

  // ── Hız sınırı ───────────────────────────────────────────────────────────
  // Her başarılı çağrı bir PENDING sipariş, bir sipariş numarası ve (artık) bir
  // stok rezervasyonu tüketiyor. Sınırsız çağrı hem numara uzayını tüketip
  // checkout'u kilitleyebilir hem de stoğu bloke edebilirdi.
  const odemeLimit = await rateLimit('odeme-baslat', user.id, 10, 10 * 60 * 1000)
  if (!odemeLimit.ok) {
    return NextResponse.json(
      { error: 'Çok fazla ödeme denemesi yaptınız. Lütfen birkaç dakika sonra tekrar deneyin.' },
      { status: 429 },
    )
  }

  let body: {
    cartItems?: IncomingItem[]
    addressData?: Record<string, string>
    brandKey?: string
    contractApproved?: boolean
    invoice?: {
      type?: string
      title?: string
      taxId?: string
      taxOffice?: string
      email?: string
    }
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 })
  }

  const { cartItems, addressData, brandKey, contractApproved, invoice } = body

  // Mesafeli satış sözleşmesi onayı sunucuda da zorunlu — istemci kontrolü
  // atlanabilir ve onay kaydı yasal ispat için gerekli.
  if (contractApproved !== true) {
    return NextResponse.json(
      { error: 'Devam etmek için ön bilgilendirme ve mesafeli satış sözleşmesini onaylamalısınız.' },
      { status: 400 },
    )
  }

  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return NextResponse.json({ error: 'Sepet boş.' }, { status: 400 })
  }
  if (cartItems.length > 100) {
    return NextResponse.json({ error: 'Sepette çok fazla ürün var.' }, { status: 400 })
  }
  if (!addressData) {
    return NextResponse.json({ error: 'Teslimat adresi gerekli.' }, { status: 400 })
  }

  // ── Marka ────────────────────────────────────────────────────────────────
  const brand = await prisma.brand.findUnique({ where: { key: String(brandKey ?? '') } })
  if (!brand) return NextResponse.json({ error: 'Marka bulunamadı.' }, { status: 400 })

  // ── Sepeti sunucuda doğrula ──────────────────────────────────────────────
  // Fiyatlar İSTEMCİDEN ALINMAZ. Tutar yalnızca veritabanındaki fiyattan
  // hesaplanır; aksi hâlde istek değiştirilerek ürün 1 TL'ye alınabilirdi.
  const requested = new Map<string, number>()
  for (const item of cartItems) {
    const id = typeof item?.id === 'string' ? item.id : null
    const qty = Number(item?.quantity)
    if (!id || !Number.isInteger(qty) || qty < 1 || qty > 999) {
      return NextResponse.json({ error: 'Sepette geçersiz ürün bilgisi var.' }, { status: 400 })
    }
    requested.set(id, (requested.get(id) ?? 0) + qty)
  }

  const products = await prisma.product.findMany({
    where: { id: { in: [...requested.keys()] } },
    select: {
      id: true,
      name: true,
      price: true,
      salePrice: true,
      stockQuantity: true,
      isActive: true,
      brandId: true,
      vatRate: true,
    },
  })

  if (products.length !== requested.size) {
    return NextResponse.json(
      { error: 'Sepetteki bazı ürünler artık mevcut değil. Sepetinizi yenileyin.' },
      { status: 409 },
    )
  }

  const validated: {
    id: string
    name: string
    unitPrice: number
    quantity: number
    vatRate: number
  }[] = []

  for (const product of products) {
    const quantity = requested.get(product.id)!

    if (!product.isActive) {
      return NextResponse.json(
        { error: `"${product.name}" artık satışta değil. Sepetinizden çıkarın.` },
        { status: 409 },
      )
    }
    if (product.brandId !== brand.id) {
      return NextResponse.json(
        { error: 'Sepetinizde farklı markaya ait ürünler var. Lütfen ayrı ayrı sipariş verin.' },
        { status: 409 },
      )
    }
    if (product.stockQuantity < quantity) {
      return NextResponse.json(
        {
          error:
            product.stockQuantity === 0
              ? `"${product.name}" tükendi.`
              : `"${product.name}" için yeterli stok yok (kalan: ${product.stockQuantity}).`,
        },
        { status: 409 },
      )
    }

    // `??` YERİNE `> 0`: null-birleştirme operatörü sıfırı geçerli bir değer
    // sayıyor, sepet ise (`store/cartStore.ts`) `salePrice > 0` kuralını
    // kullanıyordu. Veritabanına 0 indirimli fiyat düşmüşse sepet dolu fiyatı
    // gösterip ödeme tarafı sıfır hesaplıyordu. İki taraf artık aynı kuralda.
    const sale = Number(product.salePrice)
    const unitPrice = Number.isFinite(sale) && sale > 0 ? sale : Number(product.price)

    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      console.error('[ödeme] geçersiz birim fiyat:', product.id, product.price, product.salePrice)
      return NextResponse.json(
        { error: 'Sepetteki bir ürünün fiyatı geçersiz. Lütfen bizimle iletişime geçin.' },
        { status: 409 },
      )
    }

    validated.push({
      id: product.id,
      name: product.name,
      unitPrice,
      quantity,
      vatRate: typeof product.vatRate === 'number' ? product.vatRate : 20,
    })
  }

  // Satır toplamlarını ÖNCE yuvarla, sonra topla. Böylece iyzico'ya gönderilen
  // basketItems fiyatlarının toplamı ara toplamla kuruşu kuruşuna eşleşir;
  // aksi hâlde kayan nokta yuvarlaması 1 kuruşluk fark yaratıp isteği bozabilir.
  const lineTotals = validated.map((i) => money(i.unitPrice * i.quantity))
  const subtotalRaw = lineTotals.reduce((sum, value) => sum + value, 0)
  const { subtotal, shippingFee, total } = calculateTotals(subtotalRaw)

  // Fatura için KDV matrahını ayrıştır (fiyatlar KDV dahil girilir)
  const lineVats = validated.map((item, index) => extractVat(lineTotals[index], item.vatRate).vat)
  // Kargo ücreti %20 KDV'ye tabidir
  const shippingVat = shippingFee > 0 ? extractVat(shippingFee, 20).vat : 0
  const taxAmount = money(lineVats.reduce((sum, v) => sum + v, 0) + shippingVat)

  if (total <= 0) {
    return NextResponse.json({ error: 'Sipariş tutarı geçersiz.' }, { status: 400 })
  }

  // ── Adres: kayıtlıysa kullanıcıya ait mi doğrula ─────────────────────────
  let addr = addressData
  const savedAddressId = addressData.savedAddressId

  if (savedAddressId) {
    const saved = await prisma.address.findFirst({
      where: { id: String(savedAddressId), userId: user.id },
    })
    if (!saved) {
      return NextResponse.json({ error: 'Seçilen adres bulunamadı.' }, { status: 400 })
    }
    // Kayıtlı adresin DB'deki hâli esas alınır — istemcinin gönderdiği değil
    addr = {
      savedAddressId: saved.id,
      fullName: saved.fullName,
      phone: saved.phone,
      line1: saved.line1,
      line2: saved.line2 ?? '',
      district: saved.district,
      city: saved.city,
      postalCode: saved.postalCode ?? '',
    }
  }

  for (const field of ['fullName', 'phone', 'line1', 'district', 'city'] as const) {
    if (!addr[field] || String(addr[field]).trim().length < 2) {
      return NextResponse.json({ error: 'Teslimat adresi eksik.' }, { status: 400 })
    }
  }

  // ── Fatura bilgisi ───────────────────────────────────────────────────────
  const invoiceType = invoice?.type === 'kurumsal' ? 'kurumsal' : 'bireysel'
  const taxId = (invoice?.taxId ?? '').replace(/\D/g, '')

  if (invoiceType === 'kurumsal') {
    if (!invoice?.title || invoice.title.trim().length < 2) {
      return NextResponse.json({ error: 'Fatura için ticaret unvanı gerekli.' }, { status: 400 })
    }
    if (taxId.length !== 10) {
      return NextResponse.json(
        { error: 'Vergi kimlik numarası 10 haneli olmalıdır.' },
        { status: 400 },
      )
    }
    if (!invoice?.taxOffice || invoice.taxOffice.trim().length < 2) {
      return NextResponse.json({ error: 'Vergi dairesi bilgisi gerekli.' }, { status: 400 })
    }
  } else if (taxId && taxId.length !== 11) {
    return NextResponse.json({ error: 'TC kimlik numarası 11 haneli olmalıdır.' }, { status: 400 })
  }

  // iyzico `buyer.identityNumber` alanını zorunlu tutuyor; gönderilmezse
  // "identityNumber gönderilmesi zorunludur" hatasıyla ödeme hiç başlamıyor.
  // Kurumsal faturada vergi kimlik no, bireyselde TC kimlik no kullanılır.
  // Müşteri TC'sini girmediyse iyzico'nun kendi örneklerinde kullandığı
  // dolgu değer gönderilir — e-arşiv fatura ad-soyad ve adresle kesilebildiği
  // için bu bilgi yasal olarak zorunlu değil, iyzico'nun format zorunluluğu.
  const identityNumber = taxId || '11111111111'

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  const contactName = String(addr.fullName).trim()
  const nameParts = contactName.split(/\s+/)
  const firstName = nameParts[0]
  const lastName = nameParts.slice(1).join(' ') || firstName

  const gsm = normalizeGsm(addr.phone) ?? normalizeGsm(dbUser?.phone)
  if (!gsm) {
    return NextResponse.json(
      { error: 'Geçerli bir cep telefonu numarası girin (örn. 0555 111 22 33).' },
      { status: 400 },
    )
  }

  const headersList = await headers()
  const ip = (headersList.get('x-forwarded-for') ?? '127.0.0.1').split(',')[0].trim()
  const addrLine = `${addr.line1}${addr.line2 ? ', ' + addr.line2 : ''}, ${addr.district}`

  // ── PENDING sipariş — tutar dökümü ve adres kopyasıyla ───────────────────
  const orderData = {
    userId: user.id,
    brandId: brand.id,
    addressId: savedAddressId ? String(savedAddressId) : null,
    // `as const` şart: nesne create() çağrısından ayrı bir değişkene alındığı
    // için TypeScript bu değeri `string` olarak genişletiyor ve Prisma'nın
    // `OrderStatus` enum'una atanamıyordu ("Type 'string' is not assignable").
    status: 'PENDING' as const,
    paymentMethod: 'iyzico',
    paymentStatus: 'pending',
    subtotal,
    shippingFee,
    taxAmount,
    totalAmount: total,
    shipFullName: contactName,
    shipPhone: String(addr.phone ?? ''),
    shipLine1: String(addr.line1),
    shipLine2: addr.line2 ? String(addr.line2) : null,
    shipDistrict: String(addr.district),
    shipCity: String(addr.city),
    shipPostalCode: addr.postalCode ? String(addr.postalCode) : null,
    // Sözleşme onayı — tarih, IP ve metin sürümü uyuşmazlık hâlinde ispat oluşturur
    contractAcceptedAt: new Date(),
    contractIp: ip.slice(0, 64),
    contractVersion: CONTRACT_VERSION,
    invoiceType,
    invoiceTitle: invoiceType === 'kurumsal' ? invoice!.title!.trim().slice(0, 200) : null,
    invoiceTaxId: taxId || null,
    invoiceTaxOffice:
      invoiceType === 'kurumsal' ? (invoice?.taxOffice ?? '').trim().slice(0, 100) : null,
    invoiceEmail: (invoice?.email ?? user.email ?? '').trim().slice(0, 255) || null,
    items: {
      create: validated.map((item, index) => ({
        productId: item.id,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: lineTotals[index],
        vatRate: item.vatRate,
        vatAmount: lineVats[index],
      })),
    },
  }

  // Sipariş numarası rastgele üretiliyor; çakışma olasılığı düşük ama sıfır
  // değil. Önce sorgulayıp sonra yazmak yarış durumunu çözmediği için
  // veritabanının benzersizlik kısıtına güvenip yeni numarayla tekrar
  // deniyoruz. Ödeme bu yüzden hiç başlayamamamalı.
  let order: { id: string; orderNumber: string | null }
  let attempt = 0

  for (;;) {
    try {
      // ── Sipariş + STOK REZERVASYONU tek transaction'da ──────────────────
      //
      // Stok eskiden yalnızca ödeme geri dönüşünde düşülüyordu; burada sadece
      // "yeterli mi?" diye okunuyordu. Aynı anda ödemeye giren N kullanıcı bu
      // kontrolü geçip hepsi ödeyebiliyor, sonra 1 adetlik ürün için N sipariş
      // oluşuyordu. Artık stok burada atomik olarak rezerve ediliyor; yetmezse
      // transaction geri alınıyor ve sipariş hiç oluşmuyor.
      order = await prisma.$transaction(async (tx: TransactionClient) => {
        const created = await tx.order.create({
          data: {
            ...orderData,
            orderNumber: generateOrderNumber(),
            // Stok bu transaction'da düşüldüğü için bayrak baştan açık
            stockReduced: true,
          },
          select: { id: true, orderNumber: true },
        })

        await reserveStock(
          tx,
          validated.map((i) => ({ productId: i.id, quantity: i.quantity })),
        )

        return created
      })
      break
    } catch (error) {
      if (error instanceof YetersizStokHatasi) {
        const urun = validated.find((i) => i.id === error.productId)
        return NextResponse.json(
          {
            error: `"${urun?.name ?? 'Bir ürün'}" için yeterli stok kalmadı. Sepetinizi güncelleyip tekrar deneyin.`,
          },
          { status: 409 },
        )
      }
      if (attempt < 8 && isUniqueConstraintError(error)) {
        attempt++
        continue
      }
      console.error('[ödeme] sipariş oluşturulamadı:', error)
      return NextResponse.json(
        { error: 'Siparişiniz oluşturulamadı. Lütfen tekrar deneyin.' },
        { status: 500 },
      )
    }
  }

  // iyzico panelinde ve ekstrede görünen kimlik — müşteriye söylediğimiz
  // numarayla aynı olsun ki iki tarafı eşleştirmek kolay olsun.
  const conversationId = order.orderNumber ?? order.id

  const basketItems = validated.map((item, index) => ({
    id: item.id,
    name: item.name.slice(0, 100),
    category1: 'Ürün',
    itemType: 'PHYSICAL',
    price: lineTotals[index].toFixed(2),
  }))

  if (shippingFee > 0) {
    basketItems.push({
      id: 'kargo',
      name: 'Kargo Ücreti',
      category1: 'Kargo',
      itemType: 'PHYSICAL',
      price: shippingFee.toFixed(2),
    })
  }

  const siteUrl = getSiteUrl()

  const request = {
    locale: 'tr',
    conversationId,
    // iyzico kuralı: `price`, basketItems fiyatlarının TOPLAMINA eşit olmalı.
    // basketItems'a kargo kalemi de eklendiği için burada `total` kullanılır;
    // `subtotal` yazılırsa kargolu (500 TL altı) her sipariş reddedilir.
    price: total.toFixed(2),
    paidPrice: total.toFixed(2),
    currency: 'TRY',
    basketId: conversationId,
    paymentGroup: 'PRODUCT',
    callbackUrl: `${siteUrl}/api/odeme/callback`,
    enabledInstallments: [1, 2, 3, 6, 9, 12],
    buyer: {
      id: user.id,
      name: firstName,
      surname: lastName,
      identityNumber,
      gsmNumber: gsm,
      email: user.email!,
      registrationAddress: addrLine,
      ip,
      city: String(addr.city),
      country: 'Turkey',
    },
    shippingAddress: {
      contactName,
      city: String(addr.city),
      country: 'Turkey',
      address: addrLine,
    },
    billingAddress: {
      // Kurumsal faturada muhatap kişi değil, ticaret unvanıdır
      contactName:
        invoiceType === 'kurumsal' ? invoice!.title!.trim().slice(0, 200) : contactName,
      city: String(addr.city),
      country: 'Turkey',
      address: addrLine,
    },
    basketItems,
  }

  try {
    const result = await initializeCheckoutForm(request)

    if (result.status !== 'success') {
      console.error('[odeme] iyzico başlatma hatası:', result.errorCode, result.errorMessage)
      await prisma.order.delete({ where: { id: order.id } }).catch((e: unknown) => {
        console.error('[odeme] öksüz sipariş silinemedi:', order.id, e)
      })
      return NextResponse.json(
        { error: result.errorMessage ?? 'Ödeme başlatılamadı.' },
        { status: 400 },
      )
    }

    await prisma.order.update({
      where: { id: order.id },
      data: { paymentToken: result.token, formContent: result.checkoutFormContent },
    })

    return NextResponse.json({ token: result.token, orderId: order.id })
  } catch (err) {
    console.error('[odeme] iyzico bağlantı hatası:', err)
    await prisma.order.delete({ where: { id: order.id } }).catch((e: unknown) => {
      console.error('[odeme] öksüz sipariş silinemedi:', order.id, e)
    })
    return NextResponse.json(
      { error: 'Ödeme sistemi geçici olarak kullanılamıyor.' },
      { status: 500 },
    )
  }
}
