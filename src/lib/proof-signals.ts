/* ── Proof signals (shared) ───────────────────────────────────────────────
 * The homepage proof checks, moved out of audit-parser.ts (parseAI, parseSecurity) as a
 * pure move so the Findability Check and the Authority Check read a page
 * with the same rules. Any change here moves every Findability score and
 * the benchmark (labels are keys in issue-descriptions.ts), so don't tune
 * these for the Authority Check alone. No server-only imports.
 * ─────────────────────────────────────────────────────────────────────── */

/** Visible page text: scripts, styles and tags stripped, whitespace folded. */
export function extractText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Every JSON-LD <script> block, whole, or null when there are none. */
export function findJsonLdBlocks(html: string): RegExpMatchArray | null {
  return html.match(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi,
  )
}

/** Security: a link to a privacy, terms or cookie page, or those words on the page. */
export function readPrivacyLink(html: string): boolean {
  const privacyRe = /href=["'][^"']*(privacy|datenschutz|privacidad|legal|terms|policies\/privacy|cookie-policy)[^"']*["']/i
  const privacyTextRe = />([^<]*(privacy policy|privacy notice|cookie policy)[^<]*)</i
  return privacyRe.test(html) || privacyTextRe.test(html)
}

/** Security: Findability's HTTPS rule (api/audit/route.ts: the final URL after redirects). */
export function isHttpsUrl(finalUrl: string): boolean {
  return finalUrl.startsWith('https')
}

export interface ProofSignals {
  /** Trust signals: a link to an about / team / story page. */
  hasAboutLink: boolean
  /** Trust signals: testimonials, reviews, or 2+ blockquotes. */
  hasTestimonials: boolean
  /** Trust signals: licenses, awards, years in business. */
  hasCredentials: boolean
  /** Trust signals: Organization / LocalBusiness / Person / ProfessionalService JSON-LD. */
  hasOrgSchema: boolean
  /** Trust signals: a team section or a named role (founder, owner…). */
  hasPeople: boolean
  /** Entity clarity: address, location, phone, service area words. */
  hasAddressInfo: boolean
  /** Entity clarity: a plain business-type word (plumber, bakery, agency…). */
  hasBusinessType: boolean
}


// The rules, once. All non-global, so .test()/.exec() keep no state between calls.
const ABOUT_RE = /href=["'][^"']*(about|team|who-we-are|our-story)/i
const TESTIMONIAL_RE = /testimonial|review|client|customer.said|what.people.say/i
const CREDENTIALS_RE =
  /\b(certified|licensed|accredited|award|year[s]? (of |in )?experience|founded|established|since \d{4})\b/i
const ORG_SCHEMA_RE = /Organization|LocalBusiness|Person|ProfessionalService/i
const TEAM_RE =
  /(our team|meet the team|who we are|the people behind|leadership|our staff|about the owner|about us)/i
const ROLE_RE = /\b(founder|owner|ceo|cto|director|manager|partner|principal|president)\b/i
const ADDRESS_RE = /\b(address|location|phone|tel|headquarter|based in|serving|office)\b/i
const BUSINESS_TYPE_RE =
  /\b(agency|company|firm|consultant|freelanc|studio|practice|shop|store|restaurant|salon|spa|clinic|gym|church|school|contractor|dentist|doctor|lawyer|attorney|plumb|electric|mover|moving|clean|bakery|brewery|florist|veterinar|daycare|auto|insurance|account|roofing|hvac|landscap|photograph|catering|fitness|wellness|therapy|coaching|nonprofit|realtor|real estate|architect|engineer|construct)\b/i

export function readProofSignals(
  html: string,
  pageText: string,
  jsonLdBlocks: RegExpMatchArray | null,
): ProofSignals {
  const hasAboutLink = ABOUT_RE.test(html)
  const hasTestimonials =
    TESTIMONIAL_RE.test(html) ||
    (html.match(/<blockquote/gi) ?? []).length >= 2
  const hasCredentials = CREDENTIALS_RE.test(pageText)
  const hasOrgSchema = jsonLdBlocks?.some((b) => ORG_SCHEMA_RE.test(b)) ?? false
  const hasTeamSection = TEAM_RE.test(pageText)
  const hasPeopleWithRoles = ROLE_RE.test(pageText)
  const hasPeople = hasTeamSection || hasPeopleWithRoles

  const hasAddressInfo = ADDRESS_RE.test(pageText)
  const hasBusinessType = BUSINESS_TYPE_RE.test(pageText)

  return {
    hasAboutLink,
    hasTestimonials,
    hasCredentials,
    hasOrgSchema,
    hasPeople,
    hasAddressInfo,
    hasBusinessType,
  }
}

/* ── Evidence: what each rule matched, in a few words ─────────────────────
 * Same regexes as readProofSignals, run with .exec() so the Authority Check
 * can show the phrase behind each ✓. Findability doesn't call this.
 * ─────────────────────────────────────────────────────────────────────── */

export type ProofEvidence = Partial<Record<keyof ProofSignals, string>>

/** ~90 characters of text around a match, cut at word edges. */
function around(text: string, index: number, length: number): string {
  const start = Math.max(0, index - 40)
  const end = Math.min(text.length, index + length + 40)
  let s = text.slice(start, end)
  if (start > 0) s = s.replace(/^\S*\s/, '')
  if (end < text.length) s = s.replace(/\s\S*$/, '')
  // extractText leaves numeric entities (&#x27;); decode them for display only.
  s = s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
  return `${start > 0 ? '…' : ''}${s.trim()}${end < text.length ? '…' : ''}`
}

function inText(re: RegExp, pageText: string): string | undefined {
  const m = re.exec(pageText)
  return m ? `Found “${m[0]}”: ${around(pageText, m.index, m[0].length)}` : undefined
}

export function readProofEvidence(
  html: string,
  pageText: string,
  jsonLdBlocks: RegExpMatchArray | null,
): ProofEvidence {
  const out: ProofEvidence = {}

  const about = ABOUT_RE.exec(html)
  if (about) {
    const href = html.slice(about.index).match(/href=["']([^"']*)/i)?.[1] ?? about[1]
    out.hasAboutLink = `A link to “${href.slice(0, 60)}”`
  }

  const word = TESTIMONIAL_RE.exec(html)
  if (word) {
    const visible = new RegExp(word[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').exec(pageText)
    out.hasTestimonials = visible
      ? `Found “${visible[0]}”: ${around(pageText, visible.index, visible[0].length)}`
      : `Only the word “${word[0]}” in the page code, not in the visible text`
  } else if ((html.match(/<blockquote/gi) ?? []).length >= 2) {
    out.hasTestimonials = 'Two or more quotes on the page'
  }

  out.hasCredentials = inText(CREDENTIALS_RE, pageText)

  const block = jsonLdBlocks?.find((b) => ORG_SCHEMA_RE.test(b))
  if (block) out.hasOrgSchema = `Code that says this is a “${ORG_SCHEMA_RE.exec(block)![0]}”`

  out.hasPeople = inText(TEAM_RE, pageText) ?? inText(ROLE_RE, pageText)
  out.hasAddressInfo = inText(ADDRESS_RE, pageText)
  out.hasBusinessType = inText(BUSINESS_TYPE_RE, pageText)

  for (const k of Object.keys(out) as (keyof ProofSignals)[]) if (!out[k]) delete out[k]
  return out
}
