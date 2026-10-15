'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import type { FeedStatus, FeedStatusRow, Level } from '@/lib/admin-dashboard'
import { FEED_GROUPS, fmtMins, nyDate, nyTomorrow, type FeedGroup, type FeedItem } from '@/lib/dash-feed'
import { setFeedItemMins, setFeedItemStatus, updateTodoItem } from '@/app/audit/admin/dashboard/actions'
import { SCALE, chime } from '@/lib/dash-sound'
import { CopyButton } from './DashParts'
import { brandChip } from '@/lib/dash-format'
import { feedDomId, useFilters } from '@/lib/dash-console'
import { emitFeedCounts, emitTodoChange, emitUnwin, emitWin, onTodoChange } from '@/lib/dash-wins'

/* The Feed (2026-10-15): one list in Chris's morning order — Email → Sales →
 * Jobs → Marketing → Client work → Other. Red items jump to the top of their
 * group. Done / Snooze to tomorrow / Skip write to dash_feed_status (and job
 * items to job_leads). Search + filters are local to the page. */

const LVL: Record<Level, number> = { red: 0, amber: 1, green: 2, plain: 3 }
const GROUP_ORDER = Object.fromEntries(FEED_GROUPS.map((g, i) => [g.id, i])) as Record<FeedGroup, number>
const SHOW_PER_GROUP = 8

