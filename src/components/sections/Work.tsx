'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { ClientLogos } from '@/components/sections/ClientLogos'
import { Testimonials } from '@/components/sections/Testimonials'
import { fadeUp, stagger, ease } from '@/lib/animations'

function GrowthLine() {
  return (
    <svg
      viewBox="0 0 1000 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="pointer-events-none absolute inset-0 h-full w-full"
      preserveAspectRatio="none"
      aria-hidden
    >
      <path
        d="M0 180 C200 170, 300 140, 400 120 C500 100, 550 90, 650 60 C750 35, 850 20, 1000 10"
        stroke="#2dd4a8"
        strokeOpacity="0.08"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M0 180 C200 170, 300 140, 400 120 C500 100, 550 90, 650 60 C750 35, 850 20, 1000 10 L1000 200 L0 200 Z"
        fill="url(#growthGradient)"
      />
      <defs>
        <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2dd4a8" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#2dd4a8" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export function Work() {
  return (
    <section id="work" className="relative px-6 py-24 md:px-12 md:py-32 lg:px-24">
      <GrowthLine />

      <div className="relative mx-auto max-w-5xl">
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
            Businesses I&apos;ve worked with
          </motion.p>
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.6, ease }}
            className="mt-2 h-px w-12 bg-primary/40"
          />
        </motion.div>

        {/* Client logos — greyscaled */}
        <ClientLogos className="mt-14 border-b border-border/50 pb-14" />

        {/* Testimonials — two columns */}
        <Testimonials className="mt-14" />

        {/* Teaser → full portfolio */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, ease }}
          className="mt-14 flex flex-col items-center gap-4 border-t border-border/50 pt-12 text-center"
        >
          <p className="max-w-md text-base text-muted-foreground">
            I build the work too — software of my own and brands for the businesses I partner with.
          </p>
          <Link
            href="/work"
            className="inline-flex items-center gap-2 rounded-full border border-primary/40 px-6 py-2.5 text-sm font-semibold text-primary transition-all duration-200 hover:bg-primary hover:text-primary-foreground hover:shadow-glow"
          >
            See selected work <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
