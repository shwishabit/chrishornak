/* ── Experience signals (Authority Check only) ─────────────────────────────
 * The E in E-E-A-T. Google: "first-hand expertise … that comes from having
 * actually used a product or service, or visiting a place" (Creating helpful
 * content). For a local business: real work done, over real time.
 *   Your work shown = a link to a work / projects / portfolio / case results /
 *                     before-and-after page, a heading for one, or a client
 *                     list ("Clients we've helped grow", "Who we work with")
 *   Track record    = 5+ years in practice ("since 1962", "established his
 *                     practice in 1987", "six decades", foundingDate), a client
 *                     or job count of 20+ ("Over 150 clients"), 20+ reviews
 *                     stated ("700+ reviews"), or 3+ customer testimonials shown.
 *                     Strong: 5+ testimonials, 50+ reviews, 20+ years, or two signs
 * Testimonials: Google's raters look for experience in "sections such as
 * reviews and comments" (QRG Sept 2025, p. 27); Chris picked 3+ (option 2).
 * Tested on 18 Pittsburgh small-business homepages + 4 agency sites,
 * 2026-10-01 (backlog.md). Photo checks were dropped: a free check can't tell
 * the business's own photos from stock (Chris agreed). No server-only imports.
 * ─────────────────────────────────────────────────────────────────────── */

import { anchors, extractText } from './proof-signals'
import { FIRST_NAMES } from './first-names'

