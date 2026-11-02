// Cloudflare Workers hedefi: WASM sorgu derleyicili istemci (gerekçe: db.ts).
// Node hedeflerinde (Vercel önizlemesi, next dev) next.config.ts bu dosyayı
// prisma-istemci.node.ts ile değiştirir.
export { PrismaClient } from '@prisma/client/wasm'
