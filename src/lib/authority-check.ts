/* ── Authority Check: shared logic (client + server) ──────────────────────
 * One score out of 100, in four parts named after Google's E-E-A-T (our own
 * score, built from Google's public guidance; Google gives no E-E-A-T score).
 * 12 scored checks, each worth its own points (SEO panel review, rounds 1–5,
 * 2026-10-02; Recently updated added 2026-10-05):
 *   Experience 20 = your work shown 10 + track record 6, or 10 when strong
 *   Expertise  20 = real people 8 + credentials 6 + focus (offer pages) 6
 *   Authority  20 = link strength 11 (Ahrefs DR in bands; Open PageRank ×10
 *                   for a site Ahrefs has no rating for or didn't answer for,
 *                   or when Ahrefs is down) + review spread 5 + seen elsewhere 4
 *   Trust      40 = reviews on your site 15 + how to reach you 11 + About
 *                   page 8 + secure site 2 + recently updated 4 (2 within 6
 *                   months). Trust counts double because Google: "Of these
 *                   aspects, trust is most important."
 * Plus "good to know" rows, shown and never scored (schema, what you do,
 * where you work). The weights live in PROOF_CHECKS and LINK_BANDS only.
 * ─────────────────────────────────────────────────────────────────────── */

import type { ProofSignals } from './proof-signals'

export const MAX_RIVALS = 3
/** Authority values (DR or Open PageRank ×10) under this far apart read as a tie (colour only). */
export const TIE_GAP = 5
/** Overall scores under this far apart read as "about the same" (colour and summary; places don't change). */
export const OVERALL_TIE = 5

/**
 * Link strength in bands, not a curve: a local site's DR moves a point or two a month, and
 * bands keep that from moving the score (SEO panel, 6 of 6). Full points at DR 50, which few
 * local businesses pass; the old curve needed about 67.
 */
export const LINK_BANDS: readonly { from: number; points: number }[] = [
  { from: 50, points: 11 },
  { from: 30, points: 9 },
  { from: 15, points: 7 },
  { from: 5, points: 4 },
  { from: 0, points: 0 },
]
export const LINK_POINTS = LINK_BANDS[0].points
export function authorityPoints(a: number | null): number {
  if (a === null) return 0
  return LINK_BANDS.find((b) => a >= b.from)?.points ?? 0
}

export type ProofId =
  | 'work'
  | 'track'
  | 'people'
  | 'credentials'
  | 'focus'
  | 'reviewSites'
  | 'seen'
  | 'reviews'
  | 'address'
  | 'about'
  | 'https'
  // Shown, never scored:
  | 'schema'
  | 'trade'
  | 'area'
  | 'name'
  | 'age'
  | 'wikidata'
  | 'updated'
export type Letter = 'experience' | 'expertise' | 'authority' | 'trust'
export type ProofGroup = Letter

/**
 * The homepage signals (proof-signals.ts), HTTPS, the review proofs (review-signals.ts),
 * Experience (experience-signals.ts) and Focus / Seen elsewhere (standing-signals.ts).
 */
export type ProofFacts = ProofSignals & {
  isHttps: boolean
  hasReviewsShown: boolean
  hasReviewSites: boolean
  hasWorkShown: boolean
  hasTrackRecord: boolean
  hasFocus: boolean
  hasSeen: boolean
  /** Recently updated: set after the extra reads (authority-read.ts addUpdated), false on the homepage pass. */
  hasUpdated: boolean
}

export interface ProofCheck {
  id: ProofId
  group: ProofGroup
  label: string
  signal: keyof ProofFacts
  /** Full points. Graded checks (track, reviewSites, seen) can earn less: see pointsFor. */
  points: number
  move: { title: string; body: string }
}

