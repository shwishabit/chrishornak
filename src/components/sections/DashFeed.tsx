'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import type { FeedStatus, FeedStatusRow, Level, TodoStep } from '@/lib/admin-dashboard'
import { FEED_GROUPS, fmtMins, nyDate, nyTomorrow, type FeedGroup, type FeedItem } from '@/lib/dash-feed'
import { addTodoItem, setFeedItemMins, setFeedItemStatus, setItemGoalAction, updateTodoItem } from '@/app/audit/admin/dashboard/actions'
import { URGENT_CAP, goalFor, withUpkeep, type Goal } from '@/lib/dash-goals'
import { SCALE, chime } from '@/lib/dash-sound'
import { CopyButton } from './DashParts'
import { FollowUp } from './DashFollowUp'
import { brandChip } from '@/lib/dash-format'
import { feedDomId, useFilters } from '@/lib/dash-console'
import { TODO_WIN_MINS, emitFeedCounts, emitTodoChange, emitUnwin, emitWin, onTodayTodos, onTodoChange, type TodayTodo } from '@/lib/dash-wins'
import { DashModal, DayPick, Menu, MenuItem, nextMonday, openCalendar } from './DashModal'

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
  goals = [],
  goalPicks = {},
}: {
  items: FeedItem[]
  statuses: FeedStatusRow[]
  /** From GOALS.md (dash_state 'goals'). Empty = no goal chips. */
  goals?: Goal[]
  /** Chris's own picks, item id → goal key (dash_item_goals). */
  goalPicks?: Record<string, string>
}) {
  const today = nyDate()
  const [rows, setRows] = useState(() => new Map(statuses.map((s) => [s.id, s])))
  const [picks, setPicks] = useState(goalPicks)
  const goalList = useMemo(() => withUpkeep(goals), [goals])
  // Search, filters and the view come from the console.
  const { q, group, setGroup, quick, brand, showSpam, view, setView, setMeta, jump, focusReq, api } = useFilters()
  const [expanded, setExpanded] = useState<Set<FeedGroup>>(new Set())
  const [error, setError] = useState('')
  const [, startTransition] = useTransition()
  const [minsOver, setMinsOver] = useState<Record<string, number>>({})
  const [focus, setFocus] = useState(false)
  // Changes made in the To-do card to labeled to-dos (text, label, hidden).
  const [todoOver, setTodoOver] = useState<Record<string, { title?: string; group?: FeedGroup; brand?: string; gone?: boolean }>>({})
  // To-dos labeled after the page loaded: added to the Feed at once.
  const [extraTodos, setExtraTodos] = useState<FeedItem[]>([])
  useEffect(
    () =>
      onTodoChange(({ id, patch }) => {
        if (!patch.label || !patch.text || patch.done === true || patch.archived === true || patch.deleted || items.some((i) => i.todo === id)) return
        setExtraTodos((x) =>
          x.some((i) => i.todo === id)
            ? x
            : [...x, { id: `todo:${id}`, todo: id, group: patch.label as FeedGroup, level: 'plain', title: patch.text!, brand: patch.brand || 'To-do', meta: 'your to-do', mins: 15, say: `help me do this to-do: ${patch.text}`, rank: 3 }],
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
            ...(patch.brand !== undefined && { brand: patch.brand || 'To-do' }),
            ...(patch.label !== undefined && (patch.label ? { group: patch.label as FeedGroup, gone: false } : { gone: true })),
            ...((patch.done === true || patch.archived === true || patch.deleted || (patch.day !== undefined && patch.day > today)) && { gone: true }),
            ...((patch.done === false || patch.archived === false || (patch.day !== undefined && patch.day <= today)) && { gone: false }),
          },
        })),
      ),
    [today],
  )
  // Ticked steps on a to-do (0022), shown at once while the save runs.
  const [stepsOver, setStepsOver] = useState<Record<string, TodoStep[]>>({})
  const [passed, setPassed] = useState<Set<string>>(new Set())
  // Today's open to-dos from the To-do card: Focus walks them first (Chris 2026-10-16).
  const [todayTodos, setTodayTodos] = useState<TodayTodo[]>([])
  useEffect(() => onTodayTodos(setTodayTodos), [])
  // Details modal (2026-10-16): the item open now, plus where it sat, so Done / Snooze / Skip step on to the next one.
  const [detail, setDetail] = useState<{ id: string; idx: number } | null>(null)

  const hidden = (id: string) => {
    const r = rows.get(id)
    if (!r) return false
    return r.status !== 'snoozed' || (r.until ?? '') > today
  }

  const open = useMemo(
    () =>
      [...items, ...extraTodos]
        .map((i) => (minsOver[i.id] ? { ...i, mins: minsOver[i.id], minsSet: true } : i))
        .map((i) => (i.todo && todoOver[i.todo] ? { ...i, ...(todoOver[i.todo].title && { title: todoOver[i.todo].title! }), ...(todoOver[i.todo].group && { group: todoOver[i.todo].group! }), ...(todoOver[i.todo].brand && { brand: todoOver[i.todo].brand! }) } : i))
        .map((i) => (stepsOver[i.todo ?? i.id] ? { ...i, steps: stepsOver[i.todo ?? i.id] } : i))
        .filter((i) => !hidden(i.id) && (showSpam || !i.spam) && !(i.todo && todoOver[i.todo]?.gone))
        .sort((a, b) => GROUP_ORDER[a.group] - GROUP_ORDER[b.group] || (a.level === 'red' ? 0 : 1) - (b.level === 'red' ? 0 : 1) || a.rank - b.rank || LVL[a.level] - LVL[b.level]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, extraTodos, rows, minsOver, showSpam, todoOver, stepsOver],
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

  /** `until`: snooze to that day instead of tomorrow (Move → To a day). */
  function act(item: Pick<FeedItem, 'id' | 'title' | 'group' | 'mins' | 'job'> & { brand?: string }, status: FeedStatus | null, note = '', until?: string) {
    const prev = rows.get(item.id)
    const back = status === 'snoozed' ? (until && until > today ? until : nyTomorrow(today)) : null
    // Today's wins card: a Done is a win; undoing a Done takes it back.
    if (status === 'done') emitWin({ id: item.id, title: item.title, mins: item.mins, brand: item.brand, note: note || undefined, at: new Date().toISOString() })
    else if (prev?.status === 'done') emitUnwin(item.id)
    const next = new Map(rows)
    // Snooze hides at once: set the date now instead of waiting for the server.
    if (status) next.set(item.id, { id: item.id, status, until: back, title: item.title, grp: item.group, mins: item.mins, brand: item.brand, note, at: new Date().toISOString() })
    else next.delete(item.id)
    setRows(next)
    setError('')

    // A labeled to-do: the to-do itself is the record. Done ticks it, Skip archives it, Snooze moves it to tomorrow.
    if (item.id.startsWith('todo:')) {
      const todoId = item.id.slice(5)
      const patch =
        status === 'done' ? { done: true }
        : status === 'skipped' ? { archived: true }
        : status === 'snoozed' ? { day: back! }
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
        ...(back && { until: back }),
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

  /** Tick or untick a to-do's step: shows at once, saves the whole list on the to-do. */
  function setSteps(item: FeedItem, steps: TodoStep[]) {
    const id = item.todo
    // A grouped Scout item (no to-do behind it): ticks are for this visit only; Scout is the record.
    if (!id) return setStepsOver((s) => ({ ...s, [item.id]: steps }))
    const before = item.steps
    setStepsOver((s) => ({ ...s, [id]: steps }))
    setError('')
    startTransition(async () => {
      if (!(await updateTodoItem(id, { steps }).catch(() => false))) {
        setStepsOver((s) => ({ ...s, [id]: before ?? [] }))
        setError('That did not save. Try again in a moment.')
      }
    })
  }

  /** Chris's goal pick for one item: shows at once, saves in the background. Picking the automatic goal clears the pick. */
  function setGoal(item: FeedItem, goal: string) {
    const before = picks[item.id]
    const auto = goalFor(item, goals, {})
    setPicks((p) => {
      const n = { ...p }
      if (goal === auto) delete n[item.id]
      else n[item.id] = goal
      return n
    })
    startTransition(async () => {
      if (!(await setItemGoalAction(item.id, goal === auto ? null : goal).catch(() => false))) {
        setPicks((p) => {
          const n = { ...p }
          if (before) n[item.id] = before
          else delete n[item.id]
          return n
        })
        setError('That did not save. Try again in a moment.')
      }
    })
  }
  /**
   * Feed → today's to-do list (Chris 2026-10-16). A to-do that was moved here goes back (no label).
   * Any other item becomes a new to-do for today, keeping its title and site, and leaves the Feed
   * (status skipped, note "Moved to the to-do list"; job items do not touch the job tracker).
   */
  function toTodo(item: FeedItem) {
    setError('')
    if (item.todo) {
      const id = item.todo
      emitTodoChange({ id, patch: { label: '', day: today, text: item.title } })
      startTransition(async () => {
        if (!(await updateTodoItem(id, { label: '', day: today }).catch(() => false))) {
          emitTodoChange({ id, patch: { label: item.group, text: item.title } })
          setError('That did not save. Try again in a moment.')
        }
      })
      return
    }
    const site = ['Chris Hornak', 'Blog Hands', 'Swift Growth'].includes(item.brand) ? item.brand : ''
    const prev = rows.get(item.id)
    setRows((cur) => new Map(cur).set(item.id, { id: item.id, status: 'skipped', until: null, title: item.title, grp: item.group, mins: item.mins, brand: item.brand, note: 'Moved to the to-do list', at: new Date().toISOString() }))
    startTransition(async () => {
      const made = await addTodoItem(item.title.slice(0, 300), '', site).catch(() => null)
      const hid = made && (await setFeedItemStatus({ id: item.id, status: 'skipped', title: item.title, group: item.group, mins: item.mins, brand: item.brand, note: 'Moved to the to-do list' }).catch(() => ({ ok: false }))).ok
      if (made) emitTodoChange({ id: made.id, patch: {}, row: made })
      if (!made || !hid) {
        setRows((cur) => {
          const back = new Map(cur)
          if (prev) back.set(item.id, prev)
          else back.delete(item.id)
          return back
        })
        setError(made ? 'Added to the to-do list, but it is still in the Feed. Skip it here.' : 'That did not save. Try again in a moment.')
      }
    })
  }
  const urgent = open.filter((i) => i.level === 'red').length

  // Today's to-dos as Focus items: they act through the same path as labeled to-dos (Done ticks, Snooze moves the day, Skip archives).
  const todoItems: FeedItem[] = todayTodos
    .map((t): FeedItem => {
      const id = `todo:${t.id}`
      return { id, todo: t.id, group: 'other', level: 'plain', title: t.text, brand: t.brand || 'To-do', meta: 'to-do for today', mins: minsOver[id] ?? TODO_WIN_MINS, minsSet: !!minsOver[id], say: `help me do this to-do: ${t.text}`, rank: 0 }
    })
    .filter((i) => !hidden(i.id) && (brand === 'all' || i.brand === brand) && (!quick || i.mins < 15) && (!needle || i.title.toLowerCase().includes(needle)))
  // Focus mode works through today's to-dos, then what the filters show, in order; "Next" passes an item for this session.
  // A group filter (`focus sales`) leaves the to-dos out.
  const queue = [...(group === 'all' ? todoItems : []), ...shown].filter((i) => !passed.has(i.id))

  // Brands with open items, most items first.
  const brands = Object.entries(open.reduce<Record<string, number>>((m, i) => ((m[i.brand] = (m[i.brand] ?? 0) + 1), m), {})).sort((a, b) => b[1] - a[1])
  // Display order, so "done 3" in the console means the 3rd item you can see.
  const ordered = FEED_GROUPS.flatMap((g) => {
    const list = shown.filter((i) => i.group === g.id)
    return expanded.has(g.id) || needle !== '' ? list : list.slice(0, SHOW_PER_GROUP)
  })
  const numberOf = new Map(ordered.map((i, n) => [i.id, n + 1]))
  // The open details item: by id, or (if it left the list some other way) whatever now sits in its place.
  const detailIdx = !detail || !ordered.length ? -1 : ordered.findIndex((i) => i.id === detail.id) >= 0 ? ordered.findIndex((i) => i.id === detail.id) : Math.min(detail.idx, ordered.length - 1)
  const detailItem = detailIdx >= 0 ? ordered[detailIdx] : undefined

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
      act: (id, status, until, note) => {
        const it = latest.current.open.find((i) => i.id === id)
        if (it) latest.current.act(it, status, note ?? '', until)
        return !!it
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
          disabled={shown.length === 0 && todoItems.length === 0}
          title={todoItems.length ? `Today’s ${todoItems.length} to-do${todoItems.length === 1 ? '' : 's'} first, then the Feed` : 'One item at a time'}
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
      {urgent > URGENT_CAP && (
        <p role="status" className="mt-3 border border-warning/50 px-3 py-2 text-[13px] text-warning">
          {urgent} urgent items are open. Keep it to {URGENT_CAP}: snooze or skip the rest, or do one now.
        </p>
      )}
      </div>

      <p aria-live="polite" className="text-xs text-danger empty:hidden">{error}</p>

      {focus && (
        <DashModal
          labelledBy="focus-h"
          top={
            <>
              Focus · <b className="font-semibold tabular-nums text-foreground">{queue.length}</b> left · ~{fmtMins(queue.reduce((t, i) => t + i.mins, 0))}
            </>
          }
          onClose={() => setFocus(false)}
        >
          <Focus
            key={queue[0]?.id ?? 'empty'}
            item={queue[0]}
            onAct={(i, st, note) => act(i, st, note)}
            onNext={(i) => setPassed((p) => new Set(p).add(i.id))}
            onMins={(i, m) => setMins(i, m)}
            onSteps={(i, s) => setSteps(i, s)}
          />
        </DashModal>
      )}

      {detailItem && (
        <DashModal
          labelledBy="detail-h"
          top={
            <>
              {FEED_GROUPS.find((g) => g.id === detailItem.group)?.label} · <span className="tabular-nums">{detailIdx + 1} of {ordered.length}</span>
            </>
          }
          onClose={() => setDetail(null)}
          onPrev={detailIdx > 0 ? () => setDetail({ id: ordered[detailIdx - 1].id, idx: detailIdx - 1 }) : null}
          onNext={detailIdx < ordered.length - 1 ? () => setDetail({ id: ordered[detailIdx + 1].id, idx: detailIdx + 1 }) : null}
        >
          <Details
            key={detailItem.id}
            item={detailItem}
            today={today}
            goal={goals.length ? { list: goalList, value: goalFor(detailItem, goals, picks), set: !!picks[detailItem.id], onPick: (g) => setGoal(detailItem, g) } : undefined}
            onMins={(m) => setMins(detailItem, m)}
            onSteps={(s) => setSteps(detailItem, s)}
            // The item leaves the list, so the one after it slides into the same place.
            onAct={(s, note, until) => {
              act(detailItem, s, note, until)
              if (ordered.length <= 1) setDetail(null)
              else setDetail({ id: (ordered[detailIdx + 1] ?? ordered[detailIdx - 1]).id, idx: Math.min(detailIdx, ordered.length - 2) })
            }}
            onToTodo={() => {
              toTodo(detailItem)
              if (ordered.length <= 1) setDetail(null)
              else setDetail({ id: (ordered[detailIdx + 1] ?? ordered[detailIdx - 1]).id, idx: Math.min(detailIdx, ordered.length - 2) })
            }}
          />
        </DashModal>
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
                    <Row
                      key={i.id}
                      item={i}
                      n={numberOf.get(i.id)}
                      today={today}
                      onOpen={() => setDetail({ id: i.id, idx: (numberOf.get(i.id) ?? 1) - 1 })}
                      onAct={(s, until) => act(i, s, '', until)}
                      onToTodo={() => toTodo(i)}
                      goal={goals.length ? { list: goalList, value: goalFor(i, goals, picks), set: !!picks[i.id], onPick: (g) => setGoal(i, g) } : undefined}
                    />
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

/** "3 of 12 done" under a to-do that has steps. */
function stepCount(steps: TodoStep[]) {
  return `${steps.filter((s) => s.done).length} of ${steps.length} done`
}

/** A to-do's checklist (0022): tick, add or remove steps; the to-do itself stays open until Done. */
function Steps({ steps, onChange }: { steps: TodoStep[]; onChange: (s: TodoStep[]) => void }) {
  const left = steps.filter((s) => !s.done).length
  const [draft, setDraft] = useState('')
  const addStep = () => {
    const text = draft.trim().slice(0, 300)
    if (!text || steps.length >= 50) return
    onChange([...steps, { text, done: false }])
    setDraft('')
  }
  return (
    <div className="mt-4 border border-border bg-well px-3 py-2">
      <p className="nx-lab tabular-nums">{steps.length ? `Steps · ${stepCount(steps)}` : 'Steps'}</p>
      <ul className="mt-1">
        {steps.map((s, n) => (
          <li key={n} className="flex items-start gap-3 border-t border-[#323840] py-2 first:border-t-0">
            <label className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-start gap-3 md:min-h-0">
              <input
                type="checkbox"
                checked={s.done}
                onChange={() => onChange(steps.map((x, k) => (k === n ? { ...x, done: !x.done } : x)))}
                className="mt-1 size-4 shrink-0 accent-primary"
              />
              <span className={`min-w-0 text-[14px] leading-snug wrap-anywhere ${s.done ? 'text-muted-foreground line-through' : 'text-[#ece9e2]'}`}>{s.text}</span>
            </label>
            {s.href && (
              <a href={s.href} target="_blank" rel="noopener noreferrer" className="nx-ghost shrink-0 !py-0.5 !text-xs">
                Open <span aria-hidden="true">↗</span>
              </a>
            )}
            <button
              type="button"
              onClick={() => onChange(steps.filter((_, k) => k !== n))}
              aria-label={`Remove step: ${s.text}`}
              title="Remove this step"
              className="nx-ghost shrink-0 !border-transparent !px-2 !py-0.5 !text-xs"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
      {steps.length > 0 && left === 0 && <p className="mt-1 text-xs text-primary">Every step is done. Press Done to close the task.</p>}
      <div className="mt-2 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addStep()}
          maxLength={300}
          placeholder="Add a step"
          aria-label="Add a step"
          className="min-h-11 min-w-0 flex-1 border border-border bg-transparent px-3 py-1.5 text-sm focus-visible:border-primary focus-visible:outline-none md:min-h-0"
        />
        <button type="button" onClick={addStep} disabled={!draft.trim()} className="nx-ghost shrink-0">
          Add
        </button>
      </div>
    </div>
  )
}

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

/** Focus mode (inside DashModal): one item at a time, big, with a countdown from its estimate. Done moves to the next. */
function Focus({
  item: i,
  onAct,
  onNext,
  onMins,
  onSteps,
}: {
  item: FeedItem | undefined
  onAct: (i: FeedItem, s: FeedStatus, note?: string) => void
  onNext: (i: FeedItem) => void
  onMins: (i: FeedItem, m: number) => void
  onSteps: (i: FeedItem, s: TodoStep[]) => void
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

  const over = secs < 0
  const mm = Math.floor(Math.abs(secs) / 60)
  const ss = String(Math.abs(secs) % 60).padStart(2, '0')

  return (
    <>
        {!i ? (
          <div className="py-12 text-center">
            <p id="focus-h" className="text-2xl font-normal">All clear.</p>
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
            {i.steps?.length ? <Steps steps={i.steps} onChange={(s) => onSteps(i, s)} /> : null}

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
    </>
  )
}

/** Feed item details (inside DashModal): everything the row no longer shows. */
function Details({
  item: i,
  today,
  goal,
  onMins,
  onSteps,
  onAct,
  onToTodo,
}: {
  item: FeedItem
  today: string
  goal?: { list: Goal[]; value: string; set: boolean; onPick: (g: string) => void }
  onMins: (m: number) => void
  onSteps: (s: TodoStep[]) => void
  onAct: (s: FeedStatus, note?: string, until?: string) => void
  onToTodo: () => void
}) {
  const [note, setNote] = useState('')
  return (
    <>
      <p className="mt-6 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className={brandChip(i.brand)}>{i.brand}</span>
        {goal && <GoalPicker {...goal} />}
        {i.level === 'red' && <span className="text-[11px] uppercase tracking-[0.16em] text-danger">urgent</span>}
        {i.meta && <span className="nx-cond">{i.meta}</span>}
        {i.spam && <span className="border border-warning/50 px-1.5 py-px text-[11px] text-warning">likely spam: {i.spam}</span>}
      </p>
      <h2 id="detail-h" className="mt-2 text-xl font-normal leading-snug tracking-[0.02em] text-[#ece9e2] wrap-anywhere md:text-[26px]">
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
        <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
          Time <MinsPicker item={i} onMins={onMins} big />
        </span>
      </div>
      {/* Any to-do can take steps; other Feed items cannot (nothing to save them on). */}
      {i.todo ? <Steps steps={i.steps ?? []} onChange={onSteps} /> : null}
      <div className="mt-3">
        <FollowUp key={i.id} title={i.title.replace(/^Follow up: /, '')} brand={i.brand} />
      </div>

      <label className="mt-6 block">
        <span className="text-xs text-muted-foreground">Note when done (optional)</span>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onAct('done', note)}
          maxLength={1000}
          placeholder="e.g. Followed up by email, waiting on reply"
          className="mt-1 min-h-11 w-full border border-border bg-well px-3 py-2 text-sm focus-visible:border-primary focus-visible:outline-none md:min-h-0"
        />
      </label>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onAct('done', note)}
          title={i.job ? `Marks it ${i.job.done} in the tracker` : /^(mail|form):/.test(i.id) ? 'Done. Also marks it read in Gmail within the hour.' : 'Done'}
          className="nx-prim !px-6 !py-3 !text-sm"
        >
          {i.doneLabel ?? 'Done'}
        </button>
        <button type="button" onClick={() => onAct('skipped')} title={i.job ? `Marks it ${i.job.skip} in the tracker` : 'Hide it for good'} className="nx-ghost !border-transparent">
          Skip
        </button>
      </div>
      {/* Move: the same choices as the row's Move menu, laid flat. */}
      <div className="mt-4 border-t border-border pt-3">
        <p className="nx-lab">Move</p>
        <div className="mt-1 grid max-w-sm gap-0.5 [&_label]:px-0 [&>button]:px-0">
          <MenuItem onClick={onToTodo}>{i.todo ? 'Back to the to-do list' : 'To my to-do list'}</MenuItem>
          <MenuItem onClick={() => onAct('snoozed')}>To tomorrow</MenuItem>
          <MenuItem onClick={() => onAct('snoozed', '', nextMonday(today))}>Next week (Mon)</MenuItem>
          <DayPick min={nyTomorrow(today)} onPick={(d) => onAct('snoozed', '', d)} />
          <DayPick
            label="To my calendar"
            min={nyTomorrow(today)}
            onPick={(d) => {
              openCalendar(i.title, d)
              onAct('snoozed', '', d)
            }}
          />
        </div>
      </div>
    </>
  )
}

/** The goal chip that is also a picker, beside the time estimate. */
export function GoalPicker({ list, value, set, onPick }: { list: Goal[]; value: string; set: boolean; onPick: (g: string) => void }) {
  return (
    <label className="relative inline-flex">
      <span className="sr-only">Goal</span>
      <select
        value={value}
        onChange={(e) => onPick(e.target.value)}
        title={set ? 'Your pick. Choose another to change it.' : 'Picked from the brand. Choose your own.'}
        className={`min-h-11 max-w-52 cursor-pointer appearance-none truncate border bg-transparent px-1.5 py-px text-[11px] uppercase tracking-[0.1em] transition-colors hover:border-primary hover:text-[#a8f2c8] md:min-h-0 ${
          value === 'upkeep' ? 'border-[#4a4f57] text-[#a6aab2]' : 'border-primary/60 text-[#a8f2c8]'
        } ${set ? 'border-solid' : 'border-dashed'}`}
      >
        {list.map((g) => (
          <option key={g.key} value={g.key}>◎ {g.name} ▾</option>
        ))}
      </select>
    </label>
  )
}

/**
 * One Feed row (2026-10-16): chips, title, Done and Move. Everything else lives in the
 * details modal: tap the row or the title to open it.
 */
function Row({
  item: i,
  n,
  today,
  onOpen,
  onAct,
  goal,
  onToTodo,
}: {
  item: FeedItem
  n?: number
  today: string
  onOpen: () => void
  onAct: (s: FeedStatus, until?: string) => void
  goal?: { list: Goal[]; value: string; set: boolean; onPick: (g: string) => void }
  /** Move it to today's to-do list. */
  onToTodo?: () => void
}) {
  const [move, setMove] = useState(false)
  return (
    <li
      id={feedDomId(i.id)}
      // A tap anywhere that is not a control opens the details.
      onClick={(e) => !(e.target as HTMLElement).closest('a, button, select, input, label, [role=menu]') && onOpen()}
      className="-mx-3 cursor-pointer border-b border-[#323840] px-3 py-3.5 transition-colors hover:bg-[rgba(95,211,148,0.06)] hover:shadow-[inset_2px_0_0_#5fd394] focus-within:bg-[rgba(95,211,148,0.06)] focus-within:shadow-[inset_2px_0_0_#5fd394] motion-reduce:transition-none"
    >
      <div className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1">
        {n !== undefined && <span className="nx-lab tabular-nums" title={`"done ${n}" in the console marks this one done`} aria-hidden="true">{String(n).padStart(2, '0')}</span>}
        <span className={brandChip(i.brand)}>{i.brand}</span>
        {/* Goal beside the brand, boxed like it (2026-10-16: grey text in the action row was missed). */}
        {goal && <GoalPicker {...goal} />}
        {i.level === 'red' && <span className="text-[11px] uppercase tracking-[0.16em] text-danger">urgent</span>}
        {i.meta && <span className="nx-cond min-w-0 truncate text-[13px] text-[#8d929a]">{i.meta}</span>}
        {i.spam && <span className="shrink-0 border border-warning/50 px-1.5 py-px text-[11px] text-warning">likely spam: {i.spam}</span>}
      </div>
      <div className="mt-2 flex flex-col gap-2.5 md:flex-row md:items-start md:gap-4">
        <h4 className="min-w-0 flex-1 text-base font-normal leading-[1.45] tracking-[0.02em] text-[#ece9e2] wrap-anywhere">
          <button type="button" onClick={onOpen} aria-haspopup="dialog" className="text-left hover:underline focus-visible:underline">
            {i.title}
          </button>
          {i.steps?.length ? <span className="mt-0.5 block text-[13px] tabular-nums text-[#8d929a]">☐ {stepCount(i.steps)} · open to tick</span> : null}
        </h4>
        {/* Phone: one full-width row, Done twice as wide. Desktop: on the right of the title. */}
        <div className="relative flex shrink-0 items-stretch gap-2 [&>button]:flex-1 md:[&>button]:flex-none">
          <button
            type="button"
            onClick={() => onAct('done')}
            title={i.job ? `Marks it ${i.job.done} in the tracker` : /^(mail|form):/.test(i.id) ? 'Done. Also marks it read in Gmail within the hour.' : 'Done'}
            className="nx-ghost max-md:!flex-[2] !border-primary !text-[#a8f2c8]"
          >
            {i.doneLabel ?? 'Done'}
          </button>
          <button type="button" aria-haspopup="menu" aria-expanded={move} onClick={() => setMove(!move)} className="nx-ghost">
            Move
          </button>
          {move && (
            <Menu onClose={() => setMove(false)}>
              {onToTodo && (
                <MenuItem
                  onClick={() => {
                    setMove(false)
                    onToTodo()
                  }}
                >
                  {i.todo ? 'Back to the to-do list' : 'To my to-do list'}
                </MenuItem>
              )}
              <MenuItem
                onClick={() => {
                  setMove(false)
                  onAct('snoozed')
                }}
              >
                To tomorrow
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setMove(false)
                  onAct('snoozed', nextMonday(today))
                }}
              >
                Next week (Mon)
              </MenuItem>
              <DayPick
                min={nyTomorrow(today)}
                onPick={(d) => {
                  setMove(false)
                  onAct('snoozed', d)
                }}
              />
              {/* The calendar holds it; it comes back to the Feed that day. */}
              <DayPick
                label="To my calendar"
                min={nyTomorrow(today)}
                onPick={(d) => {
                  setMove(false)
                  openCalendar(i.title, d)
                  onAct('snoozed', d)
                }}
              />
            </Menu>
          )}
        </div>
      </div>
    </li>
  )
}
