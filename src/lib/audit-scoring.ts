/* ── Audit Scoring Engine ─────────────────────────────────────────────────
 *
 * Weights are based on documented ranking factor research:
 *
 * 1. Search (25%): Can search engines find you?
 *    (Google Search Central, Moz)
 *
 * 2. AI (25%): Does AI know you exist?
 *    (Authoritas GEO study, 2024; Princeton LLM citation research)
 *
 * 3. Social (10%): Do you look good when shared?
 *    (Open Graph Protocol, X Docs)
 *
 * 4. Mobile (10%): Does it work on their phone?
 *    (Google Mobile-First Indexing, Google Search Central)
 *
 * 5. Structure (20%): Is your page well-built?
 *    (Ahrefs, SEMrush, WCAG 2.1)
 *
 * 6. Accessibility (10%): Can everyone use your site?
 *    (WCAG 2.1 AA, ADA Title III)
 *
 * 7. Security (10%): Do visitors trust your site?
 *    (Google HTTPS ranking signal, Chrome security indicators)
 *
 * Within each category, checks can have individual weights (default 1).
 * Higher weight = more influence on the category score.
 * Scoring: pass = 100% | warn = 50% (or custom score) | fail = 0%
 * ─────────────────────────────────────────────────────────────────────────── */

export type Status = 'pass' | 'fail' | 'warn'

export interface AuditItem {
  label: string
  status: Status
  value: string
  extracted?: string
  recommendation?: string
  /** Override the default status-based score (0–1). Use for percentage-based
   *  checks like "6 of 7 images have alt text" → score: 0.86 */
  score?: number
  /** Weight of this check within its category (default 1). Higher = more
   *  influence on the category score. Use 0.5 for informational checks,
   *  2 for critical ones. */
  weight?: number
}

export interface AuditCategory {
  name: string
  icon: React.ReactNode
  items: AuditItem[]
}

export interface AuditResult {
  url: string
  categories: AuditCategory[]
}

export interface RankedCategory extends AuditCategory {
  score: number
  weight: number
  weightedScore: number
}

// Weights lean toward the categories that actually differentiate sites today
// (AI, Structure, Accessibility) and away from the near-ceiling fundamentals
// (Mobile, Security) that modern site builders hand out for free — so a strong
// score reflects real optimization, not platform defaults.
export const CATEGORY_WEIGHTS: Record<string, number> = {
  'Search': 25,
  'AI': 27,
  'Social': 10,
  'Mobile': 7,
  'Structure': 22,
  'Accessibility': 12,
  'Security': 7,
}

/** Unified color thresholds: 75+ green, 40-74 amber, <40 red */
export function scoreColor(score: number) {
  if (score >= 75) return { text: 'text-emerald-400', bg: 'bg-emerald-400', ring: 'bg-emerald-400/10 text-emerald-400', dot: 'bg-emerald-400' }
  if (score >= 40) return { text: 'text-amber-400', bg: 'bg-amber-400', ring: 'bg-amber-400/10 text-amber-400', dot: 'bg-amber-400' }
  return { text: 'text-red-400', bg: 'bg-red-400', ring: 'bg-red-400/10 text-red-400', dot: 'bg-red-400' }
}

export function scoreItem(item: AuditItem): number {
  if (item.score !== undefined) return item.score
  if (item.status === 'pass') return 1
  // Warnings earn partial (not half) credit — a pile of warnings should pull the
  // score down enough to signal real work, not coast near the top.
  if (item.status === 'warn') return 0.3
  return 0
}

/** Critical checks that force a category to 0% if they fail */
const CRITICAL_CHECKS: Record<string, string> = {
  'Search': 'Indexability',
}

/* Weakest-link gate — findability's substance lives in AI + Structure. A pure
 * weighted average lets strength in the easy, near-ceiling categories (Mobile,
 * Security, a title tag) paper over a failing core, so a site that bombs the
 * two things that matter most can still average its way to a green score. When
 * a core category falls below CORE_FAIL_THRESHOLD, the overall is capped at
 * CORE_FAIL_CAP (below the 75 green line). Same spirit as CRITICAL_CHECKS, one
 * level softer — a penalty, not a zero. */
const CORE_CATEGORIES = ['AI', 'Structure']
const CORE_FAIL_THRESHOLD = 50
const CORE_FAIL_CAP = 70

export function scoreCategoryPercent(name: string, items: AuditItem[]): number {
  if (items.length === 0) return 0

  const criticalLabel = CRITICAL_CHECKS[name]
  if (criticalLabel) {
    const criticalItem = items.find((i) => i.label === criticalLabel)
    if (criticalItem && criticalItem.status === 'fail') return 0
  }

  let weightedTotal = 0
  let totalWeight = 0
  for (const item of items) {
    const w = item.weight ?? 1
    weightedTotal += scoreItem(item) * w
    totalWeight += w
  }
  return totalWeight > 0 ? weightedTotal / totalWeight : 0
}

export function computeOverallScore(categories: AuditCategory[]): number {
  let weightedSum = 0
  let totalWeight = 0
  let coreShortfall = false

  for (const cat of categories) {
    const weight = CATEGORY_WEIGHTS[cat.name] ?? 5
    const pct = scoreCategoryPercent(cat.name, cat.items)
    weightedSum += pct * weight
    totalWeight += weight
    if (CORE_CATEGORIES.includes(cat.name) && pct * 100 < CORE_FAIL_THRESHOLD) {
      coreShortfall = true
    }
  }

  if (totalWeight === 0) return 0
  const overall = Math.round((weightedSum / totalWeight) * 100)
  return coreShortfall ? Math.min(overall, CORE_FAIL_CAP) : overall
}

export function computeCategoryScore(category: AuditCategory): number {
  return Math.round(scoreCategoryPercent(category.name, category.items) * 100)
}

export function rankCategories(categories: AuditCategory[]): RankedCategory[] {
  return categories
    .map((c) => {
      const weight = CATEGORY_WEIGHTS[c.name] ?? 5
      const score = computeCategoryScore(c)
      return { ...c, score, weight, weightedScore: score * weight }
    })
}
