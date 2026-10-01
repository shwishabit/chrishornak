/* ── Authority Check: shared logic (client + server) ──────────────────────
 * Three sections, named after Google's E-E-A-T where they fit:
 *   Authority = who links to you (Open PageRank 0–10, shown out of 100)
 *   Trust     = 7 homepage checks (the Findability Check's own rules)
 *   Reviews   = reviews on your homepage (same rules)
 * Plus the "About the same" tie rule, the summary sentence and the first
 * 3 moves. Build spec: drafts/authority-check-build-spec.md; Chris's later
 * calls are in backlog.md (Tools item).
 * ─────────────────────────────────────────────────────────────────────── */

import type { ProofSignals } from './proof-signals'

export const MAX_RIVALS = 3
/** Authority gaps under this many points read as "About the same" (spec decision 7). */
export const TIE_GAP = 3

export type ProofId = 'https' | 'about' | 'people' | 'credentials' | 'schema' | 'address' | 'trade' | 'reviews'
export type ProofGroup = 'trust' | 'reviews'

/** The homepage signals from parseAI plus HTTPS from Findability's Security checks. */
export type ProofFacts = ProofSignals & { isHttps: boolean }

export interface ProofCheck {
  id: ProofId
  group: ProofGroup
  label: string
  small: string
  signal: keyof ProofFacts
  move: { title: string; body: string }
}

/** Table order. Also the tie-break order for the first moves (HTTPS first: "Not secure" is the worst sign). */
export const PROOF_CHECKS: readonly ProofCheck[] = [
  {
    id: 'https',
    group: 'trust',
    label: 'Secure site',
    small: 'The lock next to your web address',
    signal: 'isHttps',
    move: {
      title: 'Turn on HTTPS',
      body: 'Ask your host for a free SSL certificate, so browsers stop calling your site "Not secure".',
    },
  },
  {
    id: 'about',
    group: 'trust',
    label: 'About page',
    small: 'A link to a page about you',
    signal: 'hasAboutLink',
    move: { title: 'Link your About page', body: 'Add a clear link to a page that says who you are and why you do this.' },
  },
  {
    id: 'people',
    group: 'trust',
    label: 'Real people',
    small: 'Who runs the business',
    signal: 'hasPeople',
    move: { title: 'Name the people', body: 'Say who runs the business, with a photo and one line each.' },
  },
  {
    id: 'credentials',
    group: 'trust',
    label: 'Credentials',
    small: 'Licenses, awards or years in business',
    signal: 'hasCredentials',
    move: { title: 'Show your credentials', body: 'List your licenses, awards, memberships or the year you started.' },
  },
  {
    id: 'schema',
    group: 'trust',
    label: 'Business details for Google',
    small: 'Hidden code with your name and trade',
    signal: 'hasOrgSchema',
    move: {
      title: 'Tell Google who you are',
      body: 'Add a few lines of hidden code (called schema) with your business name, address and trade.',
    },
  },
  {
    id: 'address',
    group: 'trust',
    label: 'How to reach you',
    small: 'Address, phone or service area',
    signal: 'hasAddressInfo',
    move: { title: 'Show how to reach you', body: 'Put your address, phone number or service area on the homepage.' },
  },
  {
    id: 'trade',
    group: 'trust',
    label: 'What you do',
    small: 'Your trade, in plain words',
    signal: 'hasBusinessType',
    move: { title: 'Say what you do', body: 'Name your trade in plain words, like "plumber" or "bakery".' },
  },
  {
    id: 'reviews',
    group: 'reviews',
    label: 'Reviews',
    small: 'What customers say, on your homepage',
    signal: 'hasTestimonials',
    move: { title: 'Add reviews', body: 'Put 2 or 3 real reviews on your homepage, with names.' },
  },
]

export const TRUST_CHECKS = PROOF_CHECKS.filter((c) => c.group === 'trust')

/* ── Result shape (the API's JSON) ─────────────────────────────────────── */

