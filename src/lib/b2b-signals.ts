/* ── B2B signals (profile=b2b only) ────────────────────────────────────────
 * What a B2B buyer looks for on a homepage before the first call, for Swift
 * Growth Marketing's homepage check (SGM's server calls /api/authority-check
 * with profile=b2b; Grill Me 2026-10-06). Reported beside the Authority Check
 * result, never scored into it: without profile=b2b nothing here runs, and
 * with it the Authority Check's own points are unchanged.
 *   Pricing      = a link to a pricing / plans page
 *   Demo path    = a "Book a demo" / "Start free trial" / "Talk to sales" link
 *   Review sites = links or badges for B2B review sites (G2, Capterra,
 *                  TrustRadius, Clutch, GetApp, Software Advice, GoodFirms)
 *   Client logos = a client-list heading ("Trusted by", "Our customers")
 *                  followed by 3+ images, or a logo strip/wall of 3+ images
 *   Case studies = a link to case studies / customer stories
 * Homepage only: these all live in the nav, hero or footer. No server-only imports.
 * ─────────────────────────────────────────────────────────────────────── */

import { anchors, extractText } from './proof-signals'

export interface B2bSignals {
  /** The pricing page found, or null. */
  pricing: string | null
  /** The demo / trial / sales link's words ("Book a demo"), or null. */
  demo: string | null
  /** B2B review sites linked or shown as a badge, by name. */
  reviewSites: string[]
  /** How many client logos the logo strip shows (0 = none found). */
  clientLogos: number
  /** The case studies / customer stories page found, or null. */
  caseStudies: string | null
}

