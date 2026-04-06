'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { testimonials } from '@/lib/data'
import { fadeUp, stagger, ease } from '@/lib/animations'

const clients = [
  { name: 'Hilton', logo: '/images/logos/hilton-international-logo.png', size: 'default' as const },
  { name: 'Giant Eagle', logo: '/images/logos/Giant_Eagle_logo.svg.png', size: 'default' as const },
  { name: 'University of Montana', logo: '/images/logos/UMT Logo.png', size: 'large' as const },
  { name: 'CellOnes', logo: '/images/logos/cellones.png', size: 'default' as const, noInvert: true },
]

const sizeClasses = {
  default: 'max-h-[42px] md:max-h-[50px]',
  large: 'max-h-[50px] md:max-h-[59px]',
}

import { guides as guideData } from '@/lib/guides'
import { FindabilityDiagram } from '@/components/guides/FindabilityDiagram'
import { SearchVisibilityDiagram } from '@/components/guides/SearchVisibilityDiagram'
import { AiReadinessDiagram } from '@/components/guides/AiReadinessDiagram'
import { WebsiteTrustDiagram } from '@/components/guides/WebsiteTrustDiagram'
import { ContentStructureDiagram } from '@/components/guides/ContentStructureDiagram'
import { StrategyFirstDiagram } from '@/components/guides/StrategyFirstDiagram'

const diagramMap: Record<string, React.ComponentType> = {
  findability: FindabilityDiagram,
  'search-visibility': SearchVisibilityDiagram,
  'ai-readiness': AiReadinessDiagram,
  'website-trust': WebsiteTrustDiagram,
  'content-structure': ContentStructureDiagram,
  'strategy-first': StrategyFirstDiagram,
}

const guides = guideData.map((g) => ({
  number: g.number,
  headline: g.headline,
  teaser: g.teaser,
  slug: `/signal/${g.slug}`,
  rawSlug: g.slug,
  role: g.role,
  published: g.published,
}))

