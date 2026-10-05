/* ── Authority Check: one homepage read → its checks ───────────────────────
 * Moved out of api/authority-check/route.ts so the route and the fixture
 * test (scripts/ac-fixtures.mts) run the same code. The extra reads (a
 * reviews page, the About page, Google short links) go through a Reader, so
 * the test can answer them from saved pages instead of the live sites.
 * ─────────────────────────────────────────────────────────────────────── */

import { resolveAndCheck, safeFetch, USER_AGENT, type FetchResult } from './fetch-guard'
import { readReviewSignals, readReviewsPage, reviewSiteOf, reviewSitesEvidence, type ReviewRead } from './review-signals'
import { readExperienceSignals } from './experience-signals'
import { anchors, extractText, findAboutPage, findJsonLdBlocks, isHttpsUrl, readProofEvidence, readProofSignals } from './proof-signals'
import { PROOF_CHECKS, SHOWN_CHECKS, proofFromSignals, type ProofId, type SiteResult } from './authority-check'
import { findOfferPages, findSeenElsewhere } from './standing-signals'

export const MAX_HTML = 2 * 1024 * 1024 // 2 MB, same as /api/audit

// The second-round reads are shorter, so a check stays inside maxDuration.
const REVIEWS_PAGE_TIMEOUT = 5_000
const SHORT_LINK_TIMEOUT = 3_000
// The sitemap's follow-up reads run one after another, so each gets less time.
const SITEMAP_TIMEOUT = 3_000

/** The extra reads one check may make after the homepage. */
export interface Reader {
  /** A page on the site (its reviews, About, contact or team page, or its sitemap). null = blocked or no answer. */
  page(url: string, timeoutMs?: number): Promise<FetchResult | null>
  /** Where a short link redirects to (its Location header), or null. */
  redirect(url: string): Promise<string | null>
}

