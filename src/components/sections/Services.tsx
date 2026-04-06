'use client'

import { motion } from 'framer-motion'
import { fadeUp, stagger, ease } from '@/lib/animations'

const approaches = [
  {
    lead: 'It starts with the question nobody asked.',
    body: 'Before touching a single tactic, I figure out what will actually move your business forward. That diagnostic has led to 500% traffic growth and 92% net sales increases — from strategy alone.',
  },
  {
    lead: 'Then content earns attention — not just clicks.',
    body: 'Blog Hands clients average 261% year-over-year organic traffic growth. Not from keyword checklists, but from content built around your audience and what they actually need to hear.',
  },
  {
    lead: 'Your digital presence becomes a growth engine.',
    body: 'Whether it\'s your first website or a full rethink, I build what converts. I\'ve done it for brands like Giant Eagle and Hertz, and for hundreds of growing businesses finding their footing online.',
  },
  {
    lead: 'And we plan for what\'s next — including what most agencies haven\'t caught up to.',
    body: 'GEO, AEO, AI visibility — the way people find businesses is changing fast. I build that into the roadmap from day one, not as an afterthought.',
  },
]

export function Services() {
  return (
    <section id="services" className="bg-muted/30 px-6 py-24 md:px-12 md:py-32 lg:px-24">
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
            How strategy plays out
          </motion.p>
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.6, ease }}
            className="mt-2 h-px w-12 bg-primary/40"
          />
          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.6, ease }}
            className="mt-8 max-w-lg text-lg text-muted-foreground"
          >
            Every engagement is different, but the principle is the same: strategy first, then execution that compounds.
          </motion.p>
        </motion.div>

        <div className="mt-14 relative pl-8 md:pl-10 max-w-3xl">
          {/* Vertical connecting line */}
          <div className="absolute left-[7px] md:left-[9px] top-3 bottom-3 w-px bg-primary/20" />

          <div className="space-y-6 md:space-y-8">
            {approaches.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.5, delay: i * 0.08, ease }}
                className="group relative"
              >
                {/* Dot with glow */}
                <div className="absolute -left-8 md:-left-10 top-5">
                  <span className="relative flex h-4 w-4 md:h-5 md:w-5 items-center justify-center">
                    <motion.span
                      className="absolute inset-0 rounded-full bg-primary/10 transition-all duration-300 group-hover:scale-[2] group-hover:bg-primary/15"
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: i * 0.08 + 0.2, ease }}
                    />
                    <motion.span
                      className="relative h-2 w-2 md:h-2.5 md:w-2.5 rounded-full bg-primary transition-shadow duration-300 group-hover:shadow-[0_0_12px_rgba(45,212,168,0.5)]"
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: i * 0.08 + 0.3, ease }}
                    />
                  </span>
                </div>

                {/* Card */}
                <div className="rounded-xl border border-border/20 bg-muted/10 p-5 md:p-6 transition-all duration-300 group-hover:border-primary/20 group-hover:bg-muted/20">
                  <p className="font-heading text-sm md:text-base font-bold leading-snug">{item.lead}</p>
                  <p className="mt-3 text-xs md:text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
