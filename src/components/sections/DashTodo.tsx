'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import type { Todo, TodoPatch } from '@/lib/admin-dashboard'
import { nyDate, nyTomorrow } from '@/lib/dash-feed'
import { addTodoItem, deleteTodoItem, setItemGoalAction, updateTodoItem } from '@/app/audit/admin/dashboard/actions'
import { UPKEEP, goalFor, withUpkeep, type Goal } from '@/lib/dash-goals'
import { TODO_WIN_MINS, emitTodoChange, emitUnwin, emitWin, onTodoChange } from '@/lib/dash-wins'
import { FEED_GROUPS } from '@/lib/dash-feed'
import { CopyButton } from './DashParts'

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
  const goalOf = (t: Todo) => goalFor({ id: `todo:${t.id}`, brand: 'To-do', group: t.label }, goals, picks)
  function pickGoal(t: Todo, goal: string) {
    const id = `todo:${t.id}`
    const before = picks[id]
    const auto = goalFor({ id, brand: 'To-do', group: t.label }, goals, {})
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
  const [label, setLabel] = useState('')
  const [error, setError] = useState('')
  const [menu, setMenu] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [showLater, setShowLater] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [drag, setDrag] = useState<{ id: string; over: number } | null>(null)
  const [, startTransition] = useTransition()

  // The Feed can act on a labeled to-do (Done / Skip / Snooze): mirror it here.
  useEffect(
    () =>
      onTodoChange(({ id, patch }) =>
        setTodos((cur) =>
          patch.deleted
            ? cur.filter((x) => x.id !== id)
            : cur.map((x) =>
                x.id !== id
                  ? x
                  : {
                      ...x,
                      ...(patch.text !== undefined && { text: patch.text }),
                      ...(patch.day !== undefined && { day: patch.day }),
                      ...(patch.label !== undefined && { label: patch.label }),
                      ...(patch.done !== undefined && { done_at: patch.done ? (x.done_at ?? new Date().toISOString()) : null }),
                      ...(patch.archived !== undefined && { archived_at: patch.archived ? (x.archived_at ?? new Date().toISOString()) : null }),
                    },
              ),
        ),
      ),
    [],
  )

  const live = todos.filter((t) => !t.archived_at)
  const now = live.filter((t) => t.day <= today).sort((a, b) => Number(!!a.done_at) - Number(!!b.done_at) || a.position - b.position)
  const openNow = now.filter((t) => !t.done_at)
  const tomorrowTodos = live.filter((t) => t.day === tomorrow)
  const later = live.filter((t) => t.day > tomorrow)
  const archived = todos.filter((t) => t.archived_at).sort((a, b) => b.archived_at!.localeCompare(a.archived_at!))
  const done = now.filter((t) => t.done_at)
  const left = now.length - done.length
  const fail = () => setError('That did not save. Try again in a moment.')

  function add(e: React.FormEvent) {
    e.preventDefault()
    const t = text.trim()
    if (!t) return
    const temp: Todo = {
      id: `temp-${Date.now()}`,
      text: t,
      day: today,
      position: Math.max(0, ...todos.map((x) => x.position)) + 1,
      label,
      done_at: null,
      archived_at: null,
      created_at: new Date().toISOString(),
    }
    setTodos((cur) => [...cur, temp])
    setText('')
    setError('')
    startTransition(async () => {
      const row = await addTodoItem(t, label).catch(() => null)
      if (row) {
        setTodos((cur) => cur.map((x) => (x.id === temp.id ? row : x)))
        if (row.label) emitTodoChange({ id: row.id, patch: { label: row.label, text: row.text, day: row.day } })
      }
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
      ...(p.done !== undefined && {
        done_at: p.done ? (t.done_at ?? stamp) : null,
      }),
      ...(p.archived !== undefined && {
        archived_at: p.archived ? (t.archived_at ?? stamp) : null,
      }),
    }
    setTodos((cur) => cur.map((x) => (x.id === t.id ? next : x)))
    // A labeled to-do also lives in the Feed: tell it.
    if (t.label || p.label !== undefined) emitTodoChange({ id: t.id, patch: { ...p, text: next.text, day: next.day, label: next.label } })
    // Today's wins card: ticking a to-do is a win; unticking takes it back.
    if (p.done === true && !t.done_at)
      emitWin({
        id: `todo:${t.id}`,
        title: t.text,
        mins: TODO_WIN_MINS,
        at: stamp,
      })
    if (p.done === false && t.done_at) emitUnwin(`todo:${t.id}`)
    setMenu(null)
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
    setMenu(null)
    setError('')
    startTransition(async () => {
      if (!(await deleteTodoItem(t.id).catch(() => false))) {
        setTodos((cur) => [...cur, t])
        fail()
      }
    })
  }

  const row = (t: Todo, where: 'now' | 'later' | 'archived') => {
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
          {editing === t.id ? (
            <EditBox
              value={t.text}
              onSave={(v) => {
                setEditing(null)
                if (v.trim() && v.trim() !== t.text) patch(t, { text: v.trim() })
              }}
              onCancel={() => setEditing(null)}
            />
          ) : (
            <span
              className={`text-[14px] leading-snug wrap-anywhere ${t.done_at || where === 'archived' ? 'text-muted-foreground' : ''} ${t.done_at ? 'line-through' : ''}`}
            >
              {t.text}
            </span>
          )}
          {where === 'now' && t.day < today && !t.done_at && <span className="ml-1.5 whitespace-nowrap text-[11px] text-warning">from {shortDay(t.day)}</span>}
          {where === 'later' && (
            <span className="ml-1.5 whitespace-nowrap text-[11px] text-muted-foreground">{t.day === tomorrow ? 'tomorrow' : shortDay(t.day)}</span>
          )}
          {/* Under the text, so a long goal name never squeezes the to-do on a phone. */}
          {goals.length > 0 && where !== 'archived' && goalOf(t) !== UPKEEP.key && (
            <span className="block text-[11px] uppercase tracking-widest text-primary" title="Goal (change it in the ⋯ menu)">
              ◎ {goals.find((g) => g.key === goalOf(t))?.name}
            </span>
          )}
        </div>
        {t.label && where !== 'archived' && (
          <span className="nx-src shrink-0 pt-0.5">{FEED_GROUPS.find((g) => g.id === t.label)?.label ?? t.label}</span>
        )}
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
          <>
            {!t.done_at && editing !== t.id && <CopyButton text={`help me do this to-do: ${t.text}`} label="Copy" quiet />}
            <button
              type="button"
              aria-label={`Options for "${t.text}"`}
              aria-haspopup="menu"
              aria-expanded={menu === t.id}
              onClick={() => setMenu(menu === t.id ? null : t.id)}
              className={`-mt-0.5 min-h-11 min-w-11 shrink-0 px-1.5 leading-none text-muted-foreground transition-opacity hover:bg-well hover:text-foreground focus-visible:opacity-100 md:min-h-7 md:min-w-0 ${menu === t.id ? 'bg-well opacity-100' : 'opacity-70 group-hover:opacity-100'}`}
            >
              ⋯
            </button>
          </>
        )}
        {menu === t.id && (
          <Menu onClose={() => setMenu(null)}>
            <MenuItem
              onClick={() => {
                setMenu(null)
                setEditing(t.id)
              }}
            >
              Edit
            </MenuItem>
            {sortable && idx > 0 && <MenuItem onClick={() => moveTo(t, idx - 1)}>Move up</MenuItem>}
            {sortable && idx < openNow.length - 1 && <MenuItem onClick={() => moveTo(t, idx + 1)}>Move down</MenuItem>}
            {where === 'later' && <MenuItem onClick={() => patch(t, { day: today })}>Move to today</MenuItem>}
            {t.day !== tomorrow && <MenuItem onClick={() => patch(t, { day: tomorrow, done: false })}>Move to tomorrow</MenuItem>}
            <label className="flex min-h-11 items-center justify-between gap-2 whitespace-nowrap px-2.5 py-1.5 text-[13px] text-foreground hover:bg-well md:min-h-0">
              Move to a day
              <input
                type="date"
                min={today}
                defaultValue={t.day > today ? t.day : ''}
                onChange={(e) => e.target.value && patch(t, { day: e.target.value, done: false })}
                className="w-31 border border-border bg-transparent px-1 py-0.5 text-xs text-muted-foreground"
              />
            </label>
            <label className="flex min-h-11 items-center justify-between gap-2 whitespace-nowrap px-2.5 py-1.5 text-[13px] text-foreground hover:bg-well md:min-h-0">
              Label (shows in Feed)
              <select
                value={t.label}
                onChange={(e) => patch(t, { label: e.target.value })}
                className="border border-border bg-transparent px-1 py-0.5 text-xs text-muted-foreground"
              >
                <option value="">None</option>
                {FEED_GROUPS.map((g) => (
                  <option key={g.id} value={g.id}>{g.label}</option>
                ))}
              </select>
            </label>
            {goals.length > 0 && (
              <label className="flex min-h-11 items-center justify-between gap-2 whitespace-nowrap px-2.5 py-1.5 text-[13px] text-foreground hover:bg-well md:min-h-0">
                Goal
                <select
                  value={goalOf(t)}
                  onChange={(e) => pickGoal(t, e.target.value)}
                  className="max-w-40 border border-border bg-transparent px-1 py-0.5 text-xs text-muted-foreground"
                >
                  {withUpkeep(goals).map((g) => (
                    <option key={g.key} value={g.key}>{g.name}</option>
                  ))}
                </select>
              </label>
            )}
            <MenuItem onClick={() => patch(t, { archived: true })}>Archive</MenuItem>
            <MenuItem danger onClick={() => remove(t)}>
              Delete
            </MenuItem>
          </Menu>
        )}
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
        <label className="sr-only" htmlFor="todo-label">Label</label>
        <select
          id="todo-label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          title="Label it to show it in the Feed too"
          className="min-h-11 shrink-0 border border-border bg-well px-2 text-xs text-muted-foreground focus-visible:border-primary focus-visible:outline-none md:min-h-0"
        >
          <option value="">No label</option>
          {FEED_GROUPS.map((g) => (
            <option key={g.id} value={g.id}>{g.label}</option>
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

      {(later.length > 0 || done.length > 0 || archived.length > 0) && (
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border pt-2.5 text-xs text-muted-foreground [&_button]:min-h-11 md:[&_button]:min-h-0">
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
      {showLater && later.length > 0 && <ul className="mt-1">{later.map((t) => row(t, 'later'))}</ul>}
      {showArchived && archived.length > 0 && <ul className="mt-1">{archived.map((t) => row(t, 'archived'))}</ul>}
    </section>
  )
}

function Menu({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const click = (e: MouseEvent) => !ref.current?.parentElement?.contains(e.target as Node) && onClose()
    const key = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('mousedown', click)
    document.addEventListener('keydown', key)
    return () => {
      document.removeEventListener('mousedown', click)
      document.removeEventListener('keydown', key)
    }
  }, [onClose])
  return (
    <div ref={ref} role="menu" className="absolute right-0 top-full z-20 mt-1 grid w-64 gap-0.5 border border-[#2e333b] bg-[#171a20] p-1.5 shadow-lg">
      {children}
    </div>
  )
}

function MenuItem({ onClick, danger, children }: { onClick: () => void; danger?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`min-h-11 px-2.5 py-1.5 text-left text-[13px] hover:bg-well md:min-h-0 ${danger ? 'text-danger' : 'text-foreground'}`}
    >
      {children}
    </button>
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
