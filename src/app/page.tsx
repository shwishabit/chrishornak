import dynamic from 'next/dynamic'
import { BackgroundMesh } from '@/components/sections/BackgroundMesh'
import { Navigation } from '@/components/sections/Navigation'
import { Hero } from '@/components/sections/Hero'
import { JsonLd } from '@/components/ui/JsonLd'
import { homeFaqs, siteConfig } from '@/lib/data'

const About = dynamic(() => import('@/components/sections/About').then(m => ({ default: m.About })))
const Services = dynamic(() => import('@/components/sections/Services').then(m => ({ default: m.Services })))
const Work = dynamic(() => import('@/components/sections/Work').then(m => ({ default: m.Work })))
const SignalPreview = dynamic(() => import('@/components/sections/SignalPreview').then(m => ({ default: m.SignalPreview })))
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
      <SignalPreview />
      <Connect />
      <Ventures />
      <Faq />
      <Footer />
      {/* Google's preferred picture for this page: the headshot shown in About,
          not the text-heavy share card (Google: avoid images with text).
          developers.google.com/search/docs/appearance/google-images */}
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          url: siteConfig.domain,
          name: siteConfig.defaultTitle,
          primaryImageOfPage: {
            '@type': 'ImageObject',
            url: `${siteConfig.domain}/images/chris-hornak-headshot.jpg`,
            width: 1140,
            height: 1140,
            caption: 'Chris Hornak — marketing strategist',
          },
        }}
      />
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