/** The 12 scored checks, in table order (also the last tie-break for the first moves). */
export const PROOF_CHECKS: readonly ProofCheck[] = [
  {
    id: 'work',
    group: 'experience',
    label: 'Your work shown',
    signal: 'hasWorkShown',
    points: 10,
    move: { title: 'Show your work', body: 'Add a page of real jobs or projects, with your own photos.' },
  },
  {
    id: 'track',
    group: 'experience',
    label: 'Track record',
    signal: 'hasTrackRecord',
    points: 10,
    move: {
      title: 'Show your track record',
      body: 'Say how long you have done this work and how many clients or jobs, like "Serving Pittsburgh since 1998".',
    },
  },
  {
    id: 'people',
    group: 'expertise',
    label: 'Real people',
    signal: 'hasPeople',
    points: 8,
    move: { title: 'Name the people', body: 'Say who runs the business, with a photo and one line each.' },
  },
  {
    id: 'credentials',
    group: 'expertise',
    label: 'Credentials',
    signal: 'hasLicences',
    points: 6,
    move: { title: 'Show your credentials', body: 'List your licenses, certifications, awards and memberships.' },
  },
  {
    id: 'focus',
    group: 'expertise',
    label: 'Focus: offer pages',
    signal: 'hasFocus',
    points: 6,
    move: {
      title: 'Give each offer its own page',
      body: 'Make one page per service or product, and link them all from your menu.',
    },
  },
  {
    id: 'reviewSites',
    group: 'authority',
    label: 'Review spread',
    signal: 'hasReviewSites',
    points: 5,
    move: {
      title: 'Link your review profiles',
      // Not only local trades: a coach or consultant has no Yelp page (InLight, 2026-10-06).
      body: 'Link your Google Business Profile, plus one site your customers review you on: Yelp or BBB for local work, Clutch or G2 for agencies and software, Trustpilot for anyone else.',
    },
  },
  {
    id: 'seen',
    group: 'authority',
    label: 'Seen elsewhere',
    signal: 'hasSeen',
    points: 4,
    move: {
      title: 'Show where you’re featured',
      body: 'Link to the press, podcasts, associations or directories that list you.',
    },
  },
  /* Trust, in a visitor's order (Chris picked the order, 2026-10-01). */
  {
    id: 'reviews',
    group: 'trust',
    label: 'Reviews on your site',
    signal: 'hasReviewsShown',
    points: 15,
    move: { title: 'Show your reviews', body: 'Put 2 or 3 real reviews on your homepage, with names and stars.' },
  },
  {
    id: 'address',
    group: 'trust',
    label: 'How to reach you',
    signal: 'hasAddressInfo',
    // 13 → 11 (2026-10-05): pays for Recently updated, with Secure site 4 → 2.
    points: 11,
    move: { title: 'Show how to reach you', body: 'Put your phone number or street address on your homepage or contact page.' },
  },
  {
    id: 'about',
    group: 'trust',
    label: 'About page',
    signal: 'hasAboutLink',
    points: 8,
    move: { title: 'Link your About page', body: 'Add a clear link to a page that says who you are and why you do this.' },
  },
  {
    id: 'https',
    group: 'trust',
    label: 'Secure site',
    signal: 'isHttps',
    // 4 → 2 (2026-10-05): almost every site passes (SEO panel, Shepard: "near-gate" at 2).
    points: 2,
    move: {
      title: 'Turn on HTTPS',
      body: 'Ask your host for a free SSL certificate, so browsers stop calling your site "Not secure".',
    },
  },
  {
    // Scored from 2026-10-05 (Chris: fresh content is core to growing visibility). The panel
    // kept it shown-only because sitemap dates are easy to fake; freshness.ts only trusts the
    // blog feed's newest post or a sitemap date its page confirms. Graded: see pointsFor.
    id: 'updated',
    group: 'trust',
    label: 'Recently updated',
    signal: 'hasUpdated',
    points: 4,
    move: {
      title: 'Publish something new',
      body: 'Publish a dated blog post, or update a page with new prices, photos or recent jobs. A new post in your blog feed counts best.',
    },
  },
]

