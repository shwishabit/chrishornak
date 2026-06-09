import type { Metadata } from 'next'
import { Navigation } from '@/components/sections/Navigation'
import { Footer } from '@/components/sections/Footer'
import { BackgroundMesh } from '@/components/sections/BackgroundMesh'
import { WorkGallery } from '@/components/sections/WorkGallery'
import { ClientLogos } from '@/components/sections/ClientLogos'
import { Testimonials } from '@/components/sections/Testimonials'
import { JsonLd } from '@/components/ui/JsonLd'
import { siteConfig, workContent, projects, connectContent } from '@/lib/data'

export const metadata: Metadata = {
  title: 'Selected Work',
  alternates: { canonical: '/work' },
  description:
    'Software, products, and brands I\'ve built — for companies of my own and for the businesses I work with. The strategy made real, with the thinking behind each one.',
  openGraph: {
    title: 'Selected Work — Chris Hornak',
    description:
      'I don\'t just advise on this stuff. I build it. SaaS, products from scratch, and brands for the businesses I work with.',
    images: [{ url: '/images/og-image.png', width: 1200, height: 630, alt: 'Selected work by Chris Hornak' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Selected Work — Chris Hornak',
    description:
      'I don\'t just advise on this stuff. I build it. SaaS, products from scratch, and brands for the businesses I work with.',
    images: ['/images/og-image.png'],
  },
}

export default function WorkPage() {
  const absoluteUrl = (url: string) => (url.startsWith('/') ? `${siteConfig.domain}${url}` : url)

  return (
    <main id="main-content" className="relative min-h-screen overflow-x-hidden">
      <BackgroundMesh />
      <Navigation />

      {/* Hero — matches homepage / audit hero scale */}
      <header className="relative px-6 pt-36 pb-12 md:px-12 md:pt-44 md:pb-16 lg:px-24">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-medium uppercase tracking-widest text-primary">
            {workContent.eyebrow}
          </p>
          <h1 className="mt-4 max-w-3xl font-heading text-4xl leading-[1.1] font-bold tracking-tight md:text-6xl lg:text-7xl">
            {workContent.headline}
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
            {workContent.intro}
          </p>
        </div>
      </header>

      {/* Trust bar — recognizable brands I've worked with */}
      <section className="relative px-6 pb-20 md:px-12 lg:px-24">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Businesses I&apos;ve worked with
          </p>
          <ClientLogos className="mt-8 border-y border-border/50 py-10" />
        </div>
      </section>

      <WorkGallery />

      {/* Testimonials — third-party validation before the ask */}
      <section className="relative px-6 pb-24 md:px-12 lg:px-24">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-medium uppercase tracking-widest text-primary">
            In their words
          </p>
          <span className="mt-2 block h-px w-12 bg-primary/40" />
          <Testimonials className="mt-10" />
        </div>
      </section>

      {/* Closing CTA */}
      <section className="relative px-6 pb-28 md:px-12 lg:px-24">
        <div className="glass-card mx-auto max-w-5xl px-8 py-14 text-center md:px-16 md:py-20">
          <h2 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">
            {connectContent.headline}
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            {connectContent.body}
          </p>
          <a
            href={connectContent.ctaLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:shadow-glow"
          >
            {connectContent.ctaText}
          </a>
        </div>
      </section>

      <Footer />

      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: siteConfig.domain },
            { '@type': 'ListItem', position: 2, name: 'Selected Work', item: `${siteConfig.domain}/work` },
          ],
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'Selected Work — Chris Hornak',
          url: `${siteConfig.domain}/work`,
          mainEntity: {
            '@type': 'ItemList',
            itemListElement: projects.map((p, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              name: p.name,
              url: absoluteUrl(p.url),
            })),
          },
        }}
      />
    </main>
  )
}
