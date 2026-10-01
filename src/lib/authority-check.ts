/* ── Authority Check: shared logic (client + server) ──────────────────────
 * The 7 proof checks (read with the Findability Check's own rules, see
 * proof-signals.ts), the links score (Open PageRank 0–10 shown out of 100),
 * the two ranked lists with the "About the same" tie rule, the verdict line
 * and the first 3 moves. Locked in drafts/authority-check-build-spec.md.
 * ─────────────────────────────────────────────────────────────────────── */

import type { ProofSignals } from './proof-signals'

export const MAX_RIVALS = 3
/** Link score gaps under this many points read as "About the same" (spec decision 7). */
export const TIE_GAP = 3

export type ProofId = 'about' | 'reviews' | 'people' | 'credentials' | 'schema' | 'address' | 'trade'

export interface ProofCheck {
  id: ProofId
  label: string
  small: string
  signal: keyof ProofSignals
  move: { title: string; body: string }
}

/** Table order. Also the tie-break order for the first moves. */
export const PROOF_CHECKS: readonly ProofCheck[] = [
  {
    id: 'about',
    label: 'About page',
    small: 'A link to who you are',
    signal: 'hasAboutLink',
    move: { title: 'Link your About page', body: 'Add a clear link to a page that says who you are and why you do this.' },
  },
  {
    id: 'reviews',
    label: 'Customer reviews',
    small: 'Testimonials on the page',
    signal: 'hasTestimonials',
    move: { title: 'Add customer reviews', body: 'Put 2 or 3 real reviews on your homepage, with names.' },
  },
  {
    id: 'people',
    label: 'People named',
    small: 'Who runs the business',
    signal: 'hasPeople',
    move: { title: 'Name the people', body: 'Say who runs the business, with a photo and one line each.' },
  },
  {
    id: 'credentials',
    label: 'Credentials',
    small: 'Licenses, awards, memberships',
    signal: 'hasCredentials',
    move: { title: 'Show your credentials', body: 'List your licenses, awards, memberships or the year you started.' },
  },
  {
    id: 'schema',
    label: 'Business schema',
    small: 'Code that names your business',
    signal: 'hasOrgSchema',
    move: { title: 'Add business schema', body: 'A few lines of code that tell Google your name, address and trade.' },
  },
  {
    id: 'address',
    label: 'Street address',
    small: 'Where you are',
    signal: 'hasAddressInfo',
    move: { title: 'Say where you are', body: 'Put your address, phone number or service area on the homepage.' },
  },
  {
    id: 'trade',
    label: 'What you do',
    small: 'Your trade, in plain words',
    signal: 'hasBusinessType',
    move: { title: 'Say what you do', body: 'Name your trade in plain words, like "plumber" or "bakery".' },
  },
]

/* ── Result shape (the API's JSON) ─────────────────────────────────────── */

export interface SiteResult {
  /** Bare host, no www. */
  domain: string
  /** Open PageRank shown out of 100. null = no link data for this site. */
  links: number | null
  /** The proof checks found. null = the homepage could not be read. */
  proof: ProofId[] | null
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

export function proofFromSignals(s: ProofSignals): ProofId[] {
  return PROOF_CHECKS.filter((c) => s[c.signal]).map((c) => c.id)
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

/* ── Ranked lists ───────────────────────────────────────────────────────── */

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
 * Links: highest first. A site joins the group above it when it is under
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

/** Proof: most found first. Equal counts share a rank number. Bars are out of 7. */
export function rankProof(r: AuthorityResult): { rows: (RankRow & { rank: number })[]; unread: { site: SiteResult; index: number }[] } {
  const sites = allSites(r)
  const read = sites
    .map((site, index) => ({ site, index, value: site.proof?.length ?? -1 }))
    .filter((s) => s.site.proof !== null)
    .sort((a, b) => b.value - a.value || a.index - b.index)
  const rows = read.map((s) => ({
    ...s,
    pct: Math.round((s.value / PROOF_CHECKS.length) * 100),
    rank: read.findIndex((o) => o.value === s.value) + 1,
  }))
  const unread = sites.map((site, index) => ({ site, index })).filter((s) => s.site.proof === null)
  return { rows, unread }
}

/* ── Verdict ────────────────────────────────────────────────────────────── */

export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

export interface VerdictPart {
  /** "Tied 2nd of 4", "1st of 3", "7 of 100". */
  text: string
  /** true when you lead (or tie for the lead), or on a solo check. */
  good: boolean
}

export function linksVerdict(r: AuthorityResult): VerdictPart | null {
  if (r.linksStatus !== 'ok') return null
  if (r.you.links === null) return { text: 'No link data', good: false }
  if (r.rivals.length === 0) return { text: `${r.you.links} of 100`, good: true }
  const { groups } = rankLinks(r)
  const n = groups.reduce((sum, g) => sum + g.rows.length, 0)
  const g = groups.find((x) => x.rows.some((row) => row.index === 0))!
  const tied = g.rows.length > 1
  return { text: `${tied ? 'Tied ' : ''}${ordinal(g.rank)} of ${n}`, good: g.rank === 1 }
}

export function proofVerdict(r: AuthorityResult): VerdictPart {
  const count = r.you.proof?.length ?? 0
  if (r.rivals.length === 0) return { text: `${count} of ${PROOF_CHECKS.length}`, good: true }
  const { rows } = rankProof(r)
  const me = rows.find((row) => row.index === 0)
  if (!me) return { text: 'Not read', good: false }
  const shared = rows.filter((row) => row.value === me.value).length > 1
  return { text: `${shared ? 'Tied ' : ''}${ordinal(me.rank)} of ${rows.length}`, good: me.rank === 1 }
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
 * The user's missing checks, ordered by how many rivals show them (most
 * first), ties broken by table order. Empty when the user shows all 7.
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
