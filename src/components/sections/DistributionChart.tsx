'use client'

import { useState } from 'react'
import { scoreColor } from '@/lib/audit-scoring'

interface Band {
  bucket: number
  count: number
}

const MAX_BAR_PX = 150

/** Interactive score-distribution bar graph. Hover (desktop) or tap (mobile) a
 *  bar to surface a tooltip with the band, count, and share of the total; the
 *  active bar brightens and the rest dim. Keyboard-focusable. */
export function DistributionChart({
  distribution,
  n,
}: {
  distribution: Band[]
  n: number
}) {
  const [active, setActive] = useState<number | null>(null)
  const distMax = Math.max(1, ...distribution.map((d) => d.count))

  const bars = Array.from({ length: 10 }, (_, i) => {
    const bucket = i + 1
    const count = distribution.find((d) => d.bucket === bucket)?.count ?? 0
    const lo = i * 10
    const hi = bucket === 10 ? 100 : bucket * 10 - 1
    return { bucket, i, count, lo, hi, mid: (lo + hi) / 2 }
  })

  const bandLabel = (b: (typeof bars)[number]) => (b.bucket === 10 ? '90+' : `${b.lo}–${b.hi}`)

  return (
    <div className="mt-8">
      <div
        role="img"
        aria-label={`Bar graph: distribution of findability scores across ${n.toLocaleString()} checked sites, in 10-point bands`}
        className="flex items-end gap-2 border-b border-border/50"
        style={{ height: '200px' }}
      >
        {bars.map((b) => {
          const barPx = b.count ? Math.max(Math.round((b.count / distMax) * MAX_BAR_PX), 4) : 0
          const color = scoreColor(b.mid).bg
          const isActive = active === b.i
          const dim = active !== null && !isActive
          return (
            <button
              key={b.bucket}
              type="button"
              onMouseEnter={() => setActive(b.i)}
              onMouseLeave={() => setActive((cur) => (cur === b.i ? null : cur))}
              onFocus={() => setActive(b.i)}
              onBlur={() => setActive((cur) => (cur === b.i ? null : cur))}
              onClick={() => setActive((cur) => (cur === b.i ? null : b.i))}
              aria-label={`${b.count} site${b.count !== 1 ? 's' : ''} scored ${bandLabel(b)}`}
              className="group relative flex flex-1 cursor-pointer flex-col items-center justify-end gap-1.5 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              {/* Tooltip */}
              {isActive && b.count > 0 && (
                <div className="pointer-events-none absolute -top-1 left-1/2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg border border-border/40 bg-background px-2.5 py-1.5 text-center shadow-xl">
                  <div className="text-xs font-semibold text-foreground">
                    {b.count} site{b.count !== 1 ? 's' : ''}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    scored {bandLabel(b)} · {Math.round((b.count / n) * 100)}%
                  </div>
                </div>
              )}
              <span
                className={`text-xs font-semibold tabular-nums transition-colors ${
                  b.count ? (isActive ? 'text-primary' : 'text-foreground') : 'text-transparent'
                }`}
              >
                {b.count || 0}
              </span>
              <div
                className={`w-full rounded-t ${b.count ? color : 'bg-muted/20'} transition-all duration-200`}
                style={{
                  height: `${barPx}px`,
                  opacity: b.count ? (dim ? 0.35 : isActive ? 1 : 0.9) : 1,
                  transform: isActive ? 'scaleY(1.05)' : undefined,
                  transformOrigin: 'bottom',
                }}
              />
            </button>
          )
        })}
      </div>

      {/* x-axis band labels */}
      <div className="mt-2 flex gap-2">
        {bars.map((b) => (
          <span
            key={b.bucket}
            className={`flex-1 text-center text-[10px] tabular-nums transition-colors ${
              active === b.i ? 'font-semibold text-foreground' : 'text-muted-foreground/70'
            }`}
          >
            {bandLabel(b)}
          </span>
        ))}
      </div>

      <p className="mt-3 text-center text-[11px] text-muted-foreground/60">
        <span className="hidden sm:inline">Hover</span>
        <span className="sm:hidden">Tap</span> a bar for details · bar height = number of sites
      </p>
    </div>
  )
}
