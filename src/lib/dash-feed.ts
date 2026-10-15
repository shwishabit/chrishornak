/* Dashboard Feed — shared types + time helpers (2026-10-15). Plain module: used by
 * the server builder (dash-feed-build.ts), the client Feed and the Calendar card. */
import type { CalEvent, Level } from './admin-dashboard'

export type FeedGroup = 'email' | 'sales' | 'jobs' | 'marketing' | 'client' | 'other'

// Chris's morning order (2026-10-15): Email → Sales → Jobs → Marketing → Client work → Other.
export const FEED_GROUPS: { id: FeedGroup; label: string }[] = [
  { id: 'email', label: 'Email' },
  { id: 'sales', label: 'Sales' },
  { id: 'jobs', label: 'Jobs' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'client', label: 'Client work' },
  { id: 'other', label: 'Other' },
]

export interface FeedItem {
  /** Stable across hourly refreshes, so Done / Snooze / Skip stick. */
  id: string
  group: FeedGroup
  level: Level
  title: string
  detail?: string
  /** Which of Chris's brands (or which client) this is for. Shown first on every item; the brand filter uses it. */
  brand: string
  /** Small grey line: sender, company, source. */
  meta?: string
  mins: number
  /** dash_todos id when this item is a labeled to-do (Done/Snooze/Skip then act on the to-do). */
  todo?: string
  /** Likely spam: the reason. Hidden from the Feed unless "Show spam" is on. */
  spam?: string
  /** True when mins is Chris's own estimate, not the default. */
  minsSet?: boolean
  say?: string
  href?: string
  hrefLabel?: string
  /** A second link, e.g. the last email with this person. */
  link2?: { href: string; label: string }
  /** job_leads row this item writes to on Done / Skip. */
  job?: { id: string; done: 'pitched' | 'replied'; skip: 'passed' | 'skipped'; undo: 'new' }
  /** Label for the Done button ("Pitched", "Answered"). */
  doneLabel?: string
  /** Sort inside the group: lower first (after red items). */
  rank: number
}

export const TZ = 'America/New_York'
export const WORK_START = 10 * 60 // 10 AM
export const WORK_END = 18 * 60 // 6 PM

export const nyDate = (d: Date = new Date()) => d.toLocaleDateString('en-CA', { timeZone: TZ })

/** Minutes since midnight, New York time. */
export function nyMinutes(d: Date): number {
  const p = new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(d)
  const v = (t: string) => Number(p.find((x) => x.type === t)?.value ?? 0)
  return v('hour') * 60 + v('minute')
}

export function fmtMins(m: number): string {
  const h = Math.floor(m / 60)
  const r = Math.round(m % 60)
  return h && r ? `${h}h ${r}m` : h ? `${h}h` : `${r}m`
}

/** Tomorrow's date in New York (YYYY-MM-DD). Noon avoids DST edges. */
export function nyTomorrow(today: string = nyDate()): string {
  const d = new Date(today + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
}

export interface Workday {
  nowMin: number
  /** Work minutes still ahead today (10–6), meetings included. */
  leftMins: number
  /** Meeting minutes still ahead inside work hours. */
  meetingMins: number
  freeMins: number
  /** Today's timed meetings inside 10–6, as minutes since midnight. */
  blocks: { start: number; end: number; title: string }[]
}

/** Free time today = 10–6 work hours from now on, minus meetings (overlaps merged). */
export function workday(events: CalEvent[], now: Date = new Date()): Workday {
  const today = nyDate(now)
  const nowMin = nyMinutes(now)
  const blocks = events
    .filter((e) => !e.allDay && e.end && nyDate(new Date(e.start)) === today)
    .map((e) => {
      const endSameDay = nyDate(new Date(e.end!)) === today
      return { start: nyMinutes(new Date(e.start)), end: endSameDay ? nyMinutes(new Date(e.end!)) : 24 * 60, title: e.title }
    })
    .map((b) => ({ ...b, start: Math.max(b.start, WORK_START), end: Math.min(b.end, WORK_END) }))
    .filter((b) => b.end > b.start)
    .sort((a, b) => a.start - b.start)

  const from = Math.min(Math.max(nowMin, WORK_START), WORK_END)
  const leftMins = WORK_END - from
  let meetingMins = 0
  let cursor = from
  for (const b of blocks) {
    const s = Math.max(b.start, cursor)
    if (b.end > s) {
      meetingMins += b.end - s
      cursor = b.end
    }
  }
  return { nowMin, leftMins, meetingMins, freeMins: Math.max(0, leftMins - meetingMins), blocks }
}
