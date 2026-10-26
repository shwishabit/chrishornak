'use client'

import { useSort } from '@/hooks/useSort'
import { SortTh } from '@/components/ui/SortTh'
import { scoreColor } from '@/lib/audit-scoring'
import { CATEGORY_ORDER } from '@/lib/benchmark-config'
import type { AuditLogRow } from '@/lib/admin-audit'

function fmtDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const issueCount = (r: AuditLogRow, s: 'fail' | 'warn') => r.issues.filter((i) => i.s === s).length
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null)

/** Seven tinted cells, one per category, colored by that category's score. */
function CategoryStrip({ scores }: { scores: Record<string, number> }) {
  return (
    <div className="flex gap-0.5">
      {CATEGORY_ORDER.map((cat) => {
        const s = scores[cat]
        const has = typeof s === 'number'
        return (
          <span
            key={cat}
            title={has ? `${cat}: ${s}` : `${cat}: —`}
            className={`h-4 w-2.5 rounded-[2px] ${has ? scoreColor(s).bg : 'bg-muted'} ${has ? 'opacity-90' : 'opacity-25'}`}
          />
        )
      })}
    </div>
  )
}

export function AdminAuditLog({ rows }: { rows: (AuditLogRow & { scan_count?: number })[] }) {
  // Domains read nicer A→Z; scores and dates high/recent first. Categories = the average, weakest first.
  const { sorted, sort } = useSort(
    rows,
    {
      domain: { get: (r) => r.domain },
      score: { get: (r) => r.overall_score, first: 'desc' },
      categories: { get: (r) => avg(Object.values(r.category_scores)), first: 'asc' },
      issues: { get: (r) => issueCount(r, 'fail') * 1000 + issueCount(r, 'warn'), first: 'desc' },
      date: { get: (r) => r.created_at, first: 'desc' },
    },
    { key: 'date', dir: 'desc' },
  )

  if (rows.length === 0) {
    return (
      <div className="glass-card p-8 text-center text-sm text-muted-foreground">
        No scans match this view yet.
      </div>
    )
  }

  return (
    <div className="glass-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
              <SortTh label="Domain" k="domain" sort={sort} className="px-4 py-3 font-medium" />
              <SortTh label="Score" k="score" sort={sort} className="px-4 py-3 font-medium" />
              <SortTh label="Categories" k="categories" sort={sort} className="px-4 py-3 font-medium" />
              <SortTh label="Issues" k="issues" sort={sort} className="px-4 py-3 font-medium" />
              <SortTh label="When" k="date" sort={sort} className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => {
              const fails = issueCount(r, 'fail')
              const warns = issueCount(r, 'warn')
              return (
                <tr key={r.id ?? r.domain} className="border-b border-border/50 last:border-0 hover:bg-foreground/[0.02]">
                  <td className="px-4 py-3">
                    <a
                      href={`https://${r.domain}`}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="font-medium text-foreground underline decoration-transparent underline-offset-2 transition-colors hover:decoration-primary"
                    >
                      {r.domain}
                    </a>
                    {r.scan_count && r.scan_count > 1 && (
                      <span className="ml-1.5 text-xs text-muted-foreground">×{r.scan_count}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-heading font-bold ${scoreColor(r.overall_score).text}`}>
                      {r.overall_score}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <CategoryStrip scores={r.category_scores} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {fails > 0 && <span className="text-red-400">{fails} fail</span>}
                    {fails > 0 && warns > 0 && <span className="text-muted-foreground">, </span>}
                    {warns > 0 && <span className="text-amber-400">{warns} warn</span>}
                    {fails === 0 && warns === 0 && <span>—</span>}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {fmtDate(r.created_at)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
