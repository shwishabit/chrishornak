'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { homeFaqs } from '@/lib/data'
import { fadeUp, stagger, ease } from '@/lib/animations'

export function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

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
            Common questions
          </motion.p>
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.6, ease }}
            className="mt-2 h-px w-12 bg-primary/40"
          />
        </motion.div>

        <motion.dl
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: '-50px' }}
          variants={stagger}
          className="mt-10 max-w-3xl divide-y divide-border/30"
        >
          {homeFaqs.map((faq, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              transition={{ duration: 0.5, ease }}
              className="py-5"
            >
              <dt>
                <button
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="flex w-full items-start justify-between gap-4 text-left"
                  aria-expanded={openIndex === i}
                >
                  <span className="text-sm font-semibold text-foreground">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${openIndex === i ? 'rotate-180' : ''}`}
                  />
                </button>
              </dt>
              <dd
                className={`overflow-hidden transition-all duration-200 ${openIndex === i ? 'mt-3 max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}
              >
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {faq.answer}
                </p>
              </dd>
            </motion.div>
          ))}
        </motion.dl>
      </div>
    </section>
  )
}