/** "Good to know": read and shown with what we found, never scored (SEO panel, rounds 2–5). */
export interface ShownCheck {
  id: ProofId
  label: string
  /** The homepage signal behind it; none for the public-record rows (public-records.ts, read in the route). */
  signal?: keyof ProofFacts
  /** One line under the row: why it isn't scored. */
  note: string
}
export const SHOWN_CHECKS: readonly ShownCheck[] = [
  {
    id: 'schema',
    label: 'Business details for Google',
    signal: 'hasOrgSchema',
    note: 'Schema helps machines know who you are. The Findability Check scores it, so it isn’t scored twice.',
  },
  {
    id: 'trade',
    label: 'Says what you do',
    signal: 'hasBusinessType',
    note: 'Your trade in plain words. Focus scores the pages behind it.',
  },
  {
    id: 'area',
    label: 'Where you work',
    signal: 'hasServiceArea',
    note: 'A place you serve or are based in. Not scored, so national and online businesses aren’t marked down.',
  },
  {
    id: 'name',
    label: 'One name everywhere',
    signal: 'hasOneName',
    note: 'Your schema, share name and © line use the same business name.',
  },
  {
    id: 'age',
    label: 'Domain age',
    note: 'When your web address was first registered (public RDAP record). Many older firms have newer domains, so it isn’t scored.',
  },
  {
    id: 'wikidata',
    label: 'Known entity (Wikidata)',
    note: 'A Wikidata entry that names your site. Most small businesses don’t have one, so it can only add.',
  },
]

/** Recently updated: full points when the newest trusted date is this recent (2 months, Chris 2026-10-05)… */
export const FRESH_DAYS = 61
/** …half points up to this (6 months). Older earns none. */
export const FRESH_PART_DAYS = 183

/** The site's newest trusted date (freshness.ts readFreshness). */
export interface Updated {
  /** YYYY-MM-DD from the blog feed's newest post, or a sitemap date its page confirms. null = none. */
  newest: string | null
  /** The post or page with that date. */
  path?: string
  source?: 'feed' | 'page'
  /**
   * With no date: none = no sitemap or feed found · no-dates = the sitemap has no dates ·
   * stamped = most pages share one date · unconfirmed = the newest pages show no matching date ·
   * not-read = the sitemap's pages couldn't be read in time, so nothing was checked.
   */
  why?: 'none' | 'no-dates' | 'stamped' | 'unconfirmed' | 'not-read'
  /** unconfirmed: what the sitemap said. */
  claimed?: string
  claimedPath?: string
}

export interface LetterInfo {
  id: Letter
  label: string
  hint: string
  points: number
}

export const LETTERS: readonly LetterInfo[] = [
  { id: 'experience', label: 'Experience', hint: 'your work and track record', points: 20 },
  { id: 'expertise', label: 'Expertise', hint: 'people, credentials, offer pages', points: 20 },
  { id: 'authority', label: 'Authority', hint: 'link strength, review sites, mentions', points: 20 },
  { id: 'trust', label: 'Trust', hint: '5 checks, incl. reviews and recent updates', points: 40 },
]

export const checksIn = (g: ProofGroup) => PROOF_CHECKS.filter((c) => c.group === g)

/* ── Result shape (the API's JSON) ─────────────────────────────────────── */

export interface SiteResult {
  /** Bare host, no www. */
  domain: string
  /** Open PageRank ×10, whole number (logged). null = no score for this site. */
  links: number | null
  /** Open PageRank as it came (0–10, two decimals), for the backup score. */
  opr?: number | null
  /** Sites linking here (Open PageRank's referring domains). Logged, not shown. */
  linkingSites?: number | null
  /** Ahrefs Domain Rating (0–100). Shown only, never stored (licence). */
  dr?: number | null
  /** This site's own Ahrefs call failed (timeout, 429, 5xx), as opposed to Ahrefs having no rating. */
  drFailed?: boolean
  /** Track record level: 1 = one sign (6 points), 2 = strong (10 points). */
  trackLevel?: 0 | 1 | 2
  /** Recently updated: 2 = a trusted date in the last 2 months (4 points), 1 = in the last 6 (2 points). */
  freshLevel?: 0 | 1 | 2
  /** How many review sites the homepage links to (Review spread: 1 = 2 points, 2 = 4, 3+ = 5). */
  reviewSiteCount?: number
  /** How many other places list or feature the site (Seen elsewhere: 1 = 2 points, 2+ = 4). */
  seenCount?: number
  /** The checks found. null = the homepage could not be read. */
  proof: ProofId[] | null
  /** What each found check matched, in a few words (the phrase behind each ✓). */
  evidence?: Partial<Record<ProofId, string>>
  /** Why a rival's homepage could not be read, in a few words. */
  pageError?: string
  /** The sitemap's newest date (shown only). Missing when there's no sitemap. */
  updated?: Updated
}

