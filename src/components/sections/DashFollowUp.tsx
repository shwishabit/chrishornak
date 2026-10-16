'use client'

import { useState, useTransition } from 'react'
import { nyDate, nyTomorrow } from '@/lib/dash-feed'
import { addTodoItem } from '@/app/audit/admin/dashboard/actions'
import { emitTodoChange } from '@/lib/dash-wins'
import { nextMonday } from './DashModal'

/** Sites a to-do can be for (migration 0021). */
const SITES = ['Chris Hornak', 'Blog Hands', 'Swift Growth']

const addDays = (day: string, n: number) => {
  const d = new Date(day + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

const shortDay = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

/**
 * Follow up (Chris 2026-10-16): make a new to-do for a later day from what is open now
 * (a to-do, a Feed item, an email). The text starts as "Follow up: <title>" and can be edited.
 * It waits under Tomorrow / Later on the to-do list and comes back that day.
 */
export function FollowUp({ title, brand = '' }: { title: string; brand?: string }) {
  const today = nyDate()
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [day, setDay] = useState('')
  const [made, setMade] = useState('')
  const [error, setError] = useState('')
  const [busy, startTransition] = useTransition()
  const days = [
    { label: 'Tomorrow', day: nyTomorrow(today) },
    { label: 'In 3 days', day: addDays(today, 3) },
    { label: 'Next week (Mon)', day: nextMonday(today) },
    { label: 'In 2 weeks', day: addDays(today, 14) },
  ]

  function start() {
    setText(`Follow up: ${title}`.slice(0, 300))
    setDay(days[1].day)
    setMade('')
    setError('')
    setOpen(true)
  }

  function add() {
    const t = text.trim()
    if (!t || !day) return
    setError('')
    startTransition(async () => {
      const row = await addTodoItem(t, '', SITES.includes(brand) ? brand : '', day).catch(() => null)
      if (!row) return setError('That did not save. Try again in a moment.')
      emitTodoChange({ id: row.id, patch: {}, row })
      setOpen(false)
      setMade(shortDay(day))
    })
  }

  if (!open)
    return (
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={start} className="nx-ghost">
          Follow up…
        </button>
        {made && <span className="text-xs text-muted-foreground" aria-live="polite">Follow-up added for {made}.</span>}
      </div>
    )

  return (
    <div role="group" aria-label="Make a follow-up" className="grid gap-2 border border-border bg-well p-3">
      <label className="grid gap-1">
        <span className="nx-lab">Follow-up</span>
        <input
          autoFocus
          value={text}
          maxLength={300}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') add()
            if (e.key === 'Escape') {
              e.stopPropagation()
              setOpen(false)
            }
          }}
          className="min-h-11 w-full border border-border bg-transparent px-2 py-1.5 text-sm focus-visible:border-primary focus-visible:outline-none md:min-h-0"
        />
      </label>
      <div className="flex flex-wrap items-center gap-1">
        {days.map((d) => (
          <button
            key={d.label}
            type="button"
            aria-pressed={day === d.day}
            onClick={() => setDay(d.day)}
            className={`min-h-11 border px-2 py-1 text-xs md:min-h-0 ${day === d.day ? 'border-primary text-foreground' : 'border-[#2e333b] text-muted-foreground hover:text-foreground'}`}
          >
            {d.label}
          </button>
        ))}
        <label className="flex items-center gap-1 text-xs text-muted-foreground">
          <span className="sr-only">Pick a day</span>
          <input
            type="date"
            min={nyTomorrow(today)}
            value={day}
            onChange={(e) => /^\d{4}-\d{2}-\d{2}$/.test(e.target.value) && e.target.value > today && setDay(e.target.value)}
            className="min-h-11 border border-border bg-transparent px-1 py-0.5 text-xs text-muted-foreground md:min-h-0"
          />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={add} disabled={busy || !text.trim() || !day} className="nx-prim disabled:opacity-40">
          {busy ? 'Adding…' : `Add for ${day ? shortDay(day) : '…'}`}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="nx-ghost !border-transparent">
          Cancel
        </button>
        <span aria-live="polite" className="text-xs text-danger empty:hidden">
          {error}
        </span>
      </div>
    </div>
  )
}