export function SignalPageClient() {
  return (
    <>
      {/* Compact Hero */}
      <motion.section
        variants={stagger}
        initial="initial"
        animate="animate"
        className="px-6 pt-32 pb-12 md:px-12 md:pt-36 md:pb-16 lg:px-24"
      >
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <motion.p
                variants={fadeUp}
                transition={{ duration: 0.6, ease }}
                className="text-sm font-medium uppercase tracking-widest text-primary"
              >
                The Signal
              </motion.p>
              <motion.h1
                variants={fadeUp}
                transition={{ duration: 0.7, ease }}
                className="mt-4 font-heading text-3xl leading-[1.15] font-bold tracking-tight md:text-4xl lg:text-5xl"
              >
                Your signal is either working for you or against you
              </motion.h1>
              <motion.p
                variants={fadeUp}
                transition={{ duration: 0.7, ease }}
                className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg"
              >
                What determines whether customers find you, trust you, and choose you — and what most businesses get wrong.
              </motion.p>
            </div>
            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.7, ease }}
              className="shrink-0"
            >
              <a
                href="/audit"
                className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-6 py-3 text-sm font-semibold text-primary transition-colors duration-200 hover:bg-primary/20"
              >
                Measure your signal <ArrowRight className="h-4 w-4" />
              </a>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Guide Grid — 2 columns × 3 rows */}
      <section className="px-6 pb-24 md:px-12 md:pb-32 lg:px-24">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-6 md:grid-cols-2">
            {guides.map((guide, i) => {
              const Diagram = diagramMap[guide.rawSlug]

              return (
                <motion.div
                  key={guide.slug}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.5, delay: i * 0.06, ease }}
                  className="group"
                >
                  {guide.published ? (
                    <Link
                      href={guide.slug}
                      className="flex h-full flex-col overflow-hidden rounded-xl border border-border/20 bg-muted/10 transition-all duration-300 hover:border-primary/25 hover:bg-muted/20"
                    >
                      {Diagram && (
                        <div className="pointer-events-none">
                          <Diagram />
                        </div>
                      )}
                      <div className="flex flex-1 flex-col p-5 md:p-6">
                        <div className="flex items-baseline gap-3">
                          <span className="font-heading text-xs font-bold tracking-widest text-primary/60">
                            {guide.number}
                          </span>
                          <span className="text-xs text-muted-foreground/60">
                            {guide.role}
                          </span>
                          <span className="ml-auto inline-flex items-center gap-1.5 text-xs font-medium text-primary/80 transition-colors duration-200 group-hover:text-primary">
                            Read <ArrowRight className="h-3 w-3" />
                          </span>
                        </div>
                        <h2 className="mt-2 font-heading text-base font-bold leading-snug transition-colors duration-300 group-hover:text-primary md:text-lg">
                          {guide.headline}
                        </h2>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                          {guide.teaser}
                        </p>
                      </div>
                    </Link>
                  ) : (
                    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border/20 bg-muted/10 transition-all duration-300 hover:border-primary/25 hover:bg-muted/20">
                      <div className="flex flex-1 flex-col p-5 md:p-6">
                        <div className="flex items-baseline gap-3">
                          <span className="font-heading text-xs font-bold tracking-widest text-primary/60">
                            {guide.number}
                          </span>
                          <span className="text-xs text-muted-foreground/60">
                            {guide.role}
                          </span>
                          <span className="ml-auto rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 text-[10px] font-medium tracking-wide text-primary/70">
                            Coming soon
                          </span>
                        </div>
                        <h2 className="mt-2 font-heading text-base font-bold leading-snug md:text-lg">
                          {guide.headline}
                        </h2>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                          {guide.teaser}
                        </p>
                      </div>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="px-6 pb-24 md:px-12 md:pb-32 lg:px-24">
        <div className="mx-auto max-w-5xl">
          {/* Client logos */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease }}
            className="flex flex-wrap items-center justify-center gap-10 md:gap-14"
          >
            {clients.map((client) => (
              <div
                key={client.name}
                className={`flex h-12 items-center justify-center transition-all duration-300 ${client.noInvert ? 'opacity-30 grayscale' : 'opacity-30 brightness-0 invert grayscale'}`}
              >
                <Image
                  src={client.logo}
                  alt={client.name}
                  width={100}
                  height={50}
                  className={`w-auto max-w-full object-contain ${sizeClasses[client.size]}`}
                  sizes="100px"
                />
              </div>
            ))}
          </motion.div>

          {/* Single testimonial */}
          <motion.figure
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease }}
            className="mx-auto mt-14 max-w-2xl border-l-2 border-primary/30 pl-5"
          >
            <blockquote className="text-base leading-relaxed text-muted-foreground italic">
              &ldquo;{testimonials[3].quote}&rdquo;
            </blockquote>
            <figcaption className="mt-4 text-sm">
              <span className="font-semibold text-foreground">{testimonials[3].name}</span>
              <span className="text-muted-foreground/80">
                {' '}&middot; {testimonials[3].title}, {testimonials[3].company}
              </span>
            </figcaption>
          </motion.figure>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="border-t border-border/20 px-6 py-24 md:px-12 md:py-32 lg:px-24">
        <div className="mx-auto max-w-3xl text-center">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease }}
            className="font-heading text-3xl font-bold tracking-tight text-primary md:text-4xl"
          >
            Be the signal.
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15, ease }}
            className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg"
          >
            Not sure where to start? The Findability Check measures all six signals in under a minute. Start with your score, then read the guide that matters most.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2, ease }}
            className="mt-8 flex flex-wrap items-center justify-center gap-5"
          >
            <a
              href="/audit"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-shadow duration-300 hover:shadow-xl hover:shadow-primary/30"
            >
              Check your signal <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="/#connect"
              className="text-sm font-semibold text-muted-foreground transition-colors duration-200 hover:text-foreground"
            >
              Or let&apos;s talk about it&nbsp;&rarr;
            </a>
          </motion.div>
        </div>
      </section>
    </>
  )
}
