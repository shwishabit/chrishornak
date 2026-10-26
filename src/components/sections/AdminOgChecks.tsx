'use client'

import { useSort } from '@/hooks/useSort'
import { SortTh } from '@/components/ui/SortTh'
import { CHECK_IDS, type CheckId } from '@/lib/og-check'
import type { OgCheckRow, OgChecksAdmin } from '@/lib/admin-og'

/* OG checker log (moved out of the server page 2026-10-26 so the columns can sort).
 * Sorting covers the page of rows on screen, not the whole log. */

const CHECK_LABEL: Record<CheckId, string> = {
  size: 'Size',
  shape: 'Shape',
  width: 'Width',
  filesize: 'File size',
  loads: 'Image loads',
  tags: 'Required tags',
  alt: 'Image alt',
  sitename: 'Site name in title',
}

function label(id: string): string {
  return (CHECK_IDS as readonly string[]).includes(id) ? CHECK_LABEL[id as CheckId] : id
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/New_York',
  })
}

export function AdminOgChecks({ rows, topFailed }: { rows: OgCheckRow[]; topFailed: OgChecksAdmin['top_failed'] }) {
  const { sorted, sort } = useSort(rows, {
    when: { get: (r) => r.created_at, first: 'desc' },
    domain: { get: (r) => r.domain },
    passed: { get: (r) => (r.status === 'error' ? null : r.passed), first: 'desc' },
    failed: { get: (r) => r.failed.length * 100 + r.warned.length, first: 'desc' },
  })

  return (
    <>
      {topFailed.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Most common problems
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {topFailed.map((t) => (
              <li key={t.id} className="rounded-full border border-border px-3 py-1.5 text-sm">
                {label(t.id)} <span className="text-muted-foreground">· {t.count}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="glass-card mt-6 overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <SortTh label="When (ET)" k="when" sort={sort} className="px-4 py-3 font-medium" />
              <SortTh label="Domain" k="domain" sort={sort} className="px-4 py-3 font-medium" />
              <SortTh label="Passed" k="passed" sort={sort} className="px-4 py-3 font-medium" />
              <SortTh label="Did not pass" k="failed" sort={sort} className="px-4 py-3 font-medium" />
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
              <tr key={r.id} className="border-t border-border">
                <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{fmtDate(r.created_at)}</td>
                <td className="px-4 py-3">{r.domain}</td>
                <td className="px-4 py-3 tabular-nums">
                  {r.status === 'error' ? <span className="text-warning">Page error</span> : `${r.passed} / 8`}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    {r.failed.map((id) => (
                      <span key={id} className="rounded-full border border-destructive/40 px-2 py-0.5 text-xs text-destructive">
                        {label(id)}
                      </span>
                    ))}
                    {r.warned.map((id) => (
                      <span key={id} className="rounded-full border border-warning/40 px-2 py-0.5 text-xs text-warning">
                        {label(id)}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
