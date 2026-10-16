'use client'

import { createContext, useContext, useMemo, useRef, useState, type MutableRefObject } from 'react'
import type { FeedGroup } from '@/lib/dash-feed'
import type { FeedStatus } from '@/lib/admin-dashboard'

/* Shared state between the console (search, filter, commands) and the Feed (2026-10-15).
 * The console owns what the person types and the filter tags; the Feed reads them, and
 * publishes what it holds (items, counts) so the console can autocomplete from it. */

export type View = 'open' | 'done' | 'snoozed'

export interface FeedMeta {
  items: { id: string; title: string; brand: string; group: FeedGroup; mins: number }[]
  groupCounts: Record<FeedGroup, number>
  brands: [string, number][]
  openCount: number
  doneCount: number
  snoozedCount: number
  spamCount: number
}

/** What the Feed lets other parts of the page do to it. */
export interface FeedApi {
  /** True when the Feed has the item and acted on it. `until` = snooze to that day. */
  act: (id: string, status: FeedStatus | null, until?: string) => boolean
  doneNth: (n: number) => boolean
}

interface Ctx {
  q: string
  setQ: (v: string) => void
  group: FeedGroup | 'all'
  setGroup: (v: FeedGroup | 'all') => void
  quick: boolean
  setQuick: (v: boolean) => void
  brand: string
  setBrand: (v: string) => void
  showSpam: boolean
  setShowSpam: (v: boolean) => void
  view: View
  setView: (v: View) => void
  meta: FeedMeta | null
  setMeta: (m: FeedMeta) => void
  /** Item the console picked: the Feed scrolls to it and flashes it. */
  jump: { id: string; n: number } | null
  setJump: (id: string) => void
  /** Bumped by the `focus` command; the Feed opens Focus mode. */
  focusReq: number
  requestFocus: () => void
  api: MutableRefObject<FeedApi | null>
}

const FilterCtx = createContext<Ctx | null>(null)

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const [q, setQ] = useState('')
  const [group, setGroup] = useState<FeedGroup | 'all'>('all')
  const [quick, setQuick] = useState(false)
  const [brand, setBrand] = useState('all')
  const [showSpam, setShowSpam] = useState(false)
  const [view, setView] = useState<View>('open')
  const [meta, setMeta] = useState<FeedMeta | null>(null)
  const [jump, setJumpState] = useState<{ id: string; n: number } | null>(null)
  const [focusReq, setFocusReq] = useState(0)
  const api = useRef<FeedApi | null>(null)

  const value = useMemo<Ctx>(
    () => ({
      q, setQ, group, setGroup, quick, setQuick, brand, setBrand, showSpam, setShowSpam, view, setView, meta, setMeta,
      jump,
      setJump: (id) => setJumpState((j) => ({ id, n: (j?.n ?? 0) + 1 })),
      focusReq,
      requestFocus: () => setFocusReq((n) => n + 1),
      api,
    }),
    [q, group, quick, brand, showSpam, view, meta, jump, focusReq],
  )
  return <FilterCtx.Provider value={value}>{children}</FilterCtx.Provider>
}

export function useFilters(): Ctx {
  const c = useContext(FilterCtx)
  if (!c) throw new Error('useFilters needs a FilterProvider')
  return c
}

/** DOM id for a Feed item, safe for getElementById. */
export const feedDomId = (id: string) => `feed-${id.replace(/[^a-zA-Z0-9_-]/g, '_')}`
