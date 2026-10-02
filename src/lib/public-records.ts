/* ── Public records: domain age and Wikidata (server-only) ────────────────
 * Two free lookups for the Authority Check's "good to know" rows, never
 * scored (SEO panel, rounds 2–3, 2026-10-02):
 *   Domain age: when the domain was first registered, from RDAP (the public
 *     registration record that replaced WHOIS; rdap.org sends each domain to
 *     its registry). Shown next to the site's own "since" year: an old firm
 *     on a newer domain is common, so it is never scored.
 *   Known entity: a Wikidata item whose official website is this domain.
 *     It can only add: most small businesses have none.
 * One request each per site, 3 s each, in parallel with the homepage reads.
 * A slow or missing answer is simply left out.
 * ─────────────────────────────────────────────────────────────────────── */

import 'server-only'
import { USER_AGENT } from './fetch-guard'

const TIMEOUT = 3_000

async function getJson(url: string, headers: Record<string, string> = {}): Promise<unknown> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT)
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': USER_AGENT, ...headers }, redirect: 'follow' })
    return res.ok ? await res.json() : null
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

/** The year the domain was first registered, or null. */
export async function domainRegistered(bare: string): Promise<number | null> {
  const data = (await getJson(`https://rdap.org/domain/${encodeURIComponent(bare)}`, { Accept: 'application/rdap+json' })) as {
    events?: { eventAction?: string; eventDate?: string }[]
  } | null
  const date = data?.events?.find((e) => e.eventAction === 'registration')?.eventDate
  const year = date ? Number(date.slice(0, 4)) : NaN
  return year >= 1985 && year <= new Date().getUTCFullYear() ? year : null
}

/** The Wikidata item (not a person) that names this domain as its official website (P856), or null. */
export async function wikidataItem(bare: string): Promise<{ id: string; label: string } | null> {
  const urls = ['http', 'https'].flatMap((p) => ['', 'www.'].flatMap((w) => ['', '/'].map((slash) => `<${p}://${w}${bare}${slash}>`)))
  // Not a person (Q5): a founder's item can list the company site as his own website
  // (hubspot.com came back as Brian Halligan). A subclass-of-organization path was too slow (3 s+).
  const query = `SELECT ?item ?itemLabel WHERE { VALUES ?site { ${urls.join(' ')} } ?item wdt:P856 ?site . FILTER NOT EXISTS { ?item wdt:P31 wd:Q5 } SERVICE wikibase:label { bd:serviceParam wikibase:language "en". } } LIMIT 1`
  const data = (await getJson(`https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(query)}`, {
    Accept: 'application/sparql-results+json',
  })) as { results?: { bindings?: { item?: { value: string }; itemLabel?: { value: string } }[] } } | null
  const hit = data?.results?.bindings?.[0]
  const id = hit?.item?.value.split('/').pop()
  return id && /^Q\d+$/.test(id) ? { id, label: hit?.itemLabel?.value ?? id } : null
}
