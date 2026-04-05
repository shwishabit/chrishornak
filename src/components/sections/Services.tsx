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

        <div className="mt-14 space-y-10">
          {approaches.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: i * 0.08, ease }}
              className="group relative pl-6 md:pl-8"
            >
              <span
                className="absolute left-0 top-1 h-2.5 w-2.5 rounded-full bg-primary/40 transition-colors duration-300 group-hover:bg-primary"
                aria-hidden
              />
              <p className="font-heading text-base font-bold md:text-lg">{item.lead}</p>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{item.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