export interface SiteResult {
  /** Bare host, no www. */
  domain: string
  /** Authority: Open PageRank shown out of 100. null = no score for this site. */
  links: number | null
  /** Sites linking here (Open PageRank's referring domains; weaker sites count for less). */
  linkingSites?: number | null
  /** The homepage checks found. null = the homepage could not be read. */
  proof: ProofId[] | null
  /** What each found check matched, in a few words (the phrase behind each ✓). */
  evidence?: Partial<Record<ProofId, string>>
  /** Why a rival's homepage could not be read, in a few words. */
  pageError?: string
}

/** ok = scores came back · busy = Open PageRank said 429 · unavailable = anything else. */
export type LinksStatus = 'ok' | 'busy' | 'unavailable'

export interface AuthorityResult {
  checkedAt: string
  /** Open PageRank's data date (YYYY-MM-DD). */
  asOf: string | null
  linksStatus: LinksStatus
  you: SiteResult
  rivals: SiteResult[]
}

/* ── Scoring ────────────────────────────────────────────────────────────── */

/** Open PageRank 0–10 → shown out of 100, whole number (0.96 → 10). */
export function linksScore(opr: number | null | undefined): number | null {
  if (opr === null || opr === undefined || !Number.isFinite(opr)) return null
  return Math.max(0, Math.min(100, Math.round(opr * 10)))
}

/**
 * What an authority score means, from Open PageRank's own bands (/methodology,
 * 0–10 scale × 10): 0–2 "New, small, or lightly-linked domains", 2–5 "Typical
 * active sites", 5–8 "Well-established sites with a strong, genuine link
 * profile", 8–10 "The most-linked sites on the web".
 */
export const AUTHORITY_BANDS = [
  { min: 80, label: 'Major site', meaning: 'Among the most-linked sites on the web' },
  { min: 50, label: 'Well established', meaning: 'Many strong, real sites link here' },
  { min: 20, label: 'Typical', meaning: 'A typical active site' },
  { min: 0, label: 'New or small', meaning: 'Few sites link here yet. Normal for a small business' },
] as const

export function authorityBand(score: number) {
  return AUTHORITY_BANDS.find((b) => score >= b.min) ?? AUTHORITY_BANDS[AUTHORITY_BANDS.length - 1]
}

export function proofFromSignals(s: ProofFacts): ProofId[] {
  return PROOF_CHECKS.filter((c) => s[c.signal]).map((c) => c.id)
}

