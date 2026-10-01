/* ── Ahrefs Domain Rating (server-only) ──────────────────────────────────
 * The Authority Check's main authority score. Free endpoint, no API units:
 * GET https://api.ahrefs.com/v3/public/domain-rating-free (key AHREFS_API_KEY,
 * a free APIv3 key). One call per domain, all in parallel.
 * Licence (https://ahrefs.com/legal/domain-rating-license): show "Domain
 * Rating by Ahrefs" with a link to ahrefs.com next to every score; never
 * collect DR in bulk to build a dataset, so DR is never stored or logged.
 * Ahrefs may throttle or withdraw it at any time; Open PageRank is the backup.
 * Research: drafts/research/free-authority-sources.md.
 * ─────────────────────────────────────────────────────────────────────── */
import 'server-only'

const ENDPOINT = 'https://api.ahrefs.com/v3/public/domain-rating-free'
const TIMEOUT = 5_000

export type DrLookup = { status: 'ok'; dr: Map<string, number | null> } | { status: 'busy' } | { status: 'unavailable' }

async function one(host: string, key: string): Promise<{ status: number; dr: number | null }> {
  const ctrl = new AbortController()
  const timeout = setTimeout(() => ctrl.abort(), TIMEOUT)
  try {
    const res = await fetch(`${ENDPOINT}?target=${encodeURIComponent(host)}&output=json`, {
      headers: { Authorization: `Bearer ${key}` },
      signal: ctrl.signal,
      cache: 'no-store',
    })
    if (!res.ok) return { status: res.status, dr: null }
    // Shape seen 2026-10-01: { domain_rating: { domain_rating: 9, license: "…" } }
    const data = (await res.json()) as { domain_rating?: { domain_rating?: unknown } | number }
    const raw = typeof data.domain_rating === 'object' ? data.domain_rating?.domain_rating : data.domain_rating
    return { status: 200, dr: typeof raw === 'number' && Number.isFinite(raw) ? raw : null }
  } catch {
    return { status: 0, dr: null }
  } finally {
    clearTimeout(timeout)
  }
}

/** Domain Rating (0–100) for each bare host. */
export async function lookupDomainRating(hosts: string[]): Promise<DrLookup> {
  const key = process.env.AHREFS_API_KEY
  if (!key) return { status: 'unavailable' }
  const answers = await Promise.all(hosts.map((h) => one(h, key)))
  if (answers.some((a) => a.status === 429)) return { status: 'busy' }
  if (answers.every((a) => a.status !== 200)) return { status: 'unavailable' }
  return { status: 'ok', dr: new Map(hosts.map((h, i) => [h, answers[i].dr])) }
}