/** ok = scores came back · busy = the source said 429 · unavailable = anything else. */
export type LinksStatus = 'ok' | 'busy' | 'unavailable'

export interface AuthorityResult {
  checkedAt: string
  /** Open PageRank's data date (YYYY-MM-DD). */
  asOf: string | null
  linksStatus: LinksStatus
  /** Ahrefs. Missing on results made before Ahrefs was added. */
  drStatus?: LinksStatus
  you: SiteResult
  rivals: SiteResult[]
}

/* ── Scoring ────────────────────────────────────────────────────────────── */

/** Open PageRank 0–10 → out of 100, whole number, for the log (0.96 → 10). */
export function linksScore(opr: number | null | undefined): number | null {
  if (opr === null || opr === undefined || !Number.isFinite(opr)) return null
  return Math.max(0, Math.min(100, Math.round(opr * 10)))
}

/** Every check found: the scored ones, then the "good to know" ones. */
export function proofFromSignals(s: ProofFacts): ProofId[] {
  return [...PROOF_CHECKS, ...SHOWN_CHECKS].filter((c) => c.signal && s[c.signal]).map((c) => c.id)
}

/** How many scored checks a site passed (the usage log stores this, 0 to 11). */
export function scoredCount(proof: ProofId[] | null): number | null {
  return proof ? PROOF_CHECKS.filter((c) => proof.includes(c.id)).length : null
}

export type AuthoritySource = 'ahrefs' | 'opr'

/** Which source this check's authority comes from: Ahrefs, else Open PageRank, else none. */
export function authoritySource(r: AuthorityResult): AuthoritySource | null {
  if (r.drStatus === 'ok') return 'ahrefs'
  if (r.linksStatus === 'ok') return 'opr'
  return null
}

/** Open PageRank ×10 for one site, one decimal, or null when it has none. */
function oprOf(s: SiteResult, r: AuthorityResult): number | null {
  if (r.linksStatus !== 'ok') return null
  if (typeof s.opr === 'number') return Math.round(s.opr * 100) / 10
  return s.links
}

/**
 * Where one site's authority comes from: the check's source, or Open PageRank for a site
 * Ahrefs had no Domain Rating for. Until 2026-10-02 that site scored 0 (scoring spec item 19).
 */
export function authorityFrom(s: SiteResult, r: AuthorityResult): AuthoritySource | null {
  const src = authoritySource(r)
  if (src === 'ahrefs' && typeof s.dr === 'number') return 'ahrefs'
  return src && oprOf(s, r) !== null ? 'opr' : null
}

/** A site's authority out of 100: its Domain Rating, else Open PageRank ×10. null = no score. */
export function authorityOf(s: SiteResult, r: AuthorityResult): number | null {
  const from = authorityFrom(s, r)
  return from === 'ahrefs' ? (s.dr as number) : from === 'opr' ? oprOf(s, r) : null
}

/** Sites scored by Open PageRank although the check used Ahrefs (Ahrefs had no rating for them). */
export function oprStandIns(r: AuthorityResult): SiteResult[] {
  return authoritySource(r) === 'ahrefs' ? allSites(r).filter((s) => s.proof && authorityFrom(s, r) === 'opr') : []
}

/** 2.8 · 9 · 14 (one decimal under 10, whole numbers above). */
export function fmtAuthority(v: number): string {
  return v < 10 ? String(Math.round(v * 10) / 10) : String(Math.round(v))
}

