'use client'

import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { heroContent } from '@/lib/data'
import { fadeUp, stagger, ease } from '@/lib/animations'

export function Hero() {
  return (
    <motion.section
      variants={stagger}
      initial="initial"
      animate="animate"
      className="relative flex min-h-[85vh] flex-col justify-center px-6 pt-28 md:min-h-screen md:pt-24 md:px-12 lg:px-24"
    >
      <div className="relative mx-auto w-full max-w-5xl">
        {/* H1 — asymmetric, left-aligned */}
        <motion.h1
          variants={fadeUp}
          transition={{ duration: 0.7, ease }}
          className="max-w-3xl font-heading text-4xl leading-[1.1] font-bold tracking-tight md:text-6xl lg:text-7xl"
        >
          {heroContent.headline}
          <br />
          {/* Wrapper for teal line + dot alignment */}
          <span className="relative inline-block">
            <span className="text-primary">{heroContent.headlineAccent}</span>

            {/* Teal dot motif — right of the accent line on desktop */}
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, delay: 0.4, ease }}
              className="pointer-events-none absolute -right-36 top-1/2 hidden -translate-y-1/2 lg:-right-44 md:block"
              aria-hidden
            >
              <span className="relative block">
                <span className="absolute -inset-16 rounded-full bg-primary/5 blur-2xl" />
                <span className="absolute -inset-8 rounded-full bg-primary/8 blur-xl" />
                <span className="relative block h-28 w-28 rounded-full bg-primary/25 lg:h-36 lg:w-36" />
                <span className="absolute inset-3 rounded-full bg-primary/40 lg:inset-4" />
                <span className="absolute inset-8 rounded-full bg-primary lg:inset-10" />
              </span>

              {/* Orbiting smaller dots */}
              <span className="absolute -top-12 -right-6 h-3 w-3 rounded-full bg-primary/50" />
              <span className="absolute -bottom-8 -left-10 h-2 w-2 rounded-full bg-primary/30" />
              <span className="absolute top-4 -left-16 h-1.5 w-1.5 rounded-full bg-primary/20" />
              <span className="absolute -right-14 bottom-6 h-2.5 w-2.5 rounded-full bg-primary/40" />
              <span className="absolute -bottom-16 right-8 h-1.5 w-1.5 rounded-full bg-primary/15" />
            </motion.span>
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          variants={fadeUp}
          transition={{ duration: 0.7, ease }}
          className="mt-8 max-w-xl text-lg leading-relaxed text-muted-foreground md:text-xl"
        >
          {heroContent.subheadline}
        </motion.p>

        {/* CTA */}
        <motion.div
          variants={fadeUp}
          transition={{ duration: 0.7, ease }}
          className="mt-10 flex flex-wrap items-center gap-5"
        >
          <motion.a
            href="/#connect"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-shadow duration-300 hover:shadow-xl hover:shadow-primary/30"
          >
            {heroContent.ctaText} <ArrowRight className="h-4 w-4" />
          </motion.a>
          <a
            href="/audit"
            className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-6 py-3 text-sm font-semibold text-primary transition-colors duration-200 hover:bg-primary/20"
          >
            Check your findability <ArrowRight className="h-4 w-4" />
          </a>
        </motion.div>
      </div>
    </motion.section>
  )
}
