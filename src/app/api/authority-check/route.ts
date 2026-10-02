/* ── GET /api/authority-check?site=&r= ───────────────────────────────────
 * The Authority Check's one server call. For your site and 0–3 rivals:
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
import {
  MAX_RIVALS,
  linksScore,
  parseSite,
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
  const bares = [you.bare, ...rivals.map((r) => r.bare)]
  if (new Set(bares).size !== bares.length) return bad('Each site needs to be different.')

  // SSRF: every host, before any request.
  const sites = [you, ...rivals]
  const blocked = await Promise.all(sites.map((s) => resolveAndCheck(s.host)))
  if (blocked.some(Boolean)) return bad('Cannot fetch internal or private addresses')

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

  const yourError = pageErrorMessage(pages[0], you.host)
  if (!pages[0] || yourError) {
    logCheck({
      domain: you.bare,
      rival_domains: rivals.map((r) => r.bare),
      links: bares.map(linksOf),
      linking_sites: bares.map(linkingOf),
      proof: bares.map(() => null),
      links_status: opr.status,
      status: 'error',
    })
    return bad(yourError ?? 'We couldn’t read your homepage.', 502)
  }

  // Each homepage's checks (with Reputation's extra reads), for every homepage that was read, in parallel.
  const errors = sites.map((s, i) => (i === 0 ? null : rivalPageError(pages[i], s.bare)))
  const reads = await Promise.all(pages.map((page, i) => (page && !errors[i] ? readSite(page) : null)))

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
      ...(read ? { evidence: read.evidence } : {}),
      ...(err ? { pageError: err } : {}),
    }
  })

  const result: AuthorityResult = {
    checkedAt: new Date().toISOString(),
    asOf: opr.status === 'ok' ? opr.asOf : null,
    linksStatus: opr.status,
    drStatus: drs.status,
    you: results[0],
    rivals: results.slice(1),
  }

  logCheck({
    domain: you.bare,
    rival_domains: rivals.map((r) => r.bare),
    links: results.map((s) => s.links),
    linking_sites: results.map((s) => s.linkingSites ?? null),
    proof: results.map((s) => s.proof?.length ?? null),
    links_status: opr.status,
    status: 'completed',
  })

  return NextResponse.json(result, { status: 200 })
}
