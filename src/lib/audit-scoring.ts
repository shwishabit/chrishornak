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

export const CATEGORY_WEIGHTS: Record<string, number> = {
  'Search': 25,
  'AI': 25,
  'Social': 10,
  'Mobile': 10,
  'Structure': 20,
  'Accessibility': 10,
  'Security': 10,
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
  if (item.status === 'warn') return 0.5
  return 0
}

/** Critical checks that force a category to 0% if they fail */
const CRITICAL_CHECKS: Record<string, string> = {
  'Search': 'Indexability',
}

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

  for (const cat of categories) {
    const weight = CATEGORY_WEIGHTS[cat.name] ?? 5
    weightedSum += scoreCategoryPercent(cat.name, cat.items) * weight
    totalWeight += weight
  }

  return totalWeight > 0 ? Math.round(weightedSum / totalWeight * 100) : 0
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
