'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { testimonials } from '@/lib/data'
import { fadeUp, stagger, ease } from '@/lib/animations'

const clients = [
  { name: 'Hilton', logo: '/images/logos/hilton-international-logo.png', size: 'large-plus' as const },
  { name: 'Giant Eagle', logo: '/images/logos/Giant_Eagle_logo.svg.png', size: 'default' as const },
  { name: 'Cellones', logo: '/images/logos/cellones.png', size: 'xl' as const, noInvert: true },
  { name: 'The Art Institute', logo: '/images/logos/art-institutes.png', size: 'small' as const },
  { name: 'University of Montana', logo: '/images/logos/UMT Logo.png', size: 'xl' as const },
  { name: 'Gamma Light Therapy', logo: '/images/logos/gamma.png', size: 'default' as const, noInvert: true },
]

const sizeClasses = {
  small: 'max-h-[34px] md:max-h-[42px]',
  default: 'max-h-[50px] md:max-h-[59px]',
  large: 'max-h-[59px] md:max-h-[67px]',
  'large-plus': 'max-h-[67px] md:max-h-[78px]',
  xl: 'max-h-[84px] md:max-h-[101px]',
}

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
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease }}
          className="mt-14 border-b border-border/50 pb-14"
        >
          <div className="grid grid-cols-3 items-center gap-8 md:grid-cols-6 md:gap-6">
            {clients.map((client) => (
              <div
                key={client.name}
                className={`flex h-14 items-center justify-center transition-all duration-300 md:h-16 ${client.noInvert ? 'opacity-40 grayscale hover:opacity-100 hover:grayscale-0' : 'opacity-40 brightness-0 invert grayscale hover:opacity-100 hover:brightness-0 hover:invert hover:grayscale-0 hover:sepia hover:saturate-[10] hover:hue-rotate-[120deg]'}`}
              >
                <Image
                  src={client.logo}
                  alt={client.name}
                  width={120}
                  height={64}
                  className={`w-auto max-w-full object-contain ${sizeClasses[client.size]}`}
                  sizes="120px"
                />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Testimonials — two columns of 3 */}
        <div className="mt-14 grid gap-6 md:grid-cols-2">
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
      </div>
    </section>
  )
}
