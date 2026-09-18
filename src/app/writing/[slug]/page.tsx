import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Navigation } from '@/components/sections/Navigation'
import { Footer } from '@/components/sections/Footer'
import { BackgroundMesh } from '@/components/sections/BackgroundMesh'
import { WritingLayout } from '@/components/sections/WritingLayout'
import { JsonLd } from '@/components/ui/JsonLd'
import { siteConfig } from '@/lib/data'
import { posts, getPostBySlug } from '@/lib/writing'

// Post content components — add new imports as pieces are published
import { ShopifyThemePost } from '@/components/writing/ShopifyThemePost'
import { ShopifyThemeDiagram } from '@/components/writing/ShopifyThemeDiagram'

const postContentMap: Record<string, React.ComponentType> = {
  'shopify-theme-small-team': ShopifyThemePost,
}

const postHeroVisualMap: Record<string, React.ComponentType> = {
  'shopify-theme-small-team': ShopifyThemeDiagram,
}

// Table of contents per post — ids match the h2 anchors in the content
const postTocMap: Record<string, { id: string; label: string }[]> = {
  'shopify-theme-small-team': [
    { id: 'what-actually-changed', label: 'What actually changed' },
    { id: 'the-condition', label: 'The condition nobody mentions' },
    { id: 'what-makes-a-theme-easy-to-change', label: 'What makes a Shopify theme easy to change?' },
    { id: 'the-test', label: 'The test worth running today' },
    { id: 'how-i-ended-up-here', label: 'How I ended up doing this work' },
    { id: 'bigger-team-or-better-theme', label: 'Do you need a bigger team, or a better theme?' },
    { id: 'one-question', label: 'One question' },
  ],
}

export function generateStaticParams() {
  return posts.filter((p) => p.published).map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post || !post.published) return {}

  return {
    title: post.title,
    description: post.metaDescription,
    keywords: post.keywords,
    alternates: {
      canonical: `/writing/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.metaDescription,
      type: 'article',
      publishedTime: `${post.datePublished}T00:00:00Z`,
      modifiedTime: `${post.dateModified}T00:00:00Z`,
      authors: ['Chris Hornak'],
      section: 'Writing',
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.metaDescription,
    },
    other: {
      'article:published_time': `${post.datePublished}T00:00:00Z`,
      'article:modified_time': `${post.dateModified}T00:00:00Z`,
    },
  }
}

export default async function WritingPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post || !post.published) notFound()

  const ContentComponent = postContentMap[slug]
  if (!ContentComponent) notFound()

  const toc = postTocMap[slug] || []
  const HeroVisual = postHeroVisualMap[slug]

  return (
    <main id="main-content" className="relative min-h-screen overflow-x-hidden">
      <BackgroundMesh />
      <Navigation />
      <WritingLayout
        post={post}
        toc={toc}
        heroVisual={HeroVisual ? <HeroVisual /> : undefined}
      >
        <ContentComponent />
      </WritingLayout>
      <Footer />

      {/* BlogPosting + BreadcrumbList + FAQPage */}
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'BlogPosting',
              '@id': `${siteConfig.domain}/writing/${post.slug}#article`,
              headline: post.title,
              description: post.metaDescription,
              image: `${siteConfig.domain}/writing/${post.slug}/opengraph-image`,
              author: {
                '@type': 'Person',
                name: 'Chris Hornak',
                url: siteConfig.domain,
              },
              publisher: {
                '@type': 'Organization',
                name: 'Chris Hornak',
                url: siteConfig.domain,
                logo: {
                  '@type': 'ImageObject',
                  url: `${siteConfig.domain}/images/wordmark-dark.png`,
                },
              },
              datePublished: `${post.datePublished}T00:00:00Z`,
              dateModified: `${post.dateModified}T00:00:00Z`,
              wordCount: 1003,
              keywords: post.keywords.join(', '),
              mainEntityOfPage: {
                '@type': 'WebPage',
                '@id': `${siteConfig.domain}/writing/${post.slug}`,
              },
              isPartOf: {
                '@type': 'Blog',
                '@id': `${siteConfig.domain}/writing`,
                name: 'Writing',
              },
              speakable: {
                '@type': 'SpeakableSpecification',
                cssSelector: ['.guide-definition', '.guide-summary', 'h1'],
              },
            },
            {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: siteConfig.domain },
                { '@type': 'ListItem', position: 2, name: 'Writing', item: `${siteConfig.domain}/writing` },
                {
                  '@type': 'ListItem',
                  position: 3,
                  name: post.title,
                  item: `${siteConfig.domain}/writing/${post.slug}`,
                },
              ],
            },
            ...(post.faq.length > 0
              ? [
                  {
                    '@type': 'FAQPage' as const,
                    mainEntity: post.faq.map((f) => ({
                      '@type': 'Question' as const,
                      name: f.question,
                      acceptedAnswer: {
                        '@type': 'Answer' as const,
                        text: f.answer,
                      },
                    })),
                  },
                ]
              : []),
          ],
        }}
      />
    </main>
  )
}
