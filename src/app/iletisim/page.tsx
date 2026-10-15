'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { telHref } from '@/lib/tel'
import { SITE_CONFIG, GROUP_WHATSAPP } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { Phone, Mail, MapPin, Clock, MessageCircle, Send, User, ChevronDown } from 'lucide-react'
import { submitContactMessage } from '@/app/actions/forms'
import Icon from '@/components/ui/Icon'

const contactSchema = z.object({
  firstName: z.string().min(2, 'Ad en az 2 karakter olmalıdır'),
  lastName: z.string().min(2, 'Soyad en az 2 karakter olmalıdır'),
  email: z.string().email('Geçerli bir e-posta adresi giriniz'),
  phone: z.string().min(10, 'Telefon numarası en az 10 karakter olmalıdır'),
  subject: z.string().min(1, 'Lütfen bir konu seçiniz'),
  message: z.string().min(10, 'Mesaj en az 10 karakter olmalıdır'),
})

type ContactFormData = z.infer<typeof contactSchema>

const SUBJECTS = [
  { value: 'genel', label: 'Genel Sorgu' },
  { value: 'siparis', label: 'Sipariş Hakkında' },
  { value: 'teknik', label: 'Teknik Destek' },
  { value: 'sikayet', label: 'Şikayet' },
  { value: 'diger', label: 'Diğer' },
]

