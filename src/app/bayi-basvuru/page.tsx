'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { submitDealerApplication } from '@/app/actions/forms'
import Link from 'next/link'
import { GROUP_WHATSAPP } from '@/lib/constants'
import { telHref } from '@/lib/tel'
import Breadcrumb from '@/components/ui/Breadcrumb'
import { TURKISH_CITIES, SITE_CONFIG } from '@/lib/constants'
import { cn } from '@/lib/utils'
import Icon, { type IconName } from '@/components/ui/Icon'

// ─── SCHEMA ───────────────────────────────────────────────────────────────────

const schema = z.object({
  companyName:    z.string().min(2, 'Firma adı gereklidir'),
  firstName:      z.string().min(2, 'Ad gereklidir'),
  lastName:       z.string().min(2, 'Soyad gereklidir'),
  email:          z.string().email('Geçerli e-posta giriniz'),
  phone:          z.string().min(10, 'Geçerli telefon giriniz'),
  city:           z.string().min(1, 'İl seçiniz'),
  district:       z.string().min(2, 'İlçe giriniz'),
  brand:          z.string().min(1, 'Marka seçiniz'),
  businessType:   z.string().min(1, 'İşletme türü seçiniz'),
  annualRevenue:  z.string().min(1, 'Ciro aralığı seçiniz'),
  message:        z.string().optional(),
  acceptTerms:    z.boolean().refine((v) => v === true, 'Koşulları kabul etmelisiniz'),
})

type FormData = z.infer<typeof schema>

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const BENEFITS: { icon: IconName; title: string; description: string }[] = [
  {
    icon: 'fiyat',
    title: 'Komisyon',
    description: 'Komisyon oranı ürün grubuna ve iş hacmine göre her bayiyle ayrı konuşulur.',
  },
  {
    icon: 'egitim',
    title: 'Ücretsiz Eğitim',
    description: 'Ürün bilgisi ve satış teknikleri konusunda kapsamlı eğitim desteği.',
  },
  {
    icon: 'servis',
    title: 'Teknik Destek',
    description: `Destek hattımız ${SITE_CONFIG.workingHours} açık; ayrıca saha ziyaretleri yapıyoruz.`,
  },
  {
    icon: 'paket',
    title: 'Stok Desteği',
    description: 'Öncelikli stok hakkı ve esnek ödeme koşulları ile avantajlı alışveriş.',
  },
]

const BRAND_OPTIONS = [
  { value: 'alb-tarim', label: 'ALB Tarım' },
  { value: 'alb-su-aritma', label: 'Alb Su Teknolojileri' },
  { value: 'her-ikisi', label: 'Her İkisi' },
]

const BUSINESS_TYPES = [
  'Tarım Bayisi',
  'Ziraat Mühendisi',
  'Kooperatif',
  'Çiftçi Market',
  'Su Arıtma Servisi',
  'Elektrik-Elektronik',
  'Beyaz Eşya',
  'Hırdavat',
  'Diğer',
]

