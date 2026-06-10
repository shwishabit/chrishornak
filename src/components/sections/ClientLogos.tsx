'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { ease } from '@/lib/animations'

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

export function ClientLogos({ className = '' }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease }}
      className={className}
    >
      <div className="grid grid-cols-3 items-center gap-8 md:grid-cols-6 md:gap-6">
        {clients.map((client) => (
          <div
            key={client.name}
            className={`flex h-14 items-center justify-center transition-all duration-300 md:h-16 ${client.noInvert ? 'opacity-40 grayscale hover:opacity-100 hover:grayscale-0' : 'opacity-40 brightness-0 invert grayscale hover:opacity-100 hover:brightness-0 hover:invert hover:grayscale-0 hover:sepia hover:saturate-[10] hover:hue-rotate-[120deg]'}`}
          >
            <Image
              src={client.logo}
              alt={`${client.name} logo`}
              width={120}
              height={64}
              className={`w-auto max-w-full object-contain ${sizeClasses[client.size]}`}
              sizes="120px"
            />
          </div>
        ))}
      </div>
    </motion.div>
  )
}
