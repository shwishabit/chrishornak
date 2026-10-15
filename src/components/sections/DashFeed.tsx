'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import type { FeedStatus, FeedStatusRow, Level } from '@/lib/admin-dashboard'
import { FEED_GROUPS, fmtMins, nyDate, nyTomorrow, type FeedGroup, type FeedItem } from '@/lib/dash-feed'
import { setFeedItemMins, setFeedItemStatus } from '@/app/audit/admin/dashboard/actions'
import { SCALE, chime } from '@/lib/dash-sound'
import { CopyButton } from './DashParts'
import { brandChip } from '@/lib/dash-format'
import { emitFeedCounts, emitUnwin, emitWin } from '@/lib/dash-wins'

/* The Feed (2026-10-15): one list in Chris's morning order — Email → Sales →
 * Jobs → Marketing → Client work → Other. Red items jump to the top of their
 * group. Done / Snooze to tomorrow / Skip write to dash_feed_status (and job
 * items to job_leads). Search + filters are local to the page. */

const DOT: Record<Level, string> = { red: 'bg-danger', amber: 'bg-warning', plain: 'bg-muted-foreground/50', green: 'bg-primary' }
const LVL: Record<Level, number> = { red: 0, amber: 1, green: 2, plain: 3 }
const GROUP_ORDER = Object.fromEntries(FEED_GROUPS.map((g, i) => [g.id, i])) as Record<FeedGroup, number>
const SHOW_PER_GROUP = 8

type View = 'open' | 'done' | 'snoozed'

