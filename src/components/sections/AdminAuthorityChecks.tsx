'use client'

import { useSort } from '@/hooks/useSort'
import { SortTh } from '@/components/ui/SortTh'
import type { AuthorityCheckRow } from '@/lib/admin-authority'

/* Authority Check log (moved out of the server page 2026-10-26 so the columns can sort).
 * Sorting covers the page of rows on screen, not the whole log. Number columns sort by
 * the first site (you). */

const LINKS_LABEL = { ok: '', busy: 'Authority busy', unavailable: 'Authority unavailable' } as const

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/New_York',
  })
}

function n(v: number | null | undefined, missing = '–'): string {
  return v === null || v === undefined ? missing : String(v)
}

export function AdminAuthorityChecks({ rows }: { rows: AuthorityCheckRow[] }) {
  const { sorted, sort } = useSort(rows, {
    when: { get: (r) => r.created_at, first: 'desc' },
    sites: { get: (r) => r.domain },
    links: { get: (r) => r.links[0], first: 'desc' },
    proof: { get: (r) => r.proof[0], first: 'desc' },
  })

  return (
    <div className="glass-card mt-6 overflow-x-auto p-0">
      <table className="w-full text-left text-sm">
        <thead className="text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <SortTh label="When (ET)" k="when" sort={sort} className="px-4 py-3 font-medium" />
            <SortTh label="Sites (you first)" k="sites" sort={sort} className="px-4 py-3 font-medium" />
            <SortTh label="Authority /100" k="links" sort={sort} className="px-4 py-3 font-medium" />
            <SortTh label="Checks /11" k="proof" sort={sort} className="px-4 py-3 font-medium" />
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-6 text-muted-foreground">
                No checks yet.
              </td>
            </tr>
          )}
          {sorted.map((r) => (
            <tr key={r.id} className="border-t border-border align-top">
              <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{fmtDate(r.created_at)}</td>
              <td className="px-4 py-3">
                <span className="text-foreground">{r.domain}</span>
                {r.rival_domains.map((d) => (
                  <span key={d} className="block text-muted-foreground">
                    vs {d}
                  </span>
                ))}
                {r.status === 'error' && <span className="block text-warning">Page error</span>}
                {r.links_status !== 'ok' && <span className="block text-warning">{LINKS_LABEL[r.links_status]}</span>}
              </td>
              <td className="px-4 py-3 tabular-nums">
                {r.links.map((v, i) => (
                  <span key={i} className="block">
                    {n(v, 'no data')}
                    {typeof r.linking_sites?.[i] === 'number' && (
                      <span className="text-muted-foreground"> · {r.linking_sites[i]} sites</span>
                    )}
                  </span>
                ))}
              </td>
              <td className="px-4 py-3 tabular-nums">
                {r.proof.map((v, i) => (
                  <span key={i} className="block">{n(v, 'not read')}</span>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
