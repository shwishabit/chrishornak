/* ── Review signals (Authority Check only) ─────────────────────────────────
 * The two rows of the Authority Check's Reputation section:
 *   Reviews on your site = reviews in the visible text (menus left out), a
 *                          review widget, or the same on a linked reviews page
 *   Independent reviews  = a link to a review profile: a Google business
 *                          listing, Yelp, BBB or a trade site. Facebook and
 *                          address-only maps don't count.
 * Findability keeps its own looser rule (proof-signals.ts hasTestimonials);
 * these live here so Findability scores don't move. Tested on 21 Pittsburgh
 * small-business homepages, 2026-10-01 (backlog.md, Google review stars item).
 * Free to run: page reads and redirect reads only, no API. No server-only
 * imports.
 * ─────────────────────────────────────────────────────────────────────── */

import { anchors, extractText, findJsonLdBlocks } from './proof-signals'
import { countTestimonials, signedReview } from './experience-signals'

/* ── Reviews on your site ───────────────────────────────────────────────── */

// A count never ends a phone number: "(971) 333-2656 Reviews" is a phone and a menu word (laurelhurstchiropractic.com).
// "4.8 stars", "4.9 out of 5 stars", "4.9 / 5", "5-star reviews", "rated 4.9", "1,600+ reviews", "200 Google reviews", ★★★★★
const RATING_RE =
  /\b[1-5](?:\.\d)?(?:\s*out of 5)?\s*stars\b|\b[1-5]\.\d\s*\/\s*5\b|\b(?:5|five)[- ]star (?:reviews?|ratings?)\b|\brated\s+[1-5]\.\d\b|(?<![\d)][-.\s]?)\b\d[\d,]*\+?\s+(?:(?:google|yelp|5-star|five-star|verified|customer|client|patient|happy)\s+)*reviews\b|[★⭐]{3,}/i
// A reviews section heading, in text that isn't a link (menu items are links). Not on a reviews page (its own title would match).
const HEADING_RE =
  /\b(?:testimonials|what (?:our |your |my )?(?:customers|clients|patients|guests|neighbors|homeowners) (?:say|are saying)|(?:customer|client|patient|google) reviews|kind words|reviews from)\b/i
