'use client'

import { useEffect, useState, useTransition } from 'react'
import type { Todo, TodoPatch } from '@/lib/admin-dashboard'
import { nyDate, nyTomorrow } from '@/lib/dash-feed'
import { addTodoItem, deleteTodoItem, setItemGoalAction, updateTodoItem } from '@/app/audit/admin/dashboard/actions'
import { UPKEEP, goalFor, withUpkeep, type Goal } from '@/lib/dash-goals'
import { TODO_WIN_MINS, emitTodayTodos, emitTodoChange, emitUnwin, emitWin, onTodoChange } from '@/lib/dash-wins'
import { FEED_GROUPS } from '@/lib/dash-feed'
import { brandChip } from '@/lib/dash-format'
import { DashModal, DayPick, Menu, MenuItem, nextMonday, openCalendar } from './DashModal'
import { CopyButton } from './DashParts'
import { FollowUp } from './DashFollowUp'

/** Sites a to-do can be for (migration 0021). */
const SITES = ['Chris Hornak', 'Blog Hands', 'Swift Growth'] as const

/* Hand-typed to-do list (2026-10-15), right column beside the Feed. Items stay
 * until Chris acts on them. Drag the ⠿ handle to reorder (or Move up / down in the
 * ⋯ menu, which also works on a phone). Each has a ⋯ menu: Edit, Move up/down,
 * Move to tomorrow, Move to a day, Archive, Delete. Ticked items stay crossed out until archived. Items for a
 * later day wait under "Later". Saved in dash_todos (migration 0017). */

const shortDay = (d: string) =>
  new Date(d + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })

