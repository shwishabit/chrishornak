'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { fadeUp, stagger, ease } from '@/lib/animations'
import { guides } from '@/lib/guides'

const published = guides.filter((g) => g.published)
const pages = [published.slice(0, 3), published.slice(3, 6)]

export function SignalPreview() {
  const [page, setPage] = useState(0)

  return (
    <section className="px-6 py-24 md:px-12 md:py-32 lg:px-24">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: '-80px' }}
          variants={stagger}
        >
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.6, ease }}
            className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between"
          >
            <div>
              <p className="text-sm font-medium uppercase tracking-widest text-primary">
                The Signal
              </p>
              <div className="mt-2 h-px w-12 bg-primary/40" />
              <p className="mt-6 max-w-lg text-lg text-muted-foreground">
                Everything I wish someone had told business owners sooner — about findability, AI, trust, and the order that actually matters.
              </p>
            </div>
            <Link
              href="/signal"
              className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-primary transition-colors duration-200 hover:text-primary/80"
            >
              All guides <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </motion.div>

        {/* Card grid — pages between two sets of 3 */}
        <div className="relative mt-12 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              initial={{ opacity: 0, x: page === 0 ? -40 : 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: page === 0 ? 40 : -40 }}
              transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
              className="grid gap-5 md:grid-cols-3"
            >
              {pages[page].map((guide) => (
                <Link
                  key={guide.slug}
                  href={`/signal/${guide.slug}`}
                  className="group flex flex-col rounded-xl border border-border/20 bg-muted/10 p-5 transition-all duration-300 hover:border-primary/25 hover:bg-muted/20 md:p-6"
                >
                  <div className="flex items-baseline gap-3">
                    <span className="font-heading text-xs font-bold tracking-widest text-primary/60">
                      {guide.number}
                    </span>
                    <span className="text-xs text-muted-foreground/60">
                      {guide.role}
                    </span>
                  </div>
                  <h3 className="mt-2 font-heading text-sm font-bold leading-snug transition-colors duration-300 group-hover:text-primary md:text-base">
                    {guide.headline}
                  </h3>
                  <p className="mt-2 flex-1 text-xs leading-relaxed text-muted-foreground md:text-sm">
                    {guide.teaser}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-primary/70 transition-colors duration-200 group-hover:text-primary">
                    Read guide <ArrowRight className="h-3 w-3" />
                  </span>
                </Link>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom controls — indicators + arrows */}
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            onClick={() => setPage(0)}
            disabled={page === 0}
            aria-label="Previous guides"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border/30 text-muted-foreground transition-all duration-200 hover:border-primary/30 hover:text-primary disabled:opacity-25 disabled:pointer-events-none"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            {[0, 1].map((i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                aria-label={`Page ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${page === i ? 'w-6 bg-primary' : 'w-1.5 bg-muted-foreground/20 hover:bg-muted-foreground/40'}`}
              />
            ))}
          </div>
          <button
            onClick={() => setPage(1)}
            disabled={page === 1}
            aria-label="Next guides"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border/30 text-muted-foreground transition-all duration-200 hover:border-primary/30 hover:text-primary disabled:opacity-25 disabled:pointer-events-none"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  )
}
