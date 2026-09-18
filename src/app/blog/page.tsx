import type { Metadata } from 'next'
import Link from 'next/link'
import { Navigation } from '@/components/sections/Navigation'
import { Footer } from '@/components/sections/Footer'
import { BackgroundMesh } from '@/components/sections/BackgroundMesh'
import { JsonLd } from '@/components/ui/JsonLd'
import { siteConfig } from '@/lib/data'
import { getPublishedPosts } from '@/lib/blog'
import { ShopifyThemeDiagram } from '@/components/blog/ShopifyThemeDiagram'
import { ProductPageAuditDiagram } from '@/components/blog/ProductPageAuditDiagram'

// Featured visual per post, so the index shows the same artwork as the piece.
const postVisualMap: Record<string, React.ComponentType> = {
  'shopify-theme-small-team': ShopifyThemeDiagram,
  'product-page-audit': ProductPageAuditDiagram,
}

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Essays on how growth actually works. Shopify theme architecture, findability, and the decisions that make a small team move faster than its size.',
  alternates: {
    canonical: '/blog',
  },
  openGraph: {
    title: 'The Chris Hornak blog',
    description:
      'Essays on how growth actually works, and the decisions that make a small team move faster than its size.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Chris Hornak blog',
    description:
      'Essays on how growth actually works, and the decisions that make a small team move faster than its size.',
  },
}

export default function BlogIndexPage() {
  const posts = getPublishedPosts()

  return (
    <main id="main-content" className="relative min-h-screen overflow-x-hidden">
      <BackgroundMesh />
      <Navigation />

      <section className="px-6 pt-32 pb-12 md:px-12 md:pt-40 md:pb-16 lg:px-24">
        <div className="mx-auto max-w-3xl">
          <h1 className="font-heading text-4xl leading-[1.1] font-bold tracking-tight md:text-6xl">
            Blog
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
            Shorter pieces, written when something is worth saying. Separate from the{' '}
            <Link href="/signal" className="underline underline-offset-4 hover:text-primary">
              Be The Signal guides
            </Link>
            , which are a set curriculum rather than a running series.
          </p>
        </div>
      </section>

      <section className="px-6 pb-24 md:px-12 md:pb-32 lg:px-24">
        <div className="mx-auto max-w-3xl">
          <ul className="space-y-16 md:space-y-20">
            {posts.map((post) => {
              const formatted = new Date(post.datePublished + 'T00:00:00').toLocaleDateString(
                'en-US',
                { year: 'numeric', month: 'long', day: 'numeric' }
              )
              const Visual = postVisualMap[post.slug]

              return (
                <li key={post.slug}>
                  <Link href={`/blog/${post.slug}`} className="group block">
                    {Visual && (
                      <div className="transition-opacity duration-300 group-hover:opacity-90">
                        <Visual />
                      </div>
                    )}

                    <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-muted-foreground/60">
                      <time dateTime={post.datePublished}>{formatted}</time>
                      <span>&middot;</span>
                      <span>{post.readingMinutes} min read</span>
                    </div>

                    <h2 className="mt-3 font-heading text-2xl font-bold leading-snug tracking-tight transition-colors group-hover:text-primary md:text-[2rem]">
                      {post.title}
                    </h2>

                    <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">
                      {post.teaser}
                    </p>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </section>

      <Footer />

      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'Blog',
              '@id': `${siteConfig.domain}/blog`,
              name: 'The Chris Hornak blog',
              url: `${siteConfig.domain}/blog`,
              author: { '@type': 'Person', name: 'Chris Hornak', url: siteConfig.domain },
              blogPost: posts.map((p) => ({
                '@type': 'BlogPosting',
                headline: p.title,
                url: `${siteConfig.domain}/blog/${p.slug}`,
                datePublished: `${p.datePublished}T00:00:00Z`,
              })),
            },
            {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: siteConfig.domain },
                { '@type': 'ListItem', position: 2, name: 'Blog', item: `${siteConfig.domain}/blog` },
              ],
            },
          ],
        }}
      />
    </main>
  )
}
