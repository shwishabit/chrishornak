import type { Metadata } from 'next'
import Script from 'next/script'
import { Navigation } from '@/components/sections/Navigation'
import { Footer } from '@/components/sections/Footer'
import { BackgroundMesh } from '@/components/sections/BackgroundMesh'
import { AuditPageClient } from '@/components/sections/AuditPageClient'
import { ToolQuestions } from '@/components/sections/ToolQuestions'
import { JsonLd } from '@/components/ui/JsonLd'
import { PlatformBar } from '@/components/ui/PlatformBar'
import { siteConfig, auditFaqs } from '@/lib/data'

export const metadata: Metadata = {
  title: 'Free Findability Audit: SEO and AI Grader',
  alternates: {
    canonical: '/audit',
  },
  description:
    'A free findability audit. See how easily search engines, AI answer engines and customers can find your website, scored out of 100. No sign-up.',
  openGraph: {
    type: 'website',
    url: `${siteConfig.domain}/audit`,
    siteName: siteConfig.brandName,
    title: 'See if your website is ready to be found.',
    description:
      'Most businesses guess whether their site is working. See what a marketing strategist actually looks at first — free, instant, no signup.',
    images: [
      {
        url: '/images/og-image-audit.png',
        width: 1200,
        height: 630,
        alt: 'Findability Check — see if your website is ready to be found',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'See if your website is ready to be found.',
    description:
      'Most businesses guess whether their site is working. See what a marketing strategist actually looks at first — free, instant, no signup.',
    images: ['/images/og-image-audit.png'],
  },
}

export default function AuditPage() {
  return (
    <main id="main-content" className="relative min-h-screen overflow-x-hidden">
      <BackgroundMesh />
      <Navigation />
      {/* Hero — same scale/spacing as homepage hero */}
      <div className="relative flex min-h-[85vh] flex-col justify-center px-6 pt-36 pb-16 md:min-h-screen md:pt-40 md:px-12 lg:px-24">
        <div className="relative mx-auto w-full max-w-5xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-medium uppercase tracking-widest text-primary">
              Findability Check · Free, no sign-up
            </p>
            <h1 className="mt-4 font-heading text-4xl leading-[1.1] font-bold tracking-tight md:text-6xl lg:text-7xl">
              See if your website
              <br />
              <span className="whitespace-nowrap">is ready to <span className="text-primary">be&nbsp;found.</span></span>
            </h1>
            <p className="mt-8 max-w-xl mx-auto text-lg leading-relaxed text-muted-foreground md:text-xl">
              Your business puts out a signal — to search engines, to AI,
              to every person looking for what you do.
              This measures how strong that signal is.
            </p>
            <PlatformBar />
          </div>

          <AuditPageClient />
          <ToolQuestions current="/audit" className="mx-auto mt-24 max-w-3xl" />
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
          '@type': 'WebApplication',
          name: 'Findability Check',
          alternateName: 'Findability Audit',
          url: `${siteConfig.domain}/audit`,
          description:
            'A free check of how easily search engines, AI answer engines and customers can find your website: one score out of 100 across 7 signals.',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Any',
          isAccessibleForFree: true,
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          author: { '@type': 'Person', name: 'Chris Hornak', url: siteConfig.domain },
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
      {/* The result's "What should you fix first?" Cal.com pop-up (15 minutes).
          Same idempotent loader as layout.tsx (whichever runs first creates
          window.Cal), then this page's own namespace, like the other two tools. */}
      <Script id="cal-findability" strategy="lazyOnload">
        {`(function (C, A, L) { let p = function (a, ar) { a.q.push(ar); }; let d = C.document; C.Cal = C.Cal || function () { let cal = C.Cal; let ar = arguments; if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement("script")).src = A; cal.loaded = true; } if (ar[0] === L) { const api = function () { p(api, arguments); }; const namespace = ar[1]; api.q = api.q || []; if(typeof namespace === "string"){cal.ns[namespace] = cal.ns[namespace] || api;p(cal.ns[namespace], ar);p(cal, ["initNamespace", namespace]);} else p(cal, ar); return;} p(cal, ar); }; })(window, "https://app.cal.com/embed/embed.js", "init");
Cal("init", "findability", {origin:"https://app.cal.com"});
Cal.ns["findability"]("ui", {"theme":"dark","cssVarsPerTheme":{"light":{"cal-brand":"#292929"},"dark":{"cal-brand":"#2dd4a8"}},"hideEventTypeDetails":false,"layout":"month_view"});`}
      </Script>
    </main>
  )
}
