'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { fadeUp, stagger, ease } from '@/lib/animations'

const stats = [
  { value: '500+', label: 'Businesses helped' },
  { value: '20+', label: 'Years in marketing' },
  { value: '12', label: 'Web apps built' },
  { value: '3', label: 'Companies established' },
]

const milestones = [
  { marker: 'Self-taught', detail: 'Learned to code, taught myself SEO, ranked on page one against agencies.' },
  { marker: 'Agency leadership', detail: 'Director of Ops — led a team of 10+ across SEO, design, and dev.' },
  { marker: 'Content company', detail: '500+ businesses served, 261% avg YoY organic traffic growth.' },
  { marker: 'Growth agency', detail: '500% organic traffic scaling, 92% net sales increase in one quarter.' },
]

export function About() {
  return (
    <section id="about" className="px-6 py-24 md:px-12 md:py-32 lg:px-24">
      <div className="mx-auto max-w-5xl">
        {/* Section label */}
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
            About
          </motion.p>
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.6, ease }}
            className="mt-2 h-px w-12 bg-primary/40"
          />
        </motion.div>

        {/* Two-column layout */}
        <div className="mt-10 grid gap-14 md:grid-cols-[1fr_280px] md:gap-16 lg:gap-24">
          {/* Left — narrative column */}
          <div>
            {/* Headshot + headline */}
            <div className="flex items-start gap-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.7, ease }}
                className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full ring-2 ring-primary/30 transition-shadow duration-300 hover:shadow-[0_0_40px_rgba(45,212,168,0.2)] md:h-32 md:w-32"
              >
                <Image
                  src="/images/chris-hornak.jpg"
                  alt="Chris Hornak — marketing strategist"
                  fill
                  className="object-cover"
                  sizes="128px"
                  priority
                />
              </motion.div>
              <motion.div
                initial="initial"
                whileInView="animate"
                viewport={{ once: true, margin: '-80px' }}
                variants={stagger}
              >
                <motion.h2
                  variants={fadeUp}
                  transition={{ duration: 0.7, ease }}
                  className="font-heading text-3xl leading-tight font-bold tracking-tight md:text-4xl"
                >
                  Strategy first. Everything else follows.
                </motion.h2>
                <motion.p
                  variants={fadeUp}
                  transition={{ duration: 0.6, ease }}
                  className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg"
                >
                  Most businesses hire marketers to check boxes. I help them figure out which boxes actually matter.
                </motion.p>
              </motion.div>
            </div>

            {/* Track record */}
            <div className="mt-12">
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, ease }}
                className="mb-6 text-xs font-medium uppercase tracking-widest text-muted-foreground"
              >
                Track record
              </motion.p>
              <div className="relative flex flex-col gap-5 pl-6 before:absolute before:left-[3px] before:top-2 before:bottom-2 before:w-px before:bg-primary/20">
                {milestones.map((m, i) => (
                  <motion.div
                    key={m.marker}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.1, ease }}
                    className="relative"
                  >
                    <div className="absolute -left-6 top-1.5 h-2 w-2 rounded-full bg-primary" />
                    <p className="text-sm">
                      <span className="font-heading font-bold">{m.marker}</span>
                      <span className="text-muted-foreground"> — {m.detail}</span>
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Right — stats column */}
          <div className="flex flex-row justify-around gap-6 md:flex-col md:justify-start md:gap-0 md:border-l md:border-border/50 md:pl-10">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1, ease }}
                className={`${i > 0 ? 'md:mt-10' : ''}`}
              >
                <p className="font-heading text-4xl font-bold text-primary md:text-5xl">{s.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
