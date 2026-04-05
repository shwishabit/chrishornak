'use client'

import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { fadeUp, stagger, ease } from '@/lib/animations'

export function Ventures() {
  return (
    <section className="bg-muted/30 px-6 py-24 md:px-12 md:py-32 lg:px-24">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: '-80px' }}
          variants={stagger}
        >
          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.6, ease }}
            className="text-sm font-medium uppercase tracking-widest text-primary"
          >
            How I work
          </motion.p>
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.6, ease }}
            className="mt-2 h-px w-12 bg-primary/40"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease }}
          className="mt-14 max-w-2xl"
        >
          <p className="text-lg leading-relaxed text-muted-foreground">
            Every project starts with a conversation. Depending on what you need, I work hands-on or bring in the right team through{' '}
            <a
              href="https://bloghands.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground underline decoration-primary/30 underline-offset-4 transition-colors duration-200 hover:text-primary"
            >
              Blog Hands
            </a>{' '}
            and{' '}
            <a
              href="https://swiftgrowthmarketing.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground underline decoration-primary/30 underline-offset-4 transition-colors duration-200 hover:text-primary"
            >
              Swift Growth Marketing
            </a>
            . Either way, I stay involved.
          </p>
        </motion.div>

        {/* Findability CTA — primary action */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, ease }}
          className="mt-12 rounded-xl border border-border/30 bg-muted/15 px-6 py-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Not sure where to start?</span>{' '}
            Check your findability — it&apos;s the first step of my diagnostic.
          </p>
          <a
            href="/audit"
            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-5 py-2.5 text-sm font-semibold text-primary transition-colors duration-200 hover:bg-primary/20"
          >
            Check your findability <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </motion.div>
      </div>
    </section>
  )
}