// Repeated review blocks: class="review__content", "testimonial-item" and the like.
const REVIEW_CLASS_RE = /<[a-z]+[^>]*\bclass=["'][^"']*\b(?:testimonial|review)[\w-]*/gi
const QUOTE_CLASS_RE = /<[a-z]+[^>]*\bclass=["'][^"']*\b(?<!(?:a|get|request|free|your)-)quote\b/gi
// Widgets that only show reviews. Their reviews load by script, so the widget itself is the proof.
const WIDGETS: [string, RegExp][] = [
  ['Trustindex', /trustindex\.io/i],
  ['Trustpilot', /widget\.trustpilot\.com/i],
  ['Birdeye', /birdeye\.com\/embed/i],
  ['NiceJob', /nicejob\.co/i],
  ['Grade.us', /grade\.us/i],
  ['Reviews On My Website', /reviewsonmywebsite/i],
  ['Featurable', /featurable\.com/i],
  ['Trustmary', /trustmary/i],
  ['Repuso', /repuso\.com/i],
  ['REVIEWS.io', /widget\.reviews\.io/i],
  ['SociableKIT Google Reviews', /sk-google-reviews|google-reviews\.sociablekit/i],
  ['BrightLocal', /showcase-reviews|brightlocal\.com\/assets\/js\/review/i],
  ['HighLevel', /leadconnectorhq\.com\/(?:js\/reviews_widget|appengine\/reviews)/i],
  ['Google Reviews plugin', /plugins\/(?:google-reviews-business|widget-google-reviews|wp-reviews-plugin-for-google)\//i],
  ['Facebook Reviews plugin', /plugins\/fb-reviews-widget\//i],
]
// A link to the site's own reviews page, by its path or its words.
const REVIEWS_PATH_RE = /\/(?:[\w-]*-)?(?:reviews?|testimonials?|kind-words|what-(?:our-)?(?:customers|clients|patients)-say)(?:[\/.?#-]|$)/i
const REVIEWS_WORDS_RE = /^(?:(?:customer|client|patient|google) )?(?:reviews|testimonials)$/i

/** ~90 characters of text around a match, cut at word edges. */
function around(text: string, index: number, length: number): string {
  const start = Math.max(0, index - 40)
  const end = Math.min(text.length, index + length + 40)
  let s = text.slice(start, end)
  if (start > 0) s = s.replace(/^\S*\s/, '')
  if (end < text.length) s = s.replace(/\s\S*$/, '')
  return `${start > 0 ? '…' : ''}${s.trim()}${end < text.length ? '…' : ''}`
}

/** Visible text with menus, headers and footers left out (falls back to all text on a thin page). */
function bodyText(html: string): string {
  const text = extractText(html.replace(/<(nav|header|footer)\b[\s\S]*?<\/\1>/gi, ' '))
  return text.length >= 200 ? text : extractText(html)
}

/** What shows reviews on this page, in a few words, or null. */
function reviewsOnPage(html: string, onReviewsPage: boolean): string | null {
  const text = bodyText(html)
  const rating = RATING_RE.exec(text)
  if (rating) return `Found “${rating[0]}”: ${around(text, rating.index, rating[0].length)}`
  const widget = WIDGETS.find(([, re]) => re.test(html))
  if (widget) return `A review widget (${widget[0]})`
  if (!onReviewsPage) {
    const plain = bodyText(html.replace(/<a\b[\s\S]*?<\/a>/gi, ' '))
    const heading = HEADING_RE.exec(plain)
    if (heading) return `Found “${heading[0]}”: ${around(plain, heading.index, heading[0].length)}`
  }
  if ((html.match(/<blockquote/gi) ?? []).length >= 2) return 'Two or more quotes on the page'
  if ((html.match(REVIEW_CLASS_RE) ?? []).length >= 3) return 'Reviews shown on the page'
  // On the reviews page only, "quote" blocks too (class="st-quote", seerinteractive.com); on a homepage
  // "quote" is mostly "get-a-quote" buttons.
  if (onReviewsPage && (html.match(QUOTE_CLASS_RE) ?? []).length >= 3) return 'Quotes shown on the page'
  // Customer quotes in plain text: 2+ quoted sentences, or one review signed "Gary G." (fixture test, 2026-10-02).
  const quotes = countTestimonials(html)
  if (quotes >= 2) return `${quotes} quotes from customers`
  const signed = signedReview(html)
  if (signed) return `A signed review: “${signed}”`
  return null
}

/** The first link to this site's own reviews page, or null. */
function findReviewsPage(html: string, pageUrl: string): string | null {
  let base: URL
  try {
    base = new URL(pageUrl)
  } catch {
    return null
  }
  const bare = (h: string) => h.toLowerCase().replace(/^www\./, '')
  for (const { href, inner } of anchors(html)) {
    const words = extractText(inner)
    let u: URL
    try {
      u = new URL(href, base)
    } catch {
      continue
    }
    if (!['http:', 'https:'].includes(u.protocol) || bare(u.hostname) !== bare(base.hostname)) continue
    if (u.pathname === base.pathname) continue // "#reviews" on the same page
    if (REVIEWS_PATH_RE.test(u.pathname) || REVIEWS_WORDS_RE.test(words)) {
      u.hash = ''
      return u.toString()
    }
  }
  return null
}

/* ── Independent reviews ────────────────────────────────────────────────── */

/** Short Google links (Maps, and Google's share.google links): where they go needs one redirect read. */
export function isGoogleShortLink(url: string): boolean {
  return /^https?:\/\/(?:maps\.app\.goo\.gl|goo\.gl\/maps|share\.google)\//i.test(url)
}

/** The review site a link points to, or null. */
export function reviewSiteOf(url: string): string | null {
  let u: URL
  try {
    u = new URL(url.replace(/&amp;/g, '&'))
  } catch {
    return null
  }
  const host = u.hostname.toLowerCase().replace(/^www\./, '')
  const path = u.pathname
  const q = u.searchParams

  if (host === 'g.page' && path.length > 1) return 'Google'
  if (host === 'g.co' && path.startsWith('/kgs/')) return 'Google'
  if (host === 'search.google.com' && path.startsWith('/local/')) return 'Google'
  if (/^(?:maps\.)?google\.[a-z.]+$/.test(host)) {
    // A business listing, not a street address or an area map.
    if (q.get('cid') || q.get('ludocid') || q.get('placeid') || q.get('place_id')) return 'Google'
    if (/^place_id:/i.test(q.get('q') ?? '')) return 'Google'
    // A business's Google panel, where share.google links land: /search?kgmid=/g/…
    if (path === '/search' && q.get('kgmid')) return 'Google'
    const place = path.match(/\/maps\/place\/([^/]+)/)?.[1]
    if (place && !/^\d/.test(decodeURIComponent(place))) return 'Google'
    return null
  }
  if (host.endsWith('yelp.com') && path.startsWith('/biz/')) return 'Yelp'
  if (host === 'bbb.org' && /\/(?:profile|business-reviews)\//.test(path)) return 'BBB'
  if (host.endsWith('trustpilot.com') && path.startsWith('/review/')) return 'Trustpilot'
  if ((host === 'angi.com' || host === 'angieslist.com') && path.startsWith('/companylist/')) return 'Angi'
  if (host === 'homeadvisor.com' && path.startsWith('/rated.')) return 'HomeAdvisor'
  if (host.endsWith('houzz.com') && /^\/(?:pro|professionals)\//.test(path)) return 'Houzz'
  if (host === 'nextdoor.com' && /^\/pages?\//.test(path)) return 'Nextdoor'
  if (host === 'thumbtack.com' && path.includes('/service/')) return 'Thumbtack'
  if (host === 'healthgrades.com' && path.length > 1) return 'Healthgrades'
  if (host === 'zocdoc.com' && /^\/(?:doctor|dentist|practice)\//.test(path)) return 'Zocdoc'
  if (host === 'avvo.com' && path.startsWith('/attorneys/')) return 'Avvo'
  if (host === 'martindale.com' && /^\/(?:attorney|organization)\//.test(path)) return 'Martindale'
  if (/(?:^|\.)tripadvisor\.[a-z.]+$/.test(host) && /_Review-/.test(path)) return 'Tripadvisor'
  if (host === 'theknot.com' && path.startsWith('/marketplace/')) return 'The Knot'
  if (host === 'weddingwire.com' && /^\/(?:biz|reviews)\//.test(path)) return 'WeddingWire'
  if (host === 'opentable.com' && path.startsWith('/r/')) return 'OpenTable'
  if (host === 'clutch.co' && path.startsWith('/profile/')) return 'Clutch'
  if (host === 'g2.com' && path.startsWith('/products/')) return 'G2'
  return null
}

/** "Links to your Google listing and Yelp page." */
export function reviewSitesEvidence(names: string[]): string {
  const label = (n: string) => (n === 'Google' ? 'Google listing' : `${n} page`)
  const parts = names.map(label)
  const list = parts.length <= 1 ? parts.join('') : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`
  return `${names.length === 1 ? 'A link' : 'Links'} to your ${list}`
}

/* ── One read of a homepage ─────────────────────────────────────────────── */

export interface ReviewRead {
  /** What shows reviews on the homepage, or null. */
  shown: string | null
  /** The site's own reviews page, to read once when the homepage shows none. */
  reviewsPage: string | null
  /** Review sites linked from the homepage (links, map embeds, schema sameAs). */
  sites: string[]
  /** Google short links, to follow once when no review site was found. */
  shortLinks: string[]
}

export function readReviewSignals(html: string, pageUrl: string): ReviewRead {
  const urls = [
    ...[...html.matchAll(/\b(?:href|src)\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s"'>]+))/gi)].map((m) => m[1] ?? m[2] ?? m[3]),
    ...[...html.matchAll(/"sameAs"\s*:\s*(\[[^\]]*\]|"[^"]*")/g)].flatMap((m) =>
      [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1].replace(/\\\//g, '/')),
    ),
    // Any other address in the schema code, e.g. "hasMap": "https://maps.google.com/?cid=…" (thriveagency.com).
    ...(findJsonLdBlocks(html) ?? []).flatMap((b) =>
      [...b.matchAll(/"(https?:(?:\\?\/){2}[^"\s]+)"/g)].map((x) => x[1].replace(/\\\//g, '/')),
    ),
  ]
  const sites: string[] = []
  const shortLinks: string[] = []
  for (const u of urls) {
    const site = reviewSiteOf(u)
    if (site && !sites.includes(site)) sites.push(site)
    if (isGoogleShortLink(u) && !shortLinks.includes(u)) shortLinks.push(u)
  }
  const shown = reviewsOnPage(html, false)
  return { shown, reviewsPage: shown ? null : findReviewsPage(html, pageUrl), sites, shortLinks: shortLinks.slice(0, 2) }
}

/** The second read: the site's own reviews page. Evidence, or null. */
export function readReviewsPage(html: string, pageUrl: string): string | null {
  const found = reviewsOnPage(html, true)
  if (!found) return null
  let where = pageUrl
  try {
    where = new URL(pageUrl).pathname
  } catch {}
  return `On your reviews page (${where.slice(0, 50)}): ${found[0].toLowerCase()}${found.slice(1)}`
}
