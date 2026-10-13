/* ── Job-lead score (0-100) ────────────────────────────────────────────────
 * How much a lead is worth Chris's time, from what the tracker already knows.
 * Six parts add up to 100; a known gap (Figma-only delivery) takes points off.
 * Pure + shared by server and client, so the hover can explain every point.
 * Change a weight here and every row re-scores on the next load.
 * ─────────────────────────────────────────────────────────────────────── */
import type { JobLead } from './admin-jobs'

export interface ScorePart {
  label: string
  detail: string
  points: number
  max: number
}

export interface JobScore {
  total: number
  band: 'hot' | 'good' | 'maybe' | 'low'
  parts: ScorePart[]
}

const FIT: Record<JobLead['fit'], [number, string]> = {
  strong: [30, 'Strong match for your work'],
  good: [20, 'Good match'],
  weak: [8, 'Weak match'],
  skip: [0, 'Not a match'],
}

// Effective $/hr. Hunt floor is $50/hr; the anchor is $100-150/hr.
function payPart(payHr: number | null, basis: string | null): ScorePart {
  const max = 25
  if (payHr === null) return { label: 'Pay', detail: 'Not listed (neutral)', points: 10, max }
  const rate = `~$${Math.round(payHr)}/hr${basis ? ` (${basis})` : ''}`
  const points = payHr >= 100 ? 25 : payHr >= 75 ? 20 : payHr >= 50 ? 15 : payHr >= 35 ? 5 : 0
  const why = payHr >= 100 ? 'at your anchor' : payHr >= 50 ? 'above your $50 floor' : 'under your $50 floor'
  return { label: 'Pay', detail: `${rate}, ${why}`, points, max }
}

function dealPart(deal: number | null): ScorePart {
  const max = 10
  if (deal === null) return { label: 'Deal size', detail: 'Unknown (neutral)', points: 4, max }
  const usd = `$${deal.toLocaleString('en-US')}`
  const points = deal >= 10000 ? 10 : deal >= 4000 ? 7 : deal >= 1500 ? 4 : 1
  return { label: 'Deal size', detail: usd, points, max }
}

function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000)
}

function freshPart(posted: string | null, today: string): ScorePart {
  const max = 15
  if (!posted) return { label: 'Freshness', detail: 'Post date unknown', points: 4, max }
  const d = Math.max(0, daysBetween(posted, today))
  const points = d <= 2 ? 15 : d <= 7 ? 12 : d <= 14 ? 8 : d <= 30 ? 4 : 0
  return { label: 'Freshness', detail: d === 0 ? 'Posted today' : `Posted ${d} day${d === 1 ? '' : 's'} ago`, points, max }
}

function shapePart(l: JobLead): ScorePart {
  const max = 10
  const fractional = l.tags.includes('pitch as fractional')
  if (l.work_type === 'full-time')
    return fractional
      ? { label: 'Work shape', detail: 'Full-time, pitch as fractional', points: 6, max }
      : { label: 'Work shape', detail: 'Full-time seat', points: 3, max }
  if (l.work_type === 'unknown') return { label: 'Work shape', detail: 'Not stated', points: 6, max }
  const detail =
    l.work_type === 'freelance' || l.work_type === 'contract'
      ? 'Freelance / contract'
      : `${l.work_type.charAt(0).toUpperCase()}${l.work_type.slice(1)}`
  return { label: 'Work shape', detail, points: 10, max }
}

function reachPart(l: JobLead): ScorePart {
  const max = 10
  if (l.kind === 'skipped') return { label: 'Reach', detail: 'Screened out', points: 0, max }
  if (l.kind === 'board') return { label: 'Reach', detail: 'Job-board repost, crowded', points: 2, max }
  if (l.source === 'contra' || l.source === 'upwork')
    return { label: 'Reach', detail: 'Apply in the platform', points: 8, max }
  if (l.contact || l.ext_link) return { label: 'Reach', detail: 'Direct, with a contact or listing', points: 10, max }
  return { label: 'Reach', detail: 'Direct post, no contact yet', points: 7, max }
}

// "Worth a look" = a New lead at or above this score. Replaces the hand-set highlight flag
// (Chris, 2026-10-13), so the badge can't drift from the score.
export const WORTH_A_LOOK = 65

const num = (v: unknown): number | null => (v === null || v === undefined || v === '' ? null : Number(v))

export function scoreLead(l: JobLead, today: string): JobScore {
  const [fitPts, fitWhy] = FIT[l.fit]
  const parts: ScorePart[] = [
    { label: 'Fit', detail: fitWhy, points: fitPts, max: 30 },
    payPart(num(l.pay_hr), l.pay_basis),
    dealPart(num(l.deal_usd)),
    freshPart(l.posted, today),
    shapePart(l),
    reachPart(l),
  ]
  if (l.tags.includes('figma')) parts.push({ label: 'Gap', detail: 'Figma-only delivery', points: -10, max: 0 })

  const total = Math.max(0, Math.min(100, parts.reduce((s, p) => s + p.points, 0)))
  const band = total >= 75 ? 'hot' : total >= 55 ? 'good' : total >= 35 ? 'maybe' : 'low'
  return { total, band, parts }
}