// "/membership-pricing" counts; "/maintenance-plans" and "/payment-plans" don't (fixture test, 2026-10-06).
const PRICING_PATH_RE = /\/(?:(?:[\w-]*-)?(?:pricing|prices)|plans(?:-(?:and-)?pricing)?)(?:[\/.?#-]|$)/i
const PRICING_WORDS_RE = /^(?:see |view |our |compare )?(?:pricing|prices|plans(?: (?:and|&) pricing)?|pricing (?:and|&) plans)$/i

const DEMO_WORDS_RE =
  /\b(?:(?:book|request|get|schedule|see|watch|take|try) (?:a |the |your )?(?:free |live |product |personali[sz]ed )?(?:demo|tour)|(?:start|begin|get|try) (?:your |a |my )?(?:free |\d+[- ]day )+(?:trial|plan)|free trial|try (?:it |us )?(?:for )?free|(?:talk|speak) (?:to|with) (?:sales|an expert|our team)|contact sales|get a (?:quote|proposal)|book a (?:call|meeting|consultation|strategy call)|start a (?:project|conversation)|let(?:'|’)?s talk|schedule a (?:call|meeting|consultation)|request a (?:quote|proposal|consultation)|get a free (?:quote|audit|consultation|proposal|assessment))\b/i
const DEMO_PATH_RE = /\/(?:[\w-]*-)?(?:demo|request-demo|book-demo|free-trial|trial|signup|sign-up|contact-sales|talk-to-sales)(?:[\/.?#-]|$)/i
const MEETING_HOST_RE = /(?:^|\.)(?:calendly\.com|cal\.com|chilipiper\.com|savvycal\.com)$|^meetings\.hubspot\.com$/i

const REVIEW_SITES: [RegExp, string][] = [
  [/(?:^|\.)(?:g2\.com|g2crowd\.com)$/i, 'G2'],
  [/(?:^|\.)capterra\.[a-z.]+$/i, 'Capterra'],
  [/(?:^|\.)trustradius\.com$/i, 'TrustRadius'],
  [/(?:^|\.)clutch\.co$/i, 'Clutch'],
  [/(?:^|\.)getapp\.com$/i, 'GetApp'],
  [/(?:^|\.)softwareadvice\.com$/i, 'Software Advice'],
  [/(?:^|\.)goodfirms\.co$/i, 'GoodFirms'],
]

const CASE_PATH_RE = /\/(?:[\w-]*-)?(?:case-stud(?:y|ies)|customer-stories|customer-success|success-stories|customers)(?:[\/.?#-]|$)/i
const CASE_WORDS_RE = /^(?:see |view |read |explore |our )?(?:case stud(?:y|ies)|customer stories|success stories|customers)$/i

// A client-list heading or label: "Trusted by 2,000+ teams", "Our customers", "Brands we've worked with".
const LOGO_HEADING_RE =
  /\b(?:trusted by|used by|loved by|chosen by|relied on by|powering|our (?:clients|customers|partners)|(?:clients|customers|brands|companies|teams) (?:we(?:'|’)ve|who) (?:helped|worked with|served|trust us)|brands we(?:'|’)ve worked with|join (?:\d[\d,]*\+? )?(?:companies|teams|businesses))\b/i
// A logo strip by its class or id: "logo-cloud", "client-logos", "customer-logos", "logo-wall", "logos".
const LOGO_BLOCK_RE = /\b(?:class|id)\s*=\s*["']?[^"'>]*\b(?:logo[-_]?(?:cloud|wall|strip|grid|bar|carousel|marquee|list|row)|(?:client|customer|partner|brand|trust)[-_]?logos?|logos)\b/i
// How far past the heading the logos must start.
const LOGO_WINDOW = 6_000
const IMG_RE = /<(?:img|svg)\b/gi
// Very large windows of images are a gallery, not a logo strip; cap the count shown.
const MAX_LOGOS = 30

function pathAndHost(href: string, pageUrl: string): { host: string; path: string; url: string } | null {
  try {
    const u = new URL(href, pageUrl)
    if (!/^https?:$/.test(u.protocol)) return null
    return { host: u.hostname.replace(/^www\./, '').toLowerCase(), path: u.pathname, url: u.toString() }
  } catch {
    return null
  }
}

// Link words, without leftover character codes ("Schedule a Call &#x1f4c5;").
const words = (inner: string) =>
  extractText(inner).replace(/&#x?[0-9a-f]+;/gi, '').replace(/\s+/g, ' ').trim()

/** Images in the stretch of page code after `from`. */
function imagesAfter(html: string, from: number): number {
  return (html.slice(from, from + LOGO_WINDOW).match(IMG_RE) ?? []).length
}

/** The most logos any client-list heading or logo block is followed by. */
function countClientLogos(html: string): number {
  let best = 0
  // Headings and short labels (inside a tag's text, not attributes or scripts).
  for (const m of html.matchAll(/>([^<]{3,120})</g)) {
    if (!LOGO_HEADING_RE.test(m[1])) continue
    best = Math.max(best, imagesAfter(html, m.index! + m[0].length))
  }
  for (const m of html.matchAll(new RegExp(LOGO_BLOCK_RE.source, 'gi'))) {
    best = Math.max(best, imagesAfter(html, m.index!))
  }
  return best >= 3 ? Math.min(best, MAX_LOGOS) : 0
}

export function readB2bSignals(html: string, pageUrl: string): B2bSignals {
  const pageHost = pathAndHost(pageUrl, pageUrl)?.host ?? ''
  let pricing: string | null = null
  let demo: string | null = null
  let caseStudies: string | null = null
  const reviewSites = new Set<string>()

  for (const a of anchors(html)) {
    const at = pathAndHost(a.href, pageUrl)
    if (!at) continue
    const text = words(a.inner)
    const own = at.host === pageHost || at.host.endsWith(`.${pageHost}`)
    // A "Pricing" menu toggle that links to "#" or the homepage itself is not a pricing page.
    const goesSomewhere = !own || at.path.replace(/\/+$/, '') !== '' || /^#.+/.test(new URL(at.url).hash)

    for (const [re, name] of REVIEW_SITES) if (re.test(at.host)) reviewSites.add(name)

    if (!pricing && own && goesSomewhere && (PRICING_PATH_RE.test(at.path) || PRICING_WORDS_RE.test(text))) pricing = at.url
    if (!caseStudies && own && goesSomewhere && (CASE_PATH_RE.test(at.path) || CASE_WORDS_RE.test(text))) caseStudies = at.url
    if (!demo) {
      if (text.length <= 60 && DEMO_WORDS_RE.test(text)) demo = text
      else if ((own && DEMO_PATH_RE.test(at.path)) || MEETING_HOST_RE.test(at.host)) demo = text || 'Demo link'
    }
  }

  // Review-site badges are often images only (G2's badges are served from g2.com / g2crowd.com).
  for (const m of html.matchAll(/<img\b[^>]*\bsrc\s*=\s*["']?([^"'\s>]+)/gi)) {
    const at = pathAndHost(m[1], pageUrl)
    if (!at) continue
    for (const [re, name] of REVIEW_SITES) if (re.test(at.host)) reviewSites.add(name)
  }

  return { pricing, demo, reviewSites: [...reviewSites], clientLogos: countClientLogos(html), caseStudies }
}
