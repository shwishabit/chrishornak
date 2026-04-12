import type { Metadata } from 'next'
import { Sora, Inter } from 'next/font/google'
import Script from 'next/script'
import '@/styles/globals.css'
import { siteConfig } from '@/lib/data'
import { JsonLd } from '@/components/ui/JsonLd'
import { CustomCursor } from '@/components/ui/CustomCursor'

const sora = Sora({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-heading',
  weight: ['400', '700'],
})

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
  weight: ['400', '500'],
})

export const metadata: Metadata = {
  title: {
    default: siteConfig.defaultTitle,
    template: `%s | ${siteConfig.brandName}`,
  },
  description: siteConfig.defaultDescription,
  keywords: ['marketing strategist', 'growth strategy', 'content marketing', 'Chris Hornak', 'Blog Hands', 'marketing strategist Pittsburgh', 'marketing strategist Wheeling WV'],
  authors: [{ name: 'Chris Hornak' }],
  creator: 'Chris Hornak',
  metadataBase: new URL(siteConfig.domain),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteConfig.domain,
    siteName: siteConfig.brandName,
    title: siteConfig.defaultTitle,
    description: siteConfig.defaultDescription,
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Chris Hornak — marketing strategist for growing businesses',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.defaultTitle,
    description: siteConfig.defaultDescription,
    images: ['/images/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${sora.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://app.cal.com" />
        <link rel="preload" as="image" href="/images/wordmark-dark.svg" />
      </head>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased" suppressHydrationWarning>
        <Script id="gtm-init" strategy="lazyOnload">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-PVRTWC9Q');`}
        </Script>
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-PVRTWC9Q"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-9999 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground"
        >
          Skip to main content
        </a>
        <CustomCursor />
        <div className="overflow-x-clip" style={{ maxWidth: '100vw' }}>
        {children}
        </div>
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: siteConfig.brandName,
            url: siteConfig.domain,
            description: siteConfig.defaultDescription,
          }}
        />
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'Person',
            name: 'Chris Hornak',
            url: siteConfig.domain,
            image: `${siteConfig.domain}/images/chris-hornak.jpg`,
            jobTitle: 'Marketing Strategist',
            worksFor: [
              { '@type': 'Organization', name: 'Blog Hands' },
              { '@type': 'Organization', name: 'Swift Growth Marketing' },
            ],
            sameAs: [
              'https://www.linkedin.com/in/chrishornak/',
              'https://www.youtube.com/@chrishornak',
              'https://twitter.com/chrishornak',
              'https://www.threads.net/@chornak',
              'https://www.reddit.com/user/chris-hornak/',
            ],
            contactPoint: {
              '@type': 'ContactPoint',
              contactType: 'customer service',
              url: `${siteConfig.domain}/#connect`,
              email: siteConfig.supportEmail,
            },
          }}
        />
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'AggregateRating',
            itemReviewed: {
              '@type': 'ProfessionalService',
              name: 'Chris Hornak',
              url: siteConfig.domain,
              areaServed: [
                { '@type': 'City', name: 'Pittsburgh', containedInPlace: { '@type': 'State', name: 'Pennsylvania' } },
                { '@type': 'City', name: 'Wheeling', containedInPlace: { '@type': 'State', name: 'West Virginia' } },
                { '@type': 'Country', name: 'United States' },
              ],
            },
            ratingValue: '5',
            bestRating: '5',
            ratingCount: '4',
            reviewCount: '4',
          }}
        />
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            itemListElement: [
              {
                '@type': 'Review',
                author: { '@type': 'Person', name: 'David Horell' },
                reviewBody: 'Before working with Chris, we had no online presence. He built our website from scratch, helping us define and communicate our brand to investors, partners, and stakeholders. The result supports our future growth.',
                reviewRating: { '@type': 'Rating', ratingValue: '5', bestRating: '5' },
                itemReviewed: { '@type': 'ProfessionalService', name: 'Chris Hornak', url: siteConfig.domain },
              },
              {
                '@type': 'Review',
                author: { '@type': 'Person', name: 'Meredith Smith' },
                reviewBody: 'Working with Blog Hands is like having a writer on staff! We are able to collaborate to develop topics lists and then Blog Hands talented writers take it from there. I am impressed with their ability to research almost any topic and make suggestions. Perfect complement to our in-house capabilities.',
                reviewRating: { '@type': 'Rating', ratingValue: '5', bestRating: '5' },
                itemReviewed: { '@type': 'ProfessionalService', name: 'Chris Hornak', url: siteConfig.domain },
              },
              {
                '@type': 'Review',
                author: { '@type': 'Person', name: 'Cheryl Cassidy' },
                reviewBody: 'Chris has been an invaluable partner. He\'s a hands-on problem solver who jumps right in when we face technical challenges. His work is consistently reliable, and the communication is always direct and collaborative.',
                reviewRating: { '@type': 'Rating', ratingValue: '5', bestRating: '5' },
                itemReviewed: { '@type': 'ProfessionalService', name: 'Chris Hornak', url: siteConfig.domain },
              },
              {
                '@type': 'Review',
                author: { '@type': 'Person', name: 'John Kleist III' },
                reviewBody: 'Chris grasped our strategic objectives quickly and delivered a comprehensive digital strategy that aligned seamlessly with our goals. His approach is professional, responsive, and results-driven.',
                reviewRating: { '@type': 'Rating', ratingValue: '5', bestRating: '5' },
                itemReviewed: { '@type': 'ProfessionalService', name: 'Chris Hornak', url: siteConfig.domain },
              },
            ],
          }}
        />
        <Script id="cal-embed" strategy="lazyOnload">
          {`(function (C, A, L) { let p = function (a, ar) { a.q.push(ar); }; let d = C.document; C.Cal = C.Cal || function () { let cal = C.Cal; let ar = arguments; if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement("script")).src = A; cal.loaded = true; } if (ar[0] === L) { const api = function () { p(api, arguments); }; const namespace = ar[1]; api.q = api.q || []; if(typeof namespace === "string"){cal.ns[namespace] = cal.ns[namespace] || api;p(cal.ns[namespace], ar);p(cal, ["initNamespace", namespace]);} else p(cal, ar); return;} p(cal, ar); }; })(window, "https://app.cal.com/embed/embed.js", "init");
Cal("init", "30min", {origin:"https://app.cal.com"});
Cal.ns["30min"]("ui", {"theme":"dark","cssVarsPerTheme":{"light":{"cal-brand":"#292929"},"dark":{"cal-brand":"#2dd4a8"}},"hideEventTypeDetails":false,"layout":"month_view"});`}
        </Script>
      </body>
    </html>
  )
}
