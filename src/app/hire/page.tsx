import type { Metadata } from 'next'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { Navigation } from '@/components/sections/Navigation'
import { Footer } from '@/components/sections/Footer'
import { BackgroundMesh } from '@/components/sections/BackgroundMesh'
import { HireForm } from '@/components/sections/HireForm'
import { PartnerBadges } from '@/components/sections/PartnerBadges'
import { JsonLd } from '@/components/ui/JsonLd'
import { hireContent, projects, siteConfig, testimonials, toolLinks } from '@/lib/data'

/* ── /hire: for people hiring a contractor ────────────────────────────────
 * Every contract / freelance pitch links here (Chris, 2026-10-14). Concept B
 * "Builds up front": the pitch on the left, three real builds on the right,
 * so the work shows before a word is read. Strategy sits behind the builds.
 * Design gate: https://claude.ai/artifact/CBF1QK4YfbS5T8HXXRhpku
 * ─────────────────────────────────────────────────────────────────────── */

const TITLE = 'Freelance Web Designer, Developer & SEO'
const SHARE_TITLE = 'I design, write and build your site. Then I make sure people find it.'
const DESCRIPTION =
  'Freelance and contract websites: design, copy, build and SEO. A new site with Sanity, or fixes to the one you have. Remote, and I do the work myself.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/hire' },
  // A page's openGraph replaces the layout's whole block, so type / url / siteName are restated here.
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/hire',
    siteName: siteConfig.brandName,
    title: SHARE_TITLE,
    description: DESCRIPTION,
    images: [{ url: '/images/og-hire.png', width: 1200, height: 630, alt: `${SHARE_TITLE} Chris Hornak is taking new contract work.` }],
  },
  twitter: {
    card: 'summary_large_image',
    title: SHARE_TITLE,
    description: DESCRIPTION,
    images: ['/images/og-hire.png'],
  },
}

const builds = hireContent.builds.map((b) => {
  const project = projects.find((p) => p.slug === b.slug)!
  return { ...b, image: project.image, url: project.url }
})

/** What a hirer can hand me, builds first. Pillars borrow SGM's found / understood / trusted, in Chris's voice. */
const JOBS = [
  {
    pillar: 'Be understood',
    title: 'Design and build your site',
    body: 'A new site on my own system with Sanity as your editor, or design and fixes on the one you have: Shopify, WordPress, Webflow or Squarespace. Mobile-first, with one clear next step on every page.',
    link: { href: '/work', label: 'See the builds' },
    partners: true,
  },
  {
    pillar: 'Get found',
    title: 'Get found in search and AI',
    body: 'Technical SEO, structured data, your Google Business Profile and AI visibility, checked before and after. I built the free tools I use to check it.',
    link: { href: '/audit', label: 'Run the Findability Check' },
  },
  {
    pillar: 'Be trusted',
    title: 'Write the words that sell',
    body: 'Page copy, blog posts and case studies in your voice, written with the design, not after it. I’ve run a content company since 2012.',
    link: { href: '/blog', label: 'Read the blog' },
  },
] as const

/** Two quotes about Chris doing the work himself. Verbatim excerpts, 1–2 sentences, about the same length. */
const QUOTES = [
  {
    quote: 'Before working with Chris, we had no online presence. He built our website from scratch.',
    name: 'David Horell',
    company: 'Speranza Consulting and Investments',
  },
  {
    quote: 'He’s a hands-on problem solver who jumps right in when we face technical challenges.',
    name: 'Cheryl Cassidy',
    company: 'Rehab Essentials',
  },
] as const

const FAQS = [
  {
    question: 'Do you do the work yourself?',
    answer: 'Yes. The design, the writing, the build and the SEO are all me. You work with me directly from the first call to the launch.',
  },
  {
    question: 'Can you work on the site we already have?',
    answer: 'Yes. I design and fix sites on Shopify, WordPress, Webflow and Squarespace, and I’m in both the Shopify Partner Program and Squarespace Circle, Squarespace’s partner program. If a new build makes more sense, I’ll tell you why.',
  },
  {
    question: 'What does a new build run on?',
    answer: 'My own system, built to be fast and easy to find, with Sanity as the editor. You change your words and photos yourself, with none of the limits of a template builder.',
  },
  {
    question: 'Why are there no prices on this page?',
    answer: 'Every job is different. Send the role and a budget range, and I’ll tell you straight away if it’s a fit.',
  },
] as const

const testimonialImage = (name: string) => testimonials.find((t) => t.name === name)?.image

