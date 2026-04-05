'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Menu, X } from 'lucide-react'
import { navLinks } from '@/lib/data'
import { Logo } from '@/components/ui/Logo'
import { ease } from '@/lib/animations'

export function Navigation() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease }}
        className="glass fixed top-4 right-4 left-4 z-50 mx-auto flex max-w-6xl items-center justify-between px-6 py-3 md:top-6 md:right-6 md:left-6"
      >
        <a href="/" className="text-foreground">
          <Logo className="h-10 w-auto" />
        </a>

        {/* Desktop nav */}
        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
          <a
            href="/#connect"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:shadow-glow"
          >
            Connect <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-11 w-11 items-center justify-center md:hidden"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            id="mobile-menu"
            role="menu"
            className="glass fixed top-20 right-4 left-4 z-40 flex flex-col gap-4 p-6 md:hidden"
          >
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-xl font-medium text-foreground transition-colors duration-200 hover:text-primary"
              >
                {link.label}
              </a>
            ))}
            <a
              href="/#connect"
              onClick={() => setMobileOpen(false)}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
            >
              Connect <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
