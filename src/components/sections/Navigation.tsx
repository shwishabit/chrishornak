'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, ChevronDown, Menu, X } from 'lucide-react'
import { navLinks, toolLinks } from '@/lib/data'
import { Logo } from '@/components/ui/Logo'
import { ThemeSwitchRow, ThemeToggle } from '@/components/ui/ThemeToggle'
import { ease } from '@/lib/animations'

/** Desktop "Tools" menu: a button that opens the three free tools. Closes on Escape, outside click or a pick. */
function ToolsMenu() {
  const [open, setOpen] = useState(false)
  const wrap = useRef<HTMLDivElement>(null)
  const button = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        button.current?.focus()
      }
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={wrap} className="relative">
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls="tools-menu"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground aria-expanded:text-foreground"
      >
        Free tools
        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {open && (
        <div
          id="tools-menu"
          className="absolute top-full right-0 mt-4 w-72 rounded-xl border border-border bg-background p-2 shadow-lg"
        >
          <ul className="m-0 grid list-none gap-0.5 p-0">
            {toolLinks.map((t) => (
              <li key={t.href}>
                <a
                  href={t.href}
                  onClick={() => setOpen(false)}
                  className="grid gap-0.5 rounded-lg px-3 py-2.5 transition-colors duration-150 hover:bg-muted focus-visible:bg-muted"
                >
                  <span className="font-code text-[11px] tracking-[.08em] text-primary uppercase">{t.step}</span>
                  <span className="text-sm font-semibold text-foreground">{t.label}</span>
                  <span className="text-[13px] text-muted-foreground">{t.question}</span>
                </a>
              </li>
            ))}
          </ul>
          <a
            href="/tools"
            onClick={() => setOpen(false)}
            className="mt-1 block rounded-lg border-t border-border px-3 pt-2.5 pb-2 text-[13px] font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground"
          >
            How the three checks fit together <span aria-hidden="true">→</span>
          </a>
        </div>
      )}
    </div>
  )
}

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
          <ToolsMenu />
          <ThemeToggle />
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
            className="glass fixed top-20 right-4 left-4 z-40 flex max-h-[calc(100dvh-6rem)] flex-col gap-4 overflow-y-auto p-6 md:hidden"
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
            <div className="grid gap-2.5 border-t border-border pt-4">
              <p className="m-0 text-xs font-medium tracking-widest text-muted-foreground uppercase">Free tools</p>
              {toolLinks.map((t) => (
                <a
                  key={t.href}
                  href={t.href}
                  onClick={() => setMobileOpen(false)}
                  className="grid gap-0.5 text-foreground transition-colors duration-200 hover:text-primary"
                >
                  <span className="font-code text-[11px] tracking-[.08em] text-primary uppercase">{t.step}</span>
                  <span className="text-lg font-medium">{t.label}</span>
                  <span className="text-[13px] text-muted-foreground">{t.question}</span>
                </a>
              ))}
              <a
                href="/tools"
                onClick={() => setMobileOpen(false)}
                className="text-[13px] font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground"
              >
                How the three checks fit together <span aria-hidden="true">→</span>
              </a>
            </div>
            <div className="border-t border-border pt-4">
              <ThemeSwitchRow />
            </div>
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
