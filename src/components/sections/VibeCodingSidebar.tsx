'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

type SectionLink = { id: string; label: string }

type ExternalLink = { href: string; label: string }

type Props = {
  sections?: SectionLink[]
  externalLinks?: ExternalLink[]
}

const mainPages = [
  { href: '/learn/vibe-coding', label: 'Overview' },
  { href: '/learn/vibe-coding/principles', label: 'The 10 Principles' },
]

export function VibeCodingSidebar({ sections = [], externalLinks = [] }: Props) {
  const pathname = usePathname()
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    if (sections.length === 0) return

    const elements = sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => el !== null)

    if (elements.length === 0) return

    // Track which sections are in the top portion of the viewport.
    // The first one whose top is above the trigger line (33% from top) is "active."
    const observer = new IntersectionObserver(
      (entries) => {
        // Find the entry with the largest intersection ratio in the trigger zone.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)

        if (visible[0]) {
          setActiveId(visible[0].target.id)
        }
      },
      {
        // Trigger zone: 30% from top, 60% from bottom.
        // Means "active" = the section currently occupying the upper third of the viewport.
        rootMargin: '-30% 0px -60% 0px',
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    )

    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [sections])

  return (
    <nav aria-label="Vibe Coding navigation" className="text-sm">
      {/* Main pages */}
      <p className="font-heading text-xs font-bold uppercase tracking-widest text-primary">
        Vibe Coding
      </p>
      <ul className="mt-3 space-y-1">
        {mainPages.map((page) => {
          const isCurrent = pathname === page.href
          return (
            <li key={page.href}>
              <Link
                href={page.href}
                aria-current={isCurrent ? 'page' : undefined}
                className={[
                  'block rounded-md px-2 py-1.5 transition-colors',
                  isCurrent
                    ? 'bg-primary/10 font-semibold text-primary'
                    : 'text-muted-foreground hover:bg-primary/5 hover:text-foreground',
                ].join(' ')}
              >
                {page.label}
              </Link>
            </li>
          )
        })}
      </ul>

      {/* Page sections (TOC for current page) */}
      {sections.length > 0 && (
        <>
          <p className="mt-8 font-heading text-xs font-bold uppercase tracking-widest text-muted-foreground/70">
            On this page
          </p>
          <ul className="mt-3 space-y-0.5 border-l border-border/30">
            {sections.map((s) => {
              const isActive = activeId === s.id
              return (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className={[
                      '-ml-px block border-l-2 px-3 py-1.5 transition-colors',
                      isActive
                        ? 'border-primary font-medium text-primary'
                        : 'border-transparent text-muted-foreground hover:border-primary/40 hover:text-foreground',
                    ].join(' ')}
                  >
                    {s.label}
                  </a>
                </li>
              )
            })}
          </ul>
        </>
      )}

      {/* External / reference links */}
      {externalLinks.length > 0 && (
        <>
          <p className="mt-8 font-heading text-xs font-bold uppercase tracking-widest text-muted-foreground/70">
            Reference
          </p>
          <ul className="mt-3 space-y-1">
            {externalLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-md px-2 py-1.5 text-muted-foreground transition-colors hover:bg-primary/5 hover:text-foreground"
                >
                  {link.label} ↗
                </a>
              </li>
            ))}
          </ul>
        </>
      )}
    </nav>
  )
}
