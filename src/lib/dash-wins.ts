/* "Today's wins" signal (2026-10-15). The Feed and the To-do list announce a
 * finished item; the Wins card listens, plays a soft chime and animates.
 * Plain browser events, so the three client components stay independent. */

export interface Win {
  id: string
  title: string
  mins: number
  brand?: string
  at: string
}

const WIN = 'dash:win'
const UNWIN = 'dash:unwin'

/** A to-do has no time estimate; it counts as this many minutes of progress. */
export const TODO_WIN_MINS = 10

export function emitWin(w: Win) {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent<Win>(WIN, { detail: w }))
}

export function emitUnwin(id: string) {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent<string>(UNWIN, { detail: id }))
}

export function onWins(win: (w: Win) => void, unwin: (id: string) => void): () => void {
  const a = (e: Event) => win((e as CustomEvent<Win>).detail)
  const b = (e: Event) => unwin((e as CustomEvent<string>).detail)
  window.addEventListener(WIN, a)
  window.addEventListener(UNWIN, b)
  return () => {
    window.removeEventListener(WIN, a)
    window.removeEventListener(UNWIN, b)
  }
}

/* Live Feed counts (review 2026-10-15): the Feed announces its open counts whenever they
 * change, so the tab badges and the top line stay in step without a reload. */
export interface FeedCounts {
  open: number
  urgent: number
  email: number
  sales: number
}

const COUNTS = 'dash:feedcounts'

export function emitFeedCounts(c: FeedCounts) {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent<FeedCounts>(COUNTS, { detail: c }))
}

export function onFeedCounts(fn: (c: FeedCounts) => void): () => void {
  const h = (e: Event) => fn((e as CustomEvent<FeedCounts>).detail)
  window.addEventListener(COUNTS, h)
  return () => window.removeEventListener(COUNTS, h)
}
