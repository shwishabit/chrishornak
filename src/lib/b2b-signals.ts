/* ── B2B signals (profile=b2b only) ────────────────────────────────────────
 * What a B2B buyer looks for on a homepage before the first call, for Swift
 * Growth Marketing's homepage check (SGM's server calls /api/authority-check
 * with profile=b2b; Grill Me 2026-10-06). Reported beside the Authority Check
 * result, never scored into it: without profile=b2b nothing here runs, and
 * with it the Authority Check's own points are unchanged.
 *   Pricing      = a link to a pricing / plans page
 *   Demo path    = a "Book a demo" / "Start free trial" / "Talk to sales" link
 *   Contact      = a plain contact page link ("Contact us"): a softer next step
 *   Review sites = links or badges for B2B review sites (G2, Capterra,
 *                  TrustRadius, Clutch, GetApp, Software Advice, GoodFirms)
 *   Client logos = a client-list heading ("Trusted by", "Our customers")
 *                  followed by 3+ images, or a logo strip/wall of 3+ images
 *   Case studies = a link to case studies / customer stories
 *   First screen = the headline, a short line above it and the text after it: who it's for, a reason to pick them
 *   Shop         = a store's own ask: "Shop now", "Add to cart", a /shop or /collections link
 *   Site type    = service (the default), ecommerce or saas, from 2+ signals in the code
 *                  (Chris, 2026-10-16: an online store failed SGM's next step)
 * Homepage only: these all live in the nav, hero or footer. No server-only imports.
 * ─────────────────────────────────────────────────────────────────────── */

import { anchors, extractText } from './proof-signals'

export interface B2bSignals {
  /** The pricing page found, or null. */
  pricing: string | null
  /** The demo / trial / sales link's words ("Book a demo"), or null. */
  demo: string | null
  /** The contact page found ("Contact us" / /contact), or null. SGM scores it below a direct ask (Chris, 2026-10-07). */
  contact: string | null
  /** B2B review sites linked or shown as a badge, by name. */
  reviewSites: string[]
  /** How many client logos the logo strip shows (0 = none found). */
  clientLogos: number
  /** The case studies / customer stories page found, or null. */
  caseStudies: string | null
  /** The homepage's first screen: headline, subline, who it's for, why pick them. */
  firstScreen: FirstScreen
  /** A store's own ask ("Shop now", "Add to cart"), or null. SGM counts it as the direct ask for an online store. */
  shop: string | null
  /** What kind of site this reads as; service unless 2+ store or software signals say otherwise. */
  siteType: SiteType
  /** Why, in plain words ("Built on Shopify", "Prices on the page"); empty for service. */
  typeSignals: string[]
}

export type SiteType = 'service' | 'ecommerce' | 'saas'

