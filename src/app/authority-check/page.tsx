import type { Metadata } from 'next'
import Script from 'next/script'
import { Navigation } from '@/components/sections/Navigation'
import { Footer } from '@/components/sections/Footer'
import { AuthorityCheck } from '@/components/sections/AuthorityCheck'
import { JsonLd } from '@/components/ui/JsonLd'
import { siteConfig } from '@/lib/data'
import { AUTHORITY_CHECK_EXAMPLE } from '@/lib/authority-check-example'
import { AUTHORITY_FAQ } from '@/lib/authority-check-faq'

// Not "Domain Authority Checker": that is Moz's product name, and the tool doesn't show it (SEO
// panel, 6 of 6, 2026-10-02). The description still says it, so the search phrase stays. og:title asks the question.
// Two jobs, two equal tabs (Grill Me, 2026-10-05): check one site, or compare it to rivals.
// Title (Chris, 2026-10-05): the search phrase first, then E-E-A-T for marketers who know it.
const PAGE_TITLE = 'Free Website Authority & E-E-A-T Checker: Compare Rivals'
const TITLE = 'How strong is your website? Check it alone, or next to your rivals.'
const DESCRIPTION =
  "Free website authority check: score your link strength, reviews and proof of expertise, or compare with up to 3 rivals. Not Moz's Domain Authority."
const OG_ALT =
  "Authority Check card: the headline 'How do you stack up? Your site next to your rivals.' above an example ranking of four sites, with yourshop.com in third place, highlighted in teal."
const URL = `${siteConfig.domain}/authority-check`

export const metadata: Metadata = {
  title: { absolute: PAGE_TITLE },
  description: DESCRIPTION,
  alternates: { canonical: '/authority-check' },
  openGraph: {
    type: 'website',
    url: URL,
    siteName: siteConfig.brandName,
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: '/images/authority-check.png', width: 1200, height: 630, alt: OG_ALT }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: ['/images/authority-check.png'],
  },
}

export default function AuthorityCheckPage() {
  // Light / dark comes from the sitewide switch (<html data-theme>);
  // .ac-theme only adds the report's standing colours.
  return (
    <div className="ac-theme">
      <Navigation />
      <main id="main-content" className="relative min-h-screen overflow-x-hidden">
        <AuthorityCheck example={AUTHORITY_CHECK_EXAMPLE} />
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: siteConfig.domain },
              { '@type': 'ListItem', position: 2, name: 'Authority Check', item: URL },
            ],
          }}
        />
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: 'Authority Check',
            alternateName: 'Website Authority Checker',
            url: URL,
            description: DESCRIPTION,
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Any',
            isAccessibleForFree: true,
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
            author: { '@type': 'Person', name: 'Chris Hornak', url: siteConfig.domain },
          }}
        />
        {/* The same questions and answers as the "Questions" list at the end of the page. */}
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: AUTHORITY_FAQ.map((f) => ({
              '@type': 'Question',
              name: f.q,
              acceptedAnswer: { '@type': 'Answer', text: f.a.join(' ') },
            })),
          }}
        />
        {/* The 15-minute call's Cal.com pop-up. Same idempotent loader as
            layout.tsx (whichever runs first creates window.Cal), then this
            page's own namespace. */}
        <Script id="cal-authority-check" strategy="lazyOnload">
          {`(function (C, A, L) { let p = function (a, ar) { a.q.push(ar); }; let d = C.document; C.Cal = C.Cal || function () { let cal = C.Cal; let ar = arguments; if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement("script")).src = A; cal.loaded = true; } if (ar[0] === L) { const api = function () { p(api, arguments); }; const namespace = ar[1]; api.q = api.q || []; if(typeof namespace === "string"){cal.ns[namespace] = cal.ns[namespace] || api;p(cal.ns[namespace], ar);p(cal, ["initNamespace", namespace]);} else p(cal, ar); return;} p(cal, ar); }; })(window, "https://app.cal.com/embed/embed.js", "init");
Cal("init", "authority-check", {origin:"https://app.cal.com"});
Cal.ns["authority-check"]("ui", {"theme":"dark","cssVarsPerTheme":{"light":{"cal-brand":"#292929"},"dark":{"cal-brand":"#2dd4a8"}},"hideEventTypeDetails":false,"layout":"month_view"});`}
        </Script>
      </main>
      <Footer />
    </div>
  )
}
