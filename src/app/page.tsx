import dynamic from 'next/dynamic'
import { BackgroundMesh } from '@/components/sections/BackgroundMesh'
import { Navigation } from '@/components/sections/Navigation'
import { Hero } from '@/components/sections/Hero'
import { JsonLd } from '@/components/ui/JsonLd'
import { homeFaqs } from '@/lib/data'

const About = dynamic(() => import('@/components/sections/About').then(m => ({ default: m.About })))
const Services = dynamic(() => import('@/components/sections/Services').then(m => ({ default: m.Services })))
const Work = dynamic(() => import('@/components/sections/Work').then(m => ({ default: m.Work })))
const Connect = dynamic(() => import('@/components/sections/Connect').then(m => ({ default: m.Connect })))
const Ventures = dynamic(() => import('@/components/sections/Ventures').then(m => ({ default: m.Ventures })))
const Faq = dynamic(() => import('@/components/sections/Faq').then(m => ({ default: m.Faq })))
const Footer = dynamic(() => import('@/components/sections/Footer').then(m => ({ default: m.Footer })))

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
