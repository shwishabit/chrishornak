/* ── Admin dashboard reads (server-side) ──────────────────────────────────
 * v2 (2026-10-15). Three sources, all failing soft to null so one dead
 * source never blanks the page:
 *   - dash_state (migration 0015): today / projects / scorecard / catalog /
 *     health, pushed hourly by .agent/scripts/dash-refresh.mjs on Chris's PC.
 *   - dash_bloghands_stats (0015): live Blog Hands numbers. Same Supabase project.
 *   - f0rmless public stats JSON (/api/stats/export), cached for an hour.
 *   Mail + calendar also arrive through dash_state ('mail', 'calendar'), read on
 *   Chris's PC by .agent/scripts/dash-inbox.mjs, so their app passwords and
 *   secret iCal links never leave that PC.
 * ─────────────────────────────────────────────────────────────────────── */
import 'server-only'
import { getSupabase } from './supabase'
import { adminKey } from './admin-auth'

export type Level = 'red' | 'amber' | 'plain' | 'green'

export interface TodayItem {
  kind: 'top3' | 'alert' | 'due' | 'play' | 'house' | 'followup' | 'question'
  level: Level
  title: string
  detail: string
  badge: string
  say: string
  href?: string
}

export interface DashProject {
  id: string
  name: string
  folder: string
  tag: 'Client' | 'Owned' | 'Internal' | 'Game' | 'Other'
  url: string | null
  status: string
  next: string
  lane: 'you' | 'waiting' | 'parked'
  last_touched: string | null
  days: number | null
  say: string
  flag?: string
  /** Changes per day, last 14 days, oldest first. null = no git history. */
  activity?: number[] | null
  unplayed?: number
}

export interface Scorecard {
  since: string
  total: number
  repos: { name: string; count: number; latest: { date: string; subject: string }[] }[]
}

export interface CatalogAgent { id: string; group: string; model: string; description: string; uses: string[]; say: string }
export interface CatalogSkill { id: string; type: 'skill' | 'guide'; description: string; usedBy: string[] }
export interface Catalog { agents: CatalogAgent[]; skills: CatalogSkill[] }

export interface Health {
  sentinel: { swept_at: string | null; failed: boolean; sections: { label: string; count: number; level: Level; items: string[] }[] }
  f0rmless: { status: string; wire: string; vitals: string; checked_at: string | null; findings: string[] }
}

export interface MailAccount {
  email: string
  label: string
  ok: boolean
  error?: string
  unread?: number
  unread_primary?: number
  inbox: string
  messages?: { from: string; subject: string; at: string; link: string }[]
}

export interface CalEvent {
  title: string
  start: string // ISO for timed events, YYYY-MM-DD for all-day
  end: string | null
  allDay: boolean
  location: string | null
  calendar: string
}

const KEYS = ['today', 'projects', 'scorecard', 'catalog', 'health', 'mail', 'calendar'] as const
type Key = (typeof KEYS)[number]

export interface DashState {
  today: { items: TodayItem[] } | null
  projects: { items: DashProject[] } | null
  scorecard: Scorecard | null
  catalog: Catalog | null
  health: Health | null
  mail: { accounts: MailAccount[] } | null
  calendar: { calendars: { label: string; ok: boolean }[]; events: CalEvent[] } | null
  updated: Partial<Record<Key, string>>
}

export async function getDashState(): Promise<DashState | null> {
  const sb = getSupabase()
  const key = adminKey()
  if (!sb || !key) return null
  const { data, error } = await sb.rpc('dash_state_admin', { p_secret: key })
  if (error || !data) return null
  const d = data as Record<string, { data: unknown; updated_at: string }>
  const pick = <T,>(k: string) => (d[k]?.data as T) ?? null
  const updated: DashState['updated'] = {}
  for (const k of KEYS) if (d[k]) updated[k] = d[k].updated_at
  return {
    today: pick('today'),
    projects: pick('projects'),
    scorecard: pick('scorecard'),
    catalog: pick('catalog'),
    health: pick('health'),
    mail: pick('mail'),
    calendar: pick('calendar'),
    updated,
  }
}

export interface BlogHandsStats {
  signups_7d: number
  signups_30d: number
  accounts_total: number
  subscribers: number
  active_subs: number
  posts_delivered_7d: number
  posts_delivered_30d: number
  paige_runs_7d: number
  paige_flagged_open: number
  paige_failed_7d: number
  grader_runs_7d: number
  grader_runs_30d: number
  free_claims_7d: number
  paid_orders_30d: number
  revenue_30d_cents: number
  daily: { d: string; signups: number; grades: number }[]
}

export async function getBlogHandsStats(): Promise<BlogHandsStats | null> {
  const sb = getSupabase()
  const key = adminKey()
  if (!sb || !key) return null
  const { data, error } = await sb.rpc('dash_bloghands_stats', { p_secret: key })
  if (error || !data) return null
  return data as BlogHandsStats
}

export interface F0rmlessDay {
  date: string
  distinctStreams: number
  avgConcurrentStreams: number
  peakConcurrentMatches: number
  peakViewers: number
  peakSingleFeedViewers: number
}

export async function getF0rmlessStats(): Promise<F0rmlessDay[] | null> {
  try {
    const res = await fetch('https://www.f0rmless.com/api/stats/export', {
      next: { revalidate: 3600 },
      // f0rmless's Vercel firewall may answer 429 "challenge" to scripted calls; we fail
      // soft and the tile falls back to the PC watcher's vitals. Never retry in a loop.
      headers: { accept: 'application/json', 'user-agent': 'chrishornak-dashboard (info@swiftgrowth.marketing)' },
      signal: AbortSignal.timeout(6000),
    })
    if (!res.ok) return null
    const json = (await res.json()) as { days?: F0rmlessDay[] }
    return Array.isArray(json.days) ? json.days.slice(-14) : null
  } catch {
    return null
  }
}
