'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import type { Todo, TodoPatch } from '@/lib/admin-dashboard'
import { nyDate, nyTomorrow } from '@/lib/dash-feed'
import { addTodoItem, deleteTodoItem, updateTodoItem } from '@/app/audit/admin/dashboard/actions'
import { TODO_WIN_MINS, emitUnwin, emitWin } from '@/lib/dash-wins'
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

export function DashTodo({ initial }: { initial: Todo[] }) {
  const today = nyDate()
  const tomorrow = nyTomorrow(today)
  const [todos, setTodos] = useState(initial)
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [menu, setMenu] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [showLater, setShowLater] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [drag, setDrag] = useState<{ id: string; over: number } | null>(null)
  const [, startTransition] = useTransition()

  const live = todos.filter((t) => !t.archived_at)
  const now = live.filter((t) => t.day <= today).sort((a, b) => Number(!!a.done_at) - Number(!!b.done_at) || a.position - b.position)
  const openNow = now.filter((t) => !t.done_at)
  const later = live.filter((t) => t.day > today)
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
      done_at: null,
      archived_at: null,
      created_at: new Date().toISOString(),
    }
    setTodos((cur) => [...cur, temp])
    setText('')
    setError('')
    startTransition(async () => {
      const row = await addTodoItem(t).catch(() => null)
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
      ...(p.done !== undefined && {
        done_at: p.done ? (t.done_at ?? stamp) : null,
      }),
      ...(p.archived !== undefined && {
        archived_at: p.archived ? (t.archived_at ?? stamp) : null,
      }),
    }
    setTodos((cur) => cur.map((x) => (x.id === t.id ? next : x)))
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
        className={`group relative flex items-start gap-2 py-1.5 ${drag?.id === t.id ? 'opacity-40' : ''} ${
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
            className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-(--color-primary)"
          />
        ) : (
          <span className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
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
              className={`text-[13.5px] leading-snug wrap-anywhere ${t.done_at || where === 'archived' ? 'text-muted-foreground' : ''} ${t.done_at ? 'line-through' : ''}`}
            >
              {t.text}
            </span>
          )}
          {where === 'now' && t.day < today && !t.done_at && <span className="ml-1.5 whitespace-nowrap text-[11px] text-warning">from {shortDay(t.day)}</span>}
          {where === 'later' && (
            <span className="ml-1.5 whitespace-nowrap text-[11px] text-muted-foreground">{t.day === tomorrow ? 'tomorrow' : shortDay(t.day)}</span>
          )}
        </div>
        {where === 'archived' ? (
          <span className="flex shrink-0 gap-1">
            <button
              type="button"
              onClick={() => patch(t, { archived: false, done: false, day: today })}
              className="rounded px-1.5 text-[11px] text-muted-foreground hover:text-foreground"
            >
              Restore
            </button>
            <button type="button" onClick={() => remove(t)} className="rounded px-1.5 text-[11px] text-muted-foreground hover:text-danger">
              Delete
            </button>
          </span>
        ) : (
          <>
            {!t.done_at && editing !== t.id && <CopyButton text={`help me do this to-do: ${t.text}`} label="Copy" />}
            <button
              type="button"
              aria-label={`Options for "${t.text}"`}
              aria-haspopup="menu"
              aria-expanded={menu === t.id}
              onClick={() => setMenu(menu === t.id ? null : t.id)}
              className={`shrink-0 rounded px-1.5 leading-none text-muted-foreground transition-opacity hover:bg-well hover:text-foreground focus-visible:opacity-100 ${menu === t.id ? 'bg-well opacity-100' : 'opacity-60 group-hover:opacity-100'}`}
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
            <label className="flex items-center justify-between gap-2 whitespace-nowrap rounded-md px-2.5 py-1.5 text-[13px] text-foreground hover:bg-well">
              Move to a day
              <input
                type="date"
                min={today}
                defaultValue={t.day > today ? t.day : ''}
                onChange={(e) => e.target.value && patch(t, { day: e.target.value, done: false })}
                className="w-31 rounded border border-border bg-transparent px-1 py-0.5 text-xs text-muted-foreground"
              />
            </label>
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
    <section aria-labelledby="todo-h" className="min-w-0 rounded-2xl border border-border bg-panel p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="todo-h" className="font-heading text-lg font-semibold">
          To-do
        </h2>
        <span className="text-xs tabular-nums text-muted-foreground">{left} left</span>
      </div>

      <form onSubmit={add} className="mt-3">
        <label className="sr-only" htmlFor="todo-new">
          Add a to-do
        </label>
        <input
          id="todo-new"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={300}
          placeholder="Add a to-do, press Enter"
          className="w-full rounded-lg border border-border bg-well px-3 py-2 text-sm placeholder:text-muted-foreground/70 focus-visible:border-primary focus-visible:outline-none"
        />
      </form>
      <p aria-live="polite" className="mt-1 text-xs text-danger empty:hidden">
        {error}
      </p>

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

      {(later.length > 0 || done.length > 0 || archived.length > 0) && (
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border pt-2.5 text-xs text-muted-foreground">
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
    <div ref={ref} role="menu" className="absolute right-0 top-full z-20 mt-1 grid w-64 gap-0.5 rounded-xl border border-border bg-panel p-1.5 shadow-lg">
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
      className={`rounded-md px-2.5 py-1.5 text-left text-[13px] hover:bg-well ${danger ? 'text-danger' : 'text-foreground'}`}
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
      className="w-full rounded border border-primary bg-well px-1.5 py-0.5 text-[13.5px] focus-visible:outline-none"
    />
  )
}