const WORK_PATH_RE =
  /\/(?:[\w-]*-)?(?:case-results|verdicts|settlements|smile-gallery|transformations|gallery|galleries|portfolio|portfolio-items|our-work|see-our-work|recent-work|projects?|case-stud(?:y|ies)|before-(?:and-|&-)?after|success-stories|lookbook|showcase)(?:[\/.?#-]|$)/i
// A page called just /work/ ("/work/instacart-content-marketing"), not "/how-we-work/".
const WORK_SEGMENT_RE = /^\/work(?:\/|$)/i
const WORK_WORDS_RE =
  /^(?:our |recent |view (?:our |the )?|see (?:our |the )?|read (?:the )?|explore (?:our )?)?(?:work|gallery|photo gallery|portfolio|projects|case stud(?:y|ies)|case results|smile gallery|before (?:and|&) after|success stories)$/i
// A short heading that is only the work section's name (not "All our work is guaranteed").
const WORK_HEADING_RE =
  /^(?:see |view |explore )?(?:recent (?:projects?|work|jobs|installs?|installations)|our (?:work|projects|portfolio|gallery|creations|cakes|designs)|(?:photo )?gallery|portfolio|before (?:and|&) after|featured projects?|project (?:gallery|spotlight)|case stud(?:y|ies)|(?:our|the) work|work we(?:'|’)ve done|smile gallery|case results|verdicts (?:and|&) settlements|transformations)$/i

// A client list heading, anywhere in a short heading ("Digital Marketing Agency Clients We've Helped Grow").
const CLIENT_HEADING_RE =
  /\b(?:who we(?:(?:'|’)ve)? work(?:ed)? with|our clients(?! (?:are )?say)|clients we(?:'|’)ve (?:helped|worked with|served)|brands we(?:'|’)ve worked with|we(?:'|’)ve helped (?:\w+ )?(?:brands|clients|companies|businesses)|featured clients|client list|trusted by)\b/i

// A start year: "since 1962", "est. 1980", "established his practice in 1987", "founded in 1925".
const START_YEAR_RE =
  /\b(?:since|est\.?|established|founded|opened|started|in business since)\b[^.\d]{0,40}?\b(1[89]\d\d|20[0-2]\d)\b/i
// The year first: "In June 2010, La Gourmandine bakery and pastry shop opened" (fixture test, 2026-10-02).
const YEAR_FIRST_RE =
  /\bIn (?:[A-Z][a-z]+ )?(1[89]\d\d|20[0-2]\d),?[^.]{0,80}?\b(?:opened|founded|started|established|began)\b/
// A length of time doing the work: "35 years of experience", "over 60 years in business",
// "20+ Years in Digital Marketing", "12+ Years Running This Agency".
// Up to 3 words before "experience": "over 30 years industry experience", "40 Years of Roofing
// Construction Experience" (second fresh-site test, 2026-10-02).
const YEARS_RE =
  /\b(?:over |more than |nearly |almost )?(\d{1,3})\+?\s*years?\s+(?:(?:of\s+)?(?:[a-z-]+\s+){0,3}?(?:experience|expertise)|in business|serving|practic\w*|running|in (?:the )?[a-z]+)\b/i
// "For over 30 years we have…", "using Landvision for 35 years", "For the last 22 years".
const FOR_YEARS_RE = /\bfor (?:over |more than |nearly |almost |the (?:last|past) )?(\d{1,3})\+?\s*years\b/i
const DECADES_RE = /\b(?:over |more than |nearly |almost )?(two|three|four|five|six|seven|eight|nine|ten|\d)\s+decades\b/i
const WORD_NUMBERS: Record<string, number> = { two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 }
// A review count shown on the site: "700+ reviews", "1,600+ Google reviews".
const REVIEW_COUNT_RE =
  /(?<![\d)][-.\s]?)\b(\d{1,3}(?:,\d{3})+|\d+)\+?\s+(?:(?:google|yelp|5-star|five-star|verified|customer|client|patient|happy|positive)\s+)*reviews\b/i

// A client or job count: "Over 150 Clients", "500+ projects", "2,000 homes", and up to two words
// between: "500+ Fast-Growing Companies", "130+ Enterprise Clients".
const CLIENT_COUNT_RE =
  /\b(\d{1,3}(?:,\d{3})+|\d+)\+?\s+(?:[A-Za-z][\w-]*\s+){0,2}?(?:clients|customers|projects|jobs|homes|families|businesses|brands|companies|startups|organizations|patients|cases|installations|installs|roofs|weddings|events)\b/i
// A quoted sentence of 40+ characters, the shape of a testimonial: a capital letter right after the
// opening mark (or "…" and a small letter: "...they know their stuff") and . ! ? before the closing
// one, so a stray straight quote can't shift the pairs.
const QUOTE_RE = /[“"]\s?((?:[A-Z]|(?:\.{3}|…)\s?[a-z])[^“”"]{36,600}?[.!?…])\s*[”"]/g
// A review signed under its last sentence with a first name and an initial: "…quickly. Gary G."
// Not after an abbreviation: "Robert A. Lebovitz, Esq. Stephen H. Lebovitz" is a list of names (lebovitzlaw.com).
// Or signed after a dash, with or without the initial: "…needs. - Angie B.", "…breathtaking" - Erica".
const SIGNED_RE =
  /(?:(?<!\b(?:Esq|Jr|Sr|Inc|Dr|Mr|Mrs|Ms|St|Co|[A-Z]))[.!?…]["”]?\s+([A-Z][a-z]+)\s+[A-Z]\.(?=\s|$)|[.!?…"”]\s*(?:&#x?[0-9a-f]+;\s*)*[-–—]\s*([A-Z][a-z]+)(?:\s+[A-Z]\.)?(?=[\s,]|$))/g

// Thresholds, sourced in drafts/research/small-business-review-counts.md (2026-10-01):
// 20 reviews: BrightLocal 2026 (vendor), "47% of consumers won't use a business with fewer than 20
// reviews"; 2024: most expect "between 20-99 reviews (59%)". 50 is the strong level (BrightLocal 2018
// average expectation 40). Clients/jobs 20 and testimonials 3 / 5 are editorial (no study found).
export const MIN_YEARS = 5
export const MIN_REVIEWS = 20
export const MIN_COUNT = 20
export const MIN_TESTIMONIALS = 3
/** Above the expected: the bonus level (Chris, 2026-10-01: "bonuses for certain levels over the expected"). */
export const STRONG_YEARS = 20
export const STRONG_TESTIMONIALS = 5
export const STRONG_REVIEWS = 50

/** 0 = none · 1 = one sign · 2 = strong (5+ testimonials, 20+ years, or two different signs). */
export type TrackLevel = 0 | 1 | 2

export interface ExperienceRead {
  /** What shows your own work, in a few words, or null. */
  workShown: string | null
  /** The track record found, in a few words, or null. */
  trackRecord: string | null
  trackLevel: TrackLevel
}

function findWork(html: string, pageUrl: string): string | null {
  let host = ''
  try {
    host = new URL(pageUrl).hostname.toLowerCase().replace(/^www\./, '')
  } catch {}
  for (const { href, inner } of anchors(html)) {
    let u: URL
    try {
      u = new URL(href, pageUrl)
    } catch {
      continue
    }
    if (u.hostname.toLowerCase().replace(/^www\./, '') !== host) continue
    const words = extractText(inner)
    if (WORK_PATH_RE.test(u.pathname) || WORK_SEGMENT_RE.test(u.pathname) || WORK_WORDS_RE.test(words))
      return `A link to “${(words || u.pathname).slice(0, 40)}” (${u.pathname.slice(0, 40)})`
  }
  for (const m of html.matchAll(/<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/gi)) {
    const t = extractText(m[1]).trim()
    if ((t.length <= 40 && WORK_HEADING_RE.test(t)) || (t.length <= 70 && CLIENT_HEADING_RE.test(t)))
      return `A section called “${t}”`
  }
  return null
}

/**
 * How many testimonials the page shows: <blockquote>s, or long quoted passages
 * in the visible text that read like a sentence (start with a capital letter,
 * no code characters). Comments, <noscript> and <template> are left out: a
 * tracking script's install note once counted as 3 "testimonials" (Wahl).
 */
export function countTestimonials(html: string): number {
  const blockquotes = (html.match(/<blockquote\b/gi) ?? []).length
  const shown = extractText(html.replace(/<!--[\s\S]*?-->|<(noscript|template)\b[\s\S]*?<\/\1>/gi, ' '))
  const quoted = new Set(
    [...shown.matchAll(QUOTE_RE)]
      .map((m) => m[1])
      .filter((q) => !/[{}<>|\\]|https?:/.test(q))
      .map((q) => q.slice(0, 60)),
  ).size
  const signed = [...shown.matchAll(SIGNED_RE)].filter((m) => FIRST_NAMES.has((m[1] ?? m[2]).toLowerCase())).length
  return Math.max(blockquotes, quoted, signed)
}

/** A review signed with a first name and an initial ("…quickly. Gary G."), or null. */
export function signedReview(html: string): string | null {
  const text = extractText(html.replace(/<!--[\s\S]*?-->|<(noscript|template)\b[\s\S]*?<\/\1>/gi, ' '))
  const m = [...text.matchAll(SIGNED_RE)].find((x) => FIRST_NAMES.has((x[1] ?? x[2]).toLowerCase()))
  return m ? text.slice(Math.max(0, m.index - 60), m.index + m[0].length).replace(/^\S*\s/, '…').trim() : null
}

/** Every track-record sign on the page, and the level they add up to. */
function findTrackRecord(html: string, now: number): { text: string | null; level: TrackLevel } {
  const text = extractText(html)
  const signs: string[] = []
  let strong = false

  // Years in practice: one sign, the longest of every wording found (a page can say both
  // "established 2024" for a new office and "for over 30 years" for the business).
  const all = (re: RegExp) => [...text.matchAll(new RegExp(re.source, re.flags.includes('i') ? 'gi' : 'g'))]
  const spans: { years: number; label: string }[] = [
    ...[...all(START_YEAR_RE), ...all(YEAR_FIRST_RE)]
      .map((m) => ({ years: now - Number(m[1]), label: `“${m[0].trim()}” (${now - Number(m[1])} years)` }))
      .filter((s) => s.years >= 0),
    ...all(YEARS_RE).map((m) => ({ years: Number(m[1]), label: `“${m[0].trim()}”` })),
    ...all(FOR_YEARS_RE).map((m) => ({ years: Number(m[1]), label: `“${m[0].trim()}”` })),
    ...all(DECADES_RE).map((m) => ({ years: (WORD_NUMBERS[m[1].toLowerCase()] ?? Number(m[1])) * 10, label: `“${m[0].trim()}”` })),
  ]
  const founding = html.match(/"foundingDate"\s*:\s*"(\d{4})/)?.[1]
  if (founding && Number(founding) <= now)
    spans.push({ years: now - Number(founding), label: `founded ${founding} (${now - Number(founding)} years)` })
  const longest = spans.filter((s) => s.years <= 200).sort((a, b) => b.years - a.years)[0]
  if (longest && longest.years >= MIN_YEARS) {
    signs.push(longest.label)
    if (longest.years >= STRONG_YEARS) strong = true
  }

  const count = REVIEW_COUNT_RE.exec(text)
  const reviews = count ? Number(count[1].replace(/,/g, '')) : 0
  if (reviews >= MIN_REVIEWS) {
    signs.push(`“${count![0].trim()}”`)
    if (reviews >= STRONG_REVIEWS) strong = true
  }
  // A year is never a count: "2027 Weddings" is a booking season (fresh-site test, 2026-10-01).
  const clients = [...text.matchAll(new RegExp(CLIENT_COUNT_RE.source, 'gi'))].find((m) => !/^(?:19|20)\d\d$/.test(m[1]))
  if (clients && Number(clients[1].replace(/,/g, '')) >= MIN_COUNT) signs.push(`“${clients[0].trim()}”`)
  const shown = countTestimonials(html)
  if (shown >= MIN_TESTIMONIALS) {
    signs.push(`${shown} testimonials`)
    if (shown >= STRONG_TESTIMONIALS) strong = true
  }

  if (!signs.length) return { text: null, level: 0 }
  const level: TrackLevel = strong || signs.length >= 2 ? 2 : 1
  return { text: `${level === 2 ? 'Strong: ' : ''}${signs.join(' · ')}`, level }
}

export function readExperienceSignals(html: string, pageUrl: string, now = new Date().getUTCFullYear()): ExperienceRead {
  const track = findTrackRecord(html, now)
  return { workShown: findWork(html, pageUrl), trackRecord: track.text, trackLevel: track.level }
}
