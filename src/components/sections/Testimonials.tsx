'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { testimonials } from '@/lib/data'
import { ease } from '@/lib/animations'

export function Testimonials({ className = '' }: { className?: string }) {
  return (
    <div className={`grid gap-6 md:grid-cols-2 ${className}`}>
      {testimonials.map((t, i) => (
        <motion.div
          key={t.name}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, delay: i * 0.08, ease }}
          className="glass-card flex flex-col justify-between gap-5 p-7"
        >
          <p className="text-sm leading-relaxed text-muted-foreground">
            &ldquo;{t.quote}&rdquo;
          </p>
          <div className="flex items-center gap-3">
            {t.image ? (
              <Image
                src={t.image}
                alt={t.name}
                width={48}
                height={48}
                className="h-12 w-12 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                {t.initials}
              </div>
            )}
            <div>
              <p className="text-sm font-semibold">{t.name}</p>
              <p className="text-xs text-muted-foreground">{t.title}{t.company ? `, ${t.company}` : ''}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
