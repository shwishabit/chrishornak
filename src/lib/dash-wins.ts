/* "Today's wins" signal (2026-10-15). The Feed and the To-do list announce a
 * finished item; the Wins card listens, plays a soft chime and animates.
 * Plain browser events, so the three client components stay independent. */

export interface Win {
  id: string
  title: string
  mins: number
  brand?: string
  note?: string
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

/* To-do ↔ Feed sync (2026-10-15): a labeled to-do shows in both places. Whoever changes it
 * announces the patch, and the other side applies it locally. */
export interface TodoChange {
  id: string
  patch: { text?: string; day?: string; label?: string; brand?: string; done?: boolean; archived?: boolean; deleted?: boolean }
  /** A to-do just made from a Feed item (2026-10-16): the To-do card adds it as is. */
  row?: { id: string; text: string; day: string; position: number; label: string; brand?: string; done_at: string | null; archived_at: string | null; created_at: string }
}
const TODO = 'dash:todo'

export function emitTodoChange(c: TodoChange) {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent<TodoChange>(TODO, { detail: c }))
}

export function onTodoChange(fn: (c: TodoChange) => void): () => void {
  const h = (e: Event) => fn((e as CustomEvent<TodoChange>).detail)
  window.addEventListener(TODO, h)
  return () => window.removeEventListener(TODO, h)
}

/* Today's open to-dos (2026-10-16): the To-do card announces them so Focus can walk them too.
 * The last list is kept, so a listener that subscribes late still gets it at once. */
export interface TodayTodo {
  id: string
  text: string
  brand?: string
}
const TODAY = 'dash:todaytodos'
let lastToday: TodayTodo[] = []

export function emitTodayTodos(list: TodayTodo[]) {
  lastToday = list
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent<TodayTodo[]>(TODAY, { detail: list }))
}

export function onTodayTodos(fn: (list: TodayTodo[]) => void): () => void {
  const h = (e: Event) => fn((e as CustomEvent<TodayTodo[]>).detail)
  window.addEventListener(TODAY, h)
  fn(lastToday)
  return () => window.removeEventListener(TODAY, h)
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