export function DashFeed({
  items,
  statuses,
}: {
  items: FeedItem[]
  statuses: FeedStatusRow[]
}) {
  const today = nyDate()
  const [rows, setRows] = useState(() => new Map(statuses.map((s) => [s.id, s])))
  // Search, filters and the view come from the console.
  const { q, group, setGroup, quick, brand, showSpam, view, setView, setMeta, jump, focusReq, api } = useFilters()
  const [expanded, setExpanded] = useState<Set<FeedGroup>>(new Set())
  const [error, setError] = useState('')
  const [, startTransition] = useTransition()
  const [minsOver, setMinsOver] = useState<Record<string, number>>({})
  const [focus, setFocus] = useState(false)
  // Changes made in the To-do card to labeled to-dos (text, label, hidden).
  const [todoOver, setTodoOver] = useState<Record<string, { title?: string; group?: FeedGroup; gone?: boolean }>>({})
  // To-dos labeled after the page loaded: added to the Feed at once.
  const [extraTodos, setExtraTodos] = useState<FeedItem[]>([])
  useEffect(
    () =>
      onTodoChange(({ id, patch }) => {
        if (!patch.label || !patch.text || patch.done === true || patch.archived === true || patch.deleted || items.some((i) => i.todo === id)) return
        setExtraTodos((x) =>
          x.some((i) => i.todo === id)
            ? x
            : [...x, { id: `todo:${id}`, todo: id, group: patch.label as FeedGroup, level: 'plain', title: patch.text!, brand: 'To-do', meta: 'your to-do', mins: 15, say: `help me do this to-do: ${patch.text}`, rank: 3 }],
        )
      }),
    [items],
  )
  useEffect(
    () =>
      onTodoChange(({ id, patch }) =>
        setTodoOver((o) => ({
          ...o,
          [id]: {
            ...o[id],
            ...(patch.text !== undefined && { title: patch.text }),
            ...(patch.label !== undefined && (patch.label ? { group: patch.label as FeedGroup, gone: false } : { gone: true })),
            ...((patch.done === true || patch.archived === true || patch.deleted || (patch.day !== undefined && patch.day > today)) && { gone: true }),
            ...((patch.done === false || patch.archived === false || (patch.day !== undefined && patch.day <= today)) && { gone: false }),
          },
        })),
      ),
    [today],
  )
  const [passed, setPassed] = useState<Set<string>>(new Set())

  const hidden = (id: string) => {
    const r = rows.get(id)
    if (!r) return false
    return r.status !== 'snoozed' || (r.until ?? '') > today
  }

  const open = useMemo(
    () =>
      [...items, ...extraTodos]
        .map((i) => (minsOver[i.id] ? { ...i, mins: minsOver[i.id], minsSet: true } : i))
        .map((i) => (i.todo && todoOver[i.todo] ? { ...i, ...(todoOver[i.todo].title && { title: todoOver[i.todo].title! }), ...(todoOver[i.todo].group && { group: todoOver[i.todo].group! }) } : i))
        .filter((i) => !hidden(i.id) && (showSpam || !i.spam) && !(i.todo && todoOver[i.todo]?.gone))
        .sort((a, b) => GROUP_ORDER[a.group] - GROUP_ORDER[b.group] || (a.level === 'red' ? 0 : 1) - (b.level === 'red' ? 0 : 1) || a.rank - b.rank || LVL[a.level] - LVL[b.level]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, extraTodos, rows, minsOver, showSpam, todoOver],
  )
  const spamCount = items.filter((i) => i.spam && !hidden(i.id)).length
  // Tab badges + the top line update live as items are done (review 2026-10-15).
  useEffect(() => {
    emitFeedCounts({
      open: open.filter((i) => !i.spam).length,
      urgent: open.filter((i) => i.level === 'red').length,
      email: open.filter((i) => i.group === 'email').length,
      sales: open.filter((i) => i.group === 'sales' && !i.spam).length,
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

  function act(item: Pick<FeedItem, 'id' | 'title' | 'group' | 'mins' | 'job'> & { brand?: string }, status: FeedStatus | null, note = '') {
    const prev = rows.get(item.id)
    // Today's wins card: a Done is a win; undoing a Done takes it back.
    if (status === 'done') emitWin({ id: item.id, title: item.title, mins: item.mins, brand: item.brand, note: note || undefined, at: new Date().toISOString() })
    else if (prev?.status === 'done') emitUnwin(item.id)
    const next = new Map(rows)
    // Snooze hides at once: set tomorrow's date now instead of waiting for the server.
    if (status) next.set(item.id, { id: item.id, status, until: status === 'snoozed' ? nyTomorrow(today) : null, title: item.title, grp: item.group, mins: item.mins, brand: item.brand, note, at: new Date().toISOString() })
    else next.delete(item.id)
    setRows(next)
    setError('')

    // A labeled to-do: the to-do itself is the record. Done ticks it, Skip archives it, Snooze moves it to tomorrow.
    if (item.id.startsWith('todo:')) {
      const todoId = item.id.slice(5)
      const patch =
        status === 'done' ? { done: true }
        : status === 'skipped' ? { archived: true }
        : status === 'snoozed' ? { day: nyTomorrow(today) }
        : prev?.status === 'done' ? { done: false }
        : prev?.status === 'skipped' ? { archived: false }
        : { day: today }
      emitTodoChange({ id: todoId, patch })
      startTransition(async () => {
        if (!(await updateTodoItem(todoId, patch).catch(() => false))) {
          setRows((cur) => {
            const back = new Map(cur)
            if (prev) back.set(item.id, prev)
            else back.delete(item.id)
            return back
          })
          if (status === 'done') emitUnwin(item.id)
          setError('That did not save. Try again in a moment.')
        }
      })
      return
    }

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
        note,
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

  // Brands with open items, most items first.
  const brands = Object.entries(open.reduce<Record<string, number>>((m, i) => ((m[i.brand] = (m[i.brand] ?? 0) + 1), m), {})).sort((a, b) => b[1] - a[1])
  // Display order, so "done 3" in the console means the 3rd item you can see.
  const ordered = FEED_GROUPS.flatMap((g) => {
    const list = shown.filter((i) => i.group === g.id)
    return expanded.has(g.id) || needle !== '' ? list : list.slice(0, SHOW_PER_GROUP)
  })
  const numberOf = new Map(ordered.map((i, n) => [i.id, n + 1]))

  // Tell the console what is in the Feed, for autocomplete and the view counts.
  const brandsKey = brands.map(([b, n]) => `${b}:${n}`).join('|')
  useEffect(() => {
    setMeta({
      items: open.filter((i) => !i.spam).map((i) => ({ id: i.id, title: i.title, brand: i.brand, group: i.group, mins: i.mins })),
      groupCounts,
      brands,
      openCount: open.filter((i) => !i.spam).length,
      doneCount: doneToday.length,
      snoozedCount: snoozed.length,
      spamCount,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, brandsKey, doneToday.length, snoozed.length, spamCount])

  // Let the console and the Due list act on Feed items (same optimistic path as the buttons).
  const latest = useRef({ open, ordered, act })
  latest.current = { open, ordered, act }
  useEffect(() => {
    api.current = {
      act: (id, status) => {
        const it = latest.current.open.find((i) => i.id === id)
        if (it) latest.current.act(it, status)
      },
      doneNth: (n) => {
        const it = latest.current.ordered[n - 1]
        if (!it) return false
        latest.current.act(it, 'done')
        return true
      },
    }
    return () => {
      api.current = null
    }
  }, [api])

  // `focus <group>` in the console opens Focus mode.
  useEffect(() => {
    if (focusReq > 0) {
      setPassed(new Set())
      setFocus(true)
    }
  }, [focusReq])

  // Picking an item in the console scrolls to it and flashes it.
  useEffect(() => {
    if (!jump) return
    const it = latest.current.open.find((i) => i.id === jump.id)
    if (!it) return
    setView('open')
    setExpanded((e) => new Set(e).add(it.group))
    if (group !== 'all' && group !== it.group) setGroup('all')
    const t = setTimeout(() => {
      const el = document.getElementById(feedDomId(jump.id))
      if (!el) return
      el.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' })
      el.classList.remove('nx-flash')
      void el.offsetWidth
      el.classList.add('nx-flash')
      setTimeout(() => el.classList.remove('nx-flash'), 1700)
    }, 80)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jump])

  return (
    <section aria-labelledby="feed-h" className="nx-box min-w-0 p-4 md:px-7 md:py-6.5">
      <div className="border-b border-border pb-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="feed-h" className="text-[22px] font-normal tracking-[0.02em]">Feed</h2>
        <button
          type="button"
          onClick={() => {
            setPassed(new Set())
            setFocus(true)
          }}
          disabled={shown.length === 0}
          className="nx-prim"
        >
          Focus
        </button>
      </div>
      {doneToday.length > 0 && (
        <p className="mt-2 text-xs text-muted-foreground">
          Done today: <b className="font-medium text-foreground tabular-nums">{doneToday.filter((r) => r.status === 'done').length}</b> items · {fmtMins(doneMins)}
        </p>
      )}
      </div>

      <p aria-live="polite" className="text-xs text-danger empty:hidden">{error}</p>

      {focus && (
        <Focus
          key={queue[0]?.id ?? 'empty'}
          item={queue[0]}
          left={queue.length}
          leftMins={queue.reduce((t, i) => t + i.mins, 0)}
          onAct={(i, st, note) => act(i, st, note)}
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
              <div key={g.id} className="mt-7 first:mt-5">
                <div className="-mx-3 flex items-center justify-between gap-3 border-y border-[#1f3a2b] bg-[#0c1511] px-3 py-2.5">
                  <h3 className="text-[13px] font-medium uppercase tracking-[0.18em] text-[#a8f2c8]">
                    {String(FEED_GROUPS.findIndex((x) => x.id === g.id) + 1).padStart(2, '0')} · {g.label}{' '}
                    <span className="text-[#8d929a]">{list.length}</span>
                  </h3>
                  <span className="text-xs tabular-nums text-[#8d929a]">~{fmtMins(list.reduce((t, i) => t + i.mins, 0))}</span>
                </div>
                <ul>
                  {visible.map((i) => (
                    <Row key={i.id} item={i} n={numberOf.get(i.id)} onAct={(s, note) => act(i, s, note)} onMins={(m) => setMins(i, m)} />
                  ))}
                </ul>
                {list.length > visible.length && (
                  <button type="button" onClick={() => setExpanded(new Set(expanded).add(g.id))} className="nx-ghost mt-2">
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
            <li key={r.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-[#323840] py-3 text-[14px] first:border-t-0">
              <span className="min-w-0 flex-1">
                {r.title || r.id}
                {r.note && <span className="block text-xs text-foreground/80">✎ {r.note}</span>}{' '}
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
                className="nx-ghost"
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
        className={`min-h-11 cursor-pointer appearance-none bg-transparent tabular-nums tracking-[0.1em] transition-colors hover:text-foreground md:min-h-0 ${
          big ? 'px-3 py-1 text-sm' : 'px-1 py-0.5 text-[11px] uppercase'
        } ${i.minsSet ? 'text-primary' : 'text-[#a6aab2]'}`}
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
  onAct: (i: FeedItem, s: FeedStatus, note?: string) => void
  onNext: (i: FeedItem) => void
  onMins: (i: FeedItem, m: number) => void
  onClose: () => void
}) {
  const total = (i?.mins ?? 0) * 60
  const [secs, setSecs] = useState(total)
  const [running, setRunning] = useState(true)
  const [note, setNote] = useState('')
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
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-background/90 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby="focus-h" className="nx-box w-full max-w-2xl p-6 shadow-2xl md:p-8">
        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>
            Focus · <b className="font-semibold tabular-nums text-foreground">{left}</b> left · ~{fmtMins(leftMins)}
          </span>
          <button type="button" onClick={onClose} className="nx-ghost">
            Exit <kbd className="ml-1 rounded border border-border px-1 text-[10px]">Esc</kbd>
          </button>
        </div>

        {!i ? (
          <div className="py-12 text-center">
            <p className="text-2xl font-normal">All clear.</p>
            <p className="mt-2 text-sm text-muted-foreground">Nothing left in this view. Nice work.</p>
          </div>
        ) : (
          <>
            <p className="mt-6 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className={brandChip(i.brand)}>{i.brand}</span>
              {i.meta && <span>{i.meta}</span>}
            </p>
            <h2 id="focus-h" className="mt-2 text-xl font-normal leading-snug tracking-[0.02em] text-[#ece9e2] wrap-anywhere md:text-[26px]">
              {i.title}
            </h2>
            {i.detail && <p className="mt-2 text-[15px] text-muted-foreground">{i.detail}</p>}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {i.href && (
                <a href={i.href} target="_blank" rel="noopener noreferrer" className="nx-ghost">
                  {i.hrefLabel ?? 'Open'} <span aria-hidden="true">↗</span>
                </a>
              )}
              {i.link2 && (
                <a href={i.link2.href} target="_blank" rel="noopener noreferrer" className="nx-ghost !text-primary">
                  {i.link2.label} <span aria-hidden="true">↗</span>
                </a>
              )}
              {i.say && <CopyButton text={i.say} />}
            </div>

            {/* Timer */}
            <div className="mt-6 border border-border bg-well p-4">
              <div className="flex items-center justify-between gap-3">
                <p className={`text-4xl font-light tabular-nums ${over ? 'text-warning' : 'nx-num'}`} aria-live="off">
                  {over ? '+' : ''}
                  {mm}:{ss}
                </p>
                <div className="flex items-center gap-2">
                  <MinsPicker item={i} onMins={(m) => onMins(i, m)} big />
                  <button type="button" onClick={() => setRunning(!running)} className="nx-ghost">
                    {running ? 'Pause' : 'Start'}
                  </button>
                </div>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden bg-muted-foreground/20" aria-hidden="true">
                <span className={`block h-full transition-[width] duration-1000 ease-linear ${over ? 'bg-warning' : 'bg-primary'}`} style={{ width: `${total ? Math.min(100, ((total - secs) / total) * 100) : 0}%` }} />
              </div>
              {over && <p className="mt-2 text-xs text-warning">Over the estimate. Finish, snooze or move on.</p>}
            </div>

            <label className="mt-5 block">
              <span className="text-xs text-muted-foreground">Note when done (optional)</span>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onAct(i, 'done', note)}
                maxLength={1000}
                placeholder="e.g. Followed up by email, waiting on reply"
                className="mt-1 min-h-11 w-full border border-border bg-well px-3 py-2 text-sm focus-visible:border-primary focus-visible:outline-none md:min-h-0"
              />
            </label>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => onAct(i, 'done', note)}
                autoFocus
                className="nx-prim !px-6 !py-3 !text-sm"
              >
                {i.doneLabel ?? 'Done'}
              </button>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => onAct(i, 'snoozed')} className="nx-ghost !border-transparent">
                  Snooze
                </button>
                <button type="button" onClick={() => onAct(i, 'skipped')} className="nx-ghost !border-transparent">
                  Skip
                </button>
                <button type="button" onClick={() => onNext(i)} className="nx-ghost !border-transparent">
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

function Row({ item: i, n, onAct, onMins }: { item: FeedItem; n?: number; onAct: (s: FeedStatus, note?: string) => void; onMins: (m: number) => void }) {
  const [noting, setNoting] = useState(false)
  const [note, setNote] = useState('')
  return (
    <li id={feedDomId(i.id)} className="-mx-3 border-b border-[#323840] px-3 py-4 transition-colors hover:bg-[rgba(95,211,148,0.06)] hover:shadow-[inset_2px_0_0_#5fd394] focus-within:bg-[rgba(95,211,148,0.06)] focus-within:shadow-[inset_2px_0_0_#5fd394] motion-reduce:transition-none">
      <div className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1">
        {n !== undefined && <span className="nx-lab tabular-nums" title={`"done ${n}" in the console marks this one done`} aria-hidden="true">{String(n).padStart(2, '0')}</span>}
        <span className={brandChip(i.brand)}>{i.brand}</span>
        {i.level === 'red' && <span className="text-[11px] uppercase tracking-[0.16em] text-danger">urgent</span>}
        {i.meta && <span className="nx-cond min-w-0 truncate text-[13px] text-[#8d929a]">{i.meta}</span>}
        {i.spam && <span className="shrink-0 border border-warning/50 px-1.5 py-px text-[11px] text-warning">likely spam: {i.spam}</span>}
      </div>
      <h4 className="mt-2 text-base font-normal leading-[1.45] tracking-[0.02em] text-[#ece9e2] wrap-anywhere">
        {i.href ? (
          <a href={i.href} target="_blank" rel="noopener noreferrer" className="hover:underline">
            {i.title}
          </a>
        ) : (
          i.title
        )}
      </h4>
      {i.detail && <p className="mt-1 max-w-[78ch] text-[13px] text-muted-foreground">{i.detail}</p>}
      <div className="mt-2.5 flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center">
      <div className="flex flex-wrap items-center gap-2">
        <MinsPicker item={i} onMins={onMins} />
        {i.href && i.hrefLabel && (
          <a href={i.href} target="_blank" rel="noopener noreferrer" className="nx-ghost">
            {i.hrefLabel} <span aria-hidden="true">↗</span>
          </a>
        )}
        {i.link2 && (
          <a href={i.link2.href} target="_blank" rel="noopener noreferrer" className="nx-ghost !text-primary">
            {i.link2.label} <span aria-hidden="true">↗</span>
          </a>
        )}
        {i.say && <CopyButton text={i.say} />}
      </div>
      {/* Phone: one full-width row of actions, Done twice as wide. Desktop: pushed to the right. */}
      <div className="flex items-stretch gap-2 md:ml-auto [&>button]:flex-1 md:[&>button]:flex-none">
        <button
          type="button"
          onClick={() => onAct('done')}
          title={i.job ? `Marks it ${i.job.done} in the tracker` : /^(mail|form):/.test(i.id) ? 'Done. Also marks it read in Gmail within the hour.' : 'Done'}
          className="nx-ghost max-md:!flex-[2] !border-primary !text-[#a8f2c8]"
        >
          {i.doneLabel ?? 'Done'}
        </button>
        <button type="button" onClick={() => setNoting(!noting)} aria-expanded={noting} title="Done, with a note" className="nx-ghost">
          ✎<span className="sr-only">Done with a note</span>
        </button>
        <button type="button" onClick={() => onAct('snoozed')} title="Hide until tomorrow" className="nx-ghost">
          Snooze
        </button>
        <button type="button" onClick={() => onAct('skipped')} title={i.job ? `Marks it ${i.job.skip} in the tracker` : 'Hide it for good'} className="nx-ghost">
          Skip
        </button>
      </div>
      </div>
      {noting && (
        <form
          className="mt-2.5 flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            onAct('done', note)
          }}
        >
          <input
            autoFocus
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && setNoting(false)}
            maxLength={1000}
            placeholder="What happened? e.g. Followed up by email"
            aria-label="Note for this item"
            className="min-h-11 min-w-0 flex-1 basis-56 border border-border bg-well px-3 py-1.5 text-sm focus-visible:border-primary focus-visible:outline-none md:min-h-0"
          />
          <button type="submit" className="nx-ghost !border-primary !text-[#a8f2c8]">
            Save &amp; {(i.doneLabel ?? 'Done').toLowerCase()}
          </button>
        </form>
      )}
    </li>
  )
}
