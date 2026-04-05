import type { Metadata } from 'next'
import { Navigation } from '@/components/sections/Navigation'
import { Footer } from '@/components/sections/Footer'
import { BackgroundMesh } from '@/components/sections/BackgroundMesh'
import { AuditPageClient } from '@/components/sections/AuditPageClient'
import { JsonLd } from '@/components/ui/JsonLd'
import { PlatformBar } from '@/components/ui/PlatformBar'
import { siteConfig, auditFaqs } from '@/lib/data'

export const metadata: Metadata = {
  title: 'Findability Check',
  alternates: {
    canonical: '/audit',
  },
  description:
    'Most businesses guess whether their site is working. See what a marketing strategist actually looks at first — whether people, search engines, and AI can find you, trust you, and share you.',
  openGraph: {
    title: 'See if your website is ready to be found.',
    description:
      'Most businesses guess whether their site is working. See what a marketing strategist actually looks at first — free, instant, no signup.',
  },
}

export default function AuditPage() {
  return (
    <main id="main-content" className="relative min-h-screen">
      <BackgroundMesh />
      <Navigation />
      {/* Hero — same scale/spacing as homepage hero */}
      <div className="relative flex min-h-[85vh] flex-col justify-center px-6 pt-36 pb-16 md:min-h-screen md:pt-40 md:px-12 lg:px-24">
        <div className="relative mx-auto w-full max-w-5xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-medium uppercase tracking-widest text-primary">
              Findability Check
            </p>
            <h1 className="mt-4 font-heading text-4xl leading-[1.1] font-bold tracking-tight md:text-6xl lg:text-7xl">
              See if your website is ready to
              <br />
              <span className="text-primary">be found.</span>
            </h1>
            <p className="mt-8 max-w-xl mx-auto text-lg leading-relaxed text-muted-foreground md:text-xl">
              Most businesses guess whether their site is working.
              This is what I actually look at first — whether people,
              search engines, and AI can find you, trust you, and share you.
            </p>
            <PlatformBar />
          </div>

          <AuditPageClient />
        </div>
      </div>
      <Footer />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: siteConfig.domain },
            { '@type': 'ListItem', position: 2, name: 'Findability Check', item: `${siteConfig.domain}/audit` },
          ],
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: auditFaqs.map((faq) => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: faq.answer,
            },
          })),
        }}
      />
    </main>
  )
}
