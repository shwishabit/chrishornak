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

import { anchors, extractText, findJsonLdBlocks, topNodes, typesOf } from './proof-signals'

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
  /** Why, in plain words ("Built on Shopify", "Prices on the page"); empty for service. When
   *  siteType is unclear, the store or software signals found (siteType stays service). */
  typeSignals: string[]
  /** Reads the engine could not settle (2026-11-19): 'ask' = only weak hints of a direct ask
   *  (see askGuess), 'siteType' = some store / software signals but not enough (see typeGuess). */
  unclear: ('ask' | 'siteType')[]
  /** With unclear 'ask': the best guess's words ("Apply now"); null otherwise. */
  askGuess: string | null
  /** With unclear 'siteType': the type the signals lean to; null otherwise. */
  typeGuess: Exclude<SiteType, 'service'> | null
  /** A nonprofit's own ask ("Donate", "Volunteer", "Get involved"), or null. SGM counts it as the direct ask for a nonprofit (2026-11-19). */
  give: string | null
  /** The nonprofit equivalents of the proof checks, read on every site so SGM can score a visitor's
   *  "Nonprofit or public group" pick without a new read. proof = check ids they fill; scores = the
   *  E-E-A-T with them added (set by the API route, which has the authority read). */
  nonprofit: NonprofitProof
}

export type SiteType = 'service' | 'ecommerce' | 'saas' | 'nonprofit'

export interface NonprofitProof {
  /** Proof check ids the nonprofit signs fill: work (impact / annual report), track (impact numbers),
   *  reviews (funders, partners or stories), reviewSites (Candid, Charity Navigator…), credentials (grants, 501(c)(3)). */
  proof: ('work' | 'track' | 'reviews' | 'reviewSites' | 'credentials')[]
  /** The phrase behind each, in the Authority Check's evidence shape ("Found “…”: …"). */
  evidence: Partial<Record<NonprofitProof['proof'][number], string>>
  /** Impact numbers found: 2+ is a strong track record (10 points), 1 is 6. */
  trackLevel: 0 | 1 | 2
  /** Charity-rating sites linked (counts like review sites). */
  ratingSites: string[]
  /** E-E-A-T with these added; null until the route sets it. */
  scores?: unknown
}

