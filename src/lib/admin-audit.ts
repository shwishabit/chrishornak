/* ── Admin usage reads (server-side) ──────────────────────────────────────
 * Thin wrappers over the secret-guarded RPCs (migration 0004). Every call
 * passes ADMIN_KEY as the secret; the RPC rejects anything else. Fails soft:
 * an unconfigured key or an errored call returns an empty/neutral result so the
 * page can render its "not configured yet" state instead of throwing.
 * ─────────────────────────────────────────────────────────────────────── */
import 'server-only'
import { getSupabase } from './supabase'
import { adminKey } from './admin-auth'

export interface AuditLogRow {
  id: string
  created_at: string
  domain: string
  overall_score: number
  category_scores: Record<string, number>
  issues: { c: string; l: string; s: 'fail' | 'warn' }[]
  status: string
}

export interface AdminOverview {
  total: number
  today: number
  last_7d: number
  last_30d: number
  avg_score: number | null
  unique_domains: number
  leads: number
}

export async function getAdminOverview(): Promise<AdminOverview | null> {
  const sb = getSupabase()
  const key = adminKey()
  if (!sb || !key) return null
  const { data, error } = await sb.rpc('benchmark_admin_overview', { p_secret: key })
  if (error || !data) return null
  return data as AdminOverview
}

export interface AuditLogPage {
  total: number
  rows: AuditLogRow[]
}

export async function getAuditLog(opts: {
  limit?: number
  offset?: number
  minScore?: number
  maxScore?: number
} = {}): Promise<AuditLogPage> {
  const sb = getSupabase()
  const key = adminKey()
  if (!sb || !key) return { total: 0, rows: [] }
  const { data, error } = await sb.rpc('benchmark_audit_log', {
    p_secret: key,
    p_limit: opts.limit ?? 50,
    p_offset: opts.offset ?? 0,
    p_min_score: opts.minScore ?? 0,
    p_max_score: opts.maxScore ?? 100,
  })
  if (error || !data) return { total: 0, rows: [] }
  return {
    total: Number((data as { total?: number }).total ?? 0),
    rows: Array.isArray((data as { rows?: AuditLogRow[] }).rows)
      ? ((data as { rows: AuditLogRow[] }).rows)
      : [],
  }
}