/** The live reader: SSRF-checked page reads and one redirect read per short link. */
export const liveReader: Reader = {
  async page(url, timeoutMs = REVIEWS_PAGE_TIMEOUT) {
    if (await resolveAndCheck(new URL(url).hostname)) return null
    return safeFetch(url, MAX_HTML, timeoutMs)
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
): {
  proof: ProofId[]
  evidence: NonNullable<SiteResult['evidence']>
  trackLevel: 0 | 1 | 2
  reviewSiteCount: number
  seen: string[]
} {
  const text = extractText(html)
  const blocks = findJsonLdBlocks(html)
  const https = isHttpsUrl(finalUrl)
  const exp = readExperienceSignals(html, finalUrl)
  const offers = findOfferPages(html, finalUrl)
  const seen = findSeenElsewhere([{ html, url: finalUrl }])
  const proof = proofFromSignals({
    ...readProofSignals(html, text, blocks, finalUrl),
    isHttps: https,
    hasReviewsShown: !!rep.shown,
    hasReviewSites: rep.sites.length > 0,
    hasWorkShown: !!exp.workShown,
    hasTrackRecord: !!exp.trackRecord,
    hasFocus: offers.length >= 3,
    hasSeen: seen.length > 0,
  })
  const found = {
    ...readProofEvidence(html, text, blocks, finalUrl),
    ...(https ? { isHttps: `Loads over “https://”` } : {}),
    ...(rep.shown ? { hasReviewsShown: rep.shown } : {}),
    ...(rep.sites.length ? { hasReviewSites: reviewSitesEvidence(rep.sites) } : {}),
    ...(exp.workShown ? { hasWorkShown: exp.workShown } : {}),
    ...(exp.trackRecord ? { hasTrackRecord: exp.trackRecord } : {}),
    ...(offers.length >= 3 ? { hasFocus: offersEvidence(offers) } : {}),
    ...(seen.length ? { hasSeen: seenEvidence(seen) } : {}),
  }
  const evidence: NonNullable<SiteResult['evidence']> = {}
  for (const c of [...PROOF_CHECKS, ...SHOWN_CHECKS]) {
    const e = found[c.signal as keyof typeof found]
    if (proof.includes(c.id) && e) evidence[c.id] = e
  }
  return { proof, evidence, trackLevel: exp.trackLevel, reviewSiteCount: rep.sites.length, seen }
}

/** "5 pages: /services/seo, /services/ppc, /services/web-design …" */
function offersEvidence(pages: string[]): string {
  return `${pages.length} offer pages: ${pages.slice(0, 4).join(', ')}${pages.length > 4 ? ' …' : ''}`
}

/** "Links to LinkedIn and Crunchbase" */
function seenEvidence(names: string[]): string {
  const list = names.length <= 1 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
  return `${names.length === 1 ? 'A link' : 'Links'} to ${list}`
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

const pathOf = (url: string) => {
  try {
    return new URL(url).pathname
  } catch {
    return url
  }
}
const ok = (r: FetchResult | null): r is FetchResult => !!r && r.status >= 200 && r.status < 300

/** Adds one check found on another page of the site, with where it was found. */
function addFrom(read: Read, id: ProofId, found: string | null | undefined, where: string): void {
  if (!found || read.proof.includes(id)) return
  read.proof.push(id)
  read.evidence[id] = `${where}: ${found[0].toLowerCase()}${found.slice(1)}`
}

/** Back in table order after checks were added. */
function reorder(read: Read): void {
  read.proof = [...PROOF_CHECKS, ...SHOWN_CHECKS].map((c) => c.id).filter((id) => read.proof.includes(id))
}

/** Adds what the About page shows for the checks the homepage missed. */
function addFromAbout(read: Read, about: FetchResult): void {
  const html = about.body
  const blocks = findJsonLdBlocks(html)
  const signals = readProofSignals(html, extractText(html), blocks, about.finalUrl)
  const evidence = readProofEvidence(html, extractText(html), blocks, about.finalUrl)
  const exp = readExperienceSignals(html, about.finalUrl)
  const where = `On your About page (${pathOf(about.finalUrl).slice(0, 50)})`
  if (signals.hasPeople) addFrom(read, 'people', evidence.hasPeople, where)
  if (signals.hasLicences) addFrom(read, 'credentials', evidence.hasLicences, where)
  if (exp.trackRecord && !read.proof.includes('track')) {
    addFrom(read, 'track', exp.trackRecord, where)
    read.trackLevel = exp.trackLevel
  }
  // Places that list or feature the business, often linked only from the About page.
  const more = findSeenElsewhere([{ html, url: about.finalUrl }]).filter((n) => !read.seen.includes(n))
  if (more.length) {
    read.seen.push(...more)
    if (!read.proof.includes('seen')) read.proof.push('seen')
    read.evidence.seen = seenEvidence(read.seen)
  }
  reorder(read)
}

/* ── The contact page and the team page (Chris, 2026-10-05, monexglobal.com) ─
 * How to reach you: many firms put their phones and offices only on the
 * contact page, linked from every page. When the homepage shows no phone,
 * tel: link or street, the check reads the page linked as "Contact" once.
 * Real people: some team pages aren't linked from the homepage or About page
 * at all (monexglobal.com/about/analyst-team), so when the homepage and About
 * page name nobody, the check reads the sitemap and one team page from it.
 * Both are Authority Check only: Findability's rules (proof-signals.ts) are
 * unchanged. Each read happens only when the check is still missing.
 * ─────────────────────────────────────────────────────────────────────── */

const CONTACT_PATH_RE = /^contact(?:[-_]?us)?(?:\.\w+)?$/i
const CONTACT_WORDS_RE = /^(?:contact(?: us)?|get in touch)$/i

/** The site's own contact page: a page named contact… or a link that says "Contact (us)". */
export function findContactPage(html: string, pageUrl: string): string | null {
  let base: URL
  try {
    base = new URL(pageUrl)
  } catch {
    return null
  }
  const bare = (h: string) => h.toLowerCase().replace(/^www\./, '')
  let byWords: string | null = null
  for (const a of anchors(html)) {
    if (/^(?:mailto:|tel:|javascript:|#)/i.test(a.href)) continue
    let u: URL
    try {
      u = new URL(a.href, base)
    } catch {
      continue
    }
    if (!['http:', 'https:'].includes(u.protocol) || bare(u.hostname) !== bare(base.hostname) || u.pathname === base.pathname) continue
    u.hash = ''
    const last = u.pathname.split('/').filter(Boolean).pop() ?? ''
    if (CONTACT_PATH_RE.test(last)) return u.toString()
    if (CONTACT_WORDS_RE.test(extractText(a.inner).trim())) byWords ??= u.toString()
  }
  return byWords
}

/** Adds How to reach you from the contact page (a phone, tel: link or street, the same rule as the homepage). */
function addFromContact(read: Read, contact: FetchResult): void {
  const html = contact.body
  const text = extractText(html)
  const blocks = findJsonLdBlocks(html)
  if (!readProofSignals(html, text, blocks, contact.finalUrl).hasAddressInfo) return
  const found = readProofEvidence(html, text, blocks, contact.finalUrl).hasAddressInfo
  addFrom(read, 'address', found ?? 'A phone number or street address', `On your contact page (${pathOf(contact.finalUrl).slice(0, 50)})`)
  reorder(read)
}

// A page about the people: a path segment that names them. Not blog posts, jobs or tag pages.
// "partners" is left out: on most sites it means business partners (monexglobal.com/partners).
const TEAM_SEGMENT_RE =
  /^(?:our-|meet-(?:the-|our-)?|the-)?(?:team|people|staff|leadership(?:-team)?|management(?:-team)?|board(?:-of-directors)?|founders?|analysts?|analyst-team|attorneys|lawyers|doctors|dentists|physicians|providers|who-we-are)(?:-(?:us|members|page))?$/i
// Looser words, only when no page above is listed.
const LOOSE_TEAM_SEGMENT_RE = /^(?:our-|meet-(?:the-|our-)?)?(?:experts|advisors|specialists)$/i
const NOT_TEAM_RE = /\/(?:blog|news|posts?|articles?|insights|careers?|jobs|join|tag|tags|category|categories|author|events?|press)\//i

/**
 * The best team page among the sitemap's addresses: a clear people word first, then a page
 * under /about/, then the shortest address. Other languages' copies (/es/, /fr/) lose to the
 * site's own default.
 */
export function findTeamInSitemap(xml: string, siteUrl: string): string | null {
  const host = (() => {
    try {
      return new URL(siteUrl).hostname.replace(/^www\./, '')
    } catch {
      return ''
    }
  })()
  let best: { url: string; rank: number } | null = null
  for (const m of xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)) {
    let u: URL
    try {
      u = new URL(m[1].replace(/&amp;/g, '&'))
    } catch {
      continue
    }
    if (u.hostname.replace(/^www\./, '') !== host || NOT_TEAM_RE.test(`${u.pathname}/`)) continue
    const segs = u.pathname.split('/').filter(Boolean)
    const names = segs.map((s) => s.replace(/\.\w+$/, ''))
    const strong = names.some((s) => TEAM_SEGMENT_RE.test(s))
    if (!strong && !names.some((s) => LOOSE_TEAM_SEGMENT_RE.test(s))) continue
    // Lower is better.
    const rank =
      (strong ? 0 : 100) + (names.includes('about') ? 0 : 10) + (/^[a-z]{2}(?:-[a-z]{2})?$/i.test(names[0] ?? '') ? 5 : 0) + segs.length
    if (!best || rank < best.rank) best = { url: u.toString(), rank }
  }
  return best?.url ?? null
}

/** A sitemap index: the sub-sitemap with the site's pages (page-sitemap.xml, wp-sitemap-posts-page-1.xml), else the first. */
function pagesSitemapOf(xml: string): string | null {
  if (!/<sitemapindex\b/i.test(xml)) return null
  const subs = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => m[1].replace(/&amp;/g, '&'))
  return subs.find((s) => /page/i.test(s.split('/').pop() ?? '')) ?? subs[0] ?? null
}

/** Real people from the sitemap: the sitemap (or its pages sitemap), then one team page. Up to 3 reads. */
async function readTeamPage(first: FetchResult | null, reader: Reader): Promise<FetchResult | null> {
  if (!ok(first)) return null
  let xml = first.body
  const sub = pagesSitemapOf(xml)
  if (sub) {
    const r = await reader.page(sub, SITEMAP_TIMEOUT)
    if (!ok(r)) return null
    xml = r.body
  }
  const team = findTeamInSitemap(xml, first.finalUrl)
  if (!team) return null
  const page = await reader.page(team, SITEMAP_TIMEOUT)
  return ok(page) ? page : null
}

function addFromTeam(read: Read, team: FetchResult): void {
  const html = team.body
  const blocks = findJsonLdBlocks(html)
  if (!readProofSignals(html, extractText(html), blocks, team.finalUrl).hasPeople) return
  const found = readProofEvidence(html, extractText(html), blocks, team.finalUrl).hasPeople
  addFrom(read, 'people', found, `On your team page (${pathOf(team.finalUrl).slice(0, 50)})`)
  reorder(read)
}

/**
 * One homepage → its checks: the review read, the extra reads (reviews page, About page,
 * contact page, sitemap), then the checks. The first round runs side by side; the sitemap's
 * team page is read only when neither the homepage nor the About page named anyone.
 */
export async function readSite(page: FetchResult, reader: Reader = liveReader) {
  const html = page.body
  const home = readProofSignals(html, extractText(html), findJsonLdBlocks(html), page.finalUrl)
  const missing = !home.hasPeople || !home.hasLicences || !readExperienceSignals(html, page.finalUrl).trackRecord
  const aboutUrl = missing ? findAboutPage(html, page.finalUrl) : null
  const contactUrl = home.hasAddressInfo ? null : findContactPage(html, page.finalUrl)
  let sitemapUrl: string | null = null
  if (!home.hasPeople) {
    try {
      sitemapUrl = new URL('/sitemap.xml', page.finalUrl).toString()
    } catch {}
  }
  const [rep, about, contact, sitemap] = await Promise.all([
    readReputation(readReviewSignals(html, page.finalUrl), reader),
    aboutUrl ? reader.page(aboutUrl) : null,
    contactUrl ? reader.page(contactUrl) : null,
    sitemapUrl ? reader.page(sitemapUrl, SITEMAP_TIMEOUT) : null,
  ])
  const read = readProof(html, page.finalUrl, rep)
  if (ok(about)) addFromAbout(read, about)
  if (ok(contact)) addFromContact(read, contact)
  if (!read.proof.includes('people')) {
    const team = await readTeamPage(sitemap, reader)
    if (team) addFromTeam(read, team)
  }
  return read
}
