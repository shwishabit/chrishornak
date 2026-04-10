'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, ChevronRight } from 'lucide-react'
import { fadeUp, stagger, ease } from '@/lib/animations'
import type { Guide } from '@/lib/guides'

interface GuideLayoutProps {
  guide: Guide
  prev: Guide | null
  next: Guide | null
  toc: { id: string; label: string }[]
  heroVisual?: React.ReactNode
  children: React.ReactNode
}

export function GuideLayout({ guide, prev, next, toc, heroVisual, children }: GuideLayoutProps) {
  const formattedDate = guide.dateModified
    ? new Date(guide.dateModified + 'T00:00:00').toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  return (
    <>
      {/* Breadcrumbs */}
      <div className="px-6 pt-28 md:px-12 md:pt-32 lg:px-24">
        <nav aria-label="Breadcrumb" className="mx-auto max-w-3xl">
          <ol className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
            <li>
              <Link href="/" className="transition-colors hover:text-foreground">Home</Link>
            </li>
            <li><ChevronRight className="h-3 w-3" /></li>
            <li>
              <Link href="/signal" className="transition-colors hover:text-foreground">Be The Signal</Link>
            </li>
            <li><ChevronRight className="h-3 w-3" /></li>
            <li className="text-foreground/80 truncate max-w-[200px] md:max-w-none">
              Guide {guide.number}
            </li>
          </ol>
        </nav>
      </div>

      {/* Guide Hero */}
      <motion.section
        variants={stagger}
        initial="initial"
        animate="animate"
        className="px-6 pt-12 pb-8 md:px-12 md:pt-16 md:pb-12 lg:px-24"
      >
        <div className="mx-auto max-w-3xl">
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.6, ease }}
            className="flex items-center gap-4"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <span className="h-3 w-3 rounded-full bg-primary" />
            </span>
            <div className="flex items-baseline gap-3">
              <span className="font-heading text-xs font-bold tracking-widest text-primary">
                GUIDE {guide.number}
              </span>
              <span className="text-xs text-muted-foreground/60">{guide.role}</span>
            </div>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            transition={{ duration: 0.7, ease }}
            className="guide-definition mt-8 font-heading text-3xl leading-[1.15] font-bold tracking-tight md:text-5xl lg:text-[3.25rem]"
          >
            {guide.headline}
          </motion.h1>

          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.7, ease }}
            className="guide-summary mt-6 text-lg leading-relaxed text-muted-foreground md:text-xl"
          >
            {guide.teaser}
          </motion.p>

          {/* Meta line: author + date */}
          {formattedDate && (
            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.6, ease }}
              className="mt-6 flex items-center gap-3 text-xs text-muted-foreground/60"
            >
              <span>By Chris Hornak</span>
              <span>&middot;</span>
              <time dateTime={guide.dateModified}>Last updated {formattedDate}</time>
            </motion.div>
          )}
        </div>
      </motion.section>

      {/* Featured Image */}
      {heroVisual && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease }}
          className="px-6 pb-12 md:px-12 md:pb-16 lg:px-24"
        >
          <div className="mx-auto max-w-3xl">
            {heroVisual}
          </div>
        </motion.section>
      )}

      {/* Table of Contents */}
      {toc.length > 0 && (
        <section className="px-6 pb-12 md:px-12 md:pb-16 lg:px-24">
          <div className="mx-auto max-w-3xl">
            <div className="rounded-xl border border-border/20 bg-muted/10 px-6 py-5 md:px-8">
              <p className="font-heading text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
                In this guide
              </p>
              <nav className="mt-3 space-y-1.5">
                {toc.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="block text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>
          </div>
        </section>
      )}

      {/* Reading line */}
      <div className="px-6 md:px-12 lg:px-24">
        <div className="mx-auto max-w-3xl">
          <div className="h-px bg-gradient-to-r from-primary/30 via-primary/10 to-transparent" />
        </div>
      </div>

      {/* Guide Content */}
      <section className="px-6 pt-12 pb-8 md:px-12 md:pt-16 md:pb-12 lg:px-24">
        <div className="guide-prose mx-auto max-w-3xl">
          {children}
        </div>
      </section>

      {/* FAQ Section */}
      {guide.faq.length > 0 && (
        <section className="px-6 pb-20 md:px-12 md:pb-28 lg:px-24">
          <div className="mx-auto max-w-3xl">
            <h2 className="font-heading text-2xl font-bold tracking-tight md:text-3xl">
              Frequently asked questions
            </h2>
            <div className="mt-8 space-y-6">
              {guide.faq.map((item) => (
                <div key={item.question}>
                  <h3 className="font-heading text-base font-bold text-foreground md:text-lg">
                    {item.question}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-base">
                    {item.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Prev / Next Navigation */}
      <section className="border-t border-border/20 px-6 py-16 md:px-12 md:py-20 lg:px-24">
        <div className="mx-auto max-w-3xl">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-stretch sm:justify-between">
            {prev ? (
              <GuideNavCard direction="prev" guide={prev} />
            ) : (
              <div />
            )}
            {next ? (
              <GuideNavCard direction="next" guide={next} />
            ) : (
              <Link
                href="/signal"
                className="group flex items-center gap-2 rounded-xl border border-border/20 bg-muted/10 px-6 py-5 text-sm font-semibold transition-all duration-300 hover:border-primary/25 hover:bg-muted/20 sm:ml-auto sm:text-right"
              >
                Back to Be The Signal
                <ArrowRight className="h-4 w-4 text-primary transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            )}
          </div>
        </div>
      </section>
    </>
  )
}

function GuideNavCard({ direction, guide }: { direction: 'prev' | 'next'; guide: Guide }) {
  const isPrev = direction === 'prev'
  const href = guide.published ? `/signal/${guide.slug}` : '/signal'

  return (
    <Link
      href={href}
      className={`group flex flex-1 items-start gap-4 rounded-xl border border-border/20 bg-muted/10 px-6 py-5 transition-all duration-300 hover:border-primary/25 hover:bg-muted/20 ${isPrev ? '' : 'sm:text-right sm:flex-row-reverse'}`}
    >
      {isPrev ? (
        <ArrowLeft className="mt-0.5 h-4 w-4 shrink-0 text-primary transition-transform duration-300 group-hover:-translate-x-1" />
      ) : (
        <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-primary transition-transform duration-300 group-hover:translate-x-1" />
      )}
      <div>
        <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/60">
          {isPrev ? 'Previous' : 'Next'} &middot; Guide {guide.number}
        </p>
        <p className="mt-1 text-sm font-semibold leading-snug">{guide.headline}</p>
        {!guide.published && (
          <p className="mt-1 text-[10px] text-primary/60">Coming soon</p>
        )}
      </div>
    </Link>
  )
}
