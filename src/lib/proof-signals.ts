/* ── Proof signals (shared) ───────────────────────────────────────────────
 * The 7 homepage proof checks, moved out of audit-parser.ts parseAI as a
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

export function readProofSignals(
  html: string,
  pageText: string,
  jsonLdBlocks: RegExpMatchArray | null,
): ProofSignals {
  const hasAboutLink = /href=["'][^"']*(about|team|who-we-are|our-story)/i.test(html)
  const hasTestimonials =
    /testimonial|review|client|customer.said|what.people.say/i.test(html) ||
    (html.match(/<blockquote/gi) ?? []).length >= 2
  const hasCredentials =
    /\b(certified|licensed|accredited|award|year[s]? (of |in )?experience|founded|established|since \d{4})\b/i.test(
      pageText,
    )
  const hasOrgSchema =
    jsonLdBlocks?.some((b) => /Organization|LocalBusiness|Person|ProfessionalService/i.test(b)) ?? false
  const hasTeamSection =
    /(our team|meet the team|who we are|the people behind|leadership|our staff|about the owner|about us)/i.test(
      pageText,
    )
  const hasPeopleWithRoles =
    /\b(founder|owner|ceo|cto|director|manager|partner|principal|president)\b/i.test(pageText)
  const hasPeople = hasTeamSection || hasPeopleWithRoles

  const hasAddressInfo =
    /\b(address|location|phone|tel|headquarter|based in|serving|office)\b/i.test(pageText)
  const hasBusinessType =
    /\b(agency|company|firm|consultant|freelanc|studio|practice|shop|store|restaurant|salon|spa|clinic|gym|church|school|contractor|dentist|doctor|lawyer|attorney|plumb|electric|mover|moving|clean|bakery|brewery|florist|veterinar|daycare|auto|insurance|account|roofing|hvac|landscap|photograph|catering|fitness|wellness|therapy|coaching|nonprofit|realtor|real estate|architect|engineer|construct)\b/i.test(
      pageText,
    )

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
