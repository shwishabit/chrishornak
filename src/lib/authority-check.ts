/* ── Authority Check: shared logic (client + server) ──────────────────────
 * One score out of 100, in four parts named after Google's E-E-A-T (our own
 * score, built from Google's public guidance; Google gives no E-E-A-T score):
 *   Experience 20 = your work shown + track record (experience-signals.ts)
 *   Expertise  20 = real people + credentials (the Findability Check's rules)
 *   Authority  20 = Ahrefs Domain Rating on a curve, full points at DR 70;
 *                   Open PageRank (×10) is the backup when Ahrefs is down, or
 *                   for a site Ahrefs has no rating for
 *   Trust      40 = 7 checks: 5 Findability rules + 2 review proofs
 *                   (review-signals.ts). Trust counts double because Google:
 *                   "Of these aspects, trust is most important."
 * Plus the sort (1st → 4th), the colours, the summary and the first 3 moves.
 * Chris's calls: backlog.md, Tools item (round 4, 2026-10-01).
 * ─────────────────────────────────────────────────────────────────────── */

import type { ProofSignals } from './proof-signals'

export const MAX_RIVALS = 3
/** Authority values (DR or Open PageRank ×10) under this far apart read as a tie. */
export const TIE_GAP = 2
/**
 * Authority points follow a curve: 20 × √(DR ÷ 70), full points at DR 70.
 * Small sites still separate (DR 2 → 3, DR 9 → 7) and big ones aren't capped
 * flat (DR 30 → 13, DR 56 → 18). Chris picked the curve, 2026-10-01.
 */
export const AUTHORITY_FULL = 70
export function authorityPoints(a: number | null): number {
  return a === null ? 0 : Math.round(20 * Math.sqrt(Math.min(Math.max(a, 0), AUTHORITY_FULL) / AUTHORITY_FULL))
}

export type ProofId =
  | 'work'
  | 'track'
  | 'people'
  | 'credentials'
  | 'https'
  | 'about'
  | 'address'
  | 'schema'
  | 'trade'
  | 'reviews'
  | 'reviewSites'
export type Letter = 'experience' | 'expertise' | 'authority' | 'trust'
export type ProofGroup = Exclude<Letter, 'authority'>

/**
 * The homepage signals from parseAI, HTTPS from Findability's Security checks,
 * the review proofs (review-signals.ts) and Experience (experience-signals.ts).
 */
export type ProofFacts = ProofSignals & {
  isHttps: boolean
  hasReviewsShown: boolean
  hasReviewSites: boolean
  hasWorkShown: boolean
  hasTrackRecord: boolean
}

export interface ProofCheck {
  id: ProofId
  group: ProofGroup
  label: string
  signal: keyof ProofFacts
  move: { title: string; body: string }
}

/** Table order. Also the tie-break order for the first moves. */
export const PROOF_CHECKS: readonly ProofCheck[] = [
  {
    id: 'work',
    group: 'experience',
    label: 'Your work shown',
    signal: 'hasWorkShown',
    move: { title: 'Show your work', body: 'Add a page of real jobs or projects, with your own photos.' },
  },
  {
    id: 'track',
    group: 'experience',
    label: 'Track record',
    signal: 'hasTrackRecord',
    move: {
      title: 'Show your track record',
      body: 'Say how long you have done this work, like "Serving Pittsburgh since 1998", and how many reviews you have.',
    },
  },
  {
    id: 'people',
    group: 'expertise',
    label: 'Real people',
    signal: 'hasPeople',
    move: { title: 'Name the people', body: 'Say who runs the business, with a photo and one line each.' },
  },
  {
    id: 'credentials',
    group: 'expertise',
    label: 'Credentials',
    signal: 'hasCredentials',
    move: { title: 'Show your credentials', body: 'List your licenses, awards, memberships or the year you started.' },
  },
  /* Trust, in a visitor's order: what you do and who you are, then proof,
   * then the behind-the-scenes checks (Chris picked the order, 2026-10-01). */
  {
    id: 'trade',
    group: 'trust',
    label: 'What you do',
    signal: 'hasBusinessType',
    move: { title: 'Say what you do', body: 'Name your trade in plain words, like "plumber" or "bakery".' },
  },
  {
    id: 'about',
    group: 'trust',
    label: 'About page',
    signal: 'hasAboutLink',
    move: { title: 'Link your About page', body: 'Add a clear link to a page that says who you are and why you do this.' },
  },
  {
    id: 'address',
    group: 'trust',
    label: 'How to reach you',
    signal: 'hasAddressInfo',
    move: { title: 'Show how to reach you', body: 'Put your phone number or street address on the homepage.' },
  },
  {
    id: 'reviews',
    group: 'trust',
    label: 'Proof: reviews on your site',
    signal: 'hasReviewsShown',
    move: { title: 'Show your reviews', body: 'Put 2 or 3 real reviews on your homepage, with names and stars.' },
  },
  {
    id: 'reviewSites',
    group: 'trust',
    label: 'Proof: links to your reviews',
    signal: 'hasReviewSites',
    move: {
      title: 'Link to your reviews',
      body: 'Link to your Google Business Profile, Yelp or BBB page, so visitors can read what customers say.',
    },
  },
  {
    id: 'https',
    group: 'trust',
    label: 'Secure site',
    signal: 'isHttps',
    move: {
      title: 'Turn on HTTPS',
      body: 'Ask your host for a free SSL certificate, so browsers stop calling your site "Not secure".',
    },
  },
  {
    id: 'schema',
    group: 'trust',
    label: 'Business details for Google',
    signal: 'hasOrgSchema',
    move: {
      title: 'Tell Google who you are',
      body: 'Add a few lines of hidden code (called schema) with your business name, address and trade.',
    },
  },
]

