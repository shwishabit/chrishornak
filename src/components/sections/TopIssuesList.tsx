'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { ISSUE_DESCRIPTIONS } from '@/lib/issue-descriptions'
import type { TopIssue } from '@/lib/audit-stats'

const STATUS_LABEL: Record<string, string> = { fail: 'Missing', warn: 'Needs work' }
const INITIAL = 8

export function TopIssuesList({ issues }: { issues: TopIssue[] }) {
  const [showAll, setShowAll] = useState(false)
  const shown = showAll ? issues : issues.slice(0, INITIAL)

  return (
    <div className="mt-6 space-y-3">
      {shown.map((issue, i) => (
        <div key={`${issue.category}-${issue.label}-${issue.status}-${i}`} className="glass-card p-4">
          <div className="flex items-baseline justify-between gap-3">
            <div className="min-w-0">
              <span className="text-sm font-semibold text-foreground">{issue.label}</span>
              <span className="ml-2 text-xs text-muted-foreground">
                {issue.category} · {STATUS_LABEL[issue.status] ?? issue.status}
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
              className={issue.status === 'fail' ? 'h-full bg-red-400/70' : 'h-full bg-amber-400/70'}
              style={{ width: `${Math.min(Number(issue.pct), 100)}%` }}
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
