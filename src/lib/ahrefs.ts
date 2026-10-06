/* ── Ahrefs Domain Rating (server-only) ──────────────────────────────────
 * The Authority Check's main authority score. Free endpoint, no API units:
 * GET https://api.ahrefs.com/v3/public/domain-rating-free (key AHREFS_API_KEY,
 * a free APIv3 key). One call per domain, all in parallel.
 * Licence (https://ahrefs.com/legal/domain-rating-license): show "Domain
 * Rating by Ahrefs" with a link to ahrefs.com next to every score; never
 * collect DR in bulk to build a dataset, so DR is never stored or logged.
 * A short in-memory reuse (12 h, this server instance only, never written
 * anywhere) saves repeat calls when the same site is checked again, e.g. a
 * shared report link (audit 2026-10-05).
 * Ahrefs may throttle or withdraw it at any time; Open PageRank is the backup.
 * Research: drafts/research/free-authority-sources.md.
 * ─────────────────────────────────────────────────────────────────────── */
import 'server-only'

const ENDPOINT = 'https://api.ahrefs.com/v3/public/domain-rating-free'
const TIMEOUT = 5_000
const REUSE_MS = 12 * 60 * 60 * 1000
const REUSE_MAX = 500

/**
 * ok: at least one site answered. `dr` has an entry for every site that answered (null = Ahrefs
 * has no rating for it); `failed` lists the sites whose own call failed (timeout, 429, 5xx), so
 * one bad call doesn't erase the others' answers or read as "no rating" (audit 2026-10-05).
 */
export type DrLookup =
  | { status: 'ok'; dr: Map<string, number | null>; failed: Set<string> }
  | { status: 'busy' }
  | { status: 'unavailable' }

const reuse = new Map<string, { dr: number | null; at: number }>()

async function one(host: string, key: string): Promise<{ status: number; dr: number | null }> {
  const hit = reuse.get(host)
  if (hit && Date.now() - hit.at < REUSE_MS) return { status: 200, dr: hit.dr }
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
    const dr = typeof raw === 'number' && Number.isFinite(raw) ? raw : null
    if (reuse.size >= REUSE_MAX) reuse.delete(reuse.keys().next().value!)
    reuse.set(host, { dr, at: Date.now() })
    return { status: 200, dr }
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
  if (answers.every((a) => a.status !== 200)) return answers.some((a) => a.status === 429) ? { status: 'busy' } : { status: 'unavailable' }
  const dr = new Map<string, number | null>()
  const failed = new Set<string>()
  hosts.forEach((h, i) => (answers[i].status === 200 ? dr.set(h, answers[i].dr) : failed.add(h)))
  return { status: 'ok', dr, failed }
}
