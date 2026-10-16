'use client'

import { useEffect, useRef } from 'react'

/* One modal shell for the dashboard (2026-10-16): Focus, Feed item details and
 * to-do details. Keeps Tab inside, Esc closes, ← / → step through the list,
 * focus goes back to what opened it. Full screen on a phone. */

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function DashModal({
  labelledBy,
  top,
  onClose,
  onPrev,
  onNext,
  children,
}: {
  labelledBy: string
  /** Left side of the top bar, e.g. "Feed · 3 of 12". */
  top: React.ReactNode
  onClose: () => void
  /** Leave out to hide the arrow; null = shown but off (start / end of the list). */
  onPrev?: (() => void) | null
  onNext?: (() => void) | null
  children: React.ReactNode
}) {
  const box = useRef<HTMLDivElement>(null)
  const keys = useRef({ onClose, onPrev, onNext })
  keys.current = { onClose, onPrev, onNext }

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    // Nothing inside has focus yet (no autoFocus): put it on the dialog itself.
    if (!box.current?.contains(document.activeElement)) box.current?.focus()
    const scroll = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const key = (e: KeyboardEvent) => {
      const k = keys.current
      const typing = (e.target as HTMLElement)?.closest?.('input, select, textarea')
      if (e.key === 'Escape') {
        e.preventDefault()
        k.onClose()
      } else if (e.key === 'ArrowLeft' && !typing && k.onPrev) k.onPrev()
      else if (e.key === 'ArrowRight' && !typing && k.onNext) k.onNext()
      else if (e.key === 'Tab' && box.current) {
        const all = [...box.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null)
        if (!all.length) return e.preventDefault()
        const first = all[0]
        const last = all[all.length - 1]
        if (e.shiftKey && (document.activeElement === first || document.activeElement === box.current)) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', key)
    return () => {
      document.removeEventListener('keydown', key)
      document.body.style.overflow = scroll
      if (opener?.isConnected) opener.focus({ preventScroll: true })
    }
  }, [])

  const arrow = 'nx-ghost min-w-11 !px-2 disabled:opacity-30'
  return (
    // flex + m-auto centres a short dialog, and a tall one starts at the top (grid centring would cut its top off).
    <div className="fixed inset-0 z-50 flex overflow-y-auto bg-background/90 md:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={box}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className="nx-box m-auto flex w-full max-w-2xl flex-col p-5 shadow-2xl outline-none max-md:min-h-dvh max-md:border-0 md:p-8"
      >
        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <span className="min-w-0">{top}</span>
          <span className="flex shrink-0 items-center gap-1.5">
            {onPrev !== undefined && (
              <button type="button" onClick={onPrev ?? undefined} disabled={!onPrev} aria-label="Previous item" title="Previous (←)" className={arrow}>
                ←
              </button>
            )}
            {onNext !== undefined && (
              <button type="button" onClick={onNext ?? undefined} disabled={!onNext} aria-label="Next item" title="Next (→)" className={arrow}>
                →
              </button>
            )}
            <button type="button" onClick={onClose} className="nx-ghost">
              Close <kbd className="ml-1 rounded border border-border px-1 text-[10px] max-md:hidden">Esc</kbd>
            </button>
          </span>
        </div>
        {children}
      </div>
    </div>
  )
}

/** Small pop-up menu under a button. Closes on an outside click or Esc. */
export function Menu({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const click = (e: MouseEvent) => !ref.current?.parentElement?.contains(e.target as Node) && onClose()
    // Capture phase + stop: Esc closes only the menu, not a modal behind it.
    const key = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      onClose()
    }
    document.addEventListener('mousedown', click)
    document.addEventListener('keydown', key, true)
    return () => {
      document.removeEventListener('mousedown', click)
      document.removeEventListener('keydown', key, true)
    }
  }, [onClose])
  return (
    <div ref={ref} role="menu" className="absolute right-0 top-full z-20 mt-1 grid w-64 gap-0.5 border border-[#2e333b] bg-[#171a20] p-1.5 shadow-lg">
      {children}
    </div>
  )
}

export function MenuItem({ onClick, danger, children }: { onClick: () => void; danger?: boolean; children: React.ReactNode }) {
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

/** The Monday after `today` (YYYY-MM-DD); a Monday gives the next one. */
export function nextMonday(today: string): string {
  const d = new Date(today + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + (((8 - d.getUTCDay()) % 7) || 7))
  return d.toISOString().slice(0, 10)
}

/**
 * Hand it off to the calendar (from Tao Toad's "hand it off" door, 2026-10-16): opens a
 * new all-day Google Calendar event for that day, filled in. Nothing is saved to Google by us.
 */
export function openCalendar(title: string, day: string) {
  const d = new Date(day + 'T12:00:00Z')
  const end = new Date(d.getTime() + 864e5).toISOString().slice(0, 10)
  const dates = `${day.replaceAll('-', '')}/${end.replaceAll('-', '')}`
  window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${dates}`, '_blank', 'noopener')
}

/** "To a day" row with a date box, for Move menus and the details modal. */
export function DayPick({ min, value, onPick, label = 'To a day' }: { min: string; value?: string; onPick: (day: string) => void; label?: string }) {
  return (
    <label className="flex min-h-11 items-center justify-between gap-2 whitespace-nowrap px-2.5 py-1.5 text-[13px] text-foreground hover:bg-well md:min-h-0">
      {label}
      <input
        type="date"
        min={min}
        defaultValue={value}
        // Typing a year fires half-typed dates (0002-…): only a full date on or after `min` counts.
        onChange={(e) => /^\d{4}-\d{2}-\d{2}$/.test(e.target.value) && e.target.value >= min && onPick(e.target.value)}
        className="w-31 border border-border bg-transparent px-1 py-0.5 text-xs text-muted-foreground"
      />
    </label>
  )
}
