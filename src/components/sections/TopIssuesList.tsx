'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { ISSUE_DESCRIPTIONS } from '@/lib/issue-descriptions'
import type { TopIssue } from '@/lib/audit-stats'

const STATUS_LABEL: Record<string, string> = { fail: 'Missing', warn: 'Needs work' }
const INITIAL = 8

// Bar color encodes PREVALENCE, not severity — this section is about what most
// sites miss, so the eye should read "how common" off the color. Smooth amber→red
// ramp as the share of affected sites climbs (top issues land ~85%, the tail ~1%).
// Severity (fail vs warn) lives in the text label instead.
function heatColor(pct: number): string {
  const t = Math.min(Math.max(pct, 0) / 80, 1)
  const hue = Math.round(42 - 42 * t) // 42° amber (rare) → 0° red (near-universal)
  const alpha = (0.45 + 0.4 * t).toFixed(2)
  return `hsl(${hue} 85% 52% / ${alpha})`
}

export function TopIssuesList({ issues }: { issues: TopIssue[] }) {
  const [showAll, setShowAll] = useState(false)
  const shown = showAll ? issues : issues.slice(0, INITIAL)

  return (
    <div className="mt-6 space-y-3">
      <p className="text-xs leading-relaxed text-muted-foreground/70">
        Each bar shows how many checked sites have that issue — the longer and redder
        it runs, the more common it is. <span className="text-muted-foreground">Missing</span> means
        the element is absent; <span className="text-muted-foreground">Needs work</span> means it
        exists but is weak.
      </p>
      {shown.map((issue, i) => (
        <div
          key={`${issue.category}-${issue.label}-${issue.status}-${i}`}
          className="group glass-card p-4 transition-all duration-200 hover:border-primary/30 hover:bg-muted/10 active:scale-[0.99]"
        >
          <div className="flex items-baseline justify-between gap-3">
            <div className="min-w-0">
              <span className="text-sm font-semibold text-foreground">{issue.label}</span>
              <span className="ml-2 text-xs text-muted-foreground">
                {issue.category} ·{' '}
                <span className={issue.status === 'fail' ? 'font-medium text-foreground/70' : ''}>
                  {STATUS_LABEL[issue.status] ?? issue.status}
                </span>
              </span>
            </div>
            <span className="shrink-0 font-heading text-sm font-bold text-primary">{issue.pct}%</span>
          </div>
          {ISSUE_DESCRIPTIONS[issue.label] && (
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground/80">
              {ISSUE_DESCRIPTIONS[issue.label]}
            </p>
          )}
          <div
            role="meter"
            aria-valuenow={Number(issue.pct)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${issue.label}: ${issue.pct}% of checked sites`}
            className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-muted/40"
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.min(Number(issue.pct), 100)}%`,
                backgroundColor: heatColor(Number(issue.pct)),
              }}
            />
          </div>
        </div>
      ))}

      {issues.length > INITIAL && (
        <button
          onClick={() => setShowAll((s) => !s)}
          className="inline-flex items-center gap-1.5 pt-1 text-xs font-semibold text-primary transition-colors duration-200 hover:text-primary/80"
        >
          {showAll ? 'Show top 8 only' : `See all ${issues.length} issues`}
          <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${showAll ? 'rotate-180' : ''}`} />
        </button>
      )}
    </div>
  )
}
