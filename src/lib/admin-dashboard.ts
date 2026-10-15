/* ── Admin dashboard reads (server-side) ──────────────────────────────────
 * v2 (2026-10-15). Three sources, all failing soft to null so one dead
 * source never blanks the page:
 *   - dash_state (migration 0015): today / projects / scorecard / catalog /
 *     health, pushed hourly by .agent/scripts/dash-refresh.mjs on Chris's PC.
 *   - dash_bloghands_stats (0015): live Blog Hands numbers. Same Supabase project.
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
export interface Catalog {
  agents: CatalogAgent[]
  skills: CatalogSkill[]
  // Added 2026-10-15 (the Claude tab). Optional: older blobs don't have them.
  triggers?: { say: string[]; label: string; does: string }[]
  commands?: { id: string; description: string }[]
  hooks?: { event: string; matcher: string; script: string; scope: string; description: string }[]
  mcp?: { name: string; where: string }[]
  schedules?: { name: string; state: string; last: string | null; next: string | null; ok: boolean; description: string }[]
  memory?: { files: number; hubs: { name: string; hint: string }[] }
}

export interface Health {
  sentinel: {
    swept_at: string | null
    failed: boolean
    sections: { label: string; count: number; level: Level; items: string[] }[]
    // Per-site split (2026-10-15). Optional: older blobs don't have them.
    sites?: string[]
    findings?: { site: string; level: Level; check: string; text: string }[]
    certs?: { domain: string; site: string; expires: string; days: number }[]
    up?: { domain: string; site: string }[]
    clean?: { title: string; text: string }[]
  }
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
  messages?: MailMessage[]
  /** chrishornak.com contact + hire form emails, last 14 days (read or unread). */
  leads?: MailMessage[]
}

/** id = Gmail message id (stable). Missing on blobs pushed before 2026-10-15. */
export interface MailMessage {
  id?: string
  from: string
  subject: string
  at: string
  link: string
  /** Lead-form emails only: which brand's form, and which form. */
  brand?: string
  form?: string
  /** Likely junk (PC-side check of subject + body); spamWhy = the matched reason. */
  spam?: boolean
  spamWhy?: string
}

/** Newest Gmail message to or from a contact (dash-sales.mjs). */
export interface LastEmail { at: string; subject: string; direction: 'from them' | 'from you' | 'about them'; link: string }

export interface ScoutLead {
  id: string
  name: string
  stage: 'new' | 'contacted' | 'in_conversation' | 'proposal'
  next_step: string | null
  due: string | null
  value_monthly: number | null
  value_oneoff: number | null
  domain: string | null
  last_touch: string | null
  last_type: string | null
  link: string
  email?: string | null
  last_email?: LastEmail | null
}

export interface SpecDraft { id: string; name: string; file: string; updated: string; preview: string; email?: string | null; last_email?: LastEmail | null }

/** The new Swift Growth site's tool leads (its own Supabase project), via dash-sales.mjs. */
export interface SgmState {
  ok: boolean
  error: string | null
  /** False until the new site answers on swiftgrowth.marketing (dashboard-config.json sgmLive). */
  live: boolean
  checks?: { id: string; created_at: string; site: string; name: string; email: string; company: string | null; score: number | null; tier: string | null; status: string }[]
  audits?: { id: string; created_at: string; email: string; business_name: string }[]
  scans?: { created_at: string; business_name: string; overall: number | null; letter: string | null }[]
}

/** Pushed hourly by .agent/scripts/dash-sales.mjs (Scout lives in another Supabase project). */
export interface SalesState {
  scout: { ok: boolean; error: string | null; leads: ScoutLead[] }
  drafts: SpecDraft[]
  sgm?: SgmState
  /** Last email with each Blog Hands sign-up / claim and SGM tool lead, by lowercase address. */
  last_by_email?: Record<string, LastEmail>
}

export interface CalEvent {
  title: string
  start: string // ISO for timed events, YYYY-MM-DD for all-day
  end: string | null
  allDay: boolean
  location: string | null
  calendar: string
}

// refresh_request: a pending "Refresh now" (migration 0019); only its time matters.
const KEYS = ['today', 'projects', 'scorecard', 'catalog', 'health', 'mail', 'calendar', 'sales', 'refresh_request'] as const
type Key = (typeof KEYS)[number]

export interface DashState {
  today: { items: TodayItem[] } | null
  projects: { items: DashProject[] } | null
  scorecard: Scorecard | null
  catalog: Catalog | null
  health: Health | null
  mail: { accounts: MailAccount[] } | null
  calendar: { calendars: { label: string; ok: boolean }[]; events: CalEvent[] } | null
  sales: SalesState | null
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
    sales: pick('sales'),
    updated,
  }
}

/* ── Feed status (migration 0016) ── */

export type FeedStatus = 'done' | 'snoozed' | 'skipped'

export interface FeedStatusRow {
  id: string
  status: FeedStatus
  until: string | null
  title: string
  grp: string
  mins: number
  /** Brand at the time it was marked (0016c), so a win keeps its color after the item leaves the Feed. */
  brand?: string
  /** What Chris wrote when he marked it done (0016d). */
  note?: string
  at: string
}