export interface LetterInfo {
  id: Letter
  label: string
  hint: string
  points: number
}

export const LETTERS: readonly LetterInfo[] = [
  { id: 'experience', label: 'Experience', hint: 'your work and track record', points: 20 },
  { id: 'expertise', label: 'Expertise', hint: 'people and credentials', points: 20 },
  { id: 'authority', label: 'Authority', hint: 'who links to you', points: 20 },
  { id: 'trust', label: 'Trust', hint: '7 checks, incl. review proof', points: 40 },
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
  /** Track record level: 1 = one sign (6 points), 2 = strong (10 points). */
  trackLevel?: 0 | 1 | 2
  /** The checks found. null = the homepage could not be read. */
  proof: ProofId[] | null
  /** What each found check matched, in a few words (the phrase behind each ✓). */
  evidence?: Partial<Record<ProofId, string>>
  /** Why a rival's homepage could not be read, in a few words. */
  pageError?: string
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

export function proofFromSignals(s: ProofFacts): ProofId[] {
  return PROOF_CHECKS.filter((c) => s[c.signal]).map((c) => c.id)
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
  /** Checks found per group. */
  found: Record<ProofGroup, number>
}

/** The four parts and the total. null when the homepage wasn't read. */
export function scoresOf(s: SiteResult, r: AuthorityResult): Scores | null {
  if (!s.proof) return null
  const count = (g: ProofGroup) => checksIn(g).filter((c) => s.proof!.includes(c.id)).length
  const part = (g: ProofGroup) => Math.round((LETTERS.find((l) => l.id === g)!.points * count(g)) / checksIn(g).length)
  const a = authorityOf(s, r)
  // Experience: your work shown 10, track record 6 (one sign) or 10 (strong: the bonus level).
  const has = (id: ProofId) => s.proof!.includes(id)
  const experience = (has('work') ? 10 : 0) + (has('track') ? (s.trackLevel === 2 ? 10 : 6) : 0)
  const expertise = part('expertise')
  const authority = authorityPoints(a)
  const trust = part('trust')
  return {
    experience,
    expertise,
    authority,
    trust,
    overall: experience + expertise + authority + trust,
    found: { experience: count('experience'), expertise: count('expertise'), trust: count('trust') },
  }
}

export function band(overall: number): 'Strong' | 'Fair' | 'Needs work' {
  return overall >= 70 ? 'Strong' : overall >= 40 ? 'Fair' : 'Needs work'
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
  return `You’re ${ordinal(me.place!)} of ${n}. ${top.site.domain} leads with ${top.scores!.overall}, you have ${mine}.`
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
  id: ProofId
  title: string
  body: string
  /** Who shows it, e.g. "rival-a.com and rival-b.com show this". null on a solo check. */
  who: string | null
}

function joinNames(names: string[]): string {
  if (names.length <= 1) return names.join('')
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
}

/** Points one check is worth (Experience and Expertise checks are worth more each). */
function checkPoints(c: ProofCheck): number {
  return LETTERS.find((l) => l.id === c.group)!.points / checksIn(c.group).length
}

/**
 * The user's missing checks: the ones most rivals show first, then the ones
 * worth the most points, then table order. Empty when the user shows all.
 */
export function firstMoves(r: AuthorityResult, limit = 3): Move[] {
  const found = new Set(r.you.proof ?? [])
  return PROOF_CHECKS.filter((c) => !found.has(c.id))
    .map((c, order) => ({ c, order, have: r.rivals.filter((s) => s.proof?.includes(c.id)).map((s) => s.domain) }))
    .sort((a, b) => b.have.length - a.have.length || checkPoints(b.c) - checkPoints(a.c) || a.order - b.order)
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
    }))
}

/** A check a rival shows and you don't (an amber ✕ in your column). */
export function isGap(r: AuthorityResult, id: ProofId): boolean {
  return !!r.you.proof && !r.you.proof.includes(id) && r.rivals.some((s) => s.proof?.includes(id))
}