export interface Scores {
  experience: number
  expertise: number
  authority: number
  trust: number
  overall: number
  /** Checks found per group (Authority: its 2 checks, not the link strength row). */
  found: Record<ProofGroup, number>
  /** True when no authority source answered and the total was scaled from the other points. */
  scaled: boolean
}

/**
 * Points one check earns for a site. Graded checks: track record 6, or 10 when strong;
 * review spread 2 / 4 / 5 for 1 / 2 / 3+ review sites; seen elsewhere 2, or 4 for 2+ places.
 * Results saved before the counts existed score a found graded check at its first level.
 */
export function pointsFor(c: ProofCheck, s: SiteResult): number {
  if (!s.proof?.includes(c.id)) return 0
  if (c.id === 'track') return s.trackLevel === 2 ? c.points : 6
  if (c.id === 'reviewSites') return [0, 2, 4, 5][Math.min(Math.max(s.reviewSiteCount ?? 1, 1), 3)]
  if (c.id === 'seen') return (s.seenCount ?? 1) >= 2 ? c.points : 2
  if (c.id === 'updated') return s.freshLevel === 2 ? c.points : 2
  return c.points
}

/** The four parts and the total. null when the homepage wasn't read. */
export function scoresOf(s: SiteResult, r: AuthorityResult): Scores | null {
  if (!s.proof) return null
  const sum = (g: ProofGroup) => checksIn(g).reduce((n, c) => n + pointsFor(c, s), 0)
  const count = (g: ProofGroup) => checksIn(g).filter((c) => s.proof!.includes(c.id)).length
  const experience = sum('experience')
  const expertise = sum('expertise')
  const authority = authorityPoints(authorityOf(s, r)) + sum('authority')
  const trust = sum('trust')
  const raw = experience + expertise + authority + trust
  // No authority source answered: link strength can't be read for anyone, so the total is
  // scaled from the points that could be earned (SEO panel), not capped at 89.
  const scaled = authoritySource(r) === null
  return {
    experience,
    expertise,
    authority,
    trust,
    overall: scaled ? Math.round((raw * 100) / (100 - LINK_POINTS)) : raw,
    found: { experience: count('experience'), expertise: count('expertise'), authority: count('authority'), trust: count('trust') },
    scaled,
  }
}

/** Where each overall band starts (the 0–100 scale on a solo report card uses these too). */
export const BAND_FROM = { fair: 40, strong: 70 } as const

export function band(overall: number): 'Strong' | 'Fair' | 'Needs work' {
  return overall >= BAND_FROM.strong ? 'Strong' : overall >= BAND_FROM.fair ? 'Fair' : 'Needs work'
}

/* ── Order and colours ──────────────────────────────────────────────────── */

export function allSites(r: AuthorityResult): SiteResult[] {
  return [r.you, ...r.rivals]
}

export interface Ranked {
  site: SiteResult
  /** 0 = you, 1–3 = the rivals in the order typed. */
  index: number
  scores: Scores | null
  /** 1st, 2nd… equal totals share a place. null = homepage not read. */
  place: number | null
}

/** Sites sorted by overall score, highest first; unread homepages last. */
export function ranked(r: AuthorityResult): Ranked[] {
  const rows = allSites(r).map((site, index) => ({ site, index, scores: scoresOf(site, r) }))
  return rows
    .map((row) => ({
      ...row,
      place: row.scores ? rows.filter((o) => o.scores && o.scores.overall > row.scores!.overall).length + 1 : null,
    }))
    .sort((a, b) => (b.scores?.overall ?? -1) - (a.scores?.overall ?? -1) || a.index - b.index)
}

export type Standing = 'ahead' | 'same' | 'behind' | 'low'

/**
 * Colour for one value against the others in its row: green only for the
 * lead (or a tie at the top), amber for behind, red for under half the lead,
 * grey when every site is level.
 */