function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  })

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true)

    // Mesaj artık veritabanına kaydediliyor (eskiden console.log'a gidiyordu)
    const result = await submitContactMessage({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      subject: SUBJECTS.find((s) => s.value === data.subject)?.label ?? data.subject,
      message: data.message,
    })

    setIsSubmitting(false)

    if (!result.ok) {
      toast.error(result.error, { duration: 5000 })
      return
    }

    toast.success('Mesajınız başarıyla gönderildi! En kısa sürede sizinle iletişime geçeceğiz.', {
      duration: 5000,
      style: { borderRadius: '10px', background: '#333', color: '#fff' },
    })
    reset()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="iletisim-firstName" className="block text-sm font-medium text-gray-700 mb-1.5">
            Ad <span className="text-red-500">*</span>
          </label>
          <input
            {...register('firstName')}
            id="iletisim-firstName"
            aria-invalid={!!errors.firstName}
            aria-describedby={errors.firstName ? 'iletisim-firstName-hata' : undefined}
            type="text"
            placeholder="Adınız"
            className={cn(
              'w-full px-4 py-2.5 rounded-lg border bg-white text-gray-900 placeholder-gray-400 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0',
              errors.firstName
                ? 'border-red-400 focus:ring-red-200'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
            )}
          />
          {errors.firstName && (
            <p id="iletisim-firstName-hata" role="alert" className="mt-1 text-xs text-red-500">{errors.firstName.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="iletisim-lastName" className="block text-sm font-medium text-gray-700 mb-1.5">
            Soyad <span className="text-red-500">*</span>
          </label>
          <input
            {...register('lastName')}
            id="iletisim-lastName"
            aria-invalid={!!errors.lastName}
            aria-describedby={errors.lastName ? 'iletisim-lastName-hata' : undefined}
            type="text"
            placeholder="Soyadınız"
            className={cn(
              'w-full px-4 py-2.5 rounded-lg border bg-white text-gray-900 placeholder-gray-400 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0',
              errors.lastName
                ? 'border-red-400 focus:ring-red-200'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
            )}
          />
          {errors.lastName && (
            <p id="iletisim-lastName-hata" role="alert" className="mt-1 text-xs text-red-500">{errors.lastName.message}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="iletisim-email" className="block text-sm font-medium text-gray-700 mb-1.5">
          E-posta <span className="text-red-500">*</span>
        </label>
        <input
          {...register('email')}
          id="iletisim-email"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'iletisim-email-hata' : undefined}
          type="email"
          placeholder="ornek@email.com"
          className={cn(
            'w-full px-4 py-2.5 rounded-lg border bg-white text-gray-900 placeholder-gray-400 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0',
            errors.email
              ? 'border-red-400 focus:ring-red-200'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
          )}
        />
        {errors.email && (
          <p id="iletisim-email-hata" role="alert" className="mt-1 text-xs text-red-500">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="iletisim-phone" className="block text-sm font-medium text-gray-700 mb-1.5">
          Telefon <span className="text-red-500">*</span>
        </label>
        <input
          {...register('phone')}
          id="iletisim-phone"
          aria-invalid={!!errors.phone}
          aria-describedby={errors.phone ? 'iletisim-phone-hata' : undefined}
          type="tel"
          placeholder="05XX XXX XX XX"
          className={cn(
            'w-full px-4 py-2.5 rounded-lg border bg-white text-gray-900 placeholder-gray-400 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0',
            errors.phone
              ? 'border-red-400 focus:ring-red-200'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
          )}
        />
        {errors.phone && (
          <p id="iletisim-phone-hata" role="alert" className="mt-1 text-xs text-red-500">{errors.phone.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="iletisim-subject" className="block text-sm font-medium text-gray-700 mb-1.5">
          Konu <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <select
            {...register('subject')}
            id="iletisim-subject"
            aria-invalid={!!errors.subject}
            aria-describedby={errors.subject ? 'iletisim-subject-hata' : undefined}
            className={cn(
              'w-full px-4 py-2.5 rounded-lg border bg-white text-gray-900 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 appearance-none pr-10',
              errors.subject
                ? 'border-red-400 focus:ring-red-200'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
            )}
          >
            <option value="">Konu seçiniz...</option>
            {SUBJECTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        {errors.subject && (
          <p id="iletisim-subject-hata" role="alert" className="mt-1 text-xs text-red-500">{errors.subject.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="iletisim-message" className="block text-sm font-medium text-gray-700 mb-1.5">
          Mesaj <span className="text-red-500">*</span>
        </label>
        <textarea
          {...register('message')}
          id="iletisim-message"
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? 'iletisim-message-hata' : undefined}
          rows={5}
          placeholder="Mesajınızı buraya yazınız..."
          className={cn(
            'w-full px-4 py-2.5 rounded-lg border bg-white text-gray-900 placeholder-gray-400 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 resize-none',
            errors.message
              ? 'border-red-400 focus:ring-red-200'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
          )}
        />
        {errors.message && (
          <p id="iletisim-message-hata" role="alert" className="mt-1 text-xs text-red-500">{errors.message.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className={cn(
          'w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-white text-sm transition-all',
          isSubmitting
            ? 'bg-blue-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.99]'
        )}
      >
        {isSubmitting ? (
          <>
            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Gönderiliyor...
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            Mesaj Gönder
          </>
        )}
      </button>
    </form>
  )
}

export default function IletisimPage() {
  // ── `href` alanı neden eklendi ────────────────────────────────────────────
  //
  // Telefon, e-posta ve adres düz metin olarak basılıyordu. Telefonda numarayı
  // görüp arayamamak, iletişim sayfasının tek işini yapamaması demek —
  // kullanıcı numarayı elle tuşlamak zorunda kalıyor ve çoğu kalmıyor.
  const contactCards: {
    icon: typeof Phone
    title: string
    lines: string[]
    href?: string
    color: string
    bg: string
  }[] = [
    {
      icon: Phone,
      title: 'Telefon',
      lines: [SITE_CONFIG.phone],
      href: telHref(SITE_CONFIG.phone),
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      icon: Mail,
      title: 'E-posta',
      lines: [SITE_CONFIG.email],
      href: `mailto:${SITE_CONFIG.email}`,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      icon: MapPin,
      title: 'Adres',
      lines: [SITE_CONFIG.address],
      href: SITE_CONFIG.mapsUrl,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
    {
      icon: Clock,
      title: 'Çalışma Saatleri',
      lines: [SITE_CONFIG.workingHours ?? 'Pzt–Cmt: 08:30–19:00'],
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
  ]

  return (
    <>
      {/* Toaster kök düzende zaten var; ikincisi bildirimleri çift gösteriyordu */}
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <h1 className="text-3xl font-bold text-gray-900">İletişim</h1>
            <p className="mt-2 text-gray-500 text-sm">
              Sorularınız için bizimle iletişime geçin. Size en kısa sürede dönüş yapacağız.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Left: Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-1">Bize Yazın</h2>
                <p className="text-sm text-gray-500 mb-6">
                  Aşağıdaki formu doldurun, ekibimiz sizinle iletişime geçsin.
                </p>
                <ContactForm />
              </div>
            </div>

            {/* Right: Info */}
            <div className="space-y-5">
              {contactCards.map((card) => {
                const Icon = card.icon
                return (
                  <div
                    key={card.title}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-start gap-4"
                  >
                    <div className={cn('p-2.5 rounded-lg', card.bg)}>
                      <Icon className={cn('w-5 h-5', card.color)} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
                        {card.title}
                      </p>
                      {card.lines.map((line, i) =>
                        card.href ? (
                          <a
                            key={i}
                            href={card.href}
                            {...(card.href.startsWith('http')
                              ? { target: '_blank', rel: 'noopener noreferrer' }
                              : {})}
                            className="block text-sm text-gray-800 font-medium hover:text-brand-600 transition-colors"
                          >
                            {line}
                          </a>
                        ) : (
                          <p key={i} className="text-sm text-gray-800 font-medium">
                            {line}
                          </p>
                        ),
                      )}
                    </div>
                  </div>
                )
              })}

              {/* Harita — Google Maps'e gider */}
              <a
                href={SITE_CONFIG.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="h-44 bg-gray-100 flex flex-col items-center justify-center gap-2 px-4">
                  <Icon name="konum" className="w-9 h-9 text-gray-400" />
                  <p className="text-sm text-gray-500 font-medium">Haritada Görüntüle</p>
                  <p className="text-xs text-gray-400 text-center">{SITE_CONFIG.address}</p>
                </div>
              </a>

              {/* WhatsApp */}
              <a
                href={`https://wa.me/${GROUP_WHATSAPP.phone}?text=${encodeURIComponent(GROUP_WHATSAPP.message)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2.5 w-full bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl px-5 py-3.5 text-sm transition-colors shadow-sm"
              >
                <MessageCircle className="w-5 h-5" />
                WhatsApp ile Yazın
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
