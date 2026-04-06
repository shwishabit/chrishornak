import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Navigation } from '@/components/sections/Navigation'
import { Footer } from '@/components/sections/Footer'
import { BackgroundMesh } from '@/components/sections/BackgroundMesh'
import { GuideLayout } from '@/components/sections/GuideLayout'
import { JsonLd } from '@/components/ui/JsonLd'
import { siteConfig } from '@/lib/data'
import { guides, getGuideBySlug, getAdjacentGuides } from '@/lib/guides'

// Guide content components — add new imports as guides are published
import { FindabilityGuide } from '@/components/guides/FindabilityGuide'
import { FindabilityDiagram } from '@/components/guides/FindabilityDiagram'
import { SearchVisibilityGuide } from '@/components/guides/SearchVisibilityGuide'
import { SearchVisibilityDiagram } from '@/components/guides/SearchVisibilityDiagram'
import { AiReadinessGuide } from '@/components/guides/AiReadinessGuide'
import { AiReadinessDiagram } from '@/components/guides/AiReadinessDiagram'
import { WebsiteTrustGuide } from '@/components/guides/WebsiteTrustGuide'
import { WebsiteTrustDiagram } from '@/components/guides/WebsiteTrustDiagram'
import { ContentStructureGuide } from '@/components/guides/ContentStructureGuide'
import { ContentStructureDiagram } from '@/components/guides/ContentStructureDiagram'
import { StrategyFirstGuide } from '@/components/guides/StrategyFirstGuide'
import { StrategyFirstDiagram } from '@/components/guides/StrategyFirstDiagram'

const guideContentMap: Record<string, React.ComponentType> = {
  findability: FindabilityGuide,
  'search-visibility': SearchVisibilityGuide,
  'ai-readiness': AiReadinessGuide,
  'website-trust': WebsiteTrustGuide,
  'content-structure': ContentStructureGuide,
  'strategy-first': StrategyFirstGuide,
}

const guideHeroVisualMap: Record<string, React.ComponentType> = {
  findability: FindabilityDiagram,
  'search-visibility': SearchVisibilityDiagram,
  'ai-readiness': AiReadinessDiagram,
  'website-trust': WebsiteTrustDiagram,
  'content-structure': ContentStructureDiagram,
  'strategy-first': StrategyFirstDiagram,
}

// Table of contents per guide — ids match h2 anchors in guide content
const guideTocMap: Record<string, { id: string; label: string }[]> = {
  findability: [
    { id: 'the-assumption-thats-costing-you', label: 'The assumption that\'s costing you' },
    { id: 'the-six-signals', label: 'What your signal is actually made of' },
    { id: 'the-strategic-layer', label: 'But a strong foundation isn\'t enough' },
    { id: 'how-it-connects', label: 'How the two layers work together' },
    { id: 'what-good-looks-like', label: 'What a strong signal actually looks like' },
    { id: 'the-strategy', label: 'Where to start' },
  ],
  'search-visibility': [
    { id: 'having-a-website-is-not-being-online', label: 'Having a website is not the same as being online' },
    { id: 'what-sitting-in-the-dark-means', label: 'What "sitting in the dark" actually means' },
    { id: 'what-your-agency-never-set-up', label: 'The six things your agency probably never set up' },
    { id: 'why-agencies-skip-this', label: 'Why agencies skip this stuff' },
    { id: 'turning-the-lights-on', label: 'What turning the lights on actually looks like' },
    { id: 'the-compound-effect', label: 'Why this compounds' },
    { id: 'where-to-start', label: 'Where to start' },
  ],
  'ai-readiness': [
    { id: 'how-ai-recommendations-work', label: 'How AI recommendations actually work' },
    { id: 'why-your-competitors-show-up', label: 'Why your competitors show up and you don\'t' },
    { id: 'the-window-is-open', label: 'The window is still open — but it\'s closing' },
    { id: 'what-ai-readiness-looks-like', label: 'What AI readiness actually looks like' },
    { id: 'this-isnt-about-tricks', label: 'This isn\'t about tricking AI' },
    { id: 'where-to-start', label: 'Where to start' },
  ],
  'website-trust': [
    { id: 'the-trust-gap', label: 'The gap nobody talks about' },
    { id: 'what-trust-actually-looks-like', label: 'What trust actually looks like on a website' },
    { id: 'the-referral-test', label: 'The referral test' },
    { id: 'why-good-businesses-have-bad-sites', label: 'Why good businesses have bad websites' },
    { id: 'closing-the-gap', label: 'How to close the trust gap' },
    { id: 'where-to-start', label: 'Where to start' },
  ],
  'content-structure': [
    { id: 'what-content-cannibalization-looks-like', label: 'What content cannibalization actually looks like' },
    { id: 'why-more-content-makes-it-worse', label: 'Why "publish more" makes it worse' },
    { id: 'how-content-should-be-structured', label: 'How content should actually be structured' },
    { id: 'the-content-audit', label: 'The content audit nobody wants to do' },
    { id: 'quality-over-quantity', label: 'The counterintuitive truth about less content' },
    { id: 'where-to-start', label: 'Where to start' },
  ],
  'strategy-first': [
    { id: 'the-sequence-problem', label: 'The sequence problem' },
    { id: 'what-the-right-order-looks-like', label: 'What the right order actually looks like' },
    { id: 'why-the-wrong-order-feels-right', label: 'Why the wrong order feels right' },
    { id: 'diagnosing-your-order', label: 'How to tell if you\'re out of order' },
    { id: 'you-dont-need-to-start-over', label: 'You don\'t need to start over' },
    { id: 'where-to-start', label: 'Where to start' },
    { id: 'the-signal-complete', label: 'The full picture' },
  ],
}