export async function getFeedStatus(): Promise<FeedStatusRow[]> {
  const sb = getSupabase()
  const key = adminKey()
  if (!sb || !key) return []
  const { data, error } = await sb.rpc('dash_feed_status_admin', { p_secret: key })
  if (error || !Array.isArray(data)) return []
  return data as FeedStatusRow[]
}

export async function setFeedStatus(row: {
  id: string
  status: FeedStatus | null
  until?: string | null
  title?: string
  grp?: string
  mins?: number
  brand?: string
  note?: string
}): Promise<boolean> {
  const sb = getSupabase()
  const key = adminKey()
  if (!sb || !key) return false
  const { data, error } = await sb.rpc('dash_feed_status_set', {
    p_secret: key,
    p_item_id: row.id,
    p_status: row.status,
    p_until: row.until ?? null,
    p_title: row.title ?? '',
    p_grp: row.grp ?? '',
    p_mins: row.mins ?? 0,
    p_brand: row.brand ?? '',
    p_note: row.note ?? '',
  })
  return !error && data === true
}

/* ── Hand-typed to-do list (migration 0017) ── */

export interface Todo {
  id: string
  text: string
  /** The day it is for (YYYY-MM-DD, New York). Past days carry forward. */
  day: string
  /** Chris's drag order, lower first. */
  position: number
  /** A Feed group ('' = none). A labeled to-do also shows in the Feed under that group. */
  label: string
  done_at: string | null
  archived_at: string | null
  created_at: string
}

export type TodoPatch = { text?: string; day?: string; position?: number; label?: string; done?: boolean; archived?: boolean }

export async function getTodos(): Promise<Todo[]> {
  const sb = getSupabase()
  const key = adminKey()
  if (!sb || !key) return []
  const { data, error } = await sb.rpc('dash_todos_admin', { p_secret: key })
  if (error || !Array.isArray(data)) return []
  return data as Todo[]
}

export async function addTodo(text: string, label = ''): Promise<Todo | null> {
  const sb = getSupabase()
  const key = adminKey()
  if (!sb || !key) return null
  const { data, error } = await sb.rpc('dash_todo_add', { p_secret: key, p_text: text, p_label: label })
  return error || !data ? null : (data as Todo)
}

export async function updateTodo(id: string, patch: TodoPatch): Promise<boolean> {
  const sb = getSupabase()
  const key = adminKey()
  if (!sb || !key) return false
  const { data, error } = await sb.rpc('dash_todo_update', { p_secret: key, p_id: id, p_patch: patch })
  return !error && data === true
}

export async function deleteTodo(id: string): Promise<boolean> {
  const sb = getSupabase()
  const key = adminKey()
  if (!sb || !key) return false
  const { data, error } = await sb.rpc('dash_todo_delete', { p_secret: key, p_id: id })
  return !error && data === true
}

/* ── Sales leads that live in this database (migration 0016) ── */

export interface SalesDb {
  signups: { id: string; email: string; name: string | null; website: string | null; stage: string | null; at: string }[]
  claims: { id: string; email: string | null; domain: string | null; topic: string | null; at: string }[]
  low_scores: { domain: string; score: number; at: string }[]
  /** This week's runs of each chrishornak.com tool (0016b). Optional: older function. */
  tool_runs_7d?: { findability: number; authority: number; og: number }
}

export async function getSalesDb(): Promise<SalesDb | null> {
  const sb = getSupabase()
  const key = adminKey()
  if (!sb || !key) return null
  const { data, error } = await sb.rpc('dash_sales_admin', { p_secret: key })
  if (error || !data) return null
  return data as SalesDb
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

/* ── Extras (migration 0018): own time estimates + win days for the streak ── */

export async function getFeedMins(): Promise<Record<string, number>> {
  const sb = getSupabase()
  const key = adminKey()
  if (!sb || !key) return {}
  const { data, error } = await sb.rpc('dash_feed_mins_admin', { p_secret: key })
  return error || !data ? {} : (data as Record<string, number>)
}

export async function setFeedMins(id: string, mins: number | null): Promise<boolean> {
  const sb = getSupabase()
  const key = adminKey()
  if (!sb || !key) return false
  const { data, error } = await sb.rpc('dash_feed_mins_set', { p_secret: key, p_item_id: id, p_mins: mins })
  return !error && data === true
}

export interface WinDay { d: string; wins: number; mins: number }

export async function getWinDays(): Promise<WinDay[]> {
  const sb = getSupabase()
  const key = adminKey()
  if (!sb || !key) return []
  const { data, error } = await sb.rpc('dash_win_days', { p_secret: key })
  return error || !Array.isArray(data) ? [] : (data as WinDay[])
}

/** "Refresh now": ask the PC job for a full refresh (it checks every 5 minutes). Returns the request time. */
export async function requestRefresh(): Promise<string | null> {
  const sb = getSupabase()
  const key = adminKey()
  if (!sb || !key) return null
  const { data, error } = await sb.rpc('dash_refresh_request', { p_secret: key, p_take: false })
  return error || !data ? null : String(data)
}
