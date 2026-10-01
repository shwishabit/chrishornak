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
}

interface OprDomain {
  domain: string
  found: boolean
  open_page_rank: number | null
  hosts?: OprHost[]
}

export type OprLookup =
  | { status: 'ok'; asOf: string | null; scores: Map<string, number | null> }
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

    const scores = new Map<string, number | null>()
    for (const host of hosts) {
      // www. and subdomains are folded into the registered domain; a
      // subdomain's own score is in that domain's hosts[].
      const d = results.find((r) => r.domain === host || host.endsWith(`.${r.domain}`))
      let score: number | null = null
      if (d && d.domain === host) score = d.found ? d.open_page_rank : null
      else if (d) {
        const h = d.hosts?.find((x) => x.host === host)
        score = h?.found ? h.open_page_rank : null
      }
      scores.set(host, typeof score === 'number' ? score : null)
    }
    return { status: 'ok', asOf: data.as_of ?? null, scores }
  } catch {
    return { status: 'unavailable' }
  } finally {
    clearTimeout(timeout)
  }
}
