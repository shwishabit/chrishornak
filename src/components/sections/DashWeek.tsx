'use client'

import { useState, useTransition } from 'react'
import { fmtMins } from '@/lib/dash-feed'
import { UPKEEP, type Goal } from '@/lib/dash-goals'
import { saveGoalsAction } from '@/app/audit/admin/dashboard/actions'

/* The Week tab (2026-10-16, from the agentic-os weekly review). Mon–Sun, New York.
 * Four lists: done by goal · stalled 7+ days · blocked (waiting on someone) ·
 * decisions due for review. Plus the goals themselves, editable: edits wait in
 * dash_state 'goals_edits' until the PC writes them into GOALS.md (the file wins). */

export interface WeekData {
  weekStart: string
  byGoal: { key: string; name: string; wins: number; mins: number; titles: string[] }[]
  stalled: { title: string; days: number; where: string }[]
  blocked: { title: string; days: number | null; next: string }[]
  decisions: { file: string; title: string; review_on: string; quit_if: string }[]
}

const short = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

export function DashWeek({ data, goals, pending, updated }: { data: WeekData; goals: Goal[]; pending: { at: string; goals: Goal[] } | null; updated?: string }) {
  const total = data.byGoal.reduce((t, g) => t + g.wins, 0)
  const top = Math.max(1, ...data.byGoal.map((g) => g.mins))
  return (
    <div className="mt-[18px] grid grid-cols-[minmax(0,1fr)] items-start gap-5 lg:grid-cols-2 lg:gap-7">
      <section aria-labelledby="week-goal-h" className="nx-box min-w-0 p-4 md:px-7 md:py-6 lg:col-span-2">
        <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-border pb-3">
          <h2 id="week-goal-h" className="text-[22px] font-normal tracking-[0.02em]">Done this week, by goal</h2>
          <span className="nx-lab">since Mon {short(data.weekStart)} · {total} done</span>
        </div>
        {total === 0 && <p className="mt-4 text-sm text-muted-foreground">Nothing done yet this week.</p>}
        <ul className="mt-2">
          {data.byGoal.map((g) => (
            <li key={g.key} className="border-b border-[#323840] py-3 last:border-b-0">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <span className={`text-[15px] ${g.key === UPKEEP.key ? 'text-muted-foreground' : 'text-[#ece9e2]'}`}>{g.name}</span>
                <span className="text-xs tabular-nums text-muted-foreground">
                  <b className="font-medium text-foreground">{g.wins}</b> done · {fmtMins(g.mins)}
                </span>
              </div>
              <span className="mt-2 block h-[3px] bg-[#23282f]" aria-hidden="true">
                <span className={`block h-full ${g.key === UPKEEP.key ? 'bg-[#4a4f57]' : 'bg-primary'}`} style={{ width: `${(g.mins / top) * 100}%` }} />
              </span>
              {g.titles.length > 0 && <p className="mt-1.5 text-xs text-muted-foreground wrap-anywhere">{g.titles.join(' · ')}</p>}
              {g.key !== UPKEEP.key && g.wins === 0 && <p className="mt-1.5 text-xs text-warning">No work on this goal yet this week.</p>}
            </li>
          ))}
        </ul>
      </section>

      <WeekList
        id="week-stalled-h"
        title="Stalled"
        hint="Open 7+ days with no change"
        empty="Nothing stalled."
        rows={data.stalled.map((s) => ({ key: s.where + s.title, main: s.title, side: `${s.days}d`, sub: s.where }))}
      />
      <WeekList
        id="week-blocked-h"
        title="Blocked"
        hint="Waiting on someone else"
        empty="Nothing blocked."
        rows={data.blocked.map((b) => ({ key: b.title, main: b.title, side: b.days === null ? '' : `${b.days}d`, sub: b.next, warn: (b.days ?? 0) >= 7 }))}
      />
      <WeekList
        id="week-dec-h"
        title="Decisions to review"
        hint="Review date has come"
        empty="No decision is due for review."
        rows={data.decisions.map((d) => ({ key: d.file, main: d.title, side: short(d.review_on), sub: d.quit_if ? `Quit if: ${d.quit_if}` : d.file }))}
      />
      <GoalsEditor goals={goals} pending={pending} updated={updated} />
    </div>
  )
}