export function standing(value: number | null, values: (number | null)[], tie = 0): Standing | null {
  if (value === null) return null
  const nums = values.filter((v): v is number => v !== null)
  const max = Math.max(...nums)
  const min = Math.min(...nums)
  if (nums.length < 2 || max - min <= tie) return 'same'
  if (value >= max - tie) return 'ahead'
  return value >= max / 2 ? 'behind' : 'low'
}

/**
 * Colour for a site checked alone (no row to compare against): the score's own
 * level, same cut-offs as band() — 70%+ green, 40–69% amber, under 40% red.
 */
export function level(value: number | null, max: number): Standing | null {
  if (value === null) return null
  const pct = (value / max) * 100
  return pct >= 70 ? 'ahead' : pct >= 40 ? 'behind' : 'low'
}

export function ordinal(n: number): string {
  const s = n % 100 >= 11 && n % 100 <= 13 ? 'th' : (['th', 'st', 'nd', 'rd'][n % 10] ?? 'th')
  return `${n}${s}`
}

/* ── The summary, in plain words ────────────────────────────────────────── */

export function summary(r: AuthorityResult): string {
  const order = ranked(r)
  const me = order.find((o) => o.index === 0)!
  if (!me.scores) return 'We couldn’t read your homepage.'
  const mine = me.scores.overall
  if (r.rivals.length === 0) return `Your score is ${mine} out of 100: ${band(mine).toLowerCase()}.`
  const n = order.filter((o) => o.scores).length
  const leaders = order.filter((o) => o.place === 1 && o.index !== 0)
  if (me.place === 1 && leaders.length) return `You’re tied for 1st with ${leaders.map((o) => o.site.domain).join(' and ')}, on ${mine}.`
  if (me.place === 1) return `You’re 1st of ${n}, with ${mine} out of 100.`
  const top = order[0]
  // Under 5 points apart is inside what the checks can tell apart (each is about 95% right).
  if (top.scores!.overall - mine < OVERALL_TIE)
    return `You’re about level with ${top.site.domain}: ${top.scores!.overall} to your ${mine}, ${ordinal(me.place!)} of ${n}.`
  return `You’re ${ordinal(me.place!)} of ${n}. ${top.site.domain} leads with ${top.scores!.overall}, you have ${mine}.`
}

/**
 * A solo check's headline. The score and its band already show right under it, so the
 * headline says what the first fixes could add (Chris, 2026-10-06: "Your score is 95 out of
 * 100: strong" and "95 / 100 Strong" said the same thing). "Up to": graded checks can earn less.
 */
export function soloHeadline(r: AuthorityResult): string {
  const mine = scoresOf(r.you, r)?.overall
  const moves = nextMoves(r)
  if (mine === undefined || moves.length === 0) return summary(r)
  const gain = Math.min(
    moves.reduce((n, m) => n + m.points, 0),
    100 - mine,
  )
  const lead = moves.length === 1 ? 'Your first fix' : `Your first ${moves.length} fixes`
  return `${lead} could add up to ${gain} ${gain === 1 ? 'point' : 'points'}.`
}

/* ── Input ──────────────────────────────────────────────────────────────── */

export interface SiteInput {
  /** Hostname as typed (keeps www), lowercase. */
  host: string
  /** Host without www, used to compare and show. */
  bare: string
  /** Homepage URL to read. */
  homepage: string
}

/** yoursite.com, https://www.yoursite.com/page → its homepage. null when it isn't a web address. */
export function parseSite(input: string): SiteInput | null {
  const cleaned = input.trim()
  if (cleaned.length < 4 || /\s/.test(cleaned)) return null
  const withProtocol = /^https?:\/\//i.test(cleaned) ? cleaned : `https://${cleaned}`
  try {
    const u = new URL(withProtocol)
    if (!['http:', 'https:'].includes(u.protocol)) return null
    const host = u.hostname.toLowerCase().replace(/\.$/, '')
    if (!host.includes('.') || host.startsWith('.') || host.length > 253) return null
    return { host, bare: host.replace(/^www\./, ''), homepage: `${u.protocol}//${host}/` }
  } catch {
    return null
  }
}

