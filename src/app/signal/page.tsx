import type { Metadata } from 'next'
import { Navigation } from '@/components/sections/Navigation'
import { Footer } from '@/components/sections/Footer'
import { BackgroundMesh } from '@/components/sections/BackgroundMesh'
import { SignalPageClient } from '@/components/sections/SignalPageClient'
import { JsonLd } from '@/components/ui/JsonLd'
import { siteConfig } from '@/lib/data'

export const metadata: Metadata = {
  title: 'The Signal',
  alternates: {
    canonical: '/signal',
  },
  description:
    'Your business puts out a signal. These 6 guides show you how to strengthen it — so the right people find you, trust you, and choose you.',
  openGraph: {
    title: 'The Signal — Guides to Getting Found',
    description:
      'Your business puts out a signal. These guides show you how to strengthen it — so the right people find you, trust you, and choose you.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Signal — Guides to Getting Found',
    description:
      'Your business puts out a signal. These guides show you how to strengthen it — so the right people find you, trust you, and choose you.',
  },
}

export default function SignalPage() {
  return (
    <main id="main-content" className="relative min-h-screen overflow-x-hidden">
      <BackgroundMesh />
      <Navigation />
      <SignalPageClient />
      <Footer />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: siteConfig.domain },
            { '@type': 'ListItem', position: 2, name: 'The Signal', item: `${siteConfig.domain}/signal` },
          ],
        }}
      />
    </main>
  )
}
