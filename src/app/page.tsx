import { BackgroundMesh } from '@/components/sections/BackgroundMesh'
import { Navigation } from '@/components/sections/Navigation'
import { Hero } from '@/components/sections/Hero'
import { About } from '@/components/sections/About'
import { Services } from '@/components/sections/Services'
import { Work } from '@/components/sections/Work'
import { Faq } from '@/components/sections/Faq'
import { Connect } from '@/components/sections/Connect'
import { Ventures } from '@/components/sections/Ventures'
import { Footer } from '@/components/sections/Footer'
import { JsonLd } from '@/components/ui/JsonLd'
import { homeFaqs } from '@/lib/data'

export default function HomePage() {
  return (
    <main id="main-content" className="relative min-h-screen overflow-hidden">
      <BackgroundMesh />
      <Navigation />
      <Hero />
      <About />
      <Services />
      <Work />
      <Connect />
      <Ventures />
      <Faq />
      <Footer />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: homeFaqs.map((faq) => ({
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