/** Trust checks found, or null when the homepage wasn't read. */
export function trustCount(s: SiteResult): number | null {
  return s.proof ? TRUST_CHECKS.filter((c) => s.proof!.includes(c.id)).length : null
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

/* ── Ranks ──────────────────────────────────────────────────────────────── */

export interface RankRow {
  site: SiteResult
  /** 0 = you, 1–3 = Rival A–C. */
  index: number
  value: number
  /** Bar width, 0–100. */
  pct: number
}

export interface RankGroup {
  rank: number
  rows: RankRow[]
}

export function allSites(r: AuthorityResult): SiteResult[] {
  return [r.you, ...r.rivals]
}

export function rivalLetter(index: number): string {
  return String.fromCharCode(64 + index) // 1 → A
}

/**
 * Authority: highest first. A site joins the group above it when it is under
 * TIE_GAP points behind that group's top score. Ranks count sites
 * (1, 2, 2, 4). Bars are drawn against the top site in the check.
 */
export function rankLinks(r: AuthorityResult): { groups: RankGroup[]; missing: { site: SiteResult; index: number }[] } {
  const sites = allSites(r)
  const scored = sites
    .map((site, index) => ({ site, index, value: site.links }))
    .filter((s): s is { site: SiteResult; index: number; value: number } => s.value !== null)
    .sort((a, b) => b.value - a.value || a.index - b.index)
  const top = scored[0]?.value ?? 0
  const groups: RankGroup[] = []
  scored.forEach((s, i) => {
    const row: RankRow = { ...s, pct: top > 0 ? Math.round((s.value / top) * 100) : 0 }
    const last = groups[groups.length - 1]
    if (last && last.rows[0].value - s.value < TIE_GAP) last.rows.push(row)
    else groups.push({ rank: i + 1, rows: [row] })
  })
  const missing = sites.map((site, index) => ({ site, index })).filter((s) => s.site.links === null)
  return { groups, missing }
}

/** Per site (by index): its authority rank and whether it shares that rank ("About the same"). */
export function authorityRanks(r: AuthorityResult): Map<number, { rank: number; tie: boolean; pct: number }> {
  const out = new Map<number, { rank: number; tie: boolean; pct: number }>()
  for (const g of rankLinks(r).groups)
    for (const row of g.rows) out.set(row.index, { rank: g.rank, tie: g.rows.length > 1, pct: row.pct })
  return out
}

/** Per site (by index): its trust rank (equal counts share a rank). Unread sites are left out. */
export function trustRanks(r: AuthorityResult): Map<number, { rank: number; tie: boolean }> {
  const read = allSites(r)
    .map((site, index) => ({ index, value: trustCount(site) }))
    .filter((s): s is { index: number; value: number } => s.value !== null)
  const out = new Map<number, { rank: number; tie: boolean }>()
  for (const s of read) {
    out.set(s.index, {
      rank: read.filter((o) => o.value > s.value).length + 1,
      tie: read.filter((o) => o.value === s.value).length > 1,
    })
  }
  return out
}

/* ── The summary, in plain words ────────────────────────────────────────── */

/** Two short sentences: where you stand on authority, then on trust. */
export function summary(r: AuthorityResult): string[] {
  const out: string[] = []
  const you = r.you
  const n = TRUST_CHECKS.length
  const solo = r.rivals.length === 0

  if (r.linksStatus === 'ok') {
    const scored = allSites(r).filter((s) => s.links !== null)
    if (you.links === null) out.push('We have no authority score for your site yet.')
    else if (solo) out.push(`Your authority is ${you.links} out of 100: ${authorityBand(you.links).label.toLowerCase()}.`)
    else if (scored.length > 1 && scored.every((s) => s.links! < 20))
      out.push("You're all small sites on authority, so links won't decide this.")
    else {
      const ranks = authorityRanks(r)
      const me = ranks.get(0)!
      const leaders = allSites(r).filter((_, i) => ranks.get(i)?.rank === 1 && i !== 0)
      if (me.rank === 1 && me.tie) out.push(`You're about level with ${leaders.map((s) => s.domain).join(' and ')} on authority.`)
      else if (me.rank === 1) out.push('You lead on authority.')
      else {
        const top = allSites(r)[[...ranks.entries()].find(([, v]) => v.rank === 1)![0]]
        out.push(`${top.domain} leads on authority, ${top.links} to your ${you.links}.`)
      }
    }
  }

  const mine = trustCount(you) ?? 0
  if (solo) out.push(`Your homepage shows ${mine} of ${n} trust signs.`)
  else {
    const best = r.rivals
      .filter((s) => s.proof)
      .sort((a, b) => trustCount(b)! - trustCount(a)!)[0]
    if (!best) out.push(`Your homepage shows ${mine} of ${n} trust signs. We couldn't read your rivals' homepages.`)
    else if (trustCount(best)! > mine) out.push(`${best.domain} shows ${trustCount(best)} trust signs to your ${mine}.`)
    else if (trustCount(best)! === mine) out.push(`You're level on trust: ${mine} of ${n}.`)
    else out.push(`You show the most trust signs: ${mine} of ${n}.`)
  }
  return out
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

/**
 * The user's missing homepage checks, ordered by how many rivals show them
 * (most first), ties broken by table order. Empty when the user shows all.
 */
export function firstMoves(r: AuthorityResult, limit = 3): Move[] {
  const found = new Set(r.you.proof ?? [])
  return PROOF_CHECKS.filter((c) => !found.has(c.id))
    .map((c, order) => {
      const have = r.rivals.filter((s) => s.proof?.includes(c.id)).map((s) => s.domain)
      return { c, order, have }
    })
    .sort((a, b) => b.have.length - a.have.length || a.order - b.order)
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

/** Rows a rival shows and you don't ("Your gap"). */
export function isGap(r: AuthorityResult, id: ProofId): boolean {
  return !!r.you.proof && !r.you.proof.includes(id) && r.rivals.some((s) => s.proof?.includes(id))
}
