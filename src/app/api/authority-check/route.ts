/* ── GET /api/authority-check?site=&r= ───────────────────────────────────
 * The Authority Check's one server call. For your site and 0–3 rivals:
 * one Open PageRank bulk call (current scores only) and one homepage read
 * per site, all in parallel. Proof is read with the Findability Check's
 * own rules (proof-signals.ts). Logs domains + scores only (no IP).
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
import {
  extractText,
  findJsonLdBlocks,
  isHttpsUrl,
  readProofEvidence,
  readProofSignals,
} from '@/lib/proof-signals'
import {
  MAX_RIVALS,
  PROOF_CHECKS,
  linksScore,
  parseSite,
  proofFromSignals,
  type AuthorityResult,
  type LinksStatus,
  type ProofId,
  type SiteInput,
  type SiteResult,
} from '@/lib/authority-check'
import { getSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const maxDuration = 25

const MAX_HTML = 2 * 1024 * 1024 // 2 MB, same as /api/audit

// Each check is up to 4 page reads + 1 API call, so 5 a minute per IP.
const isRateLimited = createRateLimiter(5, 60_000)

/** The homepage checks found, and the phrase behind each one. */
function readProof(html: string, finalUrl: string): { proof: ProofId[]; evidence: SiteResult['evidence'] } {
  const text = extractText(html)
  const blocks = findJsonLdBlocks(html)
  const https = isHttpsUrl(finalUrl)
  const proof = proofFromSignals({ ...readProofSignals(html, text, blocks), isHttps: https })
  const found = { ...readProofEvidence(html, text, blocks), ...(https ? { isHttps: `Loads over “https://”` } : {}) }
  const evidence: NonNullable<SiteResult['evidence']> = {}
  for (const c of PROOF_CHECKS) {
    const e = found[c.signal as keyof typeof found]
    if (proof.includes(c.id) && e) evidence[c.id] = e
  }
  return { proof, evidence }
}

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

  // One API call for all sites + one homepage read per site, in parallel.
  const [opr, ...pages] = await Promise.all([
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

  const results: SiteResult[] = sites.map((s, i) => {
    const page = pages[i]
    const err = i === 0 ? null : rivalPageError(page, s.bare)
    const read = page && !err ? readProof(page.body, page.finalUrl) : null
    return {
      domain: s.bare,
      links: linksOf(s.bare),
      linkingSites: linkingOf(s.bare),
      proof: read?.proof ?? null,
      ...(read ? { evidence: read.evidence } : {}),
      ...(err ? { pageError: err } : {}),
    }
  })

  const result: AuthorityResult = {
    checkedAt: new Date().toISOString(),
    asOf: opr.status === 'ok' ? opr.asOf : null,
    linksStatus: opr.status,
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