export function DashTodo({
  initial,
  dueNow,
  dueTomorrow,
  dueTomorrowCount = 0,
  goals = [],
  goalPicks = {},
}: {
  initial: Todo[]
  dueNow?: React.ReactNode
  dueTomorrow?: React.ReactNode
  dueTomorrowCount?: number
  /** From GOALS.md. Empty = no goal line in the menu. */
  goals?: Goal[]
  goalPicks?: Record<string, string>
}) {
  const today = nyDate()
  // Goal per to-do: Chris's pick, else from the label (jobs → remote work …), else Upkeep.
  const [picks, setPicks] = useState(goalPicks)
  const goalOf = (t: Todo) => goalFor({ id: `todo:${t.id}`, brand: t.brand || 'To-do', group: t.label }, goals, picks)
  function pickGoal(t: Todo, goal: string) {
    const id = `todo:${t.id}`
    const before = picks[id]
    const auto = goalFor({ id, brand: t.brand || 'To-do', group: t.label }, goals, {})
    const set = (v: string | undefined) =>
      setPicks((p) => {
        const n = { ...p }
        if (v) n[id] = v
        else delete n[id]
        return n
      })
    set(goal === auto ? undefined : goal)
    startTransition(async () => {
      if (!(await setItemGoalAction(id, goal === auto ? null : goal).catch(() => false))) {
        set(before)
        setError('That did not save. Try again in a moment.')
      }
    })
  }
  const tomorrow = nyTomorrow(today)
  const [todos, setTodos] = useState(initial)
  const [text, setText] = useState('')
  const [site, setSite] = useState('')
  const [error, setError] = useState('')
  // Details modal (2026-10-16): which to-do, which list it was opened from, and where it sat in it.
  const [detail, setDetail] = useState<{ id: string; where: 'now' | 'later' | 'feed'; idx: number } | null>(null)
  // Move menu (replaces the Copy button, Chris 2026-10-16) and the "To Feed" panel that asks for what is missing.
  const [moveMenu, setMoveMenu] = useState<string | null>(null)
  const [feeding, setFeeding] = useState<{ id: string; brand: string; label: string } | null>(null)
  const [showFeed, setShowFeed] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [showLater, setShowLater] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [drag, setDrag] = useState<{ id: string; over: number } | null>(null)
  const [, startTransition] = useTransition()

  // The Feed can act on a labeled to-do (Done / Skip / Snooze): mirror it here.
  useEffect(
    () =>
      onTodoChange(({ id, patch, row: made }) =>
        setTodos((cur) =>
          made && !cur.some((x) => x.id === id)
            ? [...cur, made]
            : patch.deleted
            ? cur.filter((x) => x.id !== id)
            : cur.map((x) =>
                x.id !== id
                  ? x
                  : {
                      ...x,
                      ...(patch.text !== undefined && { text: patch.text }),
                      ...(patch.day !== undefined && { day: patch.day }),
                      ...(patch.label !== undefined && { label: patch.label }),
                      ...(patch.brand !== undefined && { brand: patch.brand }),
                      ...(patch.done !== undefined && { done_at: patch.done ? (x.done_at ?? new Date().toISOString()) : null }),
                      ...(patch.archived !== undefined && { archived_at: patch.archived ? (x.archived_at ?? new Date().toISOString()) : null }),
                    },
              ),
        ),
      ),
    [],
  )

  // The list is for today. A to-do moved to the Feed (it has a Feed group) lives in the Feed only;
  // the card keeps one "N in the Feed" line to see them or send one back.
  const inFeed = todos.filter((t) => !t.archived_at && t.label && !t.done_at)
  const live = todos.filter((t) => !t.archived_at && !t.label)
  const now = live.filter((t) => t.day <= today).sort((a, b) => Number(!!a.done_at) - Number(!!b.done_at) || a.position - b.position)
  const openNow = now.filter((t) => !t.done_at)
  const tomorrowTodos = live.filter((t) => t.day === tomorrow)
  const later = live.filter((t) => t.day > tomorrow)
  const archived = todos.filter((t) => t.archived_at).sort((a, b) => b.archived_at!.localeCompare(a.archived_at!))
  const done = now.filter((t) => t.done_at)
  const left = now.length - done.length
  const fail = () => setError('That did not save. Try again in a moment.')

  // Focus in the Feed walks today's open to-dos too: tell it which ones.
  const todayKey = JSON.stringify(openNow.filter((t) => !t.id.startsWith('temp-')).map((t) => [t.id, t.text, t.brand ?? '']))
  useEffect(() => {
    emitTodayTodos((JSON.parse(todayKey) as [string, string, string][]).map(([id, text, brand]) => ({ id, text, brand })))
  }, [todayKey])

  const lists = { now, later: [...tomorrowTodos, ...later], feed: inFeed }
  const dList = detail ? lists[detail.where] : []
  const dFound = detail ? dList.findIndex((t) => t.id === detail.id) : -1
  const dIdx = !detail || !dList.length ? -1 : dFound >= 0 ? dFound : Math.min(detail.idx, dList.length - 1)
  const dTodo = dIdx >= 0 ? dList[dIdx] : undefined
  const open = (t: Todo, where: 'now' | 'later' | 'feed') => setDetail({ id: t.id, where, idx: lists[where].indexOf(t) })

  function add(e: React.FormEvent) {
    e.preventDefault()
    const t = text.trim()
    if (!t) return
    const temp: Todo = {
      id: `temp-${Date.now()}`,
      text: t,
      day: today,
      position: Math.max(0, ...todos.map((x) => x.position)) + 1,
      label: '',
      brand: site,
      done_at: null,
      archived_at: null,
      created_at: new Date().toISOString(),
    }
    setTodos((cur) => [...cur, temp])
    setText('')
    setError('')
    startTransition(async () => {
      const row = await addTodoItem(t, '', site).catch(() => null)
      if (row) setTodos((cur) => cur.map((x) => (x.id === temp.id ? row : x)))
      else {
        setTodos((cur) => cur.filter((x) => x.id !== temp.id))
        setText(t)
        fail()
      }
    })
  }

  /** Optimistic patch; rolls back if the save fails. */
  function patch(t: Todo, p: TodoPatch) {
    if (t.id.startsWith('temp-')) return
    const stamp = new Date().toISOString()
    const next: Todo = {
      ...t,
      ...(p.text !== undefined && { text: p.text }),
      ...(p.day !== undefined && { day: p.day }),
      ...(p.position !== undefined && { position: p.position }),
      ...(p.label !== undefined && { label: p.label }),
      ...(p.brand !== undefined && { brand: p.brand }),
      ...(p.done !== undefined && {
        done_at: p.done ? (t.done_at ?? stamp) : null,
      }),
      ...(p.archived !== undefined && {
        archived_at: p.archived ? (t.archived_at ?? stamp) : null,
      }),
    }
    setTodos((cur) => cur.map((x) => (x.id === t.id ? next : x)))
    // A labeled to-do also lives in the Feed: tell it.
    if (t.label || p.label !== undefined) emitTodoChange({ id: t.id, patch: { ...p, text: next.text, day: next.day, label: next.label, brand: next.brand ?? '' } })
    // Today's wins card: ticking a to-do is a win; unticking takes it back.
    if (p.done === true && !t.done_at)
      emitWin({
        id: `todo:${t.id}`,
        title: t.text,
        mins: TODO_WIN_MINS,
        at: stamp,
      })
    if (p.done === false && t.done_at) emitUnwin(`todo:${t.id}`)
    setMoveMenu(null)
    setError('')
    startTransition(async () => {
      if (!(await updateTodoItem(t.id, p).catch(() => false))) {
        setTodos((cur) => cur.map((x) => (x.id === t.id ? t : x)))
        if (p.done === true && !t.done_at) emitUnwin(`todo:${t.id}`)
        fail()
      }
    })
  }

  /** Put t at index `to` of the open list; its new position sits between its new neighbours. */
  function moveTo(t: Todo, to: number) {
    const rest = openNow.filter((x) => x.id !== t.id)
    const i = Math.max(0, Math.min(to, rest.length))
    const prev = rest[i - 1]?.position
    const next = rest[i]?.position
    const position = prev === undefined && next === undefined ? t.position : prev === undefined ? next! - 1 : next === undefined ? prev + 1 : (prev + next) / 2
    if (position !== t.position) patch(t, { position })
  }

  function remove(t: Todo) {
    if (t.id.startsWith('temp-')) return
    setTodos((cur) => cur.filter((x) => x.id !== t.id))
    if (t.label) emitTodoChange({ id: t.id, patch: { deleted: true } })
    if (t.done_at) emitUnwin(`todo:${t.id}`)
    setError('')
    startTransition(async () => {
      if (!(await deleteTodoItem(t.id).catch(() => false))) {
        setTodos((cur) => [...cur, t])
        fail()
      }
    })
  }

  /** "To the Feed" asks for the site + Feed group; both are needed. */
  const feedPanel = (t: Todo) =>
    feeding && (
      <div className="grid gap-0.5">
        <p className="nx-lab px-2.5 pt-1">Site</p>
        <div className="flex flex-wrap gap-1 px-2 pb-1">
          {SITES.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={feeding.brand === s}
              onClick={() => setFeeding({ ...feeding, brand: s })}
              className={`min-h-11 border px-2 py-1 text-xs md:min-h-0 ${feeding.brand === s ? 'border-primary text-foreground' : 'border-[#2e333b] text-muted-foreground hover:text-foreground'}`}
            >
              {s}
            </button>
          ))}
        </div>
        <p className="nx-lab px-2.5 pt-1">Feed group</p>
        <div className="flex flex-wrap gap-1 px-2 pb-1">
          {FEED_GROUPS.map((g) => (
            <button
              key={g.id}
              type="button"
              aria-pressed={feeding.label === g.id}
              onClick={() => setFeeding({ ...feeding, label: g.id })}
              className={`min-h-11 border px-2 py-1 text-xs md:min-h-0 ${feeding.label === g.id ? 'border-primary text-foreground' : 'border-[#2e333b] text-muted-foreground hover:text-foreground'}`}
            >
              {g.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          disabled={!feeding.brand || !feeding.label}
          onClick={() => {
            const f = feeding
            setFeeding(null)
            // The Feed shows to-dos due today or earlier, so a later one comes forward to today.
            patch(t, { label: f.label, ...(f.brand !== (t.brand ?? '') && { brand: f.brand }), ...(t.day > today && { day: today }) })
          }}
          className="nx-prim m-1.5 disabled:opacity-40"
        >
          {!feeding.brand || !feeding.label ? `Pick ${!feeding.brand ? 'a site' : ''}${!feeding.brand && !feeding.label ? ' and ' : ''}${!feeding.label ? 'a group' : ''}` : 'Add to the Feed'}
        </button>
      </div>
    )

  /**
   * Move choices, shared by the row's Move menu and the details modal (2026-10-16).
   * Plain words, nothing greyed out: a choice that does not fit is left out.
   */
  const moveItems = (t: Todo, idx: number, sortable: boolean, close: () => void) => (
    <>
      {t.label ? (
        <MenuItem onClick={() => patch(t, { label: '' })}>Back to the to-do list</MenuItem>
      ) : (
        <MenuItem
          onClick={() => {
            close()
            setFeeding({ id: t.id, brand: t.brand ?? '', label: '' })
          }}
        >
          To the Feed…
        </MenuItem>
      )}
      {sortable && idx > 1 && <MenuItem onClick={() => moveTo(t, 0)}>To the top</MenuItem>}
      {sortable && idx > 0 && <MenuItem onClick={() => moveTo(t, idx - 1)}>Up</MenuItem>}
      {sortable && idx < openNow.length - 1 && <MenuItem onClick={() => moveTo(t, idx + 1)}>Down</MenuItem>}
      {!t.label && t.day > today && <MenuItem onClick={() => patch(t, { day: today })}>To today</MenuItem>}
      {!t.label && t.day !== tomorrow && <MenuItem onClick={() => patch(t, { day: tomorrow, done: false })}>To tomorrow</MenuItem>}
      {!t.label && t.day !== nextMonday(today) && <MenuItem onClick={() => patch(t, { day: nextMonday(today), done: false })}>Next week (Mon)</MenuItem>}
      {!t.label && <DayPick min={today} value={t.day > today ? t.day : undefined} onPick={(d) => patch(t, { day: d, done: false })} />}
      {/* The calendar holds it; it comes back to the list that day. */}
      {!t.label && (
        <DayPick
          label="To my calendar"
          min={today}
          onPick={(d) => {
            openCalendar(t.text, d)
            patch(t, { day: d, done: false })
          }}
        />
      )}
    </>
  )

  const row = (t: Todo, where: 'now' | 'later' | 'archived' | 'feed') => {
    const idx = openNow.indexOf(t)
    const sortable = where === 'now' && idx >= 0
    return (
      <li
        key={t.id}
        draggable={sortable && editing !== t.id}
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = 'move'
          setDrag({ id: t.id, over: idx })
        }}
        onDragOver={(e) => {
          if (!drag || !sortable) return
          e.preventDefault()
          const r = e.currentTarget.getBoundingClientRect()
          const over = idx + (e.clientY > r.top + r.height / 2 ? 1 : 0)
          if (over !== drag.over) setDrag({ ...drag, over })
        }}
        onDrop={(e) => {
          e.preventDefault()
          const d = drag
          setDrag(null)
          const item = d && openNow.find((x) => x.id === d.id)
          if (!item) return
          const from = openNow.indexOf(item)
          moveTo(item, d.over > from ? d.over - 1 : d.over)
        }}
        onDragEnd={() => setDrag(null)}
        className={`group relative flex items-start gap-2 py-1.5 md:py-1 ${drag?.id === t.id ? 'opacity-40' : ''} ${
          drag && sortable && drag.over === idx
            ? 'shadow-[inset_0_2px_0_var(--color-primary)]'
            : drag && sortable && drag.over === idx + 1 && idx === openNow.length - 1
              ? 'shadow-[inset_0_-2px_0_var(--color-primary)]'
              : ''
        }`}
      >
        {sortable ? (
          <span
            aria-hidden="true"
            title="Drag to reorder"
            className="mt-0.5 cursor-grab select-none text-[13px] leading-none text-muted-foreground/40 group-hover:text-muted-foreground active:cursor-grabbing"
          >
            ⠿
          </span>
        ) : (
          <span className="w-[9px] shrink-0" aria-hidden="true" />
        )}
        {where !== 'archived' ? (
          <input
            type="checkbox"
            checked={!!t.done_at}
            onChange={() => patch(t, { done: !t.done_at })}
            aria-label={t.done_at ? `Mark "${t.text}" not done` : `Mark "${t.text}" done`}
            aria-describedby={undefined}
          />
        ) : (
          <span className="h-4 w-4 shrink-0" aria-hidden="true" />
        )}
        <div className="min-w-0 flex-1">
          {/* Tap the text for the details modal (2026-10-16); archived rows keep Restore / Delete inline. */}
          {where === 'archived' ? (
            <span className="text-[14px] leading-snug text-muted-foreground wrap-anywhere">{t.text}</span>
          ) : (
            <button
              type="button"
              onClick={() => open(t, where)}
              aria-haspopup="dialog"
              className={`text-left text-[14px] leading-snug wrap-anywhere hover:underline focus-visible:underline ${t.done_at ? 'text-muted-foreground line-through' : ''}`}
            >
              {t.text}
            </button>
          )}
          {where === 'now' && t.day < today && !t.done_at && <span className="ml-1.5 whitespace-nowrap text-[11px] text-warning">from {shortDay(t.day)}</span>}
          {where === 'later' && (
            <span className="ml-1.5 whitespace-nowrap text-[11px] text-muted-foreground">{t.day === tomorrow ? 'tomorrow' : shortDay(t.day)}</span>
          )}
          {/* Under the text, so labels never squeeze the to-do on a phone: site · in Feed · goal. */}
          {where !== 'archived' && (t.brand || t.label || (goals.length > 0 && goalOf(t) !== UPKEEP.key)) && (
            <span className="mt-1 flex flex-wrap items-center gap-1.5">
              {t.brand && <span className={brandChip(t.brand)}>{t.brand}</span>}
              {t.label && (
                <span className="shrink-0 border border-primary/60 px-1.5 py-px text-[11px] uppercase tracking-[0.14em] text-[#a8f2c8]">
                  In Feed · {FEED_GROUPS.find((g) => g.id === t.label)?.label ?? t.label}
                </span>
              )}
              {goals.length > 0 && goalOf(t) !== UPKEEP.key && (
                <span className="text-[11px] uppercase tracking-widest text-primary" title="Goal (tap the to-do to change it)">
                  ◎ {goals.find((g) => g.key === goalOf(t))?.name}
                </span>
              )}
            </span>
          )}
        </div>
        {where === 'archived' ? (
          <span className="flex shrink-0 gap-1">
            <button
              type="button"
              onClick={() => patch(t, { archived: false, done: false, day: today })}
              className="nx-ghost"
            >
              Restore
            </button>
            <button type="button" onClick={() => remove(t)} className="nx-ghost">
              Delete
            </button>
          </span>
        ) : (
          !t.done_at && (
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={moveMenu === t.id}
              onClick={() => {
                setFeeding(null)
                setMoveMenu(moveMenu === t.id ? null : t.id)
              }}
              className={`-mt-0.5 min-h-11 shrink-0 px-1.5 text-xs text-muted-foreground transition-opacity hover:bg-well hover:text-foreground focus-visible:opacity-100 md:min-h-7 ${moveMenu === t.id ? 'bg-well opacity-100' : 'opacity-70 group-hover:opacity-100'}`}
            >
              Move
            </button>
          )
        )}
        {moveMenu === t.id && (
          <Menu onClose={() => setMoveMenu(null)}>
            {moveItems(t, idx, sortable, () => setMoveMenu(null))}
          </Menu>
        )}
        {/* To the Feed: asks for whatever is missing (site + Feed group). From the modal it opens inside the modal. */}
        {feeding?.id === t.id && !dTodo && <Menu onClose={() => setFeeding(null)}>{feedPanel(t)}</Menu>}
      </li>
    )
  }

  return (
    <section aria-labelledby="todo-h" className="nx-box min-w-0 p-5 md:px-6 md:py-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="todo-h" className="text-lg font-normal">
          To do today
        </h2>
        <span className="nx-lab">{left} left</span>
      </div>

      <form onSubmit={add} className="mt-3 flex gap-2">
        <label className="sr-only" htmlFor="todo-new">
          Add a to-do
        </label>
        <input
          id="todo-new"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={300}
          placeholder="Add a to-do, press Enter"
          className="min-h-11 min-w-0 flex-1 border-0 border-b border-[#2e333b] bg-transparent px-0 py-1.5 text-sm text-[#d9d6cf] placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none md:min-h-0"
        />
        <label className="sr-only" htmlFor="todo-site">Site</label>
        <select
          id="todo-site"
          value={site}
          onChange={(e) => setSite(e.target.value)}
          title="Which site it is for"
          className="min-h-11 shrink-0 border border-border bg-well px-2 text-xs text-muted-foreground focus-visible:border-primary focus-visible:outline-none md:min-h-0"
        >
          <option value="">Site</option>
          {SITES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </form>
      <p aria-live="polite" className="mt-1 text-xs text-danger empty:hidden">
        {error}
      </p>

      {/* Scout steps + job follow-ups that are due: same list, same rows. */}
      {dueNow}

      {now.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">Nothing for today.</p>
      ) : (
        <ul
          className="mt-2"
          onDragLeave={(e) =>
            !e.currentTarget.contains(e.relatedTarget as Node) &&
            drag &&
            setDrag({
              ...drag,
              over: openNow.findIndex((x) => x.id === drag.id),
            })
          }
        >
          {now.map((t) => row(t, 'now'))}
        </ul>
      )}

      {(tomorrowTodos.length > 0 || dueTomorrowCount > 0) && (
        <div className="mt-3 border-t border-border pt-3">
          <p className="nx-lab">Tomorrow</p>
          <ul className="mt-1">
            {tomorrowTodos.map((t) => row(t, 'later'))}
            {dueTomorrow}
          </ul>
        </div>
      )}

      {(later.length > 0 || done.length > 0 || archived.length > 0 || inFeed.length > 0) && (
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border pt-2.5 text-xs text-muted-foreground [&_button]:min-h-11 md:[&_button]:min-h-0">
          {inFeed.length > 0 && (
            <button type="button" aria-expanded={showFeed} onClick={() => setShowFeed(!showFeed)} className="hover:text-foreground" title="Moved to the Feed: done there, or sent back here">
              In the Feed <span className="tabular-nums">{inFeed.length}</span> {showFeed ? '▾' : '▸'}
            </button>
          )}
          {later.length > 0 && (
            <button type="button" aria-expanded={showLater} onClick={() => setShowLater(!showLater)} className="hover:text-foreground">
              Later <span className="tabular-nums">{later.length}</span> {showLater ? '▾' : '▸'}
            </button>
          )}
          {archived.length > 0 && (
            <button type="button" aria-expanded={showArchived} onClick={() => setShowArchived(!showArchived)} className="hover:text-foreground">
              Archived <span className="tabular-nums">{archived.length}</span> {showArchived ? '▾' : '▸'}
            </button>
          )}
          {done.length > 0 && (
            <button type="button" onClick={() => done.forEach((t) => patch(t, { archived: true }))} className="ml-auto hover:text-foreground">
              Archive done ({done.length})
            </button>
          )}
        </div>
      )}
      {showFeed && inFeed.length > 0 && <ul className="mt-1">{inFeed.map((t) => row(t, 'feed'))}</ul>}
      {showLater && later.length > 0 && <ul className="mt-1">{later.map((t) => row(t, 'later'))}</ul>}
      {showArchived && archived.length > 0 && <ul className="mt-1">{archived.map((t) => row(t, 'archived'))}</ul>}

      {/* Details modal: same shell as Focus, ← / → walk the list it was opened from. */}
      {detail && dTodo && (
        <DashModal
          labelledBy="todo-detail-h"
          top={
            <>
              {detail.where === 'now' ? 'To do today' : detail.where === 'later' ? 'Later' : 'In the Feed'} · <span className="tabular-nums">{dIdx + 1} of {dList.length}</span>
            </>
          }
          onClose={() => {
            setDetail(null)
            setEditing(null)
            setFeeding(null)
          }}
          onPrev={dIdx > 0 ? () => setDetail({ ...detail, id: dList[dIdx - 1].id, idx: dIdx - 1 }) : null}
          onNext={dIdx < dList.length - 1 ? () => setDetail({ ...detail, id: dList[dIdx + 1].id, idx: dIdx + 1 }) : null}
        >
          <TodoDetails
            key={dTodo.id}
            t={dTodo}
            today={today}
            goals={goals}
            goal={goalOf(dTodo)}
            editing={editing === dTodo.id}
            onEdit={(on) => setEditing(on ? dTodo.id : null)}
            onPatch={(p) => patch(dTodo, p)}
            onGoal={(g) => pickGoal(dTodo, g)}
            onDelete={() => remove(dTodo)}
            feedPanel={feeding?.id === dTodo.id ? feedPanel(dTodo) : null}
            moves={moveItems(dTodo, openNow.indexOf(dTodo), detail.where === 'now' && openNow.includes(dTodo), () => {})}
          />
        </DashModal>
      )}
    </section>
  )
}