export default function HirePage() {
  return (
    <main id="main-content" className="relative min-h-screen overflow-x-hidden">
      <BackgroundMesh />
      <Navigation />

      {/* Hero: pitch left, three real builds stacked right */}
      <header className="relative px-6 pt-32 pb-16 md:px-12 md:pt-44 md:pb-24 lg:px-24">
        <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-16">
          <div className="min-w-0">
            {/* Who they'd hire: face + name before the headline (Chris, 2026-10-14) */}
            <div className="flex items-center gap-4">
              <Image
                src="/images/chris-hornak-headshot.jpg"
                alt="Chris Hornak"
                width={80}
                height={80}
                priority
                className="h-16 w-16 shrink-0 rounded-full object-cover ring-2 ring-primary-line md:h-20 md:w-20"
              />
              <div className="grid justify-items-start gap-1.5">
                <p className="font-heading text-lg leading-none font-bold">Chris Hornak</p>
            <p
              className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium ${
                hireContent.available
                  ? 'border-primary-line bg-primary-deep text-primary'
                  : 'border-border bg-muted text-muted-foreground'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${hireContent.available ? 'bg-primary' : 'bg-muted-foreground'}`}
                aria-hidden="true"
              />
              {hireContent.available ? hireContent.availableText : hireContent.bookedText}
            </p>
              </div>
            </div>
            <h1 className="mt-6 max-w-[18ch] font-heading text-4xl leading-[1.08] font-bold tracking-tight text-balance md:text-6xl lg:text-[56px]">
              {hireContent.headline}{' '}
              <span className="text-primary">{hireContent.headlineAccent}</span>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-muted-foreground md:text-xl">
              {hireContent.subheadline}
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-4">
              <a
                href="#role"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-shadow duration-300 hover:shadow-xl hover:shadow-primary/30"
              >
                {hireContent.ctaText} <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
              <a
                href="/work"
                className="text-sm font-semibold text-primary underline-offset-[3px] hover:underline"
              >
                See the work <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>

          {/* Three builds, fanned. Decorative glow behind. */}
          <div className="relative min-w-0">
            <span
              className="pointer-events-none absolute -inset-10 rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--color-primary)_16%,transparent),transparent_65%)]"
              aria-hidden="true"
            />
            <ul className="relative m-0 aspect-[1/1.02] list-none p-0" aria-label="Three sites I built">
              {builds.map((b, i) => (
                <li
                  key={b.slug}
                  className={`absolute w-[80%] ${
                    ['top-0 left-0', 'top-[27%] left-[18%]', 'top-[54%] left-[6%]'][i]
                  }`}
                >
                  <a
                    href={b.url}
                    target="_blank"
                    rel="noopener"
                    className="group block overflow-hidden rounded-xl border border-border bg-panel shadow-xl shadow-black/30 transition-transform duration-300 hover:-translate-y-1 focus-visible:-translate-y-1"
                  >
                    {/* Label on top, like a browser bar, so the next card never covers it */}
                    <span className="flex items-baseline gap-2 border-b border-border px-3.5 py-2 text-[13px]">
                      <span className="h-2 w-2 shrink-0 self-center rounded-full bg-primary/60" aria-hidden="true" />
                      <span className="truncate font-semibold text-foreground">{b.caption}</span>
                      <span className="ml-auto shrink-0 text-muted-foreground">{b.detail}</span>
                    </span>
                    <span className="relative block aspect-[16/10]">
                      <Image
                        src={b.image}
                        alt={`${b.caption} homepage`}
                        fill
                        sizes="(max-width: 1024px) 80vw, 420px"
                        priority={i === 0}
                        className="object-cover object-top"
                      />
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </header>

      {/* What I take on: builds first, strategy behind */}
      <section aria-labelledby="hire-jobs" className="relative px-6 pb-24 md:px-12 lg:px-24">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-medium tracking-widest text-primary uppercase">What I take on</p>
          <span className="mt-2 block h-px w-12 bg-primary/40" aria-hidden="true" />
          <h2 id="hire-jobs" className="mt-8 max-w-2xl font-heading text-3xl font-bold tracking-tight text-balance md:text-4xl">
            One person for the design, the words, the build and the search.
          </h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Every job starts with the same question: who is this for, and what should they do next? Then I do the work.
          </p>
          <ul className="m-0 mt-12 grid list-none gap-5 p-0 md:grid-cols-3">
            {JOBS.map((j) => (
              <li key={j.title} className="grid content-start gap-3 rounded-xl border border-border bg-panel p-6">
                <span className="font-code text-xs tracking-[.1em] text-primary uppercase">{j.pillar}</span>
                <h3 className="font-heading text-xl leading-tight font-bold text-balance">{j.title}</h3>
                <p className="text-[15px] leading-relaxed text-body-soft">{j.body}</p>
                {'partners' in j && <PartnerBadges className="my-1" />}
                <a href={j.link.href} className="mt-1 text-sm font-semibold text-primary underline-offset-[3px] hover:underline">
                  {j.link.label} <span aria-hidden="true">→</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Proof: what clients say, and tools I built */}
      <section aria-labelledby="hire-proof" className="relative bg-muted/30 px-6 py-24 md:px-12 lg:px-24">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-medium tracking-widest text-primary uppercase">Proof</p>
          <span className="mt-2 block h-px w-12 bg-primary/40" aria-hidden="true" />
          <h2 id="hire-proof" className="mt-8 font-heading text-3xl font-bold tracking-tight md:text-4xl">
            In their words
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {QUOTES.map((q) => {
              const img = testimonialImage(q.name)
              return (
                <figure key={q.name} className="m-0 grid content-between gap-6 rounded-xl border border-border bg-background p-6 md:p-8">
                  <blockquote className="m-0 font-heading text-lg leading-snug font-semibold md:text-xl">“{q.quote}”</blockquote>
                  <figcaption className="flex items-center gap-3">
                    {img && <Image src={img} alt={q.name} width={44} height={44} className="h-11 w-11 rounded-full object-cover" />}
                    <span className="text-sm">
                      <span className="block font-semibold text-foreground">{q.name}</span>
                      <span className="text-muted-foreground">{q.company}</span>
                    </span>
                  </figcaption>
                </figure>
              )
            })}
          </div>

          <h3 className="mt-16 font-heading text-2xl font-bold tracking-tight">I built these, and they’re free</h3>
          <ul className="m-0 mt-6 grid list-none gap-4 p-0 md:grid-cols-3">
            {toolLinks.map((t) => (
              <li key={t.href} className="grid">
                <a
                  href={t.href}
                  className="group grid content-start gap-1.5 rounded-xl border border-border bg-background p-5 transition-colors hover:border-primary focus-visible:border-primary"
                >
                  <span className="font-semibold text-foreground">{t.label}</span>
                  <span className="text-sm text-muted-foreground">{t.question}</span>
                  <span className="mt-1 text-sm font-semibold text-primary group-hover:underline group-hover:underline-offset-[3px]">
                    Try it <span aria-hidden="true">→</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* The main ask: the role form. Cal is the small second link inside it. */}
      <section id="role" aria-labelledby="hire-role-h" className="relative scroll-mt-28 px-6 py-24 md:px-12 lg:px-24">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
          <div className="min-w-0">
            <p className="text-sm font-medium tracking-widest text-primary uppercase">Send the role</p>
            <span className="mt-2 block h-px w-12 bg-primary/40" aria-hidden="true" />
            <h2 id="hire-role-h" className="mt-8 font-heading text-3xl font-bold tracking-tight text-balance md:text-4xl">
              Tell me about the role.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              Paste the job, add a link to the listing if there is one, and pick a budget range. I’ll tell you straight away
              if it’s a fit.
            </p>
          </div>
          <div className="min-w-0">
            <HireForm />
          </div>
        </div>
      </section>

      {/* Questions hirers ask */}
      <section aria-labelledby="hire-faq" className="relative px-6 pb-28 md:px-12 lg:px-24">
        <div className="mx-auto max-w-3xl">
          <h2 id="hire-faq" className="font-heading text-2xl font-bold tracking-tight md:text-3xl">
            Before you send it
          </h2>
          <dl className="m-0 mt-8 grid gap-7">
            {FAQS.map((f) => (
              <div key={f.question}>
                <dt className="font-heading text-lg font-semibold">{f.question}</dt>
                <dd className="m-0 mt-1.5 leading-relaxed text-muted-foreground">{f.answer}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <Footer />

      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: siteConfig.domain },
            { '@type': 'ListItem', position: 2, name: 'Hire me', item: `${siteConfig.domain}/hire` },
          ],
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: FAQS.map((f) => ({
            '@type': 'Question',
            name: f.question,
            acceptedAnswer: { '@type': 'Answer', text: f.answer },
          })),
        }}
      />
    </main>
  )
}
