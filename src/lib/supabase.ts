/* ── Supabase (server-side only) ──────────────────────────────────────────
 * Used by the audit-record route, the benchmarks page, and the seed script.
 * All access is server-side, so the anon/publishable key never ships to the
 * browser. Returns null when env is unconfigured so capture + stats degrade
 * gracefully — the audit tool itself keeps working with no analytics.
 * ─────────────────────────────────────────────────────────────────────── */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const anonKey = process.env.SUPABASE_ANON_KEY

let cached: SupabaseClient | null | undefined

export function getSupabase(): SupabaseClient | null {
  if (cached !== undefined) return cached
  cached = url && anonKey
    ? createClient(url, anonKey, { auth: { persistSession: false } })
    : null
  return cached
}
