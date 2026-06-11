/* ── Audit benchmark stats (server-side reads) ────────────────────────────
 * Thin wrappers over the security-definer RPCs. Every function fails soft:
 * if Supabase is unconfigured or the call errors, callers get an empty/neutral
 * result and the page renders its "not enough data yet" state.
 * ─────────────────────────────────────────────────────────────────────── */

import { getSupabase } from './supabase'
import { RPC_STATS, RPC_TOP_ISSUES, RPC_IMPROVEMENT } from './benchmark-config'

export interface BenchmarkStats {
  n: number
  avg: number | null
  median: number | null
  p25: number | null
  p75: number | null
  min: number | null
  max: number | null
  distribution: { bucket: number; count: number }[]
  categoryAvgs: Record<string, number>
}

export interface TopIssue {
  category: string
  label: string
  status: 'fail' | 'warn'
  count: number
  pct: number
}

export async function getBenchmarkStats(): Promise<BenchmarkStats | null> {
  const sb = getSupabase()
  if (!sb) return null
  const { data, error } = await sb.rpc(RPC_STATS)
  if (error || !data) return null
  return {
    n: Number(data.n ?? 0),
    avg: data.avg ?? null,
    median: data.median ?? null,
    p25: data.p25 ?? null,
    p75: data.p75 ?? null,
    min: data.min ?? null,
    max: data.max ?? null,
    distribution: Array.isArray(data.distribution) ? data.distribution : [],
    categoryAvgs: data.category_avgs ?? {},
  }
}

export async function getTopIssues(limit = 8): Promise<TopIssue[]> {
  const sb = getSupabase()
  if (!sb) return []
  const { data, error } = await sb.rpc(RPC_TOP_ISSUES, { limit_n: limit })
  if (error || !Array.isArray(data)) return []
  return data as TopIssue[]
}

/** First-vs-latest score across sites that re-audited. Powers the "sites that
 *  came back improved by N points" credibility stat. Fails soft to null. */
export interface BenchmarkImprovement {
  nReturned: number
  avgDelta: number | null
  avgFirst: number | null
  avgLatest: number | null
  improvedPct: number | null
  medianDelta: number | null
}

export async function getBenchmarkImprovement(): Promise<BenchmarkImprovement | null> {
  const sb = getSupabase()
  if (!sb) return null
  const { data, error } = await sb.rpc(RPC_IMPROVEMENT)
  if (error || !data) return null
  return {
    nReturned: Number(data.n_returned ?? 0),
    avgDelta: data.avg_delta ?? null,
    avgFirst: data.avg_first ?? null,
    avgLatest: data.avg_latest ?? null,
    improvedPct: data.improved_pct ?? null,
    medianDelta: data.median_delta ?? null,
  }
}