// "/membership-pricing" counts; "/maintenance-plans" and "/payment-plans" don't (fixture test, 2026-10-06).
const PRICING_PATH_RE = /\/(?:(?:[\w-]*-)?(?:pricing|prices)|plans(?:-(?:and-)?pricing)?)(?:[\/.?#-]|$)/i
const PRICING_WORDS_RE = /^(?:see |view |our |compare )?(?:pricing|prices|plans(?: (?:and|&) pricing)?|pricing (?:and|&) plans)$/i

const DEMO_WORDS_RE =
  /\b(?:(?:book|request|get|schedule|see|watch|take|try) (?:a |the |your )?(?:free |live |product |personali[sz]ed )?(?:demo|tour)|(?:start|begin|get|try) (?:your |a |my )?(?:free |\d+[- ]day )+(?:trial|plan)|free trial|try (?:it |us )?(?:for )?free|(?:talk|speak|chat) (?:to|with) (?:a |an |our |one of our )?(?:sales|team|experts?|specialists?|strategists?|consultants?|advisors?|advisers?)|contact sales|get a (?:quote|proposal)|book a (?:call|meeting|consultation|strategy call)|start a (?:project|conversation)|let(?:'|’)?s talk|schedule a (?:call|meeting|consultation)|request a (?:quote|proposal|consultation)|get a free (?:quote|audit|consultation|proposal|assessment)|get started|start here|start now|(?:claim|get|grab|request|start|try) (?:a |an |your |my )?(?:first )?free (?!shipping|returns|delivery)[a-z-]+|get (?:your |my )?first [a-z-]+ free)\b/i
// "Start here" / "Get started" added 2026-10-07 (Chris, t1dtips.com's "Just Diagnosed? Start Here." is its next step).
// A service or local business's ask (2026-10-16: SGM's own "Tell us about your project" scored as a plain contact
// link while "Start a project" to the same page scored as a direct ask). Estimates, appointments, call-backs and
// "Call now" (a tel: link with call words; a bare phone number stays a contact detail, not an ask).
// "Order now" / "Order online" / "Place a special order" (2026-11-19, engine round 3): ordering is
// buying, for a bakery or a restaurant too, not only a store (a store's shop ask is read apart).
const SERVICE_ASK_RE =
  /\b(?:tell us about your (?:project|business|needs|goals)|order (?:now|online|today|ahead)|place (?:an? |your )?(?:special |custom )?order|(?:get|request) (?:a |your |an )?(?:free )?(?:quote|estimate|proposal|consultation|call ?back|call|appointment|assessment|inspection)|free (?:[a-z-]+ )?(?:estimate|quote|consultation|review|audit|assessment|evaluation|analysis)|(?:book|schedule|request|make) (?:an |your )?(?:appointment|visit|service|inspection)|book (?:now|online|today)|schedule (?:now|online|today)|call (?:now|us(?: now| today)?|today))\b/i
// Broad ask words (2026-11-18, Chris: "look for certain words broadly rather than exact phrasing"): a short
// button that starts with an action and names something on offer counts, however it's worded ("Claim my
// free post", "Book your strategy session", "Plan your project"). Lead magnets and shop perks stay out.
const ASK_VERB_RE = /^(?:let(?:'|’)?s |please )?(?:book|schedule|request|get|claim|grab|start|try|apply|reserve|enrol{1,2}|hire|plan|arrange|unlock)\b/i
const ASK_OFFER_RE = /\b(?:free|calls?|demos?|quotes?|consult(?:ation)?s?|proposals?|estimates?|trials?|samples?|audits?|assessments?|reviews?|appointments?|meetings?|sessions?|projects?|posts?|tours?|walkthroughs?|strateg(?:y|ies)|started|pricing|spots?|seats?)\b/i
const ASK_TALK_RE = /^(?:let(?:'|’)?s (?:talk|chat|connect)|(?:talk|speak|chat) (?:to|with) )/i
const NOT_AN_ASK_RE = /\b(?:shipping|returns|delivery|guides?|e-?books?|checklists?|templates?|tools?|newsletters?|webinars?|courses?|resources?|apps?|downloads?|directions|updates)\b/i
export const broadAsk = (t: string): boolean =>
  t.length <= 50 && t.split(/\s+/).length <= 7 && !NOT_AN_ASK_RE.test(t) && (ASK_TALK_RE.test(t) || (ASK_VERB_RE.test(t) && ASK_OFFER_RE.test(t)))
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
  // No sentence end in reach: cut at the last whole word, never mid-word ("economi…", centralinaedd.org 2026-11-19).
  const subline = near.match(/^(.{20,180}?[.!?])(?:\s|$)/)?.[1] ?? (near ? (near.length > 180 ? near.slice(0, 181).replace(/\s+\S*$/, '') : near).trim() || null : null)
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

/* ── Site type: rules on the homepage's code, never AI. SGM lets the visitor change it.
 * Weighted signals (2026-11-19, research #8, after Wappalyzer's implies / excludes / requires):
 * a store REQUIRES one strong signal of selling on the page (product schema, prices, a real
 * add-to-cart button), weak ones add up (a platform, a cart link or icon, a shop link), and a
 * service business's own ask anywhere on the page (book, quote, consultation) counts AGAINST it:
 * store points minus 2 must reach 4. Shop code or a cart
 * icon alone is a theme, not a store (group8a.com: an agency on Shopify; black13tattoo.com: a
 * merch cart). Too little to decide = unclear: siteType stays service, typeGuess says the lean.
 * Software keeps its old rule (2+ signals): no software site is labelled yet to tune it on. */
const STORE_STRONG = 3
const STORE_WIN = 4
const SERVICE_ASK_WEIGHT = 2
// The asks a store or an app makes too; any other direct ask is a service business's.
const NOT_SERVICE_ASK_RE = /\b(?:demo|trial|sign ?up|free plan|start (?:for )?free|try (?:it |us )?(?:for )?free|get started|shop|buy|order|cart)\b/i

function siteTypeOf(
  html: string,
  f: { cart: boolean; addToCart: boolean; login: boolean; signup: boolean; appLink: boolean; pricing: boolean; shop: boolean; serviceAsk: boolean; nonprofit: { signals: [string, number][]; onPage: boolean } },
): { siteType: SiteType; typeSignals: string[]; typeGuess: Exclude<SiteType, 'service'> | null } {
  const store: [string, number][] = []
  const soft: string[] = []
  if (/"@type"\s*:\s*"(?:Product|ProductGroup|Offer|AggregateOffer)"/.test(html)) store.push(['Product details in the code (schema.org Product)', STORE_STRONG])
  // Named platforms, as a bonus label when we recognize one — never the only way in.
  // There will always be another cart system we haven't named (Squarespace Commerce,
  // Wix, Big Cartel, Faire, Gumroad, Square, Ecwid, a custom build...), so the signals
  // below this read what the PAGE DOES (a cart control, a product grid, prices),
  // not which platform built it (Chris, 2026-10-16: platform-only detection is too narrow).
  if (/cdn\.shopify\.com|Shopify\.theme|\.myshopify\.com/i.test(html)) store.push(['Built on Shopify', 1])
  else if (/\bwoocommerce\b/i.test(html)) store.push(['Built on WooCommerce', 1])
  else if (/cdn\d*\.bigcommerce\.com/i.test(html)) store.push(['Built on BigCommerce', 1])
  else if (/etsystatic\.com|Etsy\.Context|\bEtsyApp\b/i.test(html)) store.push(['Built on Etsy', 1])
  if (f.cart) store.push(['A cart or checkout link', 1])
  // A cart/checkout/bag CONTROL by its class, id or data-attribute — platform-agnostic,
  // so a JS-triggered cart (href="#", no real /cart URL — e.g. Etsy's "cart-trigger") still
  // counts. Scoped to attribute values, not free text, to skip "cartoon"-style false hits.
  const hasCartControl = /\b(?:class|id|data-module|data-action|data-testid|aria-label)\s*=\s*["'][^"']*\b(?:cart|checkout|mini-cart|shopping-bag|basket)\b[^"']*["']/i.test(html)
  if (hasCartControl) store.push(['A cart or checkout control', 1])
  // A real add-to-cart button (link words, a button, or a cart form) is strong; the words only in the
  // theme's code ("Item added to your cart" notices, script strings) are weak.
  if (f.addToCart || /<button\b[^<>]*>\s*(?:<[^<>]+>\s*){0,3}add to (?:cart|bag|basket)\b|action\s*=\s*["'][^"']*\/cart\/add/i.test(html)) store.push(['Add-to-cart buttons', STORE_STRONG])
  else if (/\badd[-_ ]to[-_ ](?:cart|bag|basket)\b/i.test(html)) store.push(['Add-to-cart code', 1])
  const text = extractText(html)
  if ((text.match(/(?:[$£€]\s?\d{1,5}[.,]\d{2}|\d{1,5}[.,]\d{2}\s?(?:USD|EUR|GBP|€))(?!\d)/g) ?? []).length >= 3) store.push(['Prices on the page', STORE_STRONG])
  if (f.shop) store.push(['A shop link', 1])
  if (/"@type"\s*:\s*"(?:SoftwareApplication|WebApplication|MobileApplication)"/.test(html)) soft.push('App details in the code (schema.org SoftwareApplication)')
  if (f.login && f.signup) soft.push('Log in and sign-up links')
  if (f.appLink) soft.push('Links to the app')
  if (f.pricing && /\b(?:per (?:month|user|seat)|\/\s?(?:mo|month|user)\b|billed (?:monthly|annually|yearly))/i.test(text)) soft.push('Monthly plans')

  const storeScore = store.reduce((t, [, w]) => t + w, 0)
  const strong = store.some(([, w]) => w >= STORE_STRONG)
  const serviceScore = f.serviceAsk ? SERVICE_ASK_WEIGHT : 0
  const storeSignals = store.map(([s]) => s)
  // The win is net of the service ask: 4 store points and a booking ask is not enough (monexglobal.com).
  const storeWins = strong && storeScore - serviceScore >= STORE_WIN
  // A nonprofit or public group first: one that also sells merch or offers services is still one (2026-11-19).
  // Words alone never decide it: an agency that writes "we serve 501(c)(3) organizations" and "our mission"
  // is not a nonprofit. One sign must be the page's own build: a Donate link, a .org / .gov address, a Board page…
  const np = f.nonprofit.signals
  const npScore = np.reduce((t, [, w]) => t + w, 0)
  const npSignals = np.map(([s]) => s)
  if (f.nonprofit.onPage && np.length >= 2 && np.some(([, w]) => w >= NP_STRONG) && npScore >= NP_WIN) return { siteType: 'nonprofit', typeSignals: npSignals, typeGuess: null }
  const npLean = f.nonprofit.onPage && np.length >= 2 && npScore >= NP_UNCLEAR && !storeWins && soft.length < 2
  // Software: 2+ signals, as before; a store that wins and has more signals stays a store.
  if (storeWins && store.length >= soft.length) return { siteType: 'ecommerce', typeSignals: storeSignals, typeGuess: null }
  if (soft.length >= 2) return { siteType: 'saas', typeSignals: soft, typeGuess: null }
  if (storeWins) return { siteType: 'ecommerce', typeSignals: storeSignals, typeGuess: null }
  // Something store-like but not enough: a strong signal that lost on points, or many weak ones and no service ask.
  const storeLean = storeScore >= STORE_WIN && (strong || !serviceScore)
  if (npLean && (!storeLean || npScore >= storeScore)) return { siteType: 'service', typeSignals: npSignals, typeGuess: 'nonprofit' }
  if (storeLean) return { siteType: 'service', typeSignals: storeSignals, typeGuess: 'ecommerce' }
  return { siteType: 'service', typeSignals: [], typeGuess: null }
}

/* ── Nonprofit or public group (2026-11-19, Chris: centralinaedd.org was graded as a business) ──
 * Rules on the homepage, never AI, weighted like the store read. Strong (3): nonprofit or government
 * schema, "501(c)(3)" / "tax-deductible", a Donate / Give link or a donation tool (Donorbox, Givebutter…),
 * a charity-rating link (Candid, Charity Navigator), a .gov address. Weak (1): a .org address, a Board /
 * governance page, an annual report, a volunteer link, "our mission", member or local governments
 * named, a grant received. A nonprofit needs 2+ signals, one strong, 4+ points; 2+ signals and 3+
 * points without that = unclear (SGM opens the type picker). A single "501(c)(3)" on an agency
 * that serves nonprofits is one signal: nothing. */
const NP_STRONG = 3
const NP_WIN = 4
const NP_UNCLEAR = 3
// Top-level schema entries only: a firm's "recognizedBy": {"@type": "GovernmentOrganization"} (the SEC) is not the firm (confluencefp.com).
const NP_TYPE_RE = /^(?:NGO|NonprofitOrganization|GovernmentOrganization|GovernmentOffice)$/
const npSchema = (html: string) =>
  (findJsonLdBlocks(html) ?? []).some((b) => (topNodes(b) ?? []).some((n) => typesOf(n).some((t) => NP_TYPE_RE.test(t)) || 'nonprofitStatus' in n))
const NP_STATUS_RE = /\b(?:501\s?\(?c\)?\s?\(?3\)?|tax[- ]deductible|tax[- ]exempt (?:organi[sz]ation|charity|nonprofit))/i
// A nonprofit's own ask: give, volunteer, join, apply for help. Short link or button words.
const GIVE_WORDS_RE =
  /^(?:donate(?: now| today| here| online)?|give(?: now| today| online| monthly)?|make a (?:gift|donation)|ways to give|support (?:us|our (?:work|mission|cause))|volunteer(?: with us| today| now)?|get involved|become a (?:member|partner|sponsor|volunteer|donor|mentor|foster(?: parent)?)|join (?:us|today|now)|partner with us|request (?:assistance|help|technical assistance)|apply for (?:a |an )?(?:grant|loan|program|assistance|funding|help))$/i
const DONATE_WORDS_RE = /^(?:donate\b|give(?: now| today| online| monthly)?$|make a (?:gift|donation)|ways to give)/i
const DONATION_HOST_RE =
  /(?:^|\.)(?:donorbox\.org|givebutter\.com|givelively\.org|classy\.org|networkforgood\.com|bloomerang\.co|every\.org|zeffy\.com|qgiv\.com|kindful\.com|fundraiseup\.com|donordrive\.com|onecause\.com|blackbaud\.com|bbms\.blackbaud\.com|flipcause\.com|givesmart\.com|pledge\.to)$/i
const CHARITY_RATING: [RegExp, string][] = [
  [/(?:^|\.)(?:candid\.org|guidestar\.org)$/i, 'Candid'],
  [/(?:^|\.)charitynavigator\.org$/i, 'Charity Navigator'],
  [/(?:^|\.)greatnonprofits\.org$/i, 'GreatNonprofits'],
  [/(?:^|\.)give\.org$/i, 'BBB Wise Giving'],
]
const BOARD_PATH_RE = /\/(?:[\w-]*-)?(?:board(?:-of-(?:directors|trustees|commissioners))?|governance|trustees)(?:[\/.?#-]|$)/i
const REPORT_PATH_RE = /\/(?:[\w-]*-)?(?:annual-reports?|impact(?:-reports?)?|our-impact|financials?|form-990|990s?|success-stories|stories-of-[\w-]+)(?:[\/.?#-]|$)/i
const REPORT_WORDS_RE = /^(?:(?:read |see |view |our )?(?:annual reports?|impact reports?|our impact|impact|financials|form 990|success stories))$/i
const VOLUNTEER_RE = /^(?:volunteer\b|get involved)/i
const MISSION_RE = /\bour mission\b|\bmission is to\b/i
const PUBLIC_RE = /\b(?:local governments|member (?:governments|counties|municipalities|jurisdictions)|units of local government|(?:city|county|state|federal) (?:agencies|partners))\b/i
// Money received: "$400,000 EDA Award", "awarded a $2 million grant", "received $50K in funding".
const GRANT_RE =
  /\$\s?[\d,.]+\s?(?:[kKmM]\b|million|billion|thousand)?\s(?:[A-Za-z&-]+\s){0,3}(?:grants?|awards?|in (?:funding|grants))\b|\b(?:received|awarded|wins?|won|secures?|secured)\s(?:an?\s)?(?:[A-Za-z&$\d,.-]+\s){0,4}(?:grants?|award)\b/i
// Impact numbers: "1,200 families served", "$4 million invested", "350 jobs created".
const IMPACT_RE =
  /\b\d[\d,.]*\+?\s?(?:million|billion|thousand|k)?\s(?:people|individuals|families|children|kids|youth|students|veterans|seniors|neighbors|residents|meals|homes|houses|jobs|businesses|communities|counties|volunteers|members|projects|grants|households|patients|animals|trees|acres|clients)\s(?:have been\s|were\s)?(?:served|helped|fed|housed|created|supported|reached|funded|trained|placed|assisted|built|rescued|planted|preserved|retained|protected|impacted)\b|\$\s?[\d,.]+\s?(?:million|billion|thousand|[kKmM]\b)?\s(?:invested|raised|awarded|leveraged|distributed|granted|in (?:grants|funding|investment|loans))\b/gi
// A funders / partners section: a heading, then 3+ logos (countClientLogos' window).
const FUNDER_HEADING_RE =
  /\b(?:our (?:funders|sponsors|supporters|partners|community partners|funding partners)|(?:thank you to|thanks to) our (?:sponsors|funders|supporters|partners)|supported by|funded by|made possible by|in partnership with|partner organi[sz]ations)\b/i
const STORY_RE = /\b(?:stories of (?:hope|impact|change)|(?:client|family|member|student|community) stories|(?:her|his|their) story|meet (?:\w+,? )?(?:one of )?(?:our|the) (?:families|clients|students|neighbors|participants))\b/i

interface NonprofitRead { signals: [string, number][]; onPage: boolean; give: string | null; proof: NonprofitProof }

function readNonprofit(html: string, text: string, pageUrl: string, pageHost: string): NonprofitRead {
  const signals: [string, number][] = []
  let onPage = false
  // text = true for signs read from the words alone (status, mission, local governments, a grant).
  const add = (s: string, w: number, text = false) => { if (!text) onPage = true; if (!signals.some(([x]) => x === s)) signals.push([s, w]) }
  if (npSchema(html)) add('Nonprofit or government details in the code (schema.org)', NP_STRONG)
  const status = text.match(NP_STATUS_RE)
  if (status) add(`“${status[0]}” on the page`, NP_STRONG, true)
  if (/\.gov$/i.test(pageHost)) add('A .gov address', NP_STRONG)
  else if (/\.org$/i.test(pageHost)) add('A .org address', 1)
  if (MISSION_RE.test(text)) add('A mission statement', 1, true)
  if (PUBLIC_RE.test(text)) add('Works with local governments', 1, true)
  const grant = text.match(GRANT_RE)
  if (grant) add('A grant received', 1, true)

  let give: string | null = null
  let report: { url: string; words: string } | null = null
  const ratings = new Set<string>()
  for (const a of anchors(html)) {
    const at = pathAndHost(a.href, pageUrl)
    if (!at) continue
    const w = words(a.inner)
    const own = at.host === pageHost || at.host.endsWith(`.${pageHost}`)
    if (DONATION_HOST_RE.test(at.host) || (/(?:^|\.)paypal\.com$/i.test(at.host) && /\/donate/i.test(at.path))) add('A donation link', NP_STRONG)
    for (const [re, name] of CHARITY_RATING) if (re.test(at.host)) { ratings.add(name); add(`A ${name} link`, NP_STRONG) }
    if (w && w.length <= 40 && GIVE_WORDS_RE.test(w)) {
      give ??= w
      if (DONATE_WORDS_RE.test(w)) add('A Donate link', NP_STRONG)
      else if (VOLUNTEER_RE.test(w)) add('A Volunteer link', 1)
    }
    if (own && BOARD_PATH_RE.test(at.path)) add('A Board or governance page', 1)
    if (own && !report && (REPORT_PATH_RE.test(at.path) || (w && REPORT_WORDS_RE.test(w)))) report = { url: at.url, words: w || at.path }
  }
  // Buttons too ("Donate" as a <button> that opens a form).
  // [^<>]* and a short body keep broken pages linear (engine pin: "stay fast on unclosed tags").
  if (!give) for (const m of html.matchAll(/<button\b[^<>]*>((?:[^<]|<(?!\/button>)){0,200}?)<\/button>/gi)) {
    const w = words(m[1])
    if (w && w.length <= 40 && GIVE_WORDS_RE.test(w)) { give = w; if (DONATE_WORDS_RE.test(w)) add('A Donate button', NP_STRONG); break }
  }
  // Charity seals are often images only (Candid's Seal of Transparency).
  for (const m of html.matchAll(/<img\b[^<>]*>/gi)) {
    const tag = m[0]
    if (/candid|guidestar|seal[-_ ]of[-_ ]transparency/i.test(tag)) { ratings.add('Candid'); add('A Candid seal', NP_STRONG) }
    if (/charity[-_ ]?navigator/i.test(tag)) { ratings.add('Charity Navigator'); add('A Charity Navigator badge', NP_STRONG) }
  }
  if (report) add('An annual or impact report', 1)

  const proof: NonprofitProof = { proof: [], evidence: {}, trackLevel: 0, ratingSites: [...ratings] }
  const found = (s: string, at: number) => {
    const start = Math.max(0, at - 40)
    const snip = text.slice(start, at + s.length + 40).replace(/^\S*\s/, '').replace(/\s\S*$/, '').trim()
    return `Found “${s.trim()}”: …${snip}…`
  }
  if (report) { proof.proof.push('work'); proof.evidence.work = `Found “${report.words}”: a link to ${pathAndHost(report.url, pageUrl)?.path ?? report.url}` }
  const impacts = [...text.matchAll(IMPACT_RE)]
  if (impacts.length) {
    proof.proof.push('track')
    proof.trackLevel = new Set(impacts.map((m) => m[0].toLowerCase())).size >= 2 ? 2 : 1
    proof.evidence.track = found(impacts[0][0], impacts[0].index!)
  }
  // Funders or partners named with 3+ logos, or stories of people helped: the nonprofit's reviews.
  let funders = 0
  for (const m of html.matchAll(/>([^<]{3,120})</g)) {
    if (!FUNDER_HEADING_RE.test(m[1])) continue
    funders = Math.max(funders, (html.slice(m.index! + m[0].length, m.index! + m[0].length + 6_000).match(/<(?:img|svg)\b/gi) ?? []).length)
  }
  const story = text.match(STORY_RE)
  if (funders >= 3) { proof.proof.push('reviews'); proof.evidence.reviews = `Found “${FUNDER_HEADING_RE.exec(text)?.[0] ?? 'Our partners'}”: ${Math.min(funders, 30)} logos` }
  else if (story) { proof.proof.push('reviews'); proof.evidence.reviews = found(story[0], story.index!) }
  if (ratings.size) { proof.proof.push('reviewSites'); proof.evidence.reviewSites = `Links to your ${[...ratings].join(', ')} profile${ratings.size > 1 ? 's' : ''}` }
  if (grant) { proof.proof.push('credentials'); proof.evidence.credentials = found(grant[0], grant.index!) }
  else if (status) { proof.proof.push('credentials'); proof.evidence.credentials = found(status[0], status.index!) }
  return { signals, onPage, give, proof }
}

/** How far before a form its heading ("Get your free quote") is looked for. */
const FORM_LEAD_IN = 1_500
const FORM_ASK_MAX_CHARS = 120

/** A lead form's ask words (from the lines just above it, or inside it), or null.
 *  A lead form asks for more than an email: a phone, a message or a name. Search, log-in and
 *  email-only newsletter forms don't count. */
function readLeadFormAsk(html: string): string | null {
  for (const m of html.matchAll(/<form\b([^>]*)>([\s\S]*?)<\/form>/gi)) {
    const [, attrs, inner] = m
    if (/\brole\s*=\s*["']?search|\btype\s*=\s*["']?(?:search|password)\b/i.test(attrs + inner)) continue
    const lead =
      /<textarea\b|\btype\s*=\s*["']?tel\b/i.test(inner) ||
      /<(?:input|select)\b[^>]*\b(?:name|id|placeholder|autocomplete)\s*=\s*["'][^"']*\b(?:phone|tel|message|company|first[-_ ]?name|last[-_ ]?name|full[-_ ]?name|your[-_ ]?name|name)\b/i.test(inner)
    if (!lead) continue
    const before = [...html.slice(Math.max(0, m.index! - FORM_LEAD_IN), m.index!).matchAll(/>([^<]+)</g)]
      .map((t) => words(t[1]))
      .filter(Boolean)
      .slice(-3)
      .reverse()
    const within = [
      ...[...inner.matchAll(/>([^<]+)</g)].map((t) => words(t[1])),
      ...[...inner.matchAll(/<(?:input|button)\b[^>]*\bvalue\s*=\s*["']([^"']+)["']/gi)].map((t) => words(t[1])),
    ]
    const ask = [...before, ...within].find(
      (t) => t && t.length <= FORM_ASK_MAX_CHARS && (DEMO_WORDS_RE.test(t) || SERVICE_ASK_RE.test(t) || broadAsk(t)),
    )
    if (ask) return ask
  }
  return null
}

/* ── The ask: score every candidate (2026-11-19, research #4) ─────────────
 * Every link, <button>, role="button" and submit input is a candidate, not
 * first match wins. Points:
 *   ask words (DEMO_WORDS_RE, SERVICE_ASK_RE, broadAsk) ............. 3, strong
 *   a demo / sign-up page or a meeting host (Calendly…) .............. 3, strong
 *   a tel: link with booking words ("Call to Schedule") .............. 3, strong
 *   starts with an action word, short ("Apply now", "Join today") .... 1
 *   goes to a booking-like page (/book, /quote, /appointment…) ....... 1
 *   looks like a button by class or id (btn, button, cta, primary) .. 1
 *   in the header or first screen (by source order, no pixels) ...... 1
 *   the same words twice or more on the page ......................... 1
 * Lead magnets, shop perks, log in and "Learn more" never count. The best
 * strong candidate is the ask (most points, then first on the page). With no
 * strong one, an action word plus weak points of 3+ make the ask UNCLEAR
 * (askGuess): a guess is never a pass. Contact words stay the contact link. The lead form's ask stays the fallback. */
const ASK_STRONG = 3
const ASK_UNCLEAR = 3
const ASK_PATH_RE = /\/(?:[\w-]*-)?(?:book(?:ing)?|schedule|appointments?|quote|estimate|consult(?:ation)?|get-started|start-a-project|request(?:-[\w-]+)?)(?:[\/.?#-]|$)/i
const BUTTONISH_RE = /\b(?:class|id)\s*=\s*["']?[^"'>]*\b(?:btn|button|cta|primary)\b/i
const TEL_BOOK_RE = /\b(?:schedule|book|appointment|estimate|quote|consult(?:ation)?)\b/i
const NOT_A_BUTTON_RE = /^(?:(?:learn|read|see|view|find out|discover|explore) more|more|menu|close|open|submit|send|search|next|previous|back)\b/i
/** How far past the headline the first screen reaches, for placing a candidate. */
const ASK_FIRST_SCREEN = 3_000

interface AskPick { ask: string | null; guess: string | null; serviceAsk: boolean }

function bestAsk(html: string, pageUrl: string, pageHost: string): AskPick {
  const h1End = html.search(/<\/h1>/i)
  const headerEnd = html.search(/<\/header>/i)
  const topEnd = Math.max(h1End, headerEnd) + ASK_FIRST_SCREEN
  const found: { text: string; at: number; tag: string; href: string | null }[] = []
  // One forward pass over opening tags ([^<>]* cannot run past the next tag, so broken pages stay
  // linear); a tag's words run to its closing tag, found with indexOf.
  const lower = html.toLowerCase()
  // The next closing tag after a point, per tag name; tags only move forward, so each is searched once.
  const nextClose = new Map<string, number>()
  for (const m of html.matchAll(/<(a|button|input|[a-z][a-z0-9]*)\b([^<>]*)>/gi)) {
    const name = m[1].toLowerCase()
    const attrs = m[2]
    const end = m.index! + m[0].length
    const until = (close: string, max: number) => {
      let i = nextClose.get(close)
      if (i === undefined || (i >= 0 && i < end)) nextClose.set(close, (i = lower.indexOf(close, end)))
      return i < 0 || i - end > max ? null : html.slice(end, i)
    }
    if (name === 'a') {
      const href = attrs.match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/i)
      const inner = href ? until('</a>', 4_000) : null
      if (href && inner !== null) found.push({ text: words(inner), at: m.index!, tag: m[0], href: (href[1] ?? href[2] ?? href[3]).replace(/&amp;/g, '&').trim() })
    } else if (name === 'input') {
      const v = /\btype\s*=\s*["']?submit\b/i.test(attrs) && attrs.match(/\bvalue\s*=\s*(?:"([^"]*)"|'([^']*)')/i)
      if (v) found.push({ text: words(v[1] ?? v[2]), at: m.index!, tag: m[0], href: null })
    } else if (name === 'button' || /\brole\s*=\s*["']?button\b/i.test(attrs)) {
      const inner = until(name === 'button' ? '</button>' : `</${name}>`, 400)
      if (inner !== null) found.push({ text: words(inner), at: m.index!, tag: m[0], href: null })
    }
  }
  const count = new Map<string, number>()
  for (const c of found) if (c.text) count.set(c.text.toLowerCase(), (count.get(c.text.toLowerCase()) ?? 0) + 1)

  let best: { text: string; score: number; at: number } | null = null
  let guess: { text: string; score: number; at: number } | null = null
  let serviceAsk = false
  for (const c of found) {
    const t = c.text
    if (t.length > 60) continue
    const tel = !!c.href && /^\s*tel:/i.test(c.href)
    const at = c.href && !tel ? pathAndHost(c.href, pageUrl) : null
    const own = !!at && (at.host === pageHost || at.host.endsWith(`.${pageHost}`))
    let strong = false
    if (tel) strong = SERVICE_ASK_RE.test(t) || TEL_BOOK_RE.test(t.replace(/[\d()+.\s-]{7,}/g, ' '))
    else {
      if (t && (DEMO_WORDS_RE.test(t) || SERVICE_ASK_RE.test(t) || broadAsk(t))) strong = true
      if (at && ((own && DEMO_PATH_RE.test(at.path)) || MEETING_HOST_RE.test(at.host))) strong = true
    }
    if (!strong && (!t || NOT_AN_ASK_RE.test(t) || NOT_A_BUTTON_RE.test(t) || LOGIN_WORDS_RE.test(t) || SHOP_WORDS_RE.test(t) || CONTACT_WORDS_RE.test(t) || tel)) continue
    const action = !!t && ASK_VERB_RE.test(t) && t.split(/\s+/).length <= 5
    // A guess needs an action word: button looks, place and repeats alone are any link ("Class Schedule").
    if (!strong && !action) continue
    if (strong && t && !NOT_SERVICE_ASK_RE.test(t)) serviceAsk = true
    let score = strong ? ASK_STRONG : 0
    if (action) score++
    if (own && at && ASK_PATH_RE.test(at.path)) score++
    if (BUTTONISH_RE.test(c.tag)) score++
    if (c.at <= topEnd) score++
    if ((count.get(t.toLowerCase()) ?? 0) >= 2) score++
    const pick = { text: t || 'Demo link', score, at: c.at }
    if (strong) {
      if (!best || score > best.score) best = pick
    } else if (score >= ASK_UNCLEAR && (!guess || score > guess.score)) guess = pick
  }
  return { ask: best?.text ?? null, guess: best ? null : guess?.text ?? null, serviceAsk }
}

export function readB2bSignals(html: string, pageUrl: string): B2bSignals {
  const pageHost = pathAndHost(pageUrl, pageUrl)?.host ?? ''
  let pricing: string | null = null
  let demo: string | null
  let contact: string | null = null
  let caseStudies: string | null = null
  let shop: string | null = null
  const seen = { cart: false, addToCart: false, login: false, signup: false, appLink: false }
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
    if (!contact && own && goesSomewhere && (CONTACT_PATH_RE.test(at.path) || CONTACT_WORDS_RE.test(text))) contact = at.url
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

  const pick = bestAsk(html, pageUrl, pageHost)
  demo = pick.ask
  // A lead form is a next step too (2026-10-19: sbmarketinginc.com's "Contact us today for a free marketing
  // review!" sat above its form, not in a link). Only a form with ask words counts.
  if (!demo) demo = readLeadFormAsk(html)
  const askGuess = demo ? null : pick.guess

  const np = readNonprofit(html, extractText(html).replace(/\s+/g, ' '), pageUrl, pageHost)
  const type = siteTypeOf(html, { ...seen, pricing: !!pricing, shop: !!shop, serviceAsk: pick.serviceAsk || (!!demo && !NOT_SERVICE_ASK_RE.test(demo)), nonprofit: { signals: np.signals, onPage: np.onPage } })
  // A nonprofit's ask is its own: with one, the guess at a business ask doesn't make it unclear.
  const unclear: B2bSignals['unclear'] = [...(askGuess && !(type.siteType === 'nonprofit' && np.give) ? (['ask'] as const) : []), ...(type.typeGuess ? (['siteType'] as const) : [])]
  return { pricing, demo, contact, reviewSites: [...reviewSites], clientLogos: countClientLogos(html), caseStudies, firstScreen: readFirstScreen(html), shop, ...type, unclear, askGuess, give: np.give, nonprofit: np.proof }
}
