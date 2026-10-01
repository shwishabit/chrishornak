/* ── Admin read of the OG image checker log (server-side) ─────────────────
 * One secret-guarded RPC (migration 0005), same pattern as admin-audit.ts:
 * passes ADMIN_KEY, fails soft to null so the page can show its
 * "not reachable yet" state instead of throwing.
 * ─────────────────────────────────────────────────────────────────────── */
import 'server-only'
import { getSupabase } from './supabase'
import { adminKey } from './admin-auth'

export interface OgCheckRow {
  id: string
  created_at: string
  domain: string
  passed: number
  failed: string[]
  warned: string[]
  status: 'completed' | 'error'
}

export interface OgChecksAdmin {
  total: number
  today: number
  last_7d: number
  last_30d: number
  unique_domains: number
  errors: number
  top_failed: { id: string; count: number }[]
  rows: OgCheckRow[]
}

export async function getOgChecksAdmin(opts: { limit?: number; offset?: number } = {}): Promise<OgChecksAdmin | null> {
  const sb = getSupabase()
  const key = adminKey()
  if (!sb || !key) return null
  const { data, error } = await sb.rpc('og_checks_admin', {
    p_secret: key,
    p_limit: opts.limit ?? 50,
    p_offset: opts.offset ?? 0,
  })
  if (error || !data) return null
  return data as OgChecksAdmin
}
