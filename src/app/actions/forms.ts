'use server'

import { z } from 'zod'
import { headers } from 'next/headers'
import { rateLimit, clientIp } from '@/lib/rate-limit'
import { prisma } from '@/lib/db'
import { notifyContactMessage } from '@/lib/email/form-notify'

/**
 * İletişim ve bayi başvuru formları.
 *
 * Eskiden dört form da `setTimeout` ile sahte bir başarı mesajı gösterip
 * veriyi `console.log`'a yazıyordu — gelen hiçbir mesaj ve başvuru
 * kaydedilmiyordu. Artık veritabanına yazılıyor.
 */

export type FormResult = { ok: true } | { ok: false; error: string }

// ─── Hız sınırı ──────────────────────────────────────────────────────────────
//
// Burada eskiden süreç-içi bir `Map` vardı ve Cloudflare Workers'ta HİÇ
// çalışmıyordu: her istek ayrı bir izolat (isolate) içinde koşuyor, izolatlar
// kısa ömürlü ve birbirinden habersiz. Yani sayaç her istekte sıfırdan
// başlıyordu — sınır fiilen yoktu.
//
// İkinci ve daha sinsi sorun anahtardaydı: `contact:${data.email}`. E-posta
// adresini saldırgan yazıyor; her gönderimde farklı bir adres yazarak sınırı
// zaten atlıyordu. Anahtar, kullanıcının SEÇEMEYECEĞİ bir şeye dayanmalı.
//
// Proje bu sorunu `lib/rate-limit.ts` içinde Durable Object ile çözmüştü ve
// yönetici girişinde kullanıyordu; bu dosya güncellenmemişti.
const FORM_PENCERE_MS = 60 * 1000
const FORM_MAX = 3

/**
 * IP başına sınır. E-posta ikincil anahtar olarak KULLANILMIYOR; saldırganın
 * kontrolündeki bir değerle sınırlamak, sınırı kendi eline vermek olur.
 */
async function formSiniri(kova: string): Promise<boolean> {
  const ip = clientIp(await headers())
  const sonuc = await rateLimit(kova, ip, FORM_MAX, FORM_PENCERE_MS)
  return sonuc.ok
}

// ─── İletişim formu ──────────────────────────────────────────────────────────

const contactSchema = z.object({
  firstName: z.string().trim().min(2, 'Ad en az 2 karakter olmalıdır').max(100),
  lastName: z.string().trim().min(2, 'Soyad en az 2 karakter olmalıdır').max(100),
  email: z.string().trim().email('Geçerli bir e-posta adresi girin').max(255),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  subject: z.string().trim().max(150).optional().or(z.literal('')),
  message: z.string().trim().min(10, 'Mesaj en az 10 karakter olmalıdır').max(5000),
  brandKey: z.string().trim().max(30).optional().or(z.literal('')),
  // Bot tuzağı: gerçek kullanıcı bu alanı doldurmaz
  website: z.string().max(0).optional().or(z.literal('')),
})

export type ContactInput = z.input<typeof contactSchema>

export async function submitContactMessage(input: ContactInput): Promise<FormResult> {
  const parsed = contactSchema.safeParse(input)

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Form bilgileri geçersiz.' }
  }

  const data = parsed.data

  // Honeypot doluysa sessizce başarılı gibi dön (bota ipucu verme)
  if (data.website) return { ok: true }

  if (!(await formSiniri('iletisim-formu'))) {
    return { ok: false, error: 'Çok fazla mesaj gönderdiniz. Lütfen birkaç dakika sonra deneyin.' }
  }

  try {
    await prisma.contactMessage.create({
      data: {
        brandKey: data.brandKey || null,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email.toLowerCase(),
        phone: data.phone || null,
        subject: data.subject || null,
        message: data.message,
      },
    })

    // Yöneticiye bildirim — gönderilemezse mesaj yine kaydedilmiş olur.
    // Eskiden hiç bildirim gitmiyordu; panele bakılmazsa mesaj görülmüyordu.
    await notifyContactMessage({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email.toLowerCase(),
      phone: data.phone,
      subject: data.subject,
      message: data.message,
      brandKey: data.brandKey,
    })

    return { ok: true }
  } catch (error) {
    console.error('[form] iletişim mesajı kaydedilemedi:', error)
    return {
      ok: false,
      error: 'Mesajınız kaydedilemedi. Lütfen tekrar deneyin veya telefonla ulaşın.',
    }
  }
}
