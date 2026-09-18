import type { Metadata } from 'next'
import Link from 'next/link'
import { Navigation } from '@/components/sections/Navigation'
import { Footer } from '@/components/sections/Footer'
import { BackgroundMesh } from '@/components/sections/BackgroundMesh'
import { JsonLd } from '@/components/ui/JsonLd'
import { siteConfig } from '@/lib/data'
import { getPublishedPosts } from '@/lib/writing'

export const metadata: Metadata = {
  title: 'Writing',
  description:
    'Essays on how growth actually works. Shopify theme architecture, findability, and the decisions that make a small team move faster than its size.',
  alternates: {
    canonical: '/writing',
  },
  openGraph: {
    title: 'Writing by Chris Hornak',
    description:
      'Essays on how growth actually works, and the decisions that make a small team move faster than its size.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Writing by Chris Hornak',
    description:
      'Essays on how growth actually works, and the decisions that make a small team move faster than its size.',
  },
}

export default function WritingIndexPage() {
  const posts = getPublishedPosts()

  return (
    <main id="main-content" className="relative min-h-screen overflow-x-hidden">
      <BackgroundMesh />
      <Navigation />

      <section className="px-6 pt-32 pb-12 md:px-12 md:pt-40 md:pb-16 lg:px-24">
        <div className="mx-auto max-w-3xl">
          <h1 className="font-heading text-4xl leading-[1.1] font-bold tracking-tight md:text-6xl">
            Writing
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
          <ul className="divide-y divide-border/20 border-t border-border/20">
            {posts.map((post) => {
              const formatted = new Date(post.datePublished + 'T00:00:00').toLocaleDateString(
                'en-US',
                { year: 'numeric', month: 'long', day: 'numeric' }
              )

              return (
                <li key={post.slug}>
                  <Link
                    href={`/writing/${post.slug}`}
                    className="group block py-8 transition-opacity hover:opacity-90"
                  >
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground/60">
                      <time dateTime={post.datePublished}>{formatted}</time>
                      <span>&middot;</span>
                      <span>{post.readingMinutes} min read</span>
                    </div>
                    <h2 className="mt-3 font-heading text-2xl font-bold leading-snug tracking-tight transition-colors group-hover:text-primary md:text-3xl">
                      {post.title}
                    </h2>
                    <p className="mt-3 leading-relaxed text-muted-foreground">{post.teaser}</p>
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
              '@id': `${siteConfig.domain}/writing`,
              name: 'Writing by Chris Hornak',
              url: `${siteConfig.domain}/writing`,
              author: { '@type': 'Person', name: 'Chris Hornak', url: siteConfig.domain },
              blogPost: posts.map((p) => ({
                '@type': 'BlogPosting',
                headline: p.title,
                url: `${siteConfig.domain}/writing/${p.slug}`,
                datePublished: `${p.datePublished}T00:00:00Z`,
              })),
            },
            {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: siteConfig.domain },
                { '@type': 'ListItem', position: 2, name: 'Writing', item: `${siteConfig.domain}/writing` },
              ],
            },
          ],
        }}
      />
    </main>
  )
}
