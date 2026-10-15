import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { ACTIVE_BRAND_KEY } from '@/lib/constants'

/**
 * Eski blog yazısı rotası — yazının KENDİ markasının blog'una yönlendirir.
 *
 * Eskiden yazının hangi markaya ait olduğuna bakmadan `ACTIVE_BRAND_KEY`e
 * yönlendiriyordu: Alb Su'ya ait bir yazının eski bağlantısı ALB Tarım'a gidip
 * 404 veriyordu. Ürün tarafı (`/urunler/[slug]`) bunu zaten doğru yapıyor,
 * blog o desene çevrildi.
 */
export default async function EskiBlogYaziPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const post = await prisma.blogPost
    .findUnique({
      where: { slug },
      select: { brand: { select: { key: true } } },
    })
    .catch(() => null)

  if (!post) notFound()

  redirect(`/${post.brand?.key ?? ACTIVE_BRAND_KEY}/blog/${slug}`)
}
