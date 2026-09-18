import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Navigation } from '@/components/sections/Navigation'
import { Footer } from '@/components/sections/Footer'
import { BackgroundMesh } from '@/components/sections/BackgroundMesh'
import { BlogLayout } from '@/components/sections/BlogLayout'
import { JsonLd } from '@/components/ui/JsonLd'
import { siteConfig } from '@/lib/data'
import { posts, getPostBySlug } from '@/lib/blog'

// Post content components — add new imports as pieces are published
import { ShopifyThemePost } from '@/components/blog/ShopifyThemePost'
import { ShopifyThemeDiagram } from '@/components/blog/ShopifyThemeDiagram'
import { ProductPageAuditPost } from '@/components/blog/ProductPageAuditPost'
import { ProductPageAuditDiagram } from '@/components/blog/ProductPageAuditDiagram'
import { TextInImagesPost } from '@/components/blog/TextInImagesPost'
import { TextInImagesDiagram } from '@/components/blog/TextInImagesDiagram'
import { MeasureWebsiteChangesPost } from '@/components/blog/MeasureWebsiteChangesPost'
import { MeasureWebsiteChangesDiagram } from '@/components/blog/MeasureWebsiteChangesDiagram'

const postContentMap: Record<string, React.ComponentType> = {
  'shopify-theme-small-team': ShopifyThemePost,
  'product-page-audit': ProductPageAuditPost,
  'text-in-images': TextInImagesPost,
  'measure-website-changes': MeasureWebsiteChangesPost,
}

const postHeroVisualMap: Record<string, React.ComponentType> = {
  'shopify-theme-small-team': ShopifyThemeDiagram,
  'product-page-audit': ProductPageAuditDiagram,
  'text-in-images': TextInImagesDiagram,
  'measure-website-changes': MeasureWebsiteChangesDiagram,
}

// Table of contents per post — ids match the h2 anchors in the content
const postTocMap: Record<string, { id: string; label: string }[]> = {
  'shopify-theme-small-team': [
    { id: 'what-actually-changed', label: 'What actually changed' },
    { id: 'the-condition', label: 'The condition nobody mentions' },
    { id: 'what-makes-a-theme-easy-to-change', label: 'What makes a Shopify theme easy to change?' },
    { id: 'the-test', label: 'The test worth running today' },
    { id: 'how-i-ended-up-here', label: 'What this looks like on a real store' },
    { id: 'bigger-team-or-better-theme', label: 'Do you need a bigger team, or a better theme?' },
    { id: 'one-question', label: 'One question' },
  ],
  'product-page-audit': [
    { id: 'what-it-looks-like', label: 'What does it look like when a page argues with itself?' },
    { id: 'worse-than-a-gap', label: 'Why is a contradiction worse than a gap?' },
    { id: 'where-they-hide', label: 'Where do contradictions usually hide?' },
    { id: 'how-to-run-it', label: 'How do you run a contradiction audit?' },
    { id: 'one-source', label: 'The fix is one source, not a better sentence' },
    { id: 'wrong-tool', label: 'When is a contradiction audit the wrong tool?' },
    { id: 'one-question', label: 'One question' },
  ],
  'text-in-images': [
    { id: 'what-counts', label: 'What counts as text in images?' },
    { id: 'what-it-costs', label: 'What does the tax actually cost?' },
    { id: 'when-numbers-change', label: 'What happens when the numbers change?' },
    { id: 'how-to-find-it', label: 'How do you find text in images on your site?' },
    { id: 'what-instead', label: 'What should you use instead?' },
    { id: 'when-its-fine', label: 'When is text in images fine?' },
    { id: 'one-question', label: 'One question' },
  ],
  'measure-website-changes': [
    { id: 'why-baseline', label: 'Why does the baseline matter more than the change?' },
    { id: 'what-to-record', label: 'What should you record before you change a page?' },
    { id: 'real-example', label: 'What does this look like on a real page?' },
    { id: 'how-long-to-wait', label: 'How long should you wait before you measure again?' },
    { id: 'when-not-to', label: 'When is measuring not worth it?' },
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
      canonical: `/blog/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.metaDescription,
      type: 'article',
      publishedTime: `${post.datePublished}T00:00:00Z`,
      modifiedTime: `${post.dateModified}T00:00:00Z`,
      authors: ['Chris Hornak'],
      section: 'Blog',
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

export default async function BlogPostPage({
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
      <BlogLayout
        post={post}
        toc={toc}
        heroVisual={HeroVisual ? <HeroVisual /> : undefined}
      >
        <ContentComponent />
      </BlogLayout>
      <Footer />

      {/* BlogPosting + BreadcrumbList + FAQPage */}
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'BlogPosting',
              '@id': `${siteConfig.domain}/blog/${post.slug}#article`,
              headline: post.title,
              description: post.metaDescription,
              image: `${siteConfig.domain}/blog/${post.slug}/opengraph-image`,
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
              wordCount: post.wordCount,
              keywords: post.keywords.join(', '),
              mainEntityOfPage: {
                '@type': 'WebPage',
                '@id': `${siteConfig.domain}/blog/${post.slug}`,
              },
              isPartOf: {
                '@type': 'Blog',
                '@id': `${siteConfig.domain}/blog`,
                name: 'Blog',
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
                { '@type': 'ListItem', position: 2, name: 'Blog', item: `${siteConfig.domain}/blog` },
                {
                  '@type': 'ListItem',
                  position: 3,
                  name: post.title,
                  item: `${siteConfig.domain}/blog/${post.slug}`,
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
