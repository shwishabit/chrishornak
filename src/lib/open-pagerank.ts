/* ── Open PageRank (server-only) ──────────────────────────────────────────
 * One bulk call per Authority Check, current scores only. The key is
 * OPEN_PAGERANK_API_KEY and never leaves the server. API shape verified
 * 2026-10-01: drafts/research/open-pagerank-facts.md.
 * ─────────────────────────────────────────────────────────────────────── */
import 'server-only'
import { FETCH_TIMEOUT } from './fetch-guard'

const ENDPOINT = 'https://openpagerank.keywordseverywhere.com/v1/domains/bulk'

interface OprHost {
  host: string
  found: boolean
  open_page_rank: number | null
  referring_hosts?: number | null
}

interface OprDomain {
  domain: string
  found: boolean
  open_page_rank: number | null
  referring_domains?: number | null
  hosts?: OprHost[]
}

/** score = 0–10, null when not found. linking = referring domains (weighted), null when not found. */
export interface OprScore {
  score: number | null
  linking: number | null
}

export type OprLookup =
  | { status: 'ok'; asOf: string | null; scores: Map<string, OprScore> }
  | { status: 'busy' }
  | { status: 'unavailable' }

/** Scores (0–10) for each bare host, keyed by that host. null = not found. */
export async function lookupOpenPageRank(hosts: string[]): Promise<OprLookup> {
  const key = process.env.OPEN_PAGERANK_API_KEY
  if (!key) return { status: 'unavailable' }

  const ctrl = new AbortController()
  const timeout = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT)
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      signal: ctrl.signal,
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ domains: hosts, include_history: false }),
      cache: 'no-store',
    })
    if (res.status === 429) return { status: 'busy' }
    if (!res.ok) return { status: 'unavailable' }
    const data = (await res.json()) as { as_of?: string; results?: OprDomain[] }
    const results = data.results ?? []

    const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null)
    const scores = new Map<string, OprScore>()
    for (const host of hosts) {
      // www. and subdomains are folded into the registered domain; a
      // subdomain's own score is in that domain's hosts[].
      const d = results.find((r) => r.domain === host || host.endsWith(`.${r.domain}`))
      let found: OprScore = { score: null, linking: null }
      if (d && d.domain === host) {
        if (d.found) found = { score: num(d.open_page_rank), linking: num(d.referring_domains) }
      } else if (d) {
        const h = d.hosts?.find((x) => x.host === host)
        if (h?.found) found = { score: num(h.open_page_rank), linking: num(h.referring_hosts) }
      }
      scores.set(host, found)
    }
    return { status: 'ok', asOf: data.as_of ?? null, scores }
  } catch {
    return { status: 'unavailable' }
  } finally {
    clearTimeout(timeout)
  }
}
