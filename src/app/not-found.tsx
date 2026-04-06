'use client'

import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1]

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      {/* Animated teal dot — the brand motif, lost and bouncing */}
      <motion.div
        className="relative mb-8"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease }}
      >
        <motion.div
          className="h-20 w-20 rounded-full bg-primary/25"
          animate={{ y: [0, -16, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="absolute inset-3 rounded-full bg-primary/40" />
          <div className="absolute inset-6 rounded-full bg-primary" />
        </motion.div>
        {/* Shadow */}
        <motion.div
          className="mx-auto mt-3 h-2 w-12 rounded-full bg-primary/10 blur-sm"
          animate={{ scaleX: [1, 0.7, 1], opacity: [0.3, 0.15, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="text-sm font-semibold uppercase tracking-widest text-primary"
      >
        404
      </motion.p>

      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3, ease }}
        className="mt-4 font-heading text-3xl font-bold tracking-tight md:text-5xl"
      >
        Nothing here.
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4, ease }}
        className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground md:text-lg"
      >
        Let&apos;s get you somewhere useful.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5, ease }}
        className="mt-8 flex flex-wrap items-center justify-center gap-4"
      >
        <a
          href="/"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-shadow duration-300 hover:shadow-xl hover:shadow-primary/30"
        >
          Back to home <ArrowRight className="h-4 w-4" />
        </a>
        <a
          href="/audit"
          className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-6 py-3 text-sm font-semibold text-primary transition-colors duration-200 hover:bg-primary/20"
        >
          Check your findability
        </a>
      </motion.div>
    </main>
  )
}
