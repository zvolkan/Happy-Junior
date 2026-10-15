import type { Metadata } from 'next'
import Link from 'next/link'
import Breadcrumb from '@/components/ui/Breadcrumb'
import { BRAND } from '@/lib/constants'
import { getPublishedPosts } from '@/lib/blog'
import BrandArtwork from '@/components/ui/BrandArtwork'
import Icon from '@/components/ui/Icon'

export const metadata: Metadata = {
  title: 'Blog',
  description: `${BRAND.name} blog yazıları: beden rehberleri, sezon önerileri ve anne-baba ipuçları.`,
  alternates: { canonical: '/blog' },
}

export default async function BlogPage() {
  const brandKey = BRAND.key
  const cfg = BRAND

  const posts = await getPublishedPosts(brandKey)

  const formatDate = (date: Date | null) =>
    date
      ? new Date(date).toLocaleDateString('tr-TR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : ''

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="brand-surface py-16">
        <div className="container-main text-center">
          <Breadcrumb
            koyu
            className="mb-6 justify-center [&>ol]:justify-center"
            adimlar={[
              { label: 'Ana Sayfa', href: '/' },
              { label: 'Blog' },
            ]}
          />
          <p className="font-bold uppercase text-sm tracking-widest mb-3 text-brand-400">
            Blog
          </p>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-4">
            {cfg.name} Blog
          </h1>
          <p className="text-white/60 max-w-xl mx-auto">
            Beden rehberleri, sezon önerileri ve anne-baba ipuçları
          </p>
        </div>
      </section>

      <div className="container-main py-12">
        {posts.length === 0 ? (
          <div className="text-center py-20">
            <Icon name="yazi" className="w-12 h-12 mb-4 mx-auto text-gray-300" />
            <p className="text-gray-500">Henüz blog yazısı bulunmuyor.</p>
          </div>
        ) : (
          <>
            {/* Öne çıkan yazı */}
            <div className="mb-10">
              <Link
                href={`/blog/${posts[0].slug}`}
                className="group grid grid-cols-1 md:grid-cols-2 bg-white rounded-3xl border border-gray-100 overflow-hidden hover-lift"
              >
                <div className="img-zoom min-h-52 md:min-h-64 relative overflow-hidden bg-gray-100">
                  {posts[0].coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={posts[0].coverImage}
                      alt={posts[0].title}
                      className="img-zoom-target absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <BrandArtwork variant="blog" className="absolute inset-0 w-full h-full" />
                  )}
                </div>
                <div className="p-4 sm:p-8 flex flex-col justify-center">
                  {posts[0].category && (
                    <span className="inline-block text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full mb-4 w-fit bg-brand-100 text-brand-700">
                      {posts[0].category}
                    </span>
                  )}
                  <h2 className="text-2xl font-black text-gray-900 leading-tight mb-3 group-hover:text-gray-700 transition-colors">
                    {posts[0].title}
                  </h2>
                  <p className="text-gray-500 leading-relaxed mb-5">{posts[0].excerpt}</p>
                  <div className="flex items-center gap-3 text-sm text-gray-400">
                    {posts[0].author && (
                      <>
                        <span>{posts[0].author}</span>
                        <span>·</span>
                      </>
                    )}
                    <span>{formatDate(posts[0].publishedAt)}</span>
                  </div>
                </div>
              </Link>
            </div>

            {/* Diğer yazılar */}
            {posts.length > 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.slice(1).map((post) => (
                  <Link
                    key={post.slug}
                    href={`/blog/${post.slug}`}
                    className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover-lift"
                  >
                    <div className="img-zoom aspect-[16/9] relative overflow-hidden bg-gray-100">
                      {post.coverImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={post.coverImage}
                          alt={post.title}
                          className="img-zoom-target absolute inset-0 w-full h-full object-cover"
                        />
                      ) : (
                        <BrandArtwork variant="blog" className="absolute inset-0 w-full h-full" />
                      )}
                    </div>
                    <div className="p-5">
                      {post.category && (
                        <span className="inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full mb-3 bg-brand-100 text-brand-700">
                          {post.category}
                        </span>
                      )}
                      <h3 className="font-bold text-gray-900 leading-snug mb-2 group-hover:text-gray-700 transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-gray-500 text-sm line-clamp-2 mb-4">{post.excerpt}</p>
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>{post.author ?? ''}</span>
                        <span>{formatDate(post.publishedAt)}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
