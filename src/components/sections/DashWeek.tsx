'use client'

import { useState, useTransition } from 'react'
import { fmtMins } from '@/lib/dash-feed'
import { UPKEEP, type Goal } from '@/lib/dash-goals'
import { saveGoalsAction } from '@/app/audit/admin/dashboard/actions'

/* The Week tab (v2, 2026-10-16, Chris: "a whole bunch of text I don't want to read").
 * Scan, don't read: numbers and names only; any sentence is one click away.
 *   1. Goal scoreboard — one tile per goal: done count, time, a bar. Click = what was done.
 *   2. Stuck — one chip per stuck thing (name + days). Click = its next step. Games fold into one chip.
 *   3. Decisions due — only when one is due.
 *   Goals editor sits behind "Edit goals". Mon–Sun, New York. */

export interface StuckItem {
  name: string
  days: number
  /** The next step or waiting reason, shown on click. */
  next: string
  waiting: boolean
  game: boolean
}

export interface WeekData {
  weekStart: string
  byGoal: { key: string; name: string; wins: number; mins: number; titles: string[] }[]
  stuck: StuckItem[]
  decisions: { file: string; title: string; review_on: string; quit_if: string }[]
}

const short = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
const SHOW_CHIPS = 8

export function DashWeek({ data, goals, pending, updated }: { data: WeekData; goals: Goal[]; pending: { at: string; goals: Goal[] } | null; updated?: string }) {
  const [open, setOpen] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const real = data.byGoal.filter((g) => g.key !== UPKEEP.key)
  const upkeep = data.byGoal.find((g) => g.key === UPKEEP.key)
  const top = Math.max(1, ...real.map((g) => g.mins))
  const shown = data.byGoal.find((g) => g.key === open)

  return (
    <div className="mt-[18px] grid grid-cols-[minmax(0,1fr)] gap-5">
      {/* 1 · Scoreboard */}
      <section aria-labelledby="week-h" className="nx-box min-w-0 p-4 md:px-7 md:py-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="week-h" className="text-[22px] font-normal tracking-[0.02em]">This week</h2>
          <span className="nx-lab">since Mon {short(data.weekStart)}</span>
        </div>
        {real.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No goals yet. Add them with Edit goals below.</p>
        ) : (
          <div className={`mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 ${real.length >= 3 ? 'lg:grid-cols-3' : ''}`}>
            {real.map((g) => (
              <button
                key={g.key}
                type="button"
                onClick={() => setOpen(open === g.key ? null : g.key)}
                aria-expanded={open === g.key}
                className={`flex min-w-0 flex-col justify-start border px-4 py-4 text-left transition-colors hover:border-primary ${open === g.key ? 'border-primary bg-[rgba(95,211,148,0.06)]' : 'border-[#323840]'}`}
              >
                <span className="block truncate text-[13px] uppercase tracking-[0.14em] text-[#a8f2c8]">{g.name}</span>
                <span className="mt-2 flex items-baseline gap-2">
                  <b className={`text-4xl font-light tabular-nums ${g.wins ? 'nx-num' : 'text-warning'}`}>{g.wins}</b>
                  <span className="text-xs text-muted-foreground">done{g.mins ? ` · ${fmtMins(g.mins)}` : ''}</span>
                </span>
                <span className="mt-3 block h-[3px] bg-[#23282f]" aria-hidden="true">
                  <span className="block h-full bg-primary" style={{ width: `${(g.mins / top) * 100}%` }} />
                </span>
                {g.wins === 0 && <span className="mt-2 block text-xs text-warning">Nothing yet</span>}
              </button>
            ))}
          </div>
        )}
        {upkeep && (
          <button
            type="button"
            onClick={() => setOpen(open === UPKEEP.key ? null : UPKEEP.key)}
            aria-expanded={open === UPKEEP.key}
            className="mt-3 text-xs text-muted-foreground hover:text-foreground"
          >
            + Upkeep <b className="font-medium tabular-nums text-foreground">{upkeep.wins}</b> done{upkeep.mins ? ` · ${fmtMins(upkeep.mins)}` : ''} {open === UPKEEP.key ? '▴' : '▾'}
          </button>
        )}
        {shown && (
          <ul className="mt-4 border-t border-border pt-3" aria-label={`Done for ${shown.name}`}>
            {shown.titles.length === 0 && <li className="text-sm text-muted-foreground">Nothing done for this goal yet this week.</li>}
            {shown.titles.map((t, n) => (
              <li key={n} className="truncate py-1 text-[13px] text-[#c9ccd1]" title={t}>
                ✓ {t}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 2 · Stuck */}
      <Stuck items={data.stuck} />

      {/* 3 · Decisions due: only when there is one */}
      {data.decisions.length > 0 && (
        <section aria-labelledby="week-dec-h" className="nx-box min-w-0 p-4 md:px-7 md:py-5">
          <h2 id="week-dec-h" className="text-lg font-normal tracking-[0.02em]">
            Check a decision <span className="text-[#8d929a]">{data.decisions.length}</span>
          </h2>
          <ul className="mt-2">
            {data.decisions.map((d) => (
              <li key={d.file} className="flex items-baseline gap-3 py-1.5 text-[14px]">
                <span className="min-w-0 flex-1 truncate" title={d.quit_if ? `Quit if: ${d.quit_if}` : d.file}>{d.title}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{short(d.review_on)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Goals editor: out of the way until asked for */}
      <div className="flex justify-end">
        <button type="button" onClick={() => setEditing(!editing)} aria-expanded={editing} className="nx-ghost">
          {editing ? 'Close goals' : 'Edit goals'}
        </button>
      </div>
      {editing && <GoalsEditor goals={goals} pending={pending} updated={updated} />}
    </div>
  )
}

/** Name + days chips. Click one for its next step. Games fold into one chip; more than 8 → "+N more". */
function Stuck({ items }: { items: StuckItem[] }) {
  const [pick, setPick] = useState<number | null>(null)
  const [all, setAll] = useState(false)
  const games = items.filter((i) => i.game)
  const rest = items.filter((i) => !i.game)
  const chips: (StuckItem & { count?: number })[] = [
    ...rest,
    ...(games.length ? [{ name: games.length === 1 ? games[0].name : 'Games', days: Math.max(...games.map((g) => g.days)), next: games.map((g) => `${g.name} · ${g.days}d`).join('\n'), waiting: false, game: true, count: games.length }] : []),
  ]
  const visible = all ? chips : chips.slice(0, SHOW_CHIPS)
  const sel = pick !== null ? chips[pick] : null

  return (
    <section aria-labelledby="week-stuck-h" className="nx-box min-w-0 p-4 md:px-7 md:py-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="week-stuck-h" className="text-lg font-normal tracking-[0.02em]">
          Stuck <span className="text-[#8d929a]">{items.length}</span>
        </h2>
        <span className="nx-lab">no change in 7+ days · tap one</span>
      </div>
      {chips.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">Nothing is stuck.</p>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          {visible.map((c, n) => (
            <button
              key={c.name + n}
              type="button"
              onClick={() => setPick(pick === n ? null : n)}
              aria-expanded={pick === n}
              className={`inline-flex min-h-11 max-w-full items-center gap-2 border px-3 py-1.5 text-[13px] transition-colors hover:border-primary md:min-h-0 ${
                pick === n ? 'border-primary text-foreground' : 'border-[#323840] text-[#c9ccd1]'
              }`}
            >
              <span className="truncate">{c.name}{c.count && c.count > 1 ? ` ×${c.count}` : ''}</span>
              {c.waiting && <span className="text-[11px] uppercase tracking-[0.12em] text-warning">waiting</span>}
              <span className={`shrink-0 tabular-nums text-xs ${c.days >= 14 ? 'text-warning' : 'text-muted-foreground'}`}>{c.days}d</span>
            </button>
          ))}
          {chips.length > SHOW_CHIPS && (
            <button type="button" onClick={() => setAll(!all)} className="nx-ghost">
              {all ? 'Show less' : `+${chips.length - SHOW_CHIPS} more`}
            </button>
          )}
        </div>
      )}
      {sel && (
        <p className="mt-4 max-w-[78ch] whitespace-pre-line border-l-2 border-primary pl-3 text-[13px] text-[#c9ccd1]">
          <span className="nx-lab mb-1 block">{sel.waiting ? 'Waiting on' : 'Next step'}</span>
          {sel.next || 'No next step written down.'}
        </p>
      )}
    </section>
  )
}

/** Rename, add or remove goals; the PC writes them into GOALS.md within the hour. */
function GoalsEditor({ goals, pending, updated }: { goals: Goal[]; pending: { at: string; goals: Goal[] } | null; updated?: string }) {
  const [list, setList] = useState<Goal[]>(pending?.goals ?? goals)
  const [waiting, setWaiting] = useState(!!pending)
  const [msg, setMsg] = useState('')
  const [busy, startTransition] = useTransition()
  const edit = (i: number, patch: Partial<Goal>) => setList((l) => l.map((g, n) => (n === i ? { ...g, ...patch } : g)))

  return (
    <section aria-labelledby="week-goals-h" className="nx-box min-w-0 p-4 md:px-7 md:py-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-border pb-3">
        <h2 id="week-goals-h" className="text-lg font-normal tracking-[0.02em]">Goals</h2>
        <span className="nx-lab">
          GOALS.md{updated ? ` · synced ${new Date(updated).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' })}` : ''}
        </span>
      </div>
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
          <div key={g.key || `new-${i}`} className="flex gap-2">
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
        ))}
        <p className="text-[11px] text-[#8d929a]">Which items go to which goal: the Auto lines in GOALS.md. Anything else is Upkeep.</p>
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
