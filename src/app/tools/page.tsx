import type { Metadata } from 'next'
import { Navigation } from '@/components/sections/Navigation'
import { Footer } from '@/components/sections/Footer'
import { JsonLd } from '@/components/ui/JsonLd'
import { siteConfig, toolEnding, toolLinks } from '@/lib/data'

/* ── /tools: the three free checks as one story ───────────────────────────
 * Found → Seen → Chosen, then a person (Chris, 2026-10-01). Same grid hero as
 * the tool pages. Each card says what you get, in the tool's own numbers.
 * ─────────────────────────────────────────────────────────────────────── */

const TITLE = 'Found, seen, chosen: three free website checks'
const DESCRIPTION =
  'Three free website checks that help small businesses: can you be found, what people see when they find you, and how you stack up against rivals.'

const QUESTIONS = [
  {
    q: 'Which check should I run first?',
    a: 'Start with the Findability Check. If search engines and AI can’t read your site, the other two matter less. Then check how your most important page looks when someone finds it. Then compare yourself to the business you lose work to.',
  },
  {
    q: 'Do I need to sign up?',
    a: 'No. There’s no account and no email. Each check reads the public page you give it.',
  },
  {
    q: 'What happens to the sites I check?',
    a: 'I keep a simple log of which sites were checked and how they did, so I can improve the tools. No names, no emails.',
  },
]

const YOU_GET: Record<(typeof toolLinks)[number]['href'], string> = {
  '/audit': 'A score out of 100 across 7 signals, with what to fix first.',
  '/og-image-checker': '8 checks, plus your link drawn in Facebook, LinkedIn, X, a text and Google.',
  '/authority-check': 'A report card out of 100 for your site, or you and up to 3 rivals ranked, with your first 3 fixes.',
}

export const metadata: Metadata = {
  title: 'Free Website Checks for Small Businesses',
  description: DESCRIPTION,
  alternates: { canonical: '/tools' },
  openGraph: {
    type: 'website',
    url: `${siteConfig.domain}/tools`,
    siteName: siteConfig.brandName,
    title: TITLE,
    description: DESCRIPTION,
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
    title: TITLE,
    description: DESCRIPTION,
    images: ['/images/og-image.png'],
  },
}

export default function ToolsPage() {
  return (
    <>
      <Navigation />
      <main id="main-content" className="relative min-h-screen overflow-x-hidden">
        <section
          className="border-b border-border bg-[linear-gradient(var(--color-grid)_1px,transparent_1px),linear-gradient(90deg,var(--color-grid)_1px,transparent_1px)] bg-[size:24px_24px] bg-[position:-1px_-1px]"
          aria-labelledby="tools-h1"
        >
          <div className="mx-auto max-w-[1200px] px-4 pt-32 pb-10 sm:px-6 md:pt-40 lg:pb-14">
            <p className="mb-[18px] font-code text-xs tracking-[.12em] text-primary uppercase">Free tools · No sign-up</p>
            <h1
              id="tools-h1"
              className="mb-5 max-w-[18ch] font-heading text-[clamp(34px,5vw,60px)] leading-[1.05] font-bold tracking-[-.025em] text-balance"
            >
              Found, seen, chosen.{' '}
              <span className="font-semibold text-muted-foreground">Three free checks for your website.</span>
            </h1>
            <p className="max-w-[58ch] text-base text-body-soft sm:text-lg">
              Someone needs what you do. They search, they see your link, and they compare you to the next
              business. Each check covers one of those moments. Run them in order.
            </p>
          </div>
        </section>

        <section aria-label="The three checks" className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6">
          <ol className="m-0 grid list-none gap-4 p-0 md:grid-cols-3">
            {toolLinks.map((t, i) => (
              <li key={t.href} className="grid">
                <a
                  href={t.href}
                  className="group grid content-start gap-2.5 rounded-xl border border-line-strong bg-panel p-6 no-underline transition-colors hover:border-primary focus-visible:border-primary"
                >
                  <span className="font-code text-xs tracking-[.1em] text-primary uppercase">
                    Step {i + 1} · {t.step}
                  </span>
                  <h2 className="m-0 font-heading text-xl leading-tight font-bold text-foreground text-balance">
                    {t.question}
                  </h2>
                  <p className="m-0 text-[15px] text-body-soft">{t.summary}</p>
                  <p className="m-0 text-sm text-muted-foreground">
                    <b className="font-semibold text-foreground">You get:</b> {YOU_GET[t.href]}
                  </p>
                  <span className="mt-1 text-sm font-semibold text-primary group-hover:underline group-hover:underline-offset-[3px]">
                    Open the {t.label}&nbsp;<span aria-hidden="true">→</span>
                  </span>
                </a>
              </li>
            ))}
          </ol>

          <aside
            aria-labelledby="tools-next"
            className="mt-4 grid items-center gap-x-10 gap-y-4 rounded-xl border border-primary-line bg-primary-deep p-6 md:grid-cols-[minmax(0,1fr)_auto]"
          >
            <div>
              <p className="m-0 mb-1.5 font-code text-xs tracking-[.1em] text-primary uppercase">Step 4 · You and me</p>
              <h2 id="tools-next" className="m-0 mb-1.5 font-heading text-[22px] font-bold">
                {toolEnding.heading}
              </h2>
              <p className="m-0 max-w-[60ch] text-body-soft">
                Bring your results. We look at them together and pick the one move that matters most.
              </p>
            </div>
            <a
              href="/#connect"
              className="justify-self-start rounded-full bg-primary px-[22px] py-[13px] font-heading font-semibold whitespace-nowrap text-primary-foreground no-underline"
            >
              Let&apos;s talk
            </a>
          </aside>

          <section aria-labelledby="tools-qs" className="mt-12 max-w-[68ch]">
            <h2 id="tools-qs" className="m-0 mb-4 font-heading text-[22px] font-bold">
              Before you start
            </h2>
            <dl className="m-0 grid gap-5">
              {QUESTIONS.map((x) => (
                <div key={x.q}>
                  <dt className="font-heading text-base font-semibold">{x.q}</dt>
                  <dd className="m-0 mt-1 text-[15px] text-body-soft">
                    {x.a}
                    {x.q.startsWith('What happens') && (
                      <>
                        {' '}
                        <a href="/privacy" className="font-semibold text-foreground underline underline-offset-[3px] hover:text-primary">
                          The privacy page has the details
                        </a>
                        .
                      </>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <p className="mt-10 text-sm text-muted-foreground">
            Want the why behind each check?{' '}
            <a href="/signal" className="font-semibold text-foreground underline underline-offset-[3px] hover:text-primary">
              Read the Be The Signal guides
            </a>
            .
          </p>
        </section>

        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: siteConfig.domain },
              { '@type': 'ListItem', position: 2, name: 'Free tools', item: `${siteConfig.domain}/tools` },
            ],
          }}
        />
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: 'Free website checks',
            description: DESCRIPTION,
            itemListOrder: 'https://schema.org/ItemListOrderAscending',
            itemListElement: toolLinks.map((t, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              name: t.label,
              url: `${siteConfig.domain}${t.href}`,
            })),
          }}
        />
      </main>
      <Footer />
    </>
  )
}
