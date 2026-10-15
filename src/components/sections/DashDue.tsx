'use client'

import { useEffect, useRef, useState } from 'react'
import { markJobFollowedUp } from '@/app/audit/admin/dashboard/actions'
import { onWins } from '@/lib/dash-wins'
import { useFilters } from '@/lib/dash-console'

/* Scout steps and job follow-ups that are due, shown as rows INSIDE the one "To do today" list
 * (merged with the to-dos, Chris 2026-10-16). Same row system as the to-dos: checkbox column,
 * title, quiet source label on the right. Ticking a row marks the matching Feed item Done (win,
 * status, rollback all happen there); a job follow-up also writes "Followed up <date>" on the job
 * lead. If the save fails the tick undoes itself and says so. Tomorrow's rows have no checkbox. */

export interface DueRow {
  key: string
  kind: 'scout' | 'job'
  title: string
  /** Feed item id: ticking marks it Done there. */
  feedId?: string
  /** job lead id + its current note (kind job) */
  jobId?: string
  jobNote?: string
}

const SRC: Record<DueRow['kind'], string> = { scout: 'Scout', job: 'Job' }
const srcStyle = (k: DueRow['kind']) => (k === 'scout' ? { color: '#b97a52' } : undefined)

/** Due today: rows with a checkbox. Renders nothing when there are none. */
export function DashDueNow({ rows }: { rows: DueRow[] }) {
  const f = useFilters()
  const [gone, setGone] = useState<Set<string>>(new Set())
  const [error, setError] = useState('')
  // Rows ticked here in the last few seconds: if the Feed rolls one back, say so.
  const ticked = useRef(new Map<string, number>())

  const mark = (keys: string[], on: boolean) =>
    setGone((g) => {
      const n = new Set(g)
      for (const k of keys) on ? n.add(k) : n.delete(k)
      return n
    })

  // The Feed (or Focus mode) finishing the same item removes the row here too; a rollback brings it back.
  useEffect(
    () =>
      onWins(
        (w) => mark(rows.filter((r) => r.feedId === w.id).map((r) => r.key), true),
        (id) => {
          const hit = rows.filter((r) => r.feedId === id)
          mark(hit.map((r) => r.key), false)
          if (hit.some((r) => Date.now() - (ticked.current.get(r.key) ?? 0) < 8000)) setError('That did not save. The row is back. Try again in a moment.')
        },
      ),
    [rows],
  )

  async function tick(r: DueRow) {
    setError('')
    ticked.current.set(r.key, Date.now())
    mark([r.key], true)
    if (!r.feedId || !f.api.current) {
      mark([r.key], false)
      setError('The Feed is not ready yet. Try again in a moment.')
      return
    }
    f.api.current.act(r.feedId, 'done')
    if (r.kind === 'job' && r.jobId) {
      const ok = await markJobFollowedUp(r.jobId, r.jobNote ?? '').catch(() => false)
      if (!ok) {
        f.api.current?.act(r.feedId, null)
        mark([r.key], false)
        setError('That did not save. The row is back. Try again in a moment.')
      }
    }
  }

  const open = rows.filter((r) => !gone.has(r.key))
  return (
    <>
      {open.length > 0 && (
        <ul className="mt-2">
          {open.map((r) => (
            <li key={r.key} className="flex items-start gap-2 py-1.5 md:py-1">
              <span className="w-[9px] shrink-0" aria-hidden="true" />
              <label className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-start gap-2 md:min-h-0">
                <input type="checkbox" checked={false} onChange={() => tick(r)} aria-label={`Mark "${r.title}" done`} />
                <span className="min-w-0 flex-1 text-[14px] leading-snug wrap-anywhere">{r.title}</span>
                <span className="nx-src shrink-0 pt-0.5" style={srcStyle(r.kind)}>{SRC[r.kind]}</span>
              </label>
            </li>
          ))}
        </ul>
      )}
      <p aria-live="polite" className="mt-1 text-xs text-danger empty:hidden">{error}</p>
    </>
  )
}

/** Due tomorrow: dimmed rows, no checkbox. */
export function DashDueTomorrow({ rows }: { rows: DueRow[] }) {
  return (
    <>
      {rows.map((r) => (
        <li key={r.key} className="flex items-start gap-2 py-1.5 text-muted-foreground md:py-1">
          <span className="w-[9px] shrink-0" aria-hidden="true" />
          <span className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="min-w-0 flex-1 text-[14px] leading-snug wrap-anywhere">{r.title}</span>
          <span className="nx-src shrink-0 pt-0.5" style={srcStyle(r.kind)}>{SRC[r.kind]}</span>
        </li>
      ))}
    </>
  )
}
