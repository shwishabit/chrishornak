/* ── Audit Scoring Engine ─────────────────────────────────────────────────
 *
 * Weights are based on documented ranking factor research:
 *
 * - Search (25%): Indexability, page title, description, canonical,
 *   crawl permissions, and sitemap. The technical foundation — if search
 *   engines can't find and index your page, nothing else matters.
 *   (Google Search Central, Moz)
 *
 * - AI (25%): Structured data, answerable content, trust signals,
 *   citability, entity clarity, and business description. The signals
 *   AI tools use to find, understand, and cite your content.
 *   (Authoritas GEO study, 2024; Princeton LLM citation research)
 *
 * - Structure (20%): Heading hierarchy, images, alt text, content depth,
 *   internal links, and link quality. On-page factors that affect crawl
 *   comprehension, featured snippets, accessibility, and UX.
 *   (Ahrefs, SEMrush, WCAG 2.1)
 *
 * - Social (10%): OG/Twitter tags, share image, and social profile links.
 *   Controls how your page appears in social shares and brand connections.
 *   (Open Graph Protocol, X Docs)
 *
 * - Mobile (10%): Viewport, doctype, charset, tap targets, text
 *   readability, and image formats. Mobile-first indexing is Google's
 *   default since 2023. (Google Search Central)
 *
 * - Security (10%): HTTPS, safe external links, form security, password
 *   field exposure, and CSP. Trust signals for both users and search
 *   engines. (Google HTTPS ranking signal, Chrome security indicators)
 *
 * - Accessibility (10%): Language attribute, skip navigation, ARIA
 *   landmarks, form labels, link purpose, and focus indicators. If your
 *   site isn't accessible, you're invisible to ~25% of the population.
 *   (WCAG 2.1 AA, ADA compliance)
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
  'Structure': 20,
  'Social': 10,
  'Mobile': 10,
  'Security': 10,
  'Accessibility': 10,
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