/** The ?site=&r= share link for a check. */
export function shareQuery(you: string, rivals: string[]): string {
  const q = new URLSearchParams({ site: you })
  if (rivals.length) q.set('r', rivals.join(','))
  return q.toString()
}

/* ── First 3 moves ──────────────────────────────────────────────────────── */

export interface Move {
  /** The check, or 'links' for link strength (the Domain Rating row has no check of its own). */
  id: ProofId | 'links'
  title: string
  body: string
  /** Who shows it, e.g. "rival-a.com and rival-b.com show this". null on a solo check. */
  who: string | null
  /** The most points it can add ("+15 points"; graded checks read "up to +10"). */
  points: number
  graded: boolean
  /** missing = a check you don't pass · upgrade = one you pass for part of its points. */
  kind: 'missing' | 'upgrade'
}

/** Checks that can earn less than full points (see pointsFor). */
export const GRADED: ReadonlySet<ProofId> = new Set(['track', 'reviewSites', 'seen', 'updated'])

function joinNames(names: string[]): string {
  if (names.length <= 1) return names.join('')
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
}


/**
 * The user's missing checks: the ones most rivals show first, then the ones
 * worth the most points, then table order. Empty when the user shows all, or
 * when the user's homepage couldn't be read.
 */
export function firstMoves(r: AuthorityResult, limit = 3): Move[] {
  if (!r.you.proof) return []
  const found = new Set(r.you.proof)
  return PROOF_CHECKS.filter((c) => !found.has(c.id))
    .map((c, order) => ({ c, order, have: r.rivals.filter((s) => s.proof?.includes(c.id)).map((s) => s.domain) }))
    .sort((a, b) => b.have.length - a.have.length || b.c.points - a.c.points || a.order - b.order)
    .slice(0, limit)
    .map(({ c, have }) => ({
      id: c.id,
      title: c.move.title,
      body: c.move.body,
      who:
        r.rivals.length === 0
          ? null
          : have.length === 0
            ? 'No rival shows this yet, so it sets you apart'
            : `${joinNames(have)} ${have.length === 1 ? 'shows' : 'show'} this`,
      points: c.points,
      graded: GRADED.has(c.id),
      kind: 'missing' as const,
    }))
}

/**
 * Points you have part of: link strength under its top band, a track record of one sign,
 * fewer than 3 review profiles, one place that features you (Chris, 2026-10-05: a site that
 * passes every check but scores 95 still needs to know how to reach 100). Each gain is the
 * next step's exact points, never a guess.
 */
