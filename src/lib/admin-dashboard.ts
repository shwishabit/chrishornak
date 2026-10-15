/* ── Admin dashboard reads (server-side) ──────────────────────────────────
 * Thin wrapper over the dash_projects_admin RPC (migration 0014). Same
 * secret-guarded pattern as admin-jobs.ts. Fails soft to null.
 * ─────────────────────────────────────────────────────────────────────── */
import 'server-only'
import { getSupabase } from './supabase'
import { adminKey } from './admin-auth'

export interface DashProject {
  id: string
  name: string
  status: string
  next_action: string
  updated_at: string
}

export async function getDashProjects(): Promise<DashProject[] | null> {
  const sb = getSupabase()
  const key = adminKey()
  if (!sb || !key) return null
  const { data, error } = await sb.rpc('dash_projects_admin', { p_secret: key })
  if (error || !data) return null
  return Array.isArray(data) ? data : []
}
