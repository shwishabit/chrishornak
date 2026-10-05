/* ── GET /api/authority-check?site=&r=  ·  ?site=&add= ────────────────────
 * The Authority Check's one server call. For your site and 0–3 rivals
 * (or, with add=, only the 1–3 new rivals for a check already on screen):
 * Ahrefs Domain Rating (free endpoint, one call per site), one Open PageRank
 * bulk call (the backup), and one homepage read per site, all in parallel.
 * Expertise and most of Trust use the Findability Check's own rules
 * (proof-signals.ts); the review proofs use review-signals.ts, which may read
 * one more page per site (its reviews page, when the homepage shows no
 * reviews) and follow up to 2 Google short links; Experience uses
 * experience-signals.ts. All free: page reads, redirect reads and free APIs.
 * Logs domains + Open PageRank scores + check counts only (no IP, never DR).
 * ─────────────────────────────────────────────────────────────────────── */

import { NextRequest, NextResponse, after } from 'next/server'
import {
  clientIp,
  createRateLimiter,
  fetchPageWithRetry,
  pageErrorMessage,
  resolveAndCheck,
  rivalPageError,
} from '@/lib/fetch-guard'
import { lookupOpenPageRank } from '@/lib/open-pagerank'
import { lookupDomainRating } from '@/lib/ahrefs'
import { MAX_HTML, readSite } from '@/lib/authority-read'
import { domainRegistered, wikidataItem } from '@/lib/public-records'
import { extractText } from '@/lib/proof-signals'
import {
  MAX_RIVALS,
  linksScore,
  parseSite,
  scoredCount,
  type AuthorityResult,
  type LinksStatus,
  type SiteInput,
  type SiteResult,
} from '@/lib/authority-check'
import { getSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const maxDuration = 25

// Each check is up to 4 page reads + 1 API call, so 5 a minute per IP.
const isRateLimited = createRateLimiter(5, 60_000)

/* ── Log (domains + scores only) ────────────────────────────────────────── */

function logCheck(row: {
  domain: string
  rival_domains: string[]
  links: (number | null)[]
  linking_sites: (number | null)[]
  proof: (number | null)[]
  links_status: LinksStatus
  status: 'completed' | 'error'
}) {
  after(async () => {
    const sb = getSupabase()
    if (!sb) return
    await sb.from('authority_checks').insert({ ...row, rival_count: row.rival_domains.length })
  })
}

/* ── Handler ────────────────────────────────────────────────────────────── */

function bad(error: string, status = 400) {
  return NextResponse.json({ error }, { status })
}

export async function GET(request: NextRequest) {
  if (isRateLimited(clientIp(request.headers))) {
    return bad('Too many checks. Please wait a minute and try again.', 429)
  }

  const params = request.nextUrl.searchParams
  const rawSite = params.get('site')?.trim()
  if (!rawSite) return bad('Type your site to check.')
  const you = parseSite(rawSite)
  if (!you) return bad('That doesn’t look like a web address. Try yoursite.com.')

  const rawRivals = (params.get('r') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  if (rawRivals.length > MAX_RIVALS) return bad(`Compare up to ${MAX_RIVALS} rivals at a time.`)
  const rivals: SiteInput[] = []
  for (const raw of rawRivals) {
    const p = parseSite(raw)
    if (!p) return bad(`“${raw.slice(0, 60)}” doesn’t look like a web address.`)
    rivals.push(p)
  }
  // ?add=a.com,b.com: 1–3 rivals added to a check already on screen. Only the new sites are
  // read (one Ahrefs call each); the page keeps your result and joins them (Grill Me, 2026-10-05).
  const rawAdds = (params.get('add') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  if (rawAdds.length > MAX_RIVALS) return bad(`Add up to ${MAX_RIVALS} rivals at a time.`)
  const added: SiteInput[] = []
  for (const raw of rawAdds) {
    const p = parseSite(raw)
    if (!p) return bad(`“${raw.slice(0, 60)}” doesn’t look like a web address.`)
    added.push(p)
  }
  if (added.length && rivals.length) return bad('Send the new rivals as add= only.')

  const bares = [you.bare, ...rivals.map((r) => r.bare), ...added.map((a) => a.bare)]
  if (new Set(bares).size !== bares.length) return bad('Each site needs to be different.')

  // SSRF: every host we will read, before any request.
  const sites = added.length ? added : [you, ...rivals]
  const blocked = await Promise.all(sites.map((s) => resolveAndCheck(s.host)))
  if (blocked.some(Boolean)) return bad('Cannot fetch internal or private addresses')

  const read = await readSites(sites)

  if (added.length) {
    // Log row: you + the new rivals; your scores stay empty (they're in the first check's row).
    logCheck({
      domain: you.bare,
      rival_domains: added.map((a) => a.bare),
      links: [null, ...read.results.map((s) => s.links)],
      linking_sites: [null, ...read.results.map((s) => s.linkingSites ?? null)],
      proof: [null, ...read.results.map((s) => scoredCount(s.proof))],
      links_status: read.linksStatus,
      status: 'completed',
    })
    return NextResponse.json(
      { checkedAt: read.checkedAt, asOf: read.asOf, linksStatus: read.linksStatus, drStatus: read.drStatus, rivals: read.results },
      { status: 200 },
    )
  }

  const mine = read.results[0]
  const logRow = {
    domain: you.bare,
    rival_domains: rivals.map((r) => r.bare),
    links: read.results.map((s) => s.links),
    linking_sites: read.results.map((s) => s.linkingSites ?? null),
    // Scored checks only (0–11, the column's limit): the "good to know" rows aren't counted.
    proof: read.results.map((s) => scoredCount(s.proof)),
    links_status: read.linksStatus,
  }

  // Your homepage couldn't be read: still answer when there's a link score to show (a 403 site
  // has a Domain Rating); with no score at all, say why it failed, as before.
  if (!mine.proof) {
    logCheck({ ...logRow, status: 'error' })
    const hasAuthority = typeof mine.dr === 'number' || typeof mine.opr === 'number'
    if (!hasAuthority) return bad(read.yourError ?? 'We couldn’t read your homepage.', 502)
  } else {
    logCheck({ ...logRow, status: 'completed' })
  }

  const result: AuthorityResult = {
    checkedAt: read.checkedAt,
    asOf: read.asOf,
    linksStatus: read.linksStatus,
    drStatus: read.drStatus,
    you: mine,
    rivals: read.results.slice(1),
  }
  return NextResponse.json(result, { status: 200 })
}

/* ── Read sites: Ahrefs + Open PageRank + each homepage, in parallel ─────── */

async function readSites(sites: SiteInput[]) {
  const bares = sites.map((s) => s.bare)

  // The public records for the "good to know" rows start first and run alongside everything else.
  const records = Promise.all(bares.map((b) => Promise.all([domainRegistered(b), wikidataItem(b)])))

  // Ahrefs + one Open PageRank call + one homepage read per site, in parallel.
  const [drs, opr, ...pages] = await Promise.all([
    lookupDomainRating(bares),
    lookupOpenPageRank(bares),
    ...sites.map((s) => fetchPageWithRetry(s.homepage, MAX_HTML)),
  ])

  const scores = opr.status === 'ok' ? opr.scores : null
  const linksOf = (bare: string) => linksScore(scores?.get(bare)?.score)
  const linkingOf = (bare: string) => {
    const n = scores?.get(bare)?.linking
    return typeof n === 'number' ? Math.round(n) : null
  }

  // Each homepage's checks (with Reputation's extra reads), for every homepage that was read, in parallel.
  const errors = sites.map((s, i) => rivalPageError(pages[i], s.bare))
  const reads = await Promise.all(pages.map((page, i) => (page && !errors[i] ? readSite(page) : null)))
  const recs = await records
  reads.forEach((read, i) => {
    if (!read) return
    const [year, item] = recs[i]
    if (year) {
      // The site's own start year, when it gives one ("since 1998", "established 2004").
      const said = extractText(pages[i]!.body).match(/\b(?:since|established|est\.?|founded)(?: in)? ((?:19|20)\d\d)\b/i)?.[1]
      read.proof.push('age')
      read.evidence.age = `First registered in ${year}${said ? `; your site says ${said}${Number(said) < year ? ', older than the domain, which is common' : ''}` : ''}`
    }
    if (item) {
      read.proof.push('wikidata')
      read.evidence.wikidata = `Wikidata item ${item.id}: “${item.label}”`
    }
  })

  const results: SiteResult[] = sites.map((s, i) => {
    const err = errors[i]
    const read = reads[i]
    return {
      domain: s.bare,
      links: linksOf(s.bare),
      opr: scores?.get(s.bare)?.score ?? null,
      linkingSites: linkingOf(s.bare),
      dr: drs.status === 'ok' ? (drs.dr.get(s.bare) ?? null) : null,
      proof: read?.proof ?? null,
      ...(read?.trackLevel ? { trackLevel: read.trackLevel } : {}),
      ...(read?.reviewSiteCount ? { reviewSiteCount: read.reviewSiteCount } : {}),
      ...(read?.seen.length ? { seenCount: read.seen.length } : {}),
      ...(read ? { evidence: read.evidence } : {}),
      ...(err ? { pageError: err } : {}),
    }
  })

  return {
    checkedAt: new Date().toISOString(),
    asOf: opr.status === 'ok' ? opr.asOf : null,
    linksStatus: opr.status as LinksStatus,
    drStatus: drs.status as LinksStatus,
    results,
    /** The long "why" for the first site, when its homepage failed (shown when there's nothing else). */
    yourError: pageErrorMessage(pages[0], sites[0].host),
  }
}
