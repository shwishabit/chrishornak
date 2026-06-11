/* ── Findability benchmark — shared config ────────────────────────────────
 * Safe to import from client OR server (no server-only deps here).
 * ─────────────────────────────────────────────────────────────────────── */

/** Below this many completed audits, suppress the public percentile claim and
 *  show an honest "N sites checked so far" counter instead. The percentile
 *  flips on automatically once the corpus crosses this floor. */
export const BENCHMARK_MIN_N = 100

/** Postgres object names — kept here so the backend target (a dedicated project
 *  vs. a namespaced table in a shared one) only changes one file. */
export const TBL_AUDIT_RUNS = 'audit_runs'
export const RPC_STATS = 'benchmark_stats'
export const RPC_TOP_ISSUES = 'benchmark_top_issues'
export const RPC_RANK = 'benchmark_rank'
export const RPC_IMPROVEMENT = 'benchmark_improvement'

/** The seven findability categories, canonical order. */
export const CATEGORY_ORDER = [
  'Search', 'AI', 'Social', 'Mobile', 'Structure', 'Accessibility', 'Security',
] as const