export function upgrades(r: AuthorityResult): Move[] {
  const s = r.you
  if (!s.proof) return []
  const out: Move[] = []
  const up = (id: Move['id'], points: number, title: string, body: string) =>
    points > 0 && out.push({ id, title, body, who: null, points, graded: false, kind: 'upgrade' })

  const a = authorityOf(s, r)
  if (a !== null) {
    const pts = authorityPoints(a)
    const next = [...LINK_BANDS].reverse().find((b) => b.from > a)
    const top = LINK_BANDS[0]
    const src = authorityFrom(s, r) === 'ahrefs' ? 'DR' : 'OPR'
    if (next)
      up(
        'links',
        next.points - pts,
        'Earn more links',
        // Chris, 2026-10-05: name the strategy (digital PR, link-worthy content), not just "get links".
        `Two ways that work: pitch a story to local news or trade sites (digital PR), and publish something others want to cite, like your own price survey, local data or a free guide. At ${src} ${next.from} you earn ${next.points - pts} more points${next.from < top.from ? `; ${src} ${top.from} earns all ${top.points}` : ''}.`,
      )
  }
  // Each card says what we found, then one concrete thing to add (Chris, 2026-10-05: "vague").
  // Examples name only sites the rules count (review-signals.ts, standing-signals.ts).
  const ev = (id: ProofId) => (s.evidence?.[id] ?? '').replace(/^(?:a )?links? to /i, '').replace(/^found /i, '')
  if (s.proof.includes('track') && s.trackLevel !== 2) {
    const found = ev('track')
    const hasYears = /\bsince\b|\bestablished\b|\bfounded\b|\best\.|\byears?\b|\b(?:19|20)\d\d\b/i.test(found)
    up(
      'track',
      PROOF_CHECKS.find((c) => c.id === 'track')!.points - 6,
      hasYears ? 'Add a count next to your years' : 'Add the year you started',
      `${found ? `We found ${found}. ` : ''}${
        hasYears ? 'Put how many jobs or clients next to it' : 'Put the year you started next to it'
      }, like “Since 2009 · over 400 roofs replaced.” Years plus a count earns full points.`,
    )
  }
  if (s.proof.includes('reviewSites')) {
    const n = Math.min(Math.max(s.reviewSiteCount ?? 1, 1), 3)
    const found = ev('reviewSites')
    const ideas = ['Yelp', 'BBB', 'Trustpilot'].filter((x) => !new RegExp(`\\b${x}\\b`, 'i').test(found)).slice(0, 2)
    up(
      'reviewSites',
      // The next step only: 1 → 2 sites is +2, 2 → 3 is +1 (audit 2026-10-05: it said +3 for "one more").
      [0, 2, 4, 5][Math.min(n + 1, 3)] - [0, 2, 4, 5][n],
      'Link one more review site',
      `${found ? `You link to ${found}. ` : ''}Add a link to one more site where customers review you, like your ${ideas.join(' or ')} page, next to the others in your footer. Houzz, Angi, Avvo, Healthgrades, Clutch and G2 count too.`,
    )
  }
  if (s.proof.includes('seen') && (s.seenCount ?? 1) < 2) {
    const found = ev('seen')
    const ideas = [
      /linkedin/i.test(found) ? null : 'your LinkedIn company page',
      'your chamber of commerce listing',
      'a news story or podcast episode about you',
    ].filter(Boolean)
    up(
      'seen',
      PROOF_CHECKS.find((c) => c.id === 'seen')!.points - 2,
      'Link one more place that lists you',
      `${found ? `You link to ${found}. ` : ''}Add a link to one more, like ${ideas.slice(0, -1).join(', ')} or ${ideas[ideas.length - 1]}. Put it on your About page or in your footer.`,
    )
  }
  if (s.proof.includes('updated') && s.freshLevel !== 2) {
    const found = s.evidence?.updated
    up(
      'updated',
      PROOF_CHECKS.find((c) => c.id === 'updated')!.points - 2,
      'Publish something this month',
      `${found ? `${found}. ` : ''}Publish a dated blog post, or update a page with new prices, photos or recent jobs. A date in the last 2 months earns full points.`,
    )
  }
  return out
}

/**
 * Your next moves: the checks you miss (most rivals first, then points), then the points you
 * have part of. Alone, everything is sorted by points, a missing check first on a tie.
 */
export function nextMoves(r: AuthorityResult, limit = 3): Move[] {
  const missing = firstMoves(r, PROOF_CHECKS.length)
  const ups = upgrades(r).sort((a, b) => b.points - a.points)
  const all = r.rivals.length === 0 ? [...missing, ...ups].sort((a, b) => b.points - a.points) : [...missing, ...ups]
  return all.slice(0, limit)
}

/** A rival's report card: the scored checks it passes and you don't, most points first. */
export function beatsYou(r: AuthorityResult, site: SiteResult): { check: ProofCheck; points: number }[] {
  if (!site.proof || !r.you.proof) return []
  return PROOF_CHECKS.filter((c) => site.proof!.includes(c.id) && !r.you.proof!.includes(c.id))
    .map((check) => ({ check, points: pointsFor(check, site) }))
    .sort((a, b) => b.points - a.points)
}

/** A check a rival shows and you don't (an amber ✕ in your column). */
export function isGap(r: AuthorityResult, id: ProofId): boolean {
  return !!r.you.proof && !r.you.proof.includes(id) && r.rivals.some((s) => s.proof?.includes(id))
}