function WeekList({ id, title, hint, empty, rows }: { id: string; title: string; hint: string; empty: string; rows: { key: string; main: string; side: string; sub?: string; warn?: boolean }[] }) {
  return (
    <section aria-labelledby={id} className="nx-box min-w-0 p-4 md:px-6 md:py-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-border pb-3">
        <h2 id={id} className="text-lg font-normal tracking-[0.02em]">
          {title} <span className="text-[#8d929a]">{rows.length}</span>
        </h2>
        <span className="nx-lab">{hint}</span>
      </div>
      {rows.length === 0 && <p className="mt-3 text-sm text-muted-foreground">{empty}</p>}
      <ul>
        {rows.map((r) => (
          <li key={r.key} className="flex items-baseline gap-3 border-b border-[#323840] py-2.5 last:border-b-0">
            <span className="min-w-0 flex-1 text-[14px] wrap-anywhere">
              {r.main}
              {r.sub && <span className="block text-xs text-muted-foreground">{r.sub}</span>}
            </span>
            {r.side && <span className={`shrink-0 text-xs tabular-nums ${r.warn ? 'text-warning' : 'text-muted-foreground'}`}>{r.side}</span>}
          </li>
        ))}
      </ul>
    </section>
  )
}

/** Rename, add or remove goals here; the PC writes them into GOALS.md within the hour. */
function GoalsEditor({ goals, pending, updated }: { goals: Goal[]; pending: { at: string; goals: Goal[] } | null; updated?: string }) {
  const [list, setList] = useState<Goal[]>(pending?.goals ?? goals)
  const [waiting, setWaiting] = useState(!!pending)
  const [msg, setMsg] = useState('')
  const [busy, startTransition] = useTransition()
  const edit = (i: number, patch: Partial<Goal>) => setList((l) => l.map((g, n) => (n === i ? { ...g, ...patch } : g)))

  return (
    <section aria-labelledby="week-goals-h" className="nx-box min-w-0 p-4 md:px-6 md:py-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-border pb-3">
        <h2 id="week-goals-h" className="text-lg font-normal tracking-[0.02em]">Goals</h2>
        <span className="nx-lab">GOALS.md{updated ? ` · synced ${new Date(updated).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' })}` : ''}</span>
      </div>
      {goals.length === 0 && !pending && <p className="mt-3 text-sm text-muted-foreground">No goals yet. Add GOALS.md in the workspace, or add one here.</p>}
      <form
        className="mt-3 grid gap-3"
        onSubmit={(e) => {
          e.preventDefault()
          setMsg('')
          startTransition(async () => {
            const at = await saveGoalsAction(list).catch(() => null)
            if (at) {
              setWaiting(true)
              setMsg('Saved. Your PC writes it into GOALS.md within the hour.')
            } else setMsg('That did not save. Two goals may share a name. Try again.')
          })
        }}
      >
        {list.map((g, i) => (
          <div key={g.key || `new-${i}`} className="grid gap-1.5 border-b border-[#323840] pb-3">
            <div className="flex gap-2">
              <label className="sr-only" htmlFor={`goal-${i}`}>Goal name</label>
              <input
                id={`goal-${i}`}
                value={g.name}
                maxLength={80}
                onChange={(e) => edit(i, { name: e.target.value })}
                className="min-h-11 min-w-0 flex-1 border border-border bg-well px-3 py-1.5 text-sm focus-visible:border-primary focus-visible:outline-none md:min-h-0"
              />
              <button type="button" onClick={() => setList((l) => l.filter((_, n) => n !== i))} className="nx-ghost" aria-label={`Remove ${g.name || 'this goal'}`}>
                Remove
              </button>
            </div>
            <label className="sr-only" htmlFor={`goal-why-${i}`}>Why it matters</label>
            <input
              id={`goal-why-${i}`}
              value={g.why}
              maxLength={200}
              placeholder="Why it matters (optional)"
              onChange={(e) => edit(i, { why: e.target.value })}
              className="min-h-11 min-w-0 border border-border bg-well px-3 py-1.5 text-xs text-muted-foreground focus-visible:border-primary focus-visible:outline-none md:min-h-0"
            />
            {(g.auto.brands.length > 0 || g.auto.groups.length > 0) && (
              <p className="text-[11px] text-[#8d929a]">
                Auto: {[...g.auto.brands.map((b) => `brand ${b}`), ...g.auto.groups.map((x) => `group ${x}`)].join(' · ')} <span className="opacity-70">(edit in GOALS.md)</span>
              </p>
            )}
          </div>
        ))}
        <p className="text-[11px] text-[#8d929a]">Upkeep is fixed: work that serves no goal on purpose. It is never flagged.</p>
        <div className="flex flex-wrap items-center gap-2">
          {list.length < 8 && (
            <button type="button" onClick={() => setList((l) => [...l, { key: '', name: '', why: '', auto: { brands: [], groups: [] } }])} className="nx-ghost">
              Add a goal
            </button>
          )}
          <button type="submit" disabled={busy} className="nx-prim">
            Save
          </button>
          {waiting && !msg && <span className="text-xs text-warning">Edits wait for your PC to write GOALS.md.</span>}
          <span aria-live="polite" className="text-xs text-muted-foreground">{msg}</span>
        </div>
      </form>
    </section>
  )
}