// "/membership-pricing" counts; "/maintenance-plans" and "/payment-plans" don't (fixture test, 2026-10-06).
const PRICING_PATH_RE = /\/(?:(?:[\w-]*-)?(?:pricing|prices)|plans(?:-(?:and-)?pricing)?)(?:[\/.?#-]|$)/i
const PRICING_WORDS_RE = /^(?:see |view |our |compare )?(?:pricing|prices|plans(?: (?:and|&) pricing)?|pricing (?:and|&) plans)$/i

const DEMO_WORDS_RE =
  /\b(?:(?:book|request|get|schedule|see|watch|take|try) (?:a |the |your )?(?:free |live |product |personali[sz]ed )?(?:demo|tour)|(?:start|begin|get|try) (?:your |a |my )?(?:free |\d+[- ]day )+(?:trial|plan)|free trial|try (?:it |us )?(?:for )?free|(?:talk|speak|chat) (?:to|with) (?:a |an |our |one of our )?(?:sales|team|experts?|specialists?|strategists?|consultants?|advisors?|advisers?)|contact sales|get a (?:quote|proposal)|book a (?:call|meeting|consultation|strategy call)|start a (?:project|conversation)|let(?:'|’)?s talk|schedule a (?:call|meeting|consultation)|request a (?:quote|proposal|consultation)|get a free (?:quote|audit|consultation|proposal|assessment)|get started|start here|start now)\b/i
// "Start here" / "Get started" added 2026-10-07 (Chris, t1dtips.com's "Just Diagnosed? Start Here." is its next step).
// A service or local business's ask (2026-10-16: SGM's own "Tell us about your project" scored as a plain contact
// link while "Start a project" to the same page scored as a direct ask). Estimates, appointments, call-backs and
// "Call now" (a tel: link with call words; a bare phone number stays a contact detail, not an ask).
const SERVICE_ASK_RE =
  /\b(?:tell us about your (?:project|business|needs|goals)|(?:get|request) (?:a |your |an )?(?:free )?(?:quote|estimate|proposal|consultation|call ?back|call|appointment|assessment|inspection)|free (?:estimate|quote|consultation)|(?:book|schedule|request|make) (?:an |your )?(?:appointment|visit|service|inspection)|book (?:now|online|today)|schedule (?:now|online|today)|call (?:now|us(?: now| today)?|today))\b/i
const DEMO_PATH_RE = /\/(?:[\w-]*-)?(?:demo|request-demo|book-demo|free-trial|trial|signup|sign-up|contact-sales|talk-to-sales)(?:[\/.?#-]|$)/i
// "/contact", "/contact-us", "/get-in-touch"; not "/contact-sales" (that is a demo path, above).
const CONTACT_PATH_RE = /\/(?:contact(?:-us)?|get-in-touch)(?:[\/.?#]|$)/i
const CONTACT_WORDS_RE = /^(?:contact(?: us)?|get in touch|reach out)$/i
// A store's ask. Words: "Shop now", "Shop all", "Shop the collection", "Add to cart", "Buy now", "Order online".
const SHOP_WORDS_RE =
  /^(?:shop|buy|order)(?: (?:now|all|online|here|today|the (?:collection|range|sale)|best ?sellers|new arrivals|sale|(?:all|our) [\w-]+))?$|\b(?:add to (?:cart|bag|basket)|buy (?:it )?now|shop now|order (?:now|online|today)|shop (?:all|online|the collection|best ?sellers|new arrivals|the sale))\b/i
const SHOP_PATH_RE = /\/(?:shop|store|collections?|products?)(?:[\/.?#-]|$)/i
const CART_PATH_RE = /\/(?:cart|checkout|basket|bag)(?:[\/.?#]|$)/i
const LOGIN_WORDS_RE = /^(?:log ?in|sign ?in|login|member login|customer login)$/i
const SIGNUP_WORDS_RE = /^(?:sign ?up(?: free| for free)?|create (?:an |your )?(?:free )?account|get started(?: free| for free)?|start (?:for )?free|try (?:it )?free|start (?:your |a )?free trial)$/i
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

/* ── First screen: is it clear who it's for and why to pick you? ──────────
 * Free rules on the homepage's headline and the text right after it (the hero),
 * for SGM's "Is it fast and clear?" step (Chris, 2026-10-07: no AI reads, ever).
 * They look for signals, not meaning: a named audience and a concrete reason. */

// "for B2B teams", "for law firms", "to industrial and commercial businesses", "serving manufacturers":
// a lead word + up to three words ("and" allowed) + an audience noun. Widened 2026-10-07 (Chris:
// wheelingrubber.com's "to industrial and commercial businesses" was missed). "Trusted by …" is
// proof, not an audience, so it stays out.
const AUDIENCE_NOUNS =
  'teams|companies|businesses|brands|firms|founders|owners|leaders|marketers|agencies|caregivers|moms|dads|start-?ups|practices|clinics|hospitals|schools|colleges|universities|non-?profits|charities|families|homeowners|home owners|parents|kids|children|seniors|patients|pets|contractors|retailers|manufacturers|distributors|restaurants|lawyers|attorneys|dentists|doctors|physicians|accountants|investors|developers|engineers|creators|professionals|organi[sz]ations|enterprises|smbs|cmos|ceos|executives|buyers|landlords|property managers|builders|shops|stores|hotels|venues|churches|governments|municipalities|communities|athletes|students|employers|employees|nurses|therapists|realtors|agents|brokers|insurers|banks|lenders|farms|wineries|breweries'
const AUDIENCE_RE = new RegExp(
  // "to our clients" / "to our patients" talk about existing customers, not who it's for.
  `\\b(?:for|to|serv(?:e|es|ed|ing)|help(?:s|ed|ing)?|work(?:s|ing)? with|partner(?:s|ing)? with) (?!(?:our|us)\\b)(?:(?:your |the )?[a-z0-9&-]+,? (?:and |& )?){0,3}(?:${AUDIENCE_NOUNS})\\b`,
  'i',
)
// "B2B", "SaaS", "small business" name the audience on their own; so does "parent-to-parent help"
// (Chris 2026-10-07, t1dtips.com: it's for parents) and "founder-to-founder", "business-to-business".
const AUDIENCE_WORD_RE =
  /\b(?:b2b|b2c|saas|small[- ]business(?:es)?|mid-?market|enterprise (?:teams|companies|brands)|(parent|founder|owner|business|teacher|nurse|doctor|caregiver|veteran|mom|dad|family|patient|leader|marketer|seller|buyer|creator|peer)-to-\1)\b/i
// A concrete reason: a count, a date, a credential or a promise ("20 years", "since 2006", "Google Partner", "guaranteed").
// "The only … in/to" keeps up to 6 words after, to the sentence's end, so the quote is whole
// (bareskin-laser.com: "The only aesthetic practice in southwestern PA to carry NOON");
// "the first ones to change course" is a habit, not a claim (grazemarketing.com, 2026-10-08), so "one(s)" is skipped.
const REASON_RE =
  /\b(?:\d[\d,.]*\+?\s*(?:years?|yrs|clients|customers|companies|businesses|brands|projects|reviews|locations|countries|employees|users|members|homes|families|patients|students|installs|downloads)\b|(?:since|est\.?|established) (?:in )?(?:18|19|20)\d\d\b|award[- ]winning|award|certified|accredited|licensed (?:and|&) insured|guarantee[ds]?\b|top \d+ ?%|#1\b|no\. ?1\b|rated \d|[45](?:\.\d)? ?stars?\b|five[- ]star|the (?:only|first) (?!ones?\b)(?:[\w-]+ ){0,3}(?:to|in) (?!the\b)[\w'’&-]+(?: (?!and\b|but\b|or\b)[\w'’&-]+){0,5}|premier partner|(?:google|hubspot|shopify|meta|microsoft|aws|salesforce) (?:premier )?partner|family[- ]owned|veteran[- ]owned|woman[- ]owned|patent(?:ed)?\b|\d+ ?% (?:more|less|faster|fewer|higher|lower|increase|growth|savings?))/i

export interface FirstScreen {
  /** The page's main headline (first <h1>), or null. */
  headline: string | null
  /** The first sentence after it, up to 180 characters, or null. */
  subline: string | null
  /** The words that name who it's for ("for B2B teams"), or null. */
  audience: string | null
  /** The words that give a reason to pick them ("20 years"), or null. */
  reason: string | null
  /** Not in the first screen but further down the page (Chris 2026-10-07, amgindustries.com's
   *  "Why Choose AMG Industries?" section), so the report can say where they are. */
  later: { audience: string | null; reasons: string[] }
}

/** How much text after the headline counts as the first screen (the hero's subheading, lines and buttons). */
const FIRST_SCREEN_CHARS = 600

/** How far back from the h1 the hero's own start is looked for. */
const ABOVE_WINDOW = 4_000
/** A line above the headline longer than this is not an eyebrow (it is the nav or a banner). */
const ABOVE_MAX_CHARS = 160

/** The hero's short line above the headline ("Brand studio since 2007"): text from the hero's
 *  start (the last <section>, <main> or </header> before the h1) to the h1. Empty when there is no
 *  such start nearby or the text is too long to be an eyebrow (2026-10-16: SGM's own "since 2007"
 *  sat above its h1 and was missed). */
function textAboveHeadline(html: string, h1At: number): string {
  const from = Math.max(0, h1At - ABOVE_WINDOW)
  const before = html.slice(from, h1At)
  let start = -1
  for (const m of before.matchAll(/<section\b|<main\b|<\/header>/gi)) start = m.index!
  if (start < 0) return ''
  const text = extractText(before.slice(start)).replace(/\s+/g, ' ').trim()
  return text.length <= ABOVE_MAX_CHARS ? text : ''
}

export function readFirstScreen(html: string): FirstScreen {
  const h1 = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)
  const headline = h1 ? words(h1[1]).slice(0, 200) || null : null
  const after = h1 ? extractText(html.slice(h1.index! + h1[0].length, h1.index! + h1[0].length + 20_000)) : ''
  const near = after.slice(0, FIRST_SCREEN_CHARS)
  const subline = near.match(/^(.{20,180}?[.!?])(?:\s|$)/)?.[1] ?? (near ? near.slice(0, 180).trim() || null : null)
  // No h1 at all: fall back to the page title, which is still what a buyer reads first in the tab and the search result.
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]
  const above = h1 ? textAboveHeadline(html, h1.index!) : ''
  const screen = h1 ? `${above} ${headline} ${near}` : `${title ? words(title) : ''} ${extractText(html).slice(0, FIRST_SCREEN_CHARS)}`
  const audience = screen.match(AUDIENCE_RE)?.[0] ?? screen.match(AUDIENCE_WORD_RE)?.[0] ?? null
  const reason = screen.match(REASON_RE)?.[0] ?? null
  // The rest of the page, for what the first screen is missing.
  const rest = h1 ? after.slice(FIRST_SCREEN_CHARS) : extractText(html).slice(FIRST_SCREEN_CHARS)
  const laterAudience = audience ? null : (rest.match(AUDIENCE_RE)?.[0] ?? rest.match(AUDIENCE_WORD_RE)?.[0] ?? null)
  const reasons: string[] = []
  if (!reason) {
    for (const m of rest.matchAll(new RegExp(REASON_RE.source, 'gi'))) {
      // Keep the word just before it only when it's part of the claim ("ISO-9001 Certified", "Over 120 Years").
      const before = rest.slice(Math.max(0, m.index! - 24), m.index!).match(/([A-Za-z0-9][\w-]*)\s*$/)?.[1]
      const named = before && (/\d/.test(before) || /^(over|fortune|top)$/i.test(before))
      const phrase = (named ? `${before} ${m[0]}` : m[0]).trim()
      if (!reasons.some((r) => r.toLowerCase() === phrase.toLowerCase())) reasons.push(phrase)
      if (reasons.length === 2) break
    }
  }
  return {
    headline,
    subline,
    audience: audience?.trim() ?? null,
    reason: reason?.trim() ?? null,
    later: { audience: laterAudience?.trim() ?? null, reasons },
  }
}

/* ── Site type: rules on the homepage's code, never AI. Two signals or more decide it; with
 * fewer it stays service (the check's B2B default). SGM lets the visitor change it. */
function siteTypeOf(
  html: string,
  f: { cart: boolean; addToCart: boolean; login: boolean; signup: boolean; appLink: boolean; pricing: boolean },
): { siteType: SiteType; typeSignals: string[] } {
  const store: string[] = []
  const soft: string[] = []
  if (/"@type"\s*:\s*"(?:Product|ProductGroup|Offer|AggregateOffer)"/.test(html)) store.push('Product details in the code (schema.org Product)')
  if (/cdn\.shopify\.com|Shopify\.theme|\.myshopify\.com/i.test(html)) store.push('Built on Shopify')
  else if (/\bwoocommerce\b/i.test(html)) store.push('Built on WooCommerce')
  else if (/cdn\d*\.bigcommerce\.com/i.test(html)) store.push('Built on BigCommerce')
  if (f.cart) store.push('A cart or checkout link')
  if (f.addToCart || /\badd[-_ ]to[-_ ](?:cart|bag|basket)\b|action\s*=\s*["'][^"']*\/cart\/add/i.test(html)) store.push('Add-to-cart buttons')
  const text = extractText(html)
  if ((text.match(/(?:[$£€]\s?\d{1,5}[.,]\d{2}|\d{1,5}[.,]\d{2}\s?(?:USD|EUR|GBP|€))(?!\d)/g) ?? []).length >= 3) store.push('Prices on the page')
  if (/"@type"\s*:\s*"(?:SoftwareApplication|WebApplication|MobileApplication)"/.test(html)) soft.push('App details in the code (schema.org SoftwareApplication)')
  if (f.login && f.signup) soft.push('Log in and sign-up links')
  if (f.appLink) soft.push('Links to the app')
  if (f.pricing && /\b(?:per (?:month|user|seat)|\/\s?(?:mo|month|user)\b|billed (?:monthly|annually|yearly))/i.test(text)) soft.push('Monthly plans')
  if (store.length >= 2 && store.length >= soft.length) return { siteType: 'ecommerce', typeSignals: store }
  if (soft.length >= 2) return { siteType: 'saas', typeSignals: soft }
  return { siteType: 'service', typeSignals: [] }
}

export function readB2bSignals(html: string, pageUrl: string): B2bSignals {
  const pageHost = pathAndHost(pageUrl, pageUrl)?.host ?? ''
  let pricing: string | null = null
  let demo: string | null = null
  let contact: string | null = null
  let caseStudies: string | null = null
  let shop: string | null = null
  const seen = { cart: false, addToCart: false, login: false, signup: false, appLink: false }
  const reviewSites = new Set<string>()

  for (const a of anchors(html)) {
    // "Call now" is a real next step for a service business; pathAndHost drops tel: links, so read them first.
    if (!demo && /^\s*tel:/i.test(a.href)) {
      const t = words(a.inner)
      if (t.length <= 60 && SERVICE_ASK_RE.test(t)) demo = t
    }
    const at = pathAndHost(a.href, pageUrl)
    if (!at) continue
    const text = words(a.inner)
    const own = at.host === pageHost || at.host.endsWith(`.${pageHost}`)
    // A "Pricing" menu toggle that links to "#" or the homepage itself is not a pricing page.
    const goesSomewhere = !own || at.path.replace(/\/+$/, '') !== '' || /^#.+/.test(new URL(at.url).hash)

    for (const [re, name] of REVIEW_SITES) if (re.test(at.host)) reviewSites.add(name)

    if (!pricing && own && goesSomewhere && (PRICING_PATH_RE.test(at.path) || PRICING_WORDS_RE.test(text))) pricing = at.url
    if (!caseStudies && own && goesSomewhere && (CASE_PATH_RE.test(at.path) || CASE_WORDS_RE.test(text))) caseStudies = at.url
    if (!contact && own && goesSomewhere && (CONTACT_PATH_RE.test(at.path) || CONTACT_WORDS_RE.test(text))) contact = at.url
    if (!demo) {
      if (text.length <= 60 && (DEMO_WORDS_RE.test(text) || SERVICE_ASK_RE.test(text))) demo = text
      else if ((own && DEMO_PATH_RE.test(at.path)) || MEETING_HOST_RE.test(at.host)) demo = text || 'Demo link'
    }
    if (!shop && text && text.length <= 40 && (SHOP_WORDS_RE.test(text) || (own && goesSomewhere && SHOP_PATH_RE.test(at.path)))) shop = text
    if (own && CART_PATH_RE.test(at.path)) seen.cart = true
    if (/^add to (?:cart|bag|basket)$/i.test(text)) seen.addToCart = true
    if (LOGIN_WORDS_RE.test(text)) seen.login = true
    if (SIGNUP_WORDS_RE.test(text) || (own && /\/(?:signup|sign-up|register)(?:[\/.?#]|$)/i.test(at.path))) seen.signup = true
    if (at.host !== pageHost && /^(?:app|dashboard|portal|console)\./.test(at.host) && at.host.endsWith(`.${pageHost}`)) seen.appLink = true
  }

  // Review-site badges are often images only (G2's badges are served from g2.com / g2crowd.com).
  for (const m of html.matchAll(/<img\b[^>]*\bsrc\s*=\s*["']?([^"'\s>]+)/gi)) {
    const at = pathAndHost(m[1], pageUrl)
    if (!at) continue
    for (const [re, name] of REVIEW_SITES) if (re.test(at.host)) reviewSites.add(name)
  }

  const type = siteTypeOf(html, { ...seen, pricing: !!pricing })
  return { pricing, demo, contact, reviewSites: [...reviewSites], clientLogos: countClientLogos(html), caseStudies, firstScreen: readFirstScreen(html), shop, ...type }
}
