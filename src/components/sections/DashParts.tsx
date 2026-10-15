'use client'

import { useState } from 'react'
import type { Level } from '@/lib/admin-dashboard'
import { ago } from '@/lib/dash-format'

/* Small shared pieces for the admin dashboard (v2, 2026-10-15). */

export const LEVEL_CHIP: Record<Level, string> = {
  red: 'bg-danger/15 text-danger',
  amber: 'bg-warning/15 text-warning',
  green: 'bg-success/15 text-success',
  plain: 'bg-muted text-muted-foreground',
}

export function Chip({ level = 'plain', children, title }: { level?: Level; children: React.ReactNode; title?: string }) {
  return (
    <span title={title} className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums ${LEVEL_CHIP[level]}`}>
      {children}
    </span>
  )
}

/** Copies the exact words to paste into Claude Code. */
export function CopyButton({ text, label = 'Copy what to say', quiet = false }: { text: string; label?: string; quiet?: boolean }) {
  const [state, setState] = useState<'idle' | 'done' | 'failed'>('idle')
  return (
    <button
      type="button"
      title={text}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setState('done')
        } catch {
          setState('failed')
        }
        setTimeout(() => setState('idle'), 1800)
      }}
      className={`nx-ghost shrink-0 !text-[11px] ${quiet ? '!border-transparent' : ''}`}
    >
      {state === 'done' ? 'Copied' : state === 'failed' ? text : label}
    </button>
  )
}

/** Days since → "today", "3d", with a color: green < 7, amber < 30, plain after. */
export function AgeChip({ days, prefix = '' }: { days: number | null; prefix?: string }) {
  if (days === null) return <Chip>{prefix}no date</Chip>
  const level: Level = days < 7 ? 'green' : days < 30 ? 'amber' : 'plain'
  return <Chip level={level}>{prefix}{days === 0 ? 'today' : `${days}d ago`}</Chip>
}

/** "updated 2h ago" — turns amber when older than staleHours. */
export function Updated({ iso, staleHours = 3 }: { iso: string | undefined | null; staleHours?: number }) {
  const stale = !iso || Date.now() - Date.parse(iso) > staleHours * 3600e3
  return <span className={`text-xs ${stale ? 'text-warning' : 'text-muted-foreground'}`}>updated {ago(iso)}</span>
}

export function Sparkline({ values, label }: { values: number[]; label: string }) {
  if (values.length < 2) return null
  const w = 120
  const h = 32
  const max = Math.max(1, ...values)
  const pts = values.map((v, i) => [(i / (values.length - 1)) * (w - 4) + 2, h - 3 - (v / max) * (h - 8)] as const)
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const last = pts[pts.length - 1]
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-8 w-30 text-primary" role="img" aria-label={label}>
      <polygon points={`2,${h - 3} ${line} ${w - 2},${h - 3}`} fill="currentColor" opacity="0.12" />
      <polyline points={line} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last[0]} cy={last[1]} r="2.5" fill="currentColor" />
    </svg>
  )
}

/** 14 squares, one per day; brighter = more changes that day. null = no git history. */
export function Strip({ values, className = '' }: { values: number[] | null | undefined; className?: string }) {
  if (!values) {
    return (
      <div className={`grid grid-cols-14 gap-0.5 ${className}`} title="No git history">
        {Array.from({ length: 14 }, (_, i) => (
          <span key={i} className="h-3.5 rounded-xs border border-dashed border-border" />
        ))}
      </div>
    )
  }
  const max = Math.max(1, ...values)
  return (
    <div className={`grid grid-cols-14 gap-0.5 ${className}`} title="Changes per day, last 14 days">
      {values.map((v, i) => (
        <span
          key={i}
          className="h-3.5 rounded-xs bg-border"
          style={v ? { background: `color-mix(in srgb, var(--color-primary) ${Math.round(25 + (75 * v) / max)}%, var(--color-border))` } : undefined}
        />
      ))}
    </div>
  )
}

export function OutLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex w-fit shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-primary-line px-2.5 py-1 text-xs text-primary transition-colors hover:bg-primary-deep"
    >
      {children}
      <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <path d="M6 3H3v10h10v-3M9 2h5v5M14 2 7 9" />
      </svg>
    </a>
  )
}

export function SectionTitle({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <h2 className="font-heading text-lg font-semibold tracking-tight">{children}</h2>
      {right}
    </div>
  )
}