export function generateStaticParams() {
  return guides
    .filter((g) => g.published)
    .map((g) => ({ slug: g.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const guide = getGuideBySlug(slug)
  if (!guide || !guide.published) return {}

  return {
    title: guide.metaTitle,
    description: guide.metaDescription,
    keywords: guide.keywords,
    alternates: {
      canonical: `/signal/${guide.slug}`,
    },
    openGraph: {
      title: guide.metaTitle,
      description: guide.metaDescription,
      type: 'article',
      publishedTime: guide.datePublished ? `${guide.datePublished}T00:00:00Z` : undefined,
      modifiedTime: guide.dateModified ? `${guide.dateModified}T00:00:00Z` : undefined,
      authors: ['Chris Hornak'],
      section: 'The Signal',
    },
    twitter: {
      card: 'summary_large_image',
      title: guide.metaTitle,
      description: guide.metaDescription,
    },
    other: {
      'article:published_time': guide.datePublished ? `${guide.datePublished}T00:00:00Z` : '',
      'article:modified_time': guide.dateModified ? `${guide.dateModified}T00:00:00Z` : '',
    },
  }
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const guide = getGuideBySlug(slug)
  if (!guide || !guide.published) notFound()

  const { prev, next } = getAdjacentGuides(slug)
  const ContentComponent = guideContentMap[slug]
  if (!ContentComponent) notFound()

  const toc = guideTocMap[slug] || []
  const HeroVisual = guideHeroVisualMap[slug]

  return (
    <main id="main-content" className="relative min-h-screen overflow-x-hidden">
      <BackgroundMesh />
      <Navigation />
      <GuideLayout guide={guide} prev={prev} next={next} toc={toc} heroVisual={HeroVisual ? <HeroVisual /> : undefined}>
        <ContentComponent />
      </GuideLayout>
      <Footer />

      {/* Quad-stack schema: Article + BreadcrumbList + FAQPage + ItemList */}
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'Article',
              '@id': `${siteConfig.domain}/signal/${guide.slug}#article`,
              headline: guide.headline,
              description: guide.metaDescription,
              author: {
                '@type': 'Person',
                name: 'Chris Hornak',
                url: siteConfig.domain,
              },
              publisher: {
                '@type': 'Person',
                name: 'Chris Hornak',
                url: siteConfig.domain,
              },
              datePublished: guide.datePublished ? `${guide.datePublished}T00:00:00Z` : undefined,
              dateModified: guide.dateModified ? `${guide.dateModified}T00:00:00Z` : undefined,
              mainEntityOfPage: {
                '@type': 'WebPage',
                '@id': `${siteConfig.domain}/signal/${guide.slug}`,
              },
              isPartOf: {
                '@type': 'WebPage',
                '@id': `${siteConfig.domain}/signal`,
                name: 'The Signal',
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
                { '@type': 'ListItem', position: 2, name: 'The Signal', item: `${siteConfig.domain}/signal` },
                { '@type': 'ListItem', position: 3, name: guide.headline, item: `${siteConfig.domain}/signal/${guide.slug}` },
              ],
            },
            ...(guide.faq.length > 0
              ? [
                  {
                    '@type': 'FAQPage' as const,
                    mainEntity: guide.faq.map((f) => ({
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
            ...(toc.length > 0
              ? [
                  {
                    '@type': 'ItemList' as const,
                    name: 'Key Sections',
                    itemListElement: toc.map((t, i) => ({
                      '@type': 'ListItem' as const,
                      position: i + 1,
                      name: t.label,
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
