/* ── Admin job-lead reads + edits (server-side) ──────────────────────────
 * Thin wrappers over the secret-guarded RPCs (migration 0010). Every call
 * passes ADMIN_KEY as the secret; the RPC rejects anything else. Reads fail
 * soft to null so the page can show its "not reachable" state.
 * ─────────────────────────────────────────────────────────────────────── */
import 'server-only'
import { getSupabase } from './supabase'
import { adminKey } from './admin-auth'

export const JOB_STATUSES = ['new', 'pitched', 'replied', 'won', 'passed', 'skipped'] as const
export type JobStatus = (typeof JOB_STATUSES)[number]

export interface JobLead {
  id: string
  source: string
  kind: 'direct' | 'board' | 'skipped'
  posted: string | null
  who: string
  handle: string | null
  ask: string
  link: string
  ext_link: string | null
  contact: string | null
  fit: 'strong' | 'good' | 'weak' | 'skip'
  fit_why: string | null
  status: JobStatus
  note: string
  added: string
  status_changed: string | null
  work_type: 'freelance' | 'contract' | 'part-time' | 'fractional' | 'full-time' | 'unknown'
  highlight: boolean
  tags: string[]
  pay_hr: number | null
  pay_basis: string | null
  deal_usd: number | null
}

export interface JobLeadRun {
  run_date: string
  source: string
  queries: number
  kept: number
  real_leads: number
  window_days: number
}

export async function getJobLeads(): Promise<{ rows: JobLead[]; runs: JobLeadRun[] } | null> {
  const sb = getSupabase()
  const key = adminKey()
  if (!sb || !key) return null
  const { data, error } = await sb.rpc('job_leads_admin', { p_secret: key })
  if (error || !data) return null
  const d = data as { rows?: JobLead[]; runs?: JobLeadRun[] }
  return { rows: Array.isArray(d.rows) ? d.rows : [], runs: Array.isArray(d.runs) ? d.runs : [] }
}

export async function updateJobLead(id: string, patch: { status?: JobStatus; note?: string }): Promise<boolean> {
  const sb = getSupabase()
  const key = adminKey()
  if (!sb || !key) return false
  const { data, error } = await sb.rpc('job_lead_update', {
    p_secret: key,
    p_id: id,
    p_status: patch.status ?? null,
    p_note: patch.note ?? null,
  })
  return !error && data === true
}