/** To-do details (inside DashModal): edit, site, goal, when, copy, archive, delete. */
function TodoDetails({
  t,
  today,
  goals,
  goal,
  editing,
  onEdit,
  onPatch,
  onGoal,
  onDelete,
  feedPanel,
  moves,
}: {
  t: Todo
  today: string
  goals: Goal[]
  goal: string
  editing: boolean
  onEdit: (on: boolean) => void
  onPatch: (p: TodoPatch) => void
  onGoal: (g: string) => void
  onDelete: () => void
  feedPanel: React.ReactNode
  moves: React.ReactNode
}) {
  // Delete asks once (product-ux: destructive actions confirm).
  const [sure, setSure] = useState(false)
  const field = 'flex min-h-11 items-center justify-between gap-3 text-[13px] md:min-h-9'
  const select = 'w-44 border border-border bg-well px-2 py-1 text-xs text-foreground focus-visible:border-primary focus-visible:outline-none'
  return (
    <>
      <p className="mt-6 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        {t.brand && <span className={brandChip(t.brand)}>{t.brand}</span>}
        {t.label && <span className="border border-primary/60 px-1.5 py-px text-[11px] uppercase tracking-[0.14em] text-[#a8f2c8]">In Feed · {FEED_GROUPS.find((g) => g.id === t.label)?.label ?? t.label}</span>}
        <span>{t.day < today ? `from ${shortDay(t.day)}` : t.day === today ? 'today' : shortDay(t.day)}</span>
      </p>
      {editing ? (
        <div className="mt-2">
          <EditBox
            value={t.text}
            onSave={(v) => {
              onEdit(false)
              if (v.trim() && v.trim() !== t.text) onPatch({ text: v.trim() })
            }}
            onCancel={() => onEdit(false)}
          />
          <h2 id="todo-detail-h" className="sr-only">{t.text}</h2>
        </div>
      ) : (
        <h2 id="todo-detail-h" className={`mt-2 text-xl font-normal leading-snug tracking-[0.02em] text-[#ece9e2] wrap-anywhere md:text-[26px] ${t.done_at ? 'text-muted-foreground line-through' : ''}`}>
          {t.text}
        </h2>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {!editing && (
          <button type="button" onClick={() => onEdit(true)} className="nx-ghost">
            Edit
          </button>
        )}
        <CopyButton text={`help me do this to-do: ${t.text}`} />
      </div>
      <div className="mt-3">
        <FollowUp title={t.text.replace(/^Follow up: /, '')} brand={t.brand} />
      </div>

      <div className="mt-6 grid gap-x-8 gap-y-1 md:grid-cols-2">
        <div>
          <p className="nx-lab">About</p>
          <label className={field}>
            Site
            <select value={t.brand ?? ''} onChange={(e) => onPatch({ brand: e.target.value })} className={select}>
              <option value="">None</option>
              {SITES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
          {goals.length > 0 && (
            <label className={field}>
              Goal
              <select value={goal} onChange={(e) => onGoal(e.target.value)} className={select}>
                {withUpkeep(goals).map((g) => (
                  <option key={g.key} value={g.key}>{g.name}</option>
                ))}
              </select>
            </label>
          )}
        </div>
        <div>
          <p className="nx-lab">Move</p>
          {feedPanel ?? <div className="grid gap-0.5 [&_label]:px-0 [&>button]:px-0">{moves}</div>}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <button type="button" onClick={() => onPatch({ done: !t.done_at })} className="nx-prim !px-6 !py-3 !text-sm">
          {t.done_at ? 'Not done' : 'Done'}
        </button>
        <div className="flex flex-wrap items-center gap-1">
          <button type="button" onClick={() => onPatch({ archived: true })} className="nx-ghost !border-transparent">
            Archive
          </button>
          {sure ? (
            <span role="group" aria-label="Delete this to-do?" className="flex items-center gap-1 text-xs text-danger">
              Delete for good?
              <button type="button" onClick={onDelete} autoFocus className="nx-ghost !border-danger !text-danger">
                Delete
              </button>
              <button type="button" onClick={() => setSure(false)} className="nx-ghost !border-transparent">
                Keep
              </button>
            </span>
          ) : (
            <button type="button" onClick={() => setSure(true)} className="nx-ghost !border-transparent text-danger">
              Delete…
            </button>
          )}
        </div>
      </div>
    </>
  )
}

function EditBox({ value, onSave, onCancel }: { value: string; onSave: (v: string) => void; onCancel: () => void }) {
  const [v, setV] = useState(value)
  return (
    <input
      autoFocus
      value={v}
      maxLength={300}
      aria-label="Edit to-do"
      onChange={(e) => setV(e.target.value)}
      onBlur={() => onSave(v)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onSave(v)
        if (e.key === 'Escape') onCancel()
      }}
      className="w-full border border-primary bg-well px-1.5 py-0.5 text-[14px] focus-visible:outline-none"
    />
  )
}