export function DashFeed({
  items,
  statuses,
  freeMins,
  dayOver,
}: {
  items: FeedItem[]
  statuses: FeedStatusRow[]
  freeMins: number
  dayOver: boolean
}) {
  const today = nyDate()
  const [rows, setRows] = useState(() => new Map(statuses.map((s) => [s.id, s])))
  const [q, setQ] = useState('')
  const [group, setGroup] = useState<FeedGroup | 'all'>('all')
  const [quick, setQuick] = useState(false)
  const [brand, setBrand] = useState('all')
  const [view, setView] = useState<View>('open')
  const [expanded, setExpanded] = useState<Set<FeedGroup>>(new Set())
  const [error, setError] = useState('')
  const [, startTransition] = useTransition()
  const [minsOver, setMinsOver] = useState<Record<string, number>>({})
  const [focus, setFocus] = useState(false)
  const [passed, setPassed] = useState<Set<string>>(new Set())

  const hidden = (id: string) => {
    const r = rows.get(id)
    if (!r) return false
    return r.status !== 'snoozed' || (r.until ?? '') > today
  }

  const open = useMemo(
    () =>
      items
        .map((i) => (minsOver[i.id] ? { ...i, mins: minsOver[i.id], minsSet: true } : i))
        .filter((i) => !hidden(i.id))
        .sort((a, b) => GROUP_ORDER[a.group] - GROUP_ORDER[b.group] || (a.level === 'red' ? 0 : 1) - (b.level === 'red' ? 0 : 1) || a.rank - b.rank || LVL[a.level] - LVL[b.level]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, rows, minsOver],
  )
  const needs = open.reduce((t, i) => t + i.mins, 0)
  // Tab badges + the top line update live as items are done (review 2026-10-15).
  useEffect(() => {
    emitFeedCounts({
      open: open.length,
      urgent: open.filter((i) => i.level === 'red').length,
      email: open.filter((i) => i.group === 'email').length,
      sales: open.filter((i) => i.group === 'sales').length,
    })
  }, [open])

  const needle = q.trim().toLowerCase()
  const shown = open.filter(
    (i) =>
      (group === 'all' || i.group === group) &&
      (!quick || i.mins < 15) &&
      (brand === 'all' || i.brand === brand) &&
      (!needle || `${i.brand} ${i.title} ${i.detail ?? ''} ${i.meta ?? ''}`.toLowerCase().includes(needle)),
  )
  const groupCounts = Object.fromEntries(FEED_GROUPS.map((g) => [g.id, open.filter((i) => i.group === g.id).length])) as Record<FeedGroup, number>

  const statusRows = [...rows.values()]
  const doneToday = statusRows.filter((r) => (r.status === 'done' || r.status === 'skipped') && nyDate(new Date(r.at)) === today)
  const snoozed = statusRows.filter((r) => r.status === 'snoozed' && (r.until ?? '') > today)
  const doneMins = doneToday.filter((r) => r.status === 'done').reduce((t, r) => t + r.mins, 0)

  function act(item: Pick<FeedItem, 'id' | 'title' | 'group' | 'mins' | 'job'> & { brand?: string }, status: FeedStatus | null) {
    const prev = rows.get(item.id)
    // Today's wins card: a Done is a win; undoing a Done takes it back.
    if (status === 'done') emitWin({ id: item.id, title: item.title, mins: item.mins, brand: item.brand, at: new Date().toISOString() })
    else if (prev?.status === 'done') emitUnwin(item.id)
    const next = new Map(rows)
    // Snooze hides at once: set tomorrow's date now instead of waiting for the server.
    if (status) next.set(item.id, { id: item.id, status, until: status === 'snoozed' ? nyTomorrow(today) : null, title: item.title, grp: item.group, mins: item.mins, brand: item.brand, at: new Date().toISOString() })
    else next.delete(item.id)
    setRows(next)
    setError('')

    // Job + question items keep the tracker in sync. Undo puts them back to the status they came from.
    const jobId = item.job?.id ?? (item.id.startsWith('job:') ? item.id.slice(4) : undefined)
    const jobStatus = !jobId ? undefined
      : status === 'done' ? item.job?.done
      : status === 'skipped' ? item.job?.skip
      : status === null && prev && prev.status !== 'snoozed' ? (item.job?.undo ?? 'new')
      : undefined

    startTransition(async () => {
      const res = await setFeedItemStatus({
        id: item.id,
        status,
        title: item.title,
        group: item.group,
        mins: item.mins,
        brand: item.brand,
        job: jobId && jobStatus ? { id: jobId, status: jobStatus } : undefined,
      }).catch(() => ({ ok: false, until: null }))
      if (!res.ok) {
        setRows((cur) => {
          const back = new Map(cur)
          if (prev) back.set(item.id, prev)
          else back.delete(item.id)
          return back
        })
        if (status === 'done') emitUnwin(item.id)
        // A failed Undo of a Done: the server still has it done, so the win comes back.
        else if (prev?.status === 'done') emitWin({ id: item.id, title: item.title, mins: item.mins, brand: item.brand, at: prev.at })
        setError('That did not save. Try again in a moment.')
      } else if (status === 'snoozed' && res.until) {
        setRows((cur) => {
          const row = cur.get(item.id)
          return row?.status === 'snoozed' ? new Map(cur).set(item.id, { ...row, until: res.until! }) : cur
        })
      }
    })
  }

  /** Chris's own time estimate for one item: shows at once, saves in the background. */
  function setMins(item: FeedItem, mins: number) {
    const before = minsOver[item.id]
    setMinsOver((m) => ({ ...m, [item.id]: mins }))
    startTransition(async () => {
      if (!(await setFeedItemMins(item.id, mins).catch(() => false))) {
        setMinsOver((m) => {
          const n = { ...m }
          if (before) n[item.id] = before
          else delete n[item.id]
          return n
        })
        setError('That did not save. Try again in a moment.')
      }
    })
  }

  // Focus mode works through what the filters show, in order; "Next" passes an item for this session.
  const queue = shown.filter((i) => !passed.has(i.id))

  const filtersOn = group !== 'all' || quick || brand !== 'all' || needle !== ''
  // Brands with open items, most items first.
  const brands = Object.entries(open.reduce<Record<string, number>>((m, i) => ((m[i.brand] = (m[i.brand] ?? 0) + 1), m), {})).sort((a, b) => b[1] - a[1])
  const over = needs - freeMins

  return (
    <section aria-labelledby="feed-h" className="min-w-0 rounded-2xl border border-border bg-panel p-5 md:p-6">
      {/* Time budget */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="feed-h" className="font-heading text-lg font-semibold">Feed</h2>
        <span className="flex items-center gap-3">
          <span className="hidden text-xs text-muted-foreground sm:inline">Email → Sales → Jobs → Marketing → Client → Other</span>
          <button
            type="button"
            onClick={() => {
              setPassed(new Set())
              setFocus(true)
            }}
            disabled={shown.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary-line bg-primary-deep px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/15 disabled:opacity-40"
          >
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <circle cx="8" cy="8" r="5.5" />
              <circle cx="8" cy="8" r="2" fill="currentColor" />
            </svg>
            Focus
          </button>
        </span>
      </div>
      <p className="mt-2 text-[15px]">
        {dayOver ? (
          <>The work day is over. </>
        ) : (
          <>
            You have <b className="font-semibold tabular-nums">{fmtMins(freeMins)}</b> free today{' '}
            <span className="text-muted-foreground">(10–6 minus meetings)</span>.{' '}
          </>
        )}
        The feed needs <b className="font-semibold tabular-nums">{fmtMins(needs)}</b>.
        {!dayOver && over > 0 && <span className="text-warning"> That is {fmtMins(over)} more than you have. Snooze or skip the rest.</span>}
      </p>
      {doneToday.length > 0 && (
        <p className="mt-1 text-xs text-muted-foreground">
          Done today: <b className="font-medium text-foreground tabular-nums">{doneToday.filter((r) => r.status === 'done').length}</b> items · {fmtMins(doneMins)}
        </p>
      )}

      {/* Search + filters */}
      <div className="mt-4 grid gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative min-w-0 flex-1 basis-56">
            <span className="sr-only">Search the feed</span>
            <svg viewBox="0 0 16 16" className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <circle cx="7" cy="7" r="4.5" />
              <path d="m10.5 10.5 3 3" />
            </svg>
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search title, sender, company…"
              className="w-full rounded-lg border border-border bg-well py-2 pl-8 pr-3 text-sm placeholder:text-muted-foreground/70 focus-visible:border-primary focus-visible:outline-none"
            />
          </label>
          <div role="group" aria-label="Show" className="inline-flex rounded-lg border border-border p-0.5 text-[13px]">
            {([['open', 'Open', open.length], ['done', 'Done today', doneToday.length], ['snoozed', 'Snoozed', snoozed.length]] as const).map(([id, label, n]) => (
              <button
                key={id}
                type="button"
                aria-pressed={view === id}
                onClick={() => setView(id)}
                className={`rounded-md px-2.5 py-1 transition-colors ${view === id ? 'bg-well text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {label} <span className="tabular-nums text-muted-foreground/70">{n}</span>
              </button>
            ))}
          </div>
        </div>

        {view === 'open' && (
          <div className="flex flex-wrap items-center gap-1.5">
            <Pill on={group === 'all'} onClick={() => setGroup('all')}>All <span className="tabular-nums opacity-60">{open.length}</span></Pill>
            {FEED_GROUPS.map((g) => (
              <Pill key={g.id} on={group === g.id} onClick={() => setGroup(group === g.id ? 'all' : g.id)} disabled={groupCounts[g.id] === 0 && group !== g.id}>
                {g.label} <span className="tabular-nums opacity-60">{groupCounts[g.id]}</span>
              </Pill>
            ))}
            <span className="mx-1 hidden h-4 w-px bg-border sm:inline-block" aria-hidden="true" />
            <Pill on={quick} onClick={() => setQuick(!quick)}>Under 15 min</Pill>
            <label className="inline-flex items-center">
              <span className="sr-only">Brand</span>
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className={`rounded-full border bg-transparent px-2.5 py-1 text-xs focus-visible:border-primary focus-visible:outline-none ${brand === 'all' ? 'border-border text-muted-foreground' : 'border-primary-line text-primary'}`}
              >
                <option value="all">All brands</option>
                {brands.map(([b, n]) => (
                  <option key={b} value={b}>{b} ({n})</option>
                ))}
              </select>
            </label>
            {filtersOn && (
              <button type="button" onClick={() => { setGroup('all'); setQuick(false); setBrand('all'); setQ('') }} className="ml-1 text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground">
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      <p aria-live="polite" className="text-xs text-danger empty:hidden">{error}</p>

      {focus && (
        <Focus
          key={queue[0]?.id ?? 'empty'}
          item={queue[0]}
          left={queue.length}
          leftMins={queue.reduce((t, i) => t + i.mins, 0)}
          onAct={(i, st) => act(i, st)}
          onNext={(i) => setPassed((p) => new Set(p).add(i.id))}
          onMins={(i, m) => setMins(i, m)}
          onClose={() => setFocus(false)}
        />
      )}

      {/* Open list, by group */}
      {view === 'open' && (
        <div className="mt-2">
          {open.length === 0 && <p className="mt-6 text-sm text-muted-foreground">All clear. Nothing is left in the feed.</p>}
          {open.length > 0 && shown.length === 0 && <p className="mt-6 text-sm text-muted-foreground">Nothing matches these filters.</p>}
          {FEED_GROUPS.map((g) => {
            const list = shown.filter((i) => i.group === g.id)
            if (!list.length) return null
            const all = expanded.has(g.id) || needle !== ''
            const visible = all ? list : list.slice(0, SHOW_PER_GROUP)
            return (
              <div key={g.id} className="mt-5 first:mt-3">
                <div className="flex items-baseline justify-between gap-3 border-b border-border pb-1.5">
                  <h3 className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                    {g.label} <span className="tabular-nums text-muted-foreground/60">{list.length}</span>
                  </h3>
                  <span className="text-xs tabular-nums text-muted-foreground">~{fmtMins(list.reduce((t, i) => t + i.mins, 0))}</span>
                </div>
                <ul>
                  {visible.map((i) => (
                    <Row key={i.id} item={i} onAct={(s) => act(i, s)} onMins={(m) => setMins(i, m)} />
                  ))}
                </ul>
                {list.length > visible.length && (
                  <button type="button" onClick={() => setExpanded(new Set(expanded).add(g.id))} className="mt-1 text-[13px] text-muted-foreground hover:text-foreground">
                    Show {list.length - visible.length} more
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Done today / Snoozed */}
      {view !== 'open' && (
        <ul className="mt-3">
          {(view === 'done' ? doneToday : snoozed).length === 0 && (
            <li className="py-4 text-sm text-muted-foreground">{view === 'done' ? 'Nothing done yet today.' : 'Nothing is snoozed.'}</li>
          )}
          {(view === 'done' ? doneToday : snoozed).map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border py-2.5 text-[13.5px] first:border-t-0">
              <span className="min-w-0 flex-1">
                {r.title || r.id}{' '}
                <span className="text-xs text-muted-foreground">
                  · {FEED_GROUPS.find((g) => g.id === r.grp)?.label ?? r.grp}
                  {r.status === 'skipped' && ' · skipped'}
                  {r.status === 'snoozed' && r.until && ` · back ${r.until === nyTomorrow(today) ? 'tomorrow' : r.until}`}
                </span>
              </span>
              <span className="text-xs tabular-nums text-muted-foreground">{fmtMins(r.mins)}</span>
              <button
                type="button"
                onClick={() => act({ id: r.id, title: r.title, group: r.grp as FeedGroup, mins: r.mins, job: items.find((i) => i.id === r.id)?.job }, null)}
                className="rounded-md border border-border px-2 py-0.5 text-[11px] text-muted-foreground hover:border-primary hover:text-foreground"
              >
                {r.status === 'snoozed' ? 'Bring back' : 'Undo'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function Pill({ on, onClick, disabled, children }: { on: boolean; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors disabled:opacity-40 ${
        on ? 'border-primary-line bg-primary-deep text-primary' : 'border-border text-muted-foreground hover:text-foreground'
      }`}
    >
      {children}
    </button>
  )
}

const MIN_CHOICES = [2, 5, 10, 15, 20, 30, 45, 60, 90, 120]

/** "~15m" that is also a picker: choose your own estimate for this item. */
function MinsPicker({ item: i, onMins, big = false }: { item: FeedItem; onMins: (m: number) => void; big?: boolean }) {
  const choices = MIN_CHOICES.includes(i.mins) ? MIN_CHOICES : [...MIN_CHOICES, i.mins].sort((a, b) => a - b)
  return (
    <label className="relative inline-flex">
      <span className="sr-only">Time estimate</span>
      <select
        value={i.mins}
        onChange={(e) => onMins(Number(e.target.value))}
        title={i.minsSet ? 'Your estimate. Pick another to change it.' : 'Default estimate. Pick your own.'}
        className={`cursor-pointer appearance-none rounded-full tabular-nums transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary ${
          big ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-[11px]'
        } ${i.minsSet ? 'bg-primary-deep text-primary' : 'bg-muted text-muted-foreground'}`}
      >
        {choices.map((m) => (
          <option key={m} value={m}>~{fmtMins(m)}</option>
        ))}
      </select>
    </label>
  )
}

/** Focus mode: one item at a time, big, with a countdown from its estimate. Done moves to the next. */
function Focus({
  item: i,
  left,
  leftMins,
  onAct,
  onNext,
  onMins,
  onClose,
}: {
  item: FeedItem | undefined
  left: number
  leftMins: number
  onAct: (i: FeedItem, s: FeedStatus) => void
  onNext: (i: FeedItem) => void
  onMins: (i: FeedItem, m: number) => void
  onClose: () => void
}) {
  const total = (i?.mins ?? 0) * 60
  const [secs, setSecs] = useState(total)
  const [running, setRunning] = useState(true)
  const rang = useRef(false)

  useEffect(() => setSecs(total), [total])
  useEffect(() => {
    if (!running || !i) return
    const t = setInterval(() => setSecs((x) => x - 1), 1000)
    return () => clearInterval(t)
  }, [running, i])
  useEffect(() => {
    if (secs <= 0 && !rang.current && i) {
      rang.current = true
      chime([SCALE[4], SCALE[2]], 0.18)
    }
  }, [secs, i])
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', key)
    return () => document.removeEventListener('keydown', key)
  }, [onClose])

  const over = secs < 0
  const mm = Math.floor(Math.abs(secs) / 60)
  const ss = String(Math.abs(secs) % 60).padStart(2, '0')

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-background/90 p-4 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby="focus-h" className="w-full max-w-2xl rounded-2xl border border-border bg-panel p-6 shadow-2xl md:p-8">
        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>
            Focus · <b className="font-semibold tabular-nums text-foreground">{left}</b> left · ~{fmtMins(leftMins)}
          </span>
          <button type="button" onClick={onClose} className="rounded-md px-2 py-1 hover:bg-well hover:text-foreground">
            Exit <kbd className="ml-1 rounded border border-border px-1 text-[10px]">Esc</kbd>
          </button>
        </div>

        {!i ? (
          <div className="py-12 text-center">
            <p className="font-heading text-2xl font-semibold">All clear.</p>
            <p className="mt-2 text-sm text-muted-foreground">Nothing left in this view. Nice work.</p>
          </div>
        ) : (
          <>
            <p className="mt-6 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className={brandChip(i.brand)}>{i.brand}</span>
              {i.meta && <span>{i.meta}</span>}
            </p>
            <h2 id="focus-h" className="mt-2 font-heading text-2xl font-semibold leading-snug wrap-anywhere md:text-[28px]">
              {i.title}
            </h2>
            {i.detail && <p className="mt-2 text-[15px] text-muted-foreground">{i.detail}</p>}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {i.href && (
                <a href={i.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs hover:border-primary">
                  {i.hrefLabel ?? 'Open'} <span aria-hidden="true">↗</span>
                </a>
              )}
              {i.link2 && (
                <a href={i.link2.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-md border border-primary-line px-2.5 py-1.5 text-xs text-primary hover:bg-primary-deep">
                  {i.link2.label} <span aria-hidden="true">↗</span>
                </a>
              )}
              {i.say && <CopyButton text={i.say} />}
            </div>

            {/* Timer */}
            <div className="mt-6 rounded-xl bg-well p-4">
              <div className="flex items-center justify-between gap-3">
                <p className={`font-heading text-4xl font-semibold tabular-nums ${over ? 'text-warning' : ''}`} aria-live="off">
                  {over ? '+' : ''}
                  {mm}:{ss}
                </p>
                <div className="flex items-center gap-2">
                  <MinsPicker item={i} onMins={(m) => onMins(i, m)} big />
                  <button type="button" onClick={() => setRunning(!running)} className="rounded-md border border-border px-3 py-1.5 text-xs hover:border-primary">
                    {running ? 'Pause' : 'Start'}
                  </button>
                </div>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted-foreground/20" aria-hidden="true">
                <span className={`block h-full transition-[width] duration-1000 ease-linear ${over ? 'bg-warning' : 'bg-primary'}`} style={{ width: `${total ? Math.min(100, ((total - secs) / total) * 100) : 0}%` }} />
              </div>
              {over && <p className="mt-2 text-xs text-warning">Over the estimate. Finish, snooze or move on.</p>}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => onAct(i, 'done')}
                autoFocus
                className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-background transition-transform hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                {i.doneLabel ?? 'Done'}
              </button>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => onAct(i, 'snoozed')} className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-well hover:text-foreground">
                  Snooze
                </button>
                <button type="button" onClick={() => onAct(i, 'skipped')} className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-well hover:text-foreground">
                  Skip
                </button>
                <button type="button" onClick={() => onNext(i)} className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-well hover:text-foreground">
                  Next →
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function Row({ item: i, onAct, onMins }: { item: FeedItem; onAct: (s: FeedStatus) => void; onMins: (m: number) => void }) {
  return (
    <li className="grid grid-cols-[8px_minmax(0,1fr)] gap-x-3 border-t border-border py-3.5 first:border-t-0">
      <i className={`mt-1.75 h-2 w-2 rounded-full ${DOT[i.level]}`} aria-label={i.level === 'red' ? 'urgent' : undefined} />
      <div className="min-w-0">
        <p className="flex min-w-0 items-center gap-1.5 text-[11.5px] text-muted-foreground">
          <span className={brandChip(i.brand)}>{i.brand}</span>
          {i.meta && <span className="truncate">{i.meta}</span>}
        </p>
        <h4 className="mt-0.5 text-[14.5px] font-medium leading-snug wrap-anywhere">
          {i.href ? (
            <a href={i.href} target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:underline">
              {i.title}
            </a>
          ) : (
            i.title
          )}
        </h4>
        {i.detail && <p className="mt-0.5 max-w-[78ch] text-[13px] text-muted-foreground">{i.detail}</p>}
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <MinsPicker item={i} onMins={onMins} />
            {i.href && i.hrefLabel && (
              <a href={i.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground hover:border-primary hover:text-foreground">
                {i.hrefLabel} <span aria-hidden="true">↗</span>
              </a>
            )}
            {i.link2 && (
              <a href={i.link2.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-md border border-primary-line px-2 py-1 text-[11px] text-primary hover:bg-primary-deep">
                {i.link2.label} <span aria-hidden="true">↗</span>
              </a>
            )}
            {i.say && <CopyButton text={i.say} />}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onAct('done')}
              title={i.job ? `Marks it ${i.job.done} in the tracker` : /^(mail|form):/.test(i.id) ? 'Done. Also marks it read in Gmail within the hour.' : 'Done'}
              className="rounded-md border border-primary-line px-2.5 py-1 text-[11px] font-medium text-primary transition-colors hover:bg-primary-deep focus-visible:outline-2 focus-visible:outline-primary"
            >
              {i.doneLabel ?? 'Done'}
            </button>
            <button type="button" onClick={() => onAct('snoozed')} title="Hide until tomorrow" className="rounded-md px-2 py-1 text-[11px] text-muted-foreground hover:bg-well hover:text-foreground">
              Snooze
            </button>
            <button type="button" onClick={() => onAct('skipped')} title={i.job ? `Marks it ${i.job.skip} in the tracker` : 'Hide it for good'} className="rounded-md px-2 py-1 text-[11px] text-muted-foreground hover:bg-well hover:text-foreground">
              Skip
            </button>
          </div>
        </div>
      </div>
    </li>
  )
}