const REVENUE_RANGES = [
  '500.000 TL altı',
  '500.000 – 1.000.000 TL',
  '1.000.000 – 5.000.000 TL',
  '5.000.000 TL üzeri',
]

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function BayiBasvuruPage() {
  const [submitted, setSubmitted] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    const result = await submitDealerApplication({
      companyName: data.companyName,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      city: data.city,
      district: data.district,
      brandInterest: data.brand,
      businessType: data.businessType,
      annualRevenue: data.annualRevenue,
      message: data.message,
    })

    if (!result.ok) {
      toast.error(result.error)
      return
    }

    toast.success('Başvurunuz alındı! En kısa sürede size dönüş yapacağız.')
    setSubmitted(true)
    reset()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl text-center">
          <Breadcrumb
            koyu
            className="mb-4 justify-center [&>ol]:justify-center"
            adimlar={[
              { label: 'Ana Sayfa', href: '/' },
              { label: 'Bayi Başvurusu' },
            ]}
          />
          <p className="text-gray-400 text-sm font-semibold uppercase tracking-widest mb-3">
            Bayırlıoğlu
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Bayimiz Olun
          </h1>
          <p className="text-white/75 text-lg max-w-xl mx-auto">
            ALB Tarım ve Alb Su Teknolojileri markalarımızın bayisi olarak işletmenizi büyütün.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl py-12">
        {/* Benefits */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {BENEFITS.map((b) => (
            <div key={b.title} className="rounded-2xl p-5 border border-gray-200 bg-white">
              <div className="mb-3"><Icon name={b.icon} className="w-8 h-8 text-gray-700" /></div>
              <h3 className="font-semibold text-gray-900 mb-1">{b.title}</h3>
              <p className="text-sm text-gray-600">{b.description}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Başvuru Formu</h2>

              {submitted ? (
                <div className="text-center py-12">
                  <div className="mb-4 flex justify-center"><Icon name="onay-daire" className="w-14 h-14 text-green-600" /></div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Başvurunuz Alındı!</h3>
                  <p className="text-gray-600 mb-6">
                    Ekibimiz en geç 2 iş günü içinde sizinle iletişime geçecek.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="px-6 py-3 rounded-xl text-white font-semibold transition-colors bg-gray-900 hover:bg-gray-700"
                  >
                    Yeni Başvuru Yap
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  {/* Company */}
                  <div>
                    <label htmlFor="bayi-companyName" className="form-label">Firma / İşletme Adı *</label>
                    <input {...register('companyName')} id="bayi-companyName" aria-invalid={!!errors.companyName} aria-describedby={errors.companyName ? 'bayi-companyName-hata' : undefined} className="form-input" placeholder="Yılmaz Ticaret Ltd. Şti." />
                    {errors.companyName && <p id="bayi-companyName-hata" role="alert" className="form-error">{errors.companyName.message}</p>}
                  </div>

                  {/* Name */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="bayi-firstName" className="form-label">Ad *</label>
                      <input {...register('firstName')} id="bayi-firstName" aria-invalid={!!errors.firstName} aria-describedby={errors.firstName ? 'bayi-firstName-hata' : undefined} className="form-input" placeholder="Ahmet" />
                      {errors.firstName && <p id="bayi-firstName-hata" role="alert" className="form-error">{errors.firstName.message}</p>}
                    </div>
                    <div>
                      <label htmlFor="bayi-lastName" className="form-label">Soyad *</label>
                      <input {...register('lastName')} id="bayi-lastName" aria-invalid={!!errors.lastName} aria-describedby={errors.lastName ? 'bayi-lastName-hata' : undefined} className="form-input" placeholder="Yılmaz" />
                      {errors.lastName && <p id="bayi-lastName-hata" role="alert" className="form-error">{errors.lastName.message}</p>}
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="bayi-email" className="form-label">E-posta *</label>
                      <input {...register('email')} id="bayi-email" aria-invalid={!!errors.email} aria-describedby={errors.email ? 'bayi-email-hata' : undefined} type="email" className="form-input" placeholder="ahmet@firma.com" />
                      {errors.email && <p id="bayi-email-hata" role="alert" className="form-error">{errors.email.message}</p>}
                    </div>
                    <div>
                      <label htmlFor="bayi-phone" className="form-label">Telefon *</label>
                      <input {...register('phone')} id="bayi-phone" aria-invalid={!!errors.phone} aria-describedby={errors.phone ? 'bayi-phone-hata' : undefined} type="tel" className="form-input" placeholder="0532 000 00 00" />
                      {errors.phone && <p id="bayi-phone-hata" role="alert" className="form-error">{errors.phone.message}</p>}
                    </div>
                  </div>

                  {/* Location */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="bayi-city" className="form-label">İl *</label>
                      <select {...register('city')} id="bayi-city" aria-invalid={!!errors.city} aria-describedby={errors.city ? 'bayi-city-hata' : undefined} className="form-input">
                        <option value="">İl seçin</option>
                        {TURKISH_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                      {errors.city && <p id="bayi-city-hata" role="alert" className="form-error">{errors.city.message}</p>}
                    </div>
                    <div>
                      <label htmlFor="bayi-district" className="form-label">İlçe *</label>
                      <input {...register('district')} id="bayi-district" aria-invalid={!!errors.district} aria-describedby={errors.district ? 'bayi-district-hata' : undefined} className="form-input" placeholder="İlçe" />
                      {errors.district && <p id="bayi-district-hata" role="alert" className="form-error">{errors.district.message}</p>}
                    </div>
                  </div>

                  {/* Marka Seçimi */}
                  <div>
                    <label htmlFor="bayi-brand" className="form-label">Hangi Marka İçin Başvuruyorsunuz? *</label>
                    <select {...register('brand')} id="bayi-brand" aria-invalid={!!errors.brand} aria-describedby={errors.brand ? 'bayi-brand-hata' : undefined} className="form-input">
                      <option value="">Seçin</option>
                      {BRAND_OPTIONS.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
                    </select>
                    {errors.brand && <p id="bayi-brand-hata" role="alert" className="form-error">{errors.brand.message}</p>}
                  </div>

                  {/* Business */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="bayi-businessType" className="form-label">İşletme Türü *</label>
                      <select {...register('businessType')} id="bayi-businessType" aria-invalid={!!errors.businessType} aria-describedby={errors.businessType ? 'bayi-businessType-hata' : undefined} className="form-input">
                        <option value="">Seçin</option>
                        {BUSINESS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                      {errors.businessType && <p id="bayi-businessType-hata" role="alert" className="form-error">{errors.businessType.message}</p>}
                    </div>
                    <div>
                      <label htmlFor="bayi-annualRevenue" className="form-label">Yıllık Ciro *</label>
                      <select {...register('annualRevenue')} id="bayi-annualRevenue" aria-invalid={!!errors.annualRevenue} aria-describedby={errors.annualRevenue ? 'bayi-annualRevenue-hata' : undefined} className="form-input">
                        <option value="">Seçin</option>
                        {REVENUE_RANGES.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                      {errors.annualRevenue && <p id="bayi-annualRevenue-hata" role="alert" className="form-error">{errors.annualRevenue.message}</p>}
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label htmlFor="bayi-message" className="form-label">Ek Notlar (İsteğe Bağlı)</label>
                    <textarea
                      {...register('message')} id="bayi-message" aria-invalid={!!errors.message} aria-describedby={errors.message ? 'bayi-message-hata' : undefined}
                      rows={4}
                      className="form-input resize-none"
                      placeholder="Bize işletmeniz hakkında daha fazla bilgi verin..."
                    />
                  </div>

                  {/* Terms */}
                  <div>
                    <div className="flex items-start gap-2">
                      <input
                        {...register('acceptTerms')}
                        type="checkbox"
                        id="terms"
                        className="mt-0.5 rounded"
                      />
                      <label htmlFor="terms" className="text-sm text-gray-600 cursor-pointer">
                        <Link href="/gizlilik" className="underline text-gray-800">Gizlilik ve Güvenlik</Link> metnini ve{' '}
                        <Link href="/kullanim-kosullari" className="underline text-gray-800">Kullanım Koşulları</Link>'nı
                        okudum ve kabul ediyorum.
                      </label>
                    </div>
                    {errors.acceptTerms && <p className="form-error mt-1">{errors.acceptTerms.message}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={cn(
                      'w-full py-4 rounded-xl text-white font-semibold text-lg transition-colors flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-700',
                      isSubmitting && 'opacity-70 cursor-not-allowed'
                    )}
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Gönderiliyor...
                      </>
                    ) : (
                      'Başvuru Gönder'
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Contact */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Mevcut Bayiler İçin</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start gap-3">
                  <Icon name="telefon" className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-800">Bayi Destek Hattı</p>
                    <a
                      href={telHref(SITE_CONFIG.phone)}
                      className="hover:text-brand-600 transition-colors"
                    >
                      {SITE_CONFIG.phone}
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Icon name="eposta" className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-800">E-posta</p>
                    <p>bayi@bayirlioglu.com</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Icon name="saat" className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-800">Çalışma Saatleri</p>
                    <p>Pazartesi – Cumartesi: 08:30 – 19:00</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Process */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Başvuru Süreci</h3>
              <div className="space-y-3">
                {[
                  { step: '1', text: 'Formu doldurun ve gönderin' },
                  { step: '2', text: 'Ekibimiz 2 iş günü içinde arar' },
                  { step: '3', text: 'Değerlendirme toplantısı yapılır' },
                  { step: '4', text: 'Sözleşme imzalanır ve bayilik başlar' },
                ].map((item) => (
                  <div key={item.step} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 bg-gray-900">
                      {item.step}
                    </div>
                    <p className="text-sm text-gray-600">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* WhatsApp CTA */}
            <a
              /* Numara buraya gömülüydü: `NEXT_PUBLIC_WHATSAPP_GROUP`
                 tanımlansa bile bu bağlantı eski numaraya gitmeye devam
                 ederdi ve bunu kimse fark etmezdi. */
              href={`https://wa.me/${GROUP_WHATSAPP.phone}?text=${encodeURIComponent(
                'Merhaba! Bayırlıoğlu bayi başvurusu hakkında bilgi almak istiyorum',
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 w-full bg-green-500 hover:bg-green-600 text-white rounded-2xl p-4 transition-colors"
            >
              <svg className="w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.553 4.103 1.522 5.826L.053 23.947a.5.5 0 00.6.6l6.121-1.469A11.946 11.946 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.878a9.871 9.871 0 01-5.032-1.378l-.36-.214-3.733.897.912-3.618-.234-.372A9.861 9.861 0 012.122 12C2.122 6.52 6.52 2.122 12 2.122S21.878 6.52 21.878 12 17.48 21.878 12 21.878z" />
              </svg>
              <span className="font-semibold">WhatsApp ile Bilgi Alın</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
