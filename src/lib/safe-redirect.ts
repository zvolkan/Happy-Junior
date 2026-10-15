/**
 * Açık yönlendirme (open redirect) koruması.
 *
 * `/giris?redirect=https://kotusite.com` gibi bağlantılar kullanıcıyı giriş
 * sonrası dış siteye atabiliyordu — kimlik avı için kullanılabilecek bir açık.
 * Bu yardımcı yalnızca aynı site içindeki göreli yollara izin verir.
 */
export function safeInternalPath(
  path: string | null | undefined,
  fallback: string,
): string {
  if (!path || typeof path !== 'string') return fallback

  const trimmed = path.trim()

  // Tek eğik çizgiyle başlamalı: "/hesabim" ✓
  if (!trimmed.startsWith('/')) return fallback

  // Protokol-göreli ("//evil.com") ve ters eğik çizgili ("/\evil.com") varyantlar
  if (trimmed.startsWith('//') || trimmed.startsWith('/\\')) return fallback

  // Kodlanmış hâlleri ("/%2f%2fevil.com", "/%5c%5cevil.com")
  const lower = trimmed.toLowerCase()
  if (lower.startsWith('/%2f') || lower.startsWith('/%5c')) return fallback

  // Satır sonu / kontrol karakteri enjeksiyonu
  if (/[\r\n\t\0]/.test(trimmed)) return fallback

  return trimmed
}
