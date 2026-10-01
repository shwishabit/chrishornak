/* ── Admin read of the Authority Check log (server-side) ──────────────────
 * One secret-guarded RPC (migration 0006), same pattern as admin-og.ts:
 * passes ADMIN_KEY, fails soft to null so the page can show its
 * "not reachable yet" state instead of throwing.
 * ─────────────────────────────────────────────────────────────────────── */
import 'server-only'
import { getSupabase } from './supabase'
import { adminKey } from './admin-auth'

export interface AuthorityCheckRow {
  id: string
  created_at: string
  domain: string
  rival_count: number
  rival_domains: string[]
  /** You, Rival A, B, C. null = no link data. */
  links: (number | null)[]
  /** You, Rival A, B, C. null = homepage not read. */
  proof: (number | null)[]
  links_status: 'ok' | 'busy' | 'unavailable'
  status: 'completed' | 'error'
}

export interface AuthorityChecksAdmin {
  total: number
  today: number
  last_7d: number
  last_30d: number
  unique_domains: number
  with_rivals: number
  errors: number
  links_busy: number
  rows: AuthorityCheckRow[]
}

export async function getAuthorityChecksAdmin(
  opts: { limit?: number; offset?: number } = {},
): Promise<AuthorityChecksAdmin | null> {
  const sb = getSupabase()
  const key = adminKey()
  if (!sb || !key) return null
  const { data, error } = await sb.rpc('authority_checks_admin', {
    p_secret: key,
    p_limit: opts.limit ?? 50,
    p_offset: opts.offset ?? 0,
  })
  if (error || !data) return null
  return data as AuthorityChecksAdmin
}
