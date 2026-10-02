/* ── Authority Check: one homepage read → its checks ───────────────────────
 * Moved out of api/authority-check/route.ts so the route and the fixture
 * test (scripts/ac-fixtures.mts) run the same code. The extra reads (a
 * reviews page, the About page, Google short links) go through a Reader, so
 * the test can answer them from saved pages instead of the live sites.
 * ─────────────────────────────────────────────────────────────────────── */

import { resolveAndCheck, safeFetch, USER_AGENT, type FetchResult } from './fetch-guard'
import { readReviewSignals, readReviewsPage, reviewSiteOf, reviewSitesEvidence, type ReviewRead } from './review-signals'
import { readExperienceSignals } from './experience-signals'
import { extractText, findAboutPage, findJsonLdBlocks, isHttpsUrl, readProofEvidence, readProofSignals } from './proof-signals'
import { PROOF_CHECKS, proofFromSignals, type ProofId, type SiteResult } from './authority-check'

export const MAX_HTML = 2 * 1024 * 1024 // 2 MB, same as /api/audit

// The second-round reads are shorter, so a check stays inside maxDuration.
const REVIEWS_PAGE_TIMEOUT = 5_000
const SHORT_LINK_TIMEOUT = 3_000

/** The extra reads one check may make after the homepage. */
export interface Reader {
  /** A page on the site (its reviews page). null = blocked or no answer. */
  page(url: string): Promise<FetchResult | null>
  /** Where a short link redirects to (its Location header), or null. */
  redirect(url: string): Promise<string | null>
}

/** The live reader: SSRF-checked page reads and one redirect read per short link. */
export const liveReader: Reader = {
  async page(url) {
    if (await resolveAndCheck(new URL(url).hostname)) return null
    return safeFetch(url, MAX_HTML, REVIEWS_PAGE_TIMEOUT)
  },
  async redirect(url) {
    const ctrl = new AbortController()
    const timeout = setTimeout(() => ctrl.abort(), SHORT_LINK_TIMEOUT)
    try {
      const res = await fetch(url, { redirect: 'manual', signal: ctrl.signal, headers: { 'User-Agent': USER_AGENT } })
      return res.headers.get('location')
    } catch {
      return null
    } finally {
      clearTimeout(timeout)
    }
  },
}

/** Reputation, after the extra reads: what shows reviews, and which review sites are linked. */
interface Reputation {
  shown: string | null
  sites: string[]
}

/** The homepage's review read, plus its reviews page and short links when those are needed. */
export async function readReputation(rr: ReviewRead, reader: Reader = liveReader): Promise<Reputation> {
  const page = async () => {
    if (rr.shown || !rr.reviewsPage) return rr.shown
    const res = await reader.page(rr.reviewsPage)
    return res && res.status >= 200 && res.status < 300 ? readReviewsPage(res.body, res.finalUrl) : null
  }
  // Where a Google short link goes, as a review site (a business listing), or null (an address, or no answer).
  const follow = async (url: string) => {
    const to = await reader.redirect(url)
    return to ? reviewSiteOf(to) : null
  }
  const short = async () => (rr.sites.length ? [] : Promise.all(rr.shortLinks.map(follow)))
  const [shown, more] = await Promise.all([page(), short()])
  const sites = [...rr.sites]
  for (const s of more) if (s && !sites.includes(s)) sites.push(s)
  return { shown, sites }
}

/** The homepage checks found, and the phrase behind each one. */
export function readProof(
  html: string,
  finalUrl: string,
  rep: Reputation,
): { proof: ProofId[]; evidence: NonNullable<SiteResult['evidence']>; trackLevel: 0 | 1 | 2 } {
  const text = extractText(html)
  const blocks = findJsonLdBlocks(html)
  const https = isHttpsUrl(finalUrl)
  const exp = readExperienceSignals(html, finalUrl)
  const proof = proofFromSignals({
    ...readProofSignals(html, text, blocks),
    isHttps: https,
    hasReviewsShown: !!rep.shown,
    hasReviewSites: rep.sites.length > 0,
    hasWorkShown: !!exp.workShown,
    hasTrackRecord: !!exp.trackRecord,
  })
  const found = {
    ...readProofEvidence(html, text, blocks),
    ...(https ? { isHttps: `Loads over “https://”` } : {}),
    ...(rep.shown ? { hasReviewsShown: rep.shown } : {}),
    ...(rep.sites.length ? { hasReviewSites: reviewSitesEvidence(rep.sites) } : {}),
    ...(exp.workShown ? { hasWorkShown: exp.workShown } : {}),
    ...(exp.trackRecord ? { hasTrackRecord: exp.trackRecord } : {}),
  }
  const evidence: NonNullable<SiteResult['evidence']> = {}
  for (const c of PROOF_CHECKS) {
    const e = found[c.signal as keyof typeof found]
    if (proof.includes(c.id) && e) evidence[c.id] = e
  }
  return { proof, evidence, trackLevel: exp.trackLevel }
}

/* ── The About page ─────────────────────────────────────────────────────────
 * Small businesses often name the owner, the year they started and their
 * licences only on the About page (Google's raters start there too: "Look at
 * the 'About us' page", QRG §3.4). So when the homepage misses Real people,
 * Credentials or Track record, the check reads the About page once, at the
 * same time as the reviews page, with the same short timeout, and counts what
 * it shows for those 3 checks only (Chris, 2026-10-02). Never more than one
 * About page per site; none when the homepage already shows all 3.
 * ─────────────────────────────────────────────────────────────────────── */

type Read = ReturnType<typeof readProof>

/** Adds what the About page shows for the checks the homepage missed. */
function addFromAbout(read: Read, about: FetchResult): void {
  const html = about.body
  const blocks = findJsonLdBlocks(html)
  const signals = readProofSignals(html, extractText(html), blocks)
  const evidence = readProofEvidence(html, extractText(html), blocks)
  const exp = readExperienceSignals(html, about.finalUrl)
  let where = about.finalUrl
  try {
    where = new URL(about.finalUrl).pathname
  } catch {}
  const add = (id: ProofId, found: string | null | undefined) => {
    if (!found || read.proof.includes(id)) return
    read.proof.push(id)
    read.evidence[id] = `On your About page (${where.slice(0, 50)}): ${found[0].toLowerCase()}${found.slice(1)}`
  }
  if (signals.hasPeople) add('people', evidence.hasPeople)
  if (signals.hasCredentials) add('credentials', evidence.hasCredentials)
  if (exp.trackRecord && !read.proof.includes('track')) {
    add('track', exp.trackRecord)
    read.trackLevel = exp.trackLevel
  }
  read.proof = PROOF_CHECKS.map((c) => c.id).filter((id) => read.proof.includes(id))
}

/** One homepage → its checks: the review read, the extra reads (reviews page, About page), then the checks. */
export async function readSite(page: FetchResult, reader: Reader = liveReader) {
  const html = page.body
  const home = readProofSignals(html, extractText(html), findJsonLdBlocks(html))
  const missing = !home.hasPeople || !home.hasCredentials || !readExperienceSignals(html, page.finalUrl).trackRecord
  const aboutUrl = missing ? findAboutPage(html, page.finalUrl) : null
  const [rep, about] = await Promise.all([
    readReputation(readReviewSignals(html, page.finalUrl), reader),
    aboutUrl ? reader.page(aboutUrl) : null,
  ])
  const read = readProof(html, page.finalUrl, rep)
  if (about && about.status >= 200 && about.status < 300) addFromAbout(read, about)
  return read
}
