'use client'

import Icon from '@/components/ui/Icon'

/**
 * Kök layout'un kendisi çökerse devreye giren son çare hata ekranı.
 * Kendi <html>/<body> etiketlerini içermek zorundadır.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  console.error('[kritik hata]', error)

  return (
    <html lang="tr">
      <body
        style={{
          fontFamily: 'system-ui, sans-serif',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f9fafb',
          margin: 0,
          padding: '2rem',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: 420 }}>
          <div style={{ width: 56, height: 56, margin: '0 auto 16px', color: '#f59e0b' }}>
            <Icon name="uyari" className="w-full h-full" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', marginBottom: 12 }}>
            Beklenmeyen bir hata oluştu
          </h1>
          <p style={{ color: '#6b7280', lineHeight: 1.6, marginBottom: 28 }}>
            Sayfa yüklenemedi. Lütfen tekrar deneyin.
          </p>
          <button
            onClick={reset}
            style={{
              background: '#111827',
              color: '#fff',
              border: 'none',
              padding: '12px 24px',
              borderRadius: 12,
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Tekrar Dene
          </button>
        </div>
      </body>
    </html>
  )
}
