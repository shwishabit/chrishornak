'use client'

import { useMemo, useState } from 'react'
import { scoreColor } from '@/lib/audit-scoring'
import { CATEGORY_ORDER } from '@/lib/benchmark-config'
import type { AuditLogRow } from '@/lib/admin-audit'

type SortKey = 'date' | 'score' | 'domain'

function fmtDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

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

export function AdminAuditLog({ rows }: { rows: AuditLogRow[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('date')
  const [asc, setAsc] = useState(false)

  const sorted = useMemo(() => {
    const copy = [...rows]
    copy.sort((a, b) => {
      let cmp = 0
      if (sortKey === 'date') cmp = a.created_at.localeCompare(b.created_at)
      else if (sortKey === 'score') cmp = a.overall_score - b.overall_score
      else cmp = a.domain.localeCompare(b.domain)
      return asc ? cmp : -cmp
    })
    return copy
  }, [rows, sortKey, asc])

  function toggle(key: SortKey) {
    if (key === sortKey) setAsc((v) => !v)
    else {
      setSortKey(key)
      setAsc(key === 'domain') // domains read nicer A→Z; scores/dates high→recent first
    }
  }

  const arrow = (key: SortKey) => (sortKey === key ? (asc ? ' ↑' : ' ↓') : '')

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
              <th className="px-4 py-3 font-medium">
                <button onClick={() => toggle('domain')} className="hover:text-foreground">
                  Domain{arrow('domain')}
                </button>
              </th>
              <th className="px-4 py-3 font-medium">
                <button onClick={() => toggle('score')} className="hover:text-foreground">
                  Score{arrow('score')}
                </button>
              </th>
              <th className="px-4 py-3 font-medium">Categories</th>
              <th className="px-4 py-3 font-medium">Issues</th>
              <th className="px-4 py-3 font-medium">
                <button onClick={() => toggle('date')} className="hover:text-foreground">
                  When{arrow('date')}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => {
              const fails = r.issues.filter((i) => i.s === 'fail').length
              const warns = r.issues.filter((i) => i.s === 'warn').length
              return (
                <tr key={r.id} className="border-b border-border/50 last:border-0 hover:bg-foreground/[0.02]">
                  <td className="px-4 py-3">
                    <a
                      href={`https://${r.domain}`}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="font-medium text-foreground underline decoration-transparent underline-offset-2 transition-colors hover:decoration-primary"
                    >
                      {r.domain}
                    </a>
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
