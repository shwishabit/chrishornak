import { FIRST_NAMES } from './first-names'

/* ── Proof signals (shared) ───────────────────────────────────────────────
 * The homepage proof checks, moved out of audit-parser.ts (parseAI, parseSecurity) as a
 * pure move so the Findability Check and the Authority Check read a page
 * with the same rules. Any change here moves every Findability score and
 * the benchmark (labels are keys in issue-descriptions.ts), so don't tune
 * these for the Authority Check alone. No server-only imports.
 * ─────────────────────────────────────────────────────────────────────── */

/**
 * Remembers the answer for the last page it was given. A check and its
 * evidence line (and the other readers) ask the same question about the same
 * page several times; this reads a page once. One entry, so no memory grows.
 */
function lastOf<R>(fn: (html: string) => R): (html: string) => R {
  let key: string | undefined
  let value: R
  return (html) => {
    if (html !== key) {
      value = fn(html)
      key = html
    }
    return value
  }
}

const stripTags = (html: string): string =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
const pageText = lastOf(stripTags)

/** Visible page text: scripts, styles and tags stripped, whitespace folded. Whole pages are remembered (link words aren't, so they don't push the page out). */
export function extractText(html: string): string {
  return html.length > 5_000 ? pageText(html) : stripTags(html)
}

/* Attribute values may come without quotes: minified pages write
 * href=/about-us/ and type=application/ld+json (smartsites.com, pghdma.com,
 * Authority Check fixture test, 2026-10-02). Every href/type rule allows both. */

/** Every JSON-LD <script> block, whole, or null when there are none. */
export function findJsonLdBlocks(html: string): RegExpMatchArray | null {
  return html.match(
    /<script[^>]*type=["']?application\/ld\+json["']?[^>]*>[\s\S]*?<\/script>/gi,
  )
}

/** One attribute of a tag, quoted or not, or ''. */
function attrOf(tag: string, name: string): string {
  return (
    tag
      .match(new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'>]+))`, 'i'))
      ?.slice(1)
      .find((v) => v !== undefined) ?? ''
  )
}

/**
 * What each image is called, in words: its alt, its title and its file name
 * (google-premier-partner.png → "google premier partner"). The real file behind
 * /_next/image?url=… is used; names that are only a code (IMG_4021, a8f3c2e9) are skipped.
 */
export const imageWords = lastOf(readImageWords)
function readImageWords(html: string): string[] {
  const out: string[] = []
  for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
    for (const t of [attrOf(m[0], 'alt'), attrOf(m[0], 'title')]) if (t.trim()) out.push(t.trim())
    let src = attrOf(m[0], 'src') || attrOf(m[0], 'data-src') || attrOf(m[0], 'data-lazy-src')
    if (/^data:/i.test(src)) src = attrOf(m[0], 'data-lazy-srcset') || attrOf(m[0], 'srcset')
    src = src.replace(/&amp;/g, '&').split(/\s/)[0]
    const nextUrl = src.match(/[?&]url=([^&]+)/)?.[1]
    if (nextUrl) {
      try {
        src = decodeURIComponent(nextUrl)
      } catch {}
    }
    const base = src.split(/[?#]/)[0].split('/').pop()?.replace(/\.(?:png|jpe?g|webp|gif|svg|avif)$/i, '') ?? ''
    const words = base.replace(/[-_.+]+/g, ' ').replace(/\b\d+x\d+\b|\bscaled\b/gi, ' ').trim()
    if (/[a-z]{3,}/i.test(words) && !/^(?:img|dsc|image|photo|screenshot|pxl)?\s*[\da-f\s]+$/i.test(words)) out.push(words)
  }
  return out
}

/** Every <a href>: its address (quoted or not, &amp; decoded) and the HTML inside it. */
export function anchors(html: string): { href: string; inner: string }[] {
  return [...html.matchAll(/<a\b[^>]*?\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))[^>]*>([\s\S]*?)<\/a>/gi)].map((m) => ({
    href: (m[1] ?? m[2] ?? m[3]).replace(/&amp;/g, '&').trim(),
    inner: m[4],
  })).filter((a) => a.href)
}

/** Security: a link to a privacy, terms or cookie page, or those words on the page. */
export function readPrivacyLink(html: string): boolean {
  const privacyRe = /href=(?:["'][^"']*|[^"'\s>]*)(privacy|datenschutz|privacidad|legal|terms|policies\/privacy|cookie-policy)/i
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
  /** Trust signals: licenses, awards, years in business (Findability). */
  hasCredentials: boolean
  /** The same without years: licenses, certifications, awards, degree letters, badges (Authority Check). */
  hasLicences: boolean
  /** Trust signals: a business entry in valid JSON-LD (businessEntry). */
  hasOrgSchema: boolean
  /** Trust signals: a named person who works there (findPerson). */
  hasPeople: boolean
  /** Entity clarity: a phone number, tel: link or street address. */
  hasAddressInfo: boolean
  /** Entity clarity: a named place it serves or is based in ("Serving Allegheny County"). */
  hasServiceArea: boolean
  /** The schema name, share name, title brand and © line agree (readNames; Authority Check, shown only). */
  hasOneName: boolean
  /** Entity clarity: a plain business-type word (plumber, bakery, agency…). */
  hasBusinessType: boolean
}


// The rules, once. All non-global, so .test()/.exec() keep no state between calls.
// About links (widened 2026-10-02): by a path segment, or by the link's words ("MORE ABOUT ME"),
// on the site itself: not linkedin.com/company/…/about, not an image file ("…/isteam/…").
// The word starts the page name ("/company/", "/our-team/", "/meet-the-team/"), so service
// pages like "/michigan-seo-company/" or "/thought-leadership/" don't count. Only "about" may
// run on ("/about-the-firm/"); the other words end the name or take -us / -team / -members /
// -page, so "/practice-areas/", "/company-news/" and "/team-building/" don't count either
// (SEO panel review + scoring spec, 2026-10-02).
const ABOUT_PATH_RE =
  /\/(?:our-|meet-(?:the-|our-)?|the-)?(?:about[\w-]*|(?:team|who-we-are|story|company|people|mission|history|staff|leadership|founders?|owners?|why-us|culture|values|firm|attorneys|lawyers|doctors|dentists|providers|practice)(?:-(?:us|team|members|page))?)(?:[\/.?#]|$)/i
const ABOUT_WORDS_RE =
  /^(?:(?:more |learn more )?about(?: us| me)?|about (?:the|our) (?:company|team|firm|practice|story|people|doctors?|attorneys?)|our (?:story|team|people|company|firm|practice|history|mission|staff|doctors|attorneys)|meet (?:the |our |dr\.? )?\w+|who we are|company|the team|team)$/i
const NOT_SITE_RE =
  /^(?:mailto:|tel:|javascript:)|\/\/(?:[\w-]+\.)*(?:linkedin|facebook|instagram|twitter|x|youtube|tiktok|pinterest|google|yelp|bbb|wsimg)\.(?:com|org)\b|\.(?:png|jpe?g|webp|gif|svg|avif|pdf)(?:[?#]|$)/i
const isAboutLink = (a: { href: string; inner: string }) =>
  !NOT_SITE_RE.test(a.href) &&
  (ABOUT_PATH_RE.test(a.href.replace(/^https?:\/\/[^/]+/i, '')) || ABOUT_WORDS_RE.test(extractText(a.inner).trim()))
const aboutLinksOf = lastOf((html: string) => anchors(html).filter(isAboutLink))
const bareHost = (h: string) => h.toLowerCase().replace(/^www\./, '')
/** The page's host, or '' when the address can't be read (then links aren't checked for it). */
function hostOf(pageUrl: string | undefined): string {
  try {
    return pageUrl ? bareHost(new URL(pageUrl).hostname) : ''
  } catch {
    return ''
  }
}
/** A relative link, or an absolute one to the page's own host: another company's /about/ doesn't count. */
function onSite(href: string, host: string): boolean {
  if (!host || !/^(?:https?:)?\/\//i.test(href)) return true
  try {
    return bareHost(new URL(href, `https://${host}/`).hostname) === host
  } catch {
    return false
  }
}
/**
 * The site's best About link: one whose words say "About" or whose page is named about…
 * first, then any address with "about", then team / story / company pages. Which link wins
 * changes only the evidence shown, never the ✓ (webfx.com showed "/about/results/", live test).
 */
const findAboutLink = (html: string, pageUrl?: string) => {
  const host = hostOf(pageUrl)
  const rank = (a: { href: string; inner: string }) => {
    const path = a.href.replace(/^https?:\/\/[^/]+/i, '').split(/[?#]/)[0]
    const last = path.split('/').filter(Boolean).pop() ?? ''
    // A real page beats a "#" link with the right words.
    return (/^#|^$/.test(a.href) ? -3 : 0) + (ABOUT_WORDS_RE.test(extractText(a.inner).trim()) ? 2 : 0) + (/^about/i.test(last) ? 2 : 0) + (/about/i.test(path) ? 1 : 0)
  }
  let best: { href: string; inner: string } | undefined
  for (const a of aboutLinksOf(html)) if (onSite(a.href, host) && (!best || rank(a) > rank(best))) best = a
  return best
}

/**
 * The site's own About page to read (Authority Check only): a real page on the
 * same site, not a "#about" jump on the homepage. A link that says "about" (by
 * its address or words) wins over team / company / story links.
 */
export function findAboutPage(html: string, pageUrl: string): string | null {
  let base: URL
  try {
    base = new URL(pageUrl)
  } catch {
    return null
  }
  const bare = bareHost
  // Best first: a page named about… ("/about", "/about-us/"), then any address or words with "about"
  // ("/about/results/" on webfx.com is a results page), then team / company / story.
  let second: string | null = null
  let fallback: string | null = null
  for (const a of anchors(html)) {
    if (!isAboutLink(a)) continue
    let u: URL
    try {
      u = new URL(a.href, base)
    } catch {
      continue
    }
    if (!['http:', 'https:'].includes(u.protocol) || bare(u.hostname) !== bare(base.hostname)) continue
    if (u.pathname === base.pathname) continue
    u.hash = ''
    if (/^about/i.test(u.pathname.split('/').filter(Boolean).pop() ?? '')) return u.toString()
    if (/about/i.test(u.pathname) || /^(?:more |learn more )?about\b/i.test(extractText(a.inner).trim())) second ??= u.toString()
    else fallback ??= u.toString()
  }
  return second ?? fallback
}
const TESTIMONIAL_RE = /testimonial|review|client|customer.said|what.people.say/i
// Widened 2026-10-02 (Authority Check fixture test): "awards" (plural), certification, partner
// status, Inc. 5000, "12+ years running"; "founded" / "established" now need a year, so
// "an established brand" and "Founded Swift Growth" stop passing.
const CREDENTIALS_RE =
  /\b(certified|certifications?|licensed|accredited|accreditation|awards?|award-winning|(?:premier|certified|google|meta|microsoft|hubspot|shopify|tiktok|amazon|klaviyo) partner|inc\.? ?5000|voted (?:[\w'’]+ ){0,5}?best|best of (?:[a-z]+ )?\d{4}|\d+\+? years? (?:of |in )?(?:[a-z-]+ ){0,3}?experience|\d+\+? years running|(?:founded|established|est\.)(?: in)? \d{4}|since \d{4})\b/i
// The Authority Check's Credentials: the same without years. A start year or "20 years of experience"
// is time in business, which Track record scores (SEO panel, 6 of 6, 2026-10-02); Findability's
// "credentials or experience" keeps them.
const LICENCE_RE =
  /\b(certified|certifications?|licensed|accredited|accreditation|awards?|award-winning|(?:premier|certified|google|meta|microsoft|hubspot|shopify|tiktok|amazon|klaviyo) partner|inc\.? ?5000|voted (?:[\w'’]+ ){0,5}?best|best of (?:[a-z]+ )?\d{4})\b/i
// The same, read from what images are called: alt, title, file name (badges are images).
const IMAGE_CREDENTIALS_RE =
  /\b(badges?|certified|certification|accredited|awards?|winner|aaha|(?:premier|certified|google|meta|microsoft|hubspot|shopify|tiktok|amazon|klaviyo|official|preferred|authorized|select) partner|inc\.? ?5000|clutch|upcity|designrush|goodfirms|bbb|best of \d{4}|top rated)\b/i // not "David Kadosh | Partner" (a client's job title)
/* ── Business details for Google: a real business entry in the JSON-LD ─────
 * Until 2026-10-02 this was a text search over each block, so a blog post's
 * author {"@type":"Person"} or the word "Person" in a review passed. Now the
 * block has to parse, and one of its top-level entries (or @graph entries)
 * has to be the business itself: an Organization-family type or a Person (a
 * one-person business), with a name the page also shows, plus a url on this
 * site, a sameAs, a phone or an address. A phone in the code that differs
 * from every phone on the page fails: Google asks for structured data that
 * matches the visible text (SEO panel review, rounds 4-5, 2026-10-02).
 * ─────────────────────────────────────────────────────────────────────── */

// schema.org's business types, by name: the Organization family by suffix, LocalBusiness subtypes
// with no shared ending ("Dentist", "AutoRepair", "LegalService"). Plain "Service" (an offer) doesn't count.
const ORG_TYPE_RE =
  /^(?:Person|LocalBusiness|ProfessionalService|\w*(?:Organization|Business|Store|Shop|Contractor|Salon|Agency|Restaurant|Establishment|Clinic)|Dentist|Physician|Attorney|Notary|Plumber|Electrician|Locksmith|HousePainter|MovingCompany|Bakery|Brewery|Winery|Distillery|BarOrPub|Florist|Hotel|Motel|Resort|Hostel|BedAndBreakfast|DaySpa|HealthClub|ExerciseGym|TattooParlor|AutoRepair|AutoDealer|AutoRental|AutoWash|GasStation|MotorcycleDealer|MotorcycleRepair|ChildCare|Optician|Pharmacy|VeterinaryCare|RealEstateAgent|AccountingService|FinancialService|LegalService|EmergencyService|BankOrCreditUnion|DryCleaningOrLaundry|SelfStorage|Corporation|NGO|SportsActivityLocation|GolfCourse)$/

// Words that don't name a business: "the", "&", legal endings.
const NAME_STOP = /^(?:a|an|and|of|the|to|at|in|for|llc|inc|ltd|co|corp|pllc|pc|lp|llp)$/
const nameWords = (s: string) =>
  s.toLowerCase().replace(/&#0?39;|['’]/g, '').replace(/&amp;|&/g, ' ').split(/[^a-z0-9]+/).filter((w) => w.length > 1 && !NAME_STOP.test(w))
/**
 * Does the page show this name? Its first word, and most of its words. Schema names run longer
 * than the page's ("Roots to Petals Studio & Shop" vs "Roots To Petals") or carry a tagline after
 * a dash ("Norris Landscaping Services, Inc. - Raleigh NC … (919) 934-3938"), so the name is cut
 * at " - " / " | " / "(" and needs 2 in 3 of its words, not the exact string.
 */
function pageShowsName(name: string, pageWords: Set<string>): boolean {
  const words = nameWords(name.split(/\s+[-–—|]\s+|\s*\(/)[0])
  if (!words.length || !pageWords.has(words[0])) return false
  return words.filter((w) => pageWords.has(w)).length / words.length >= 2 / 3
}

type Node = Record<string, unknown>
/** A JSON-LD block's top-level entries (an array, an @graph, or the one object), or null when it doesn't parse. */
function topNodes(block: string): Node[] | null {
  let data: unknown
  try {
    data = JSON.parse(block.replace(/^<script[^>]*>|<\/script>$/gi, '').trim())
  } catch {
    return null
  }
  const list = Array.isArray(data) ? data : [data]
  return list.flatMap((d) => {
    if (!d || typeof d !== 'object') return []
    const graph = (d as Node)['@graph']
    return [d as Node, ...(Array.isArray(graph) ? (graph as Node[]) : [])]
  })
}

const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '')
const typesOf = (n: Node): string[] => [n['@type']].flat().map(str).filter(Boolean)
const digitsOf = (s: string) => s.replace(/\D/g, '').slice(-10)

/** The page's business entry: its type and name, or null. */
function businessEntry(
  blocks: RegExpMatchArray | null,
  pageText: string,
  host: string,
): { type: string; name: string } | null {
  const pageWords = new Set(nameWords(pageText))
  const pagePhones = (pageText.match(new RegExp(PHONE_RE.source, 'g')) ?? []).map(digitsOf)
  for (const block of blocks ?? []) {
    for (const n of topNodes(block) ?? []) {
      const type = typesOf(n).find((t) => ORG_TYPE_RE.test(t))
      const name = str(n.name)
      if (!type || !name || !pageShowsName(name, pageWords)) continue
      const url = str(n.url)
      const ownUrl = !!url && onSite(url, host)
      const sameAs = [n.sameAs].flat().some((s) => str(s))
      const phone = str(n.telephone)
      const address = !!n.address
      if (!ownUrl && !sameAs && !phone && !address) continue
      if (phone && pagePhones.length && !pagePhones.includes(digitsOf(phone))) continue
      return { type, name }
    }
  }
  return null
}
/* ── One name everywhere (Authority Check, shown only) ─────────────────────
 * The name a page gives itself in the places machines read it: the schema
 * business entry, og:site_name and the © line. When two or more are found and
 * they agree (same first word, 2 in 3 words shared), the row passes. The
 * <title> isn't read: most titles lead with keywords, not the name (26 false
 * clashes on the saved test sites). Jason Barnard: when facts clash, an AI "hedges" (SEO panel,
 * round 3, 4 of 6). "LLC", "&" and "The" are ignored.
 * ─────────────────────────────────────────────────────────────────────── */

const sameName = (a: string, b: string): boolean => {
  const x = nameWords(a), y = nameWords(b)
  if (!x.length || !y.length || x[0] !== y[0]) return false
  const [short, long] = x.length <= y.length ? [x, y] : [y, x]
  return short.filter((w) => long.includes(w)).length / short.length >= 2 / 3
}

/** The names found and whether they agree, or null when fewer than two were found. */
export function readNames(
  html: string,
  pageText: string,
  blocks: RegExpMatchArray | null,
  pageUrl?: string,
): { names: { where: string; name: string }[]; agree: boolean } | null {
  const names: { where: string; name: string }[] = []
  const entry = businessEntryOf(blocks, pageText, hostOf(pageUrl))
  if (entry) names.push({ where: 'schema', name: entry.name })
  const site = html.match(/<meta[^>]+property=["']?og:site_name["']?[^>]*>/i)?.[0]
  const siteName = site ? attrOf(site, 'content').replace(/&amp;/g, '&').trim() : ''
  if (siteName) names.push({ where: 'share name', name: siteName })
  const copy = pageText.match(/(?:©|&copy;|Copyright)\s*(?:\d{4}(?:\s*[-–]\s*\d{4})?\s*)?(?:by\s+)?([A-Z][\w&'’.,\- ]{1,50}?)(?=\s*(?:\.|,|\||All rights|All Rights|$))/)?.[1]
  if (copy && !/^all rights/i.test(copy.trim())) names.push({ where: '© line', name: copy.trim() })
  if (names.length < 2) return null
  return { names, agree: names.every((n) => sameName(n.name, names[0].name)) }
}

const businessEntryOf = (() => {
  let key: unknown[] = []
  let value: { type: string; name: string } | null = null
  return (blocks: RegExpMatchArray | null, pageText: string, host: string) => {
    if (key[0] !== blocks || key[1] !== pageText || key[2] !== host) {
      value = businessEntry(blocks, pageText, host)
      key = [blocks, pageText, host]
    }
    return value
  }
})()

// The things themselves, not words like "location" or "phone" (those passed menus, "photography
// location" and "Business Phone Services": all 4 false yeses in the fixture test, 2026-10-02):
// a phone number, a tel: link, a street address.
const PHONE_RE = /(?:\+?1[\s.-]?)?\(?\b[2-9]\d{2}\)?[\s.-]\d{3}[\s.-]\d{4}\b/
const TEL_LINK_RE = /href\s*=\s*["']?tel:/i
const STREET_RE =
  /\b\d{1,6}\s+(?:[NSEW]\.?\s+)?(?:(?:[A-Z][a-z]+\.?|\d+(?:st|nd|rd|th))\s+){1,3}(?:St|Street|Ave|Avenue|Rd|Road|Blvd|Boulevard|Dr|Drive|Ln|Lane|Way|Pkwy|Parkway|Ct|Court|Pl|Place|Hwy|Highway|Pike|Sq|Square|Ter|Terrace|Cir|Circle)\b/
const hasReachInfo = (html: string, pageText: string) =>
  PHONE_RE.test(pageText) || STREET_RE.test(pageText) || TEL_LINK_RE.test(html)
// A place it serves or is based in, named ("Serving Allegheny County", "Offices in Pittsburgh, PA"),
// or a stated reach for a business that isn't local ("Serving businesses nationwide"): location for
// Findability's Entity clarity, not a way to reach you.
const SERVICE_AREA_RE =
  /\b(?:(?:[Bb]ased|[Ll]ocated|[Hh]eadquartered|[Oo]ffices?) in|(?:[Pp]roudly )?[Ss]erving|[Ss]ervice [Aa]reas?:?)\s+(?:the\s+)?(?:[Gg]reater\s+)?[A-Z][a-z]+|\b[Ss]erving (?:[a-z]+ ){0,3}?(?:nationwide|worldwide|globally|across the (?:US|U\.S\.|country|world))\b/ // no i flag: the place must be capitalised
// Whole words with their real endings: until 2026-10-02 stems like "plumb" and "account" sat inside
// \b…\b, so "plumber" and "accountant" never matched and "My Account" did. "company" is gone too:
// it names no kind of business (cts-pgh.com passed on "our company"), unless a trade comes first
// ("marketing company", "IT services").
const BUSINESS_TYPE_RE =
  /\b((?:marketing|advertising|seo|web design|design|branding|software|it|staffing|trucking|consulting) (?:compan(?:y|ies)|services)|(?:marketing|brand|business|seo|content|digital) strategists?|web designers?|agenc(?:y|ies)|(?:law |accounting |architecture |engineering |design |marketing |consulting )?firms?|consultants?|consulting|freelanc(?:e|er|ers|ing)|studios?|practice|shops?|stores?|restaurants?|salons?|spas?|clinics?|gyms?|church(?:es)?|schools?|contractors?|dentists?|dental|dentistry|doctors?|lawyers?|attorneys?|plumbers?|plumbing|electricians?|electrical|movers|moving|cleaners|cleaning|bakery|bakeries|brewery|breweries|florists?|veterinar(?:y|ians?)|daycare|auto|automotive|insurance|accountants?|accounting|bookkeeping|roofers?|roofing|hvac|heating and (?:air|cooling)|landscap(?:e|er|ers|ing)|photograph(?:er|ers|y)|caterers?|catering|fitness|wellness|therap(?:y|ies|ists?)|coach(?:es|ing)?|nonprofit|realtors?|real estate|architects?|architecture|engineers?|engineering|construction|builders?|remodel(?:ing|ers?)|tattoos?|piercing|yoga|pilates|pest control|exterminators?|chiropractors?|chiropractic|massage|barbers?|barbershop|optometr(?:ists?|y)|pharmac(?:y|ies)|grooming)\b/i

/* ── Real people: a named person who works there ──────────────────────────
 * Until 2026-10-02 any "About us", "our team" or "partner" passed, so 20 of
 * 22 sites with no one named passed (Authority Check fixture test). Now a
 * person has to be named, in one of the ways pages name their own people:
 * a title (Dr. Jane Smith, Attorney Kim Bodnar), letters after the name
 * (Robert Lebovitz, Esq.), a name next to a staff role (Jane Smith, Owner),
 * "founded by…" / "John Wahl started this company", "Hi, I'm Jane",
 * "Meet Jane", a byline, a founder or employee in schema, or a headshot's
 * alt text or file name. Customer quotes are cut out first: their names are
 * customers. Where a name is only a name, its first word must be a common
 * first name (first-names.ts), so "Google Partner" stays a badge.
 * ─────────────────────────────────────────────────────────────────────── */

// A capitalised word: Jane · O'Brien-Smith · McDonald · ElBermawy
const CAP = `[A-Z][a-z]+(?:[A-Z][a-z]+)?(?:['’-][A-Za-z]+)*`
// Jane Smith · Paul J. Gleason · Mary Ann O'Brien-Smith · Robert A. Lebovitz
const FULL = `(${CAP}(?:\\s+[A-Z]\\.)?(?:\\s+${CAP}){1,2}?)` // shortest fit: "Alex Rubinov", not "Alex Rubinov Cosmetic"
const NOT_A_NAME = /^(?:The|Our|Your|Of|And|For|With|In|At|On|To|Office|Dental|Family|Law|Group|Home|Contact|Call|Free|Best|New|North|South|East|West)\b/
/** A word list in any capitalisation, without the i flag (that flag would let the name pattern match any word). */
const ci = (s: string) => s.replace(/[a-z]/g, (c) => `[${c}${c.toUpperCase()}]`)
const STAFF_ROLE = ci(
  `(?:co-?founders?|founders?|owners?|co-owners?|proprietor|ceo|president|principal|managing (?:partner|director|attorney)|master (?:plumber|electrician|technician)|attorney at law|lead stylist|stylist|head chef|executive chef|realtor|broker|lead technician|dentist|hygienist|physician|chiropractor|optometrist|veterinarian|accountant|photographer|instructor|therapist|counselor|(?:marketing |brand |business )?strategist|consultant|coach|designer|advisor)`,
)
const POST_NOMINAL = `(?:DDS|DMD|MD|DO|DC|DPM|OD|CPA|Esq\\.?|JD|PE|RN|NP|PA-C|LCSW|LPC|LMFT|PhD|CFP|AIA|DVM|RDH|CPSS)`
// Degree or licence letters after a name are a credential too: "Jane Smith, DC" (center4chiropractic.com).
const DEGREE_RE = new RegExp(`${FULL},\\s*${POST_NOMINAL}\\b`)

// In order: a staff role first, so the evidence names staff before a "Dr." from a client's review.
const PERSON_RES: { re: RegExp; listed: boolean }[] = [
  // "Jane Smith, Owner", "Alex & Michael Melen Co-founders", "Elisa | Owner & Founder"
  { re: new RegExp(`${FULL}\\s*(?:[,|:–—-]\\s*)?(?:(?:the|our)\\s+)?(?:&\\s*)?${STAFF_ROLE}\\b`), listed: true },
  // "Ron Founder" (a first name and a role)
  { re: new RegExp(`\\b(${CAP})\\s*(?:[,|:–—-]\\s*)?${ci('(?:co-?founder|founder|owner|ceo)')}\\b`), listed: true },
  // "Founder & CEO Jane Smith", "our owner, Jane Smith"
  { re: new RegExp(`\\b${STAFF_ROLE}\\s*(?:&\\s*\\w+\\s*)?[,:|–—-]?\\s*${FULL}`), listed: true },
  // "founded by Jane Smith", "John Wahl started this company in 1980", "Jane has 20 years…"
  { re: new RegExp(`\\b(?:founded|started|established|opened|owned|run|led)\\s+by\\s+(?:(?:artist|owner|chef|designer|stylist|florist)\\s+)?${FULL}`), listed: true },
  // A name over a first-person bio: "Vanessa Nguyen My passion for floral arrangements started…"
  { re: new RegExp(`${FULL}\\s+(?:My|I(?:'|’)m|I(?:'|’)ve|I have|I am)\\s`), listed: true },
  // A class or session led by someone: "60 minutes with Annie Hanson"
  { re: new RegExp(`\\b(?:class|session|minutes|hour|lesson|workshop)s?\\s+with\\s+${FULL}`), listed: true },
  { re: new RegExp(`${FULL}\\s+(?:founded|started|opened|established)\\s+(?:the|this|our|his|her)\\b`), listed: true },
  { re: new RegExp(`${FULL}\\s+has\\s+(?:over\\s+|more than\\s+)?\\d+\\+?\\s+years`), listed: true },
  // "Robert A. Lebovitz, Esq.", "Jane Smith, DDS" (the comma keeps "Internal Controls CPA" out)
  { re: new RegExp(`${FULL},\\s*${POST_NOMINAL}\\b`), listed: false },
  // "Dr. Paul J. Gleason", "Attorney Kim Bodnar", "Chef Ana Ruiz" (not "Skin Doctor Babor Skin…", a product)
  { re: new RegExp(`\\b(?:Dr\\.?|Doctor|Attorney|Atty\\.?|Chef|Pastor|Rev\\.)\\s+${FULL}`), listed: true },
  // "Hi, I'm Jane", "My name is Jane", "Meet Jane", a byline "By Michael Transon"
  { re: new RegExp(`\\b(?:Hi|Hello),?\\s+I(?:'|’)?m\\s+(${CAP})`), listed: true },
  { re: new RegExp(`\\bMy name is\\s+(${CAP})`), listed: true },
  // "I'm Jane Smith, and…" without the "Hi"
  { re: new RegExp(`\\bI(?:'|’)m\\s+${FULL}(?=\\s*[,.]|\\s+and\\b)`), listed: true },
  { re: new RegExp(`\\bMeet\\s+(${CAP})\\b(?!\\s+(?:the|our|us)\\b)`), listed: true },
  { re: new RegExp(`(?<!(?:site|website|designed|developed|powered|built|made|photo|photos|image|images|hosted|managed)\\s)\\bBy\\s+${FULL}`), listed: true },
]
// An image of a person: "Headshot of Mostafa ElBermawy, Founder & CEO".
const HEADSHOT_ALT_RE = new RegExp(`\\b${ci('(?:headshot|portrait|photo|picture)')}\\s+of\\s+${FULL}`)
// jane-smith-headshot.jpg, dr-jane-smith.webp
const HEADSHOT_FILE_RE = /(?:^|\/)(?:dr[-_])?([a-z]+)[-_]([a-z]+)[-_](?:headshot|portrait|bio|photo)\b/i
// A founder or staff member named in schema: "founder": {"@type": "Person", "name": "Matt Bowman"}
const SCHEMA_PERSON_RE = /"(?:founders?|employees?|members?|alumni)"\s*:\s*[[{][^\]]*?"name"\s*:\s*"([^"]{3,60})"/
// Or a Person with a job title: {"@type": "Person", "name": "Chris Hornak", "jobTitle": "Marketing Strategist"}.
// Review authors are Persons too, but carry no job title.
const SCHEMA_PERSON_NODE_RE = /"@type"\s*:\s*"Person"[^{}]*/g

const isFirstName = (w: string) => FIRST_NAMES.has(w.toLowerCase())

/** The page without its customer quotes: testimonial / review blocks, blockquotes, <q> and <cite>. */
function withoutQuotes(html: string): string {
  const open = /<([a-z][a-z0-9]*)\b([^>]*)>/gi
  let out = ''
  let last = 0
  let m: RegExpExecArray | null
  while ((m = open.exec(html))) {
    const tag = m[1].toLowerCase()
    const quoteTag = tag === 'blockquote' || tag === 'q' || tag === 'cite'
    // A testimonial / review class, as its own word: not "post-preview" (nogood.io).
    const quoteClass = /\b(?:class|id)\s*=\s*["']?[^"'>]*(?<![a-z])(?:testimonial|review)/i.test(m[2])
    if (!quoteTag && (/^(?:html|body|main)$/.test(tag) || !quoteClass)) continue
    // Find the matching close tag, counting nested tags of the same name.
    const tagRe = new RegExp(`<(/?)${tag}\\b[^>]*>`, 'gi')
    tagRe.lastIndex = open.lastIndex
    let depth = 1
    let end = -1
    let t: RegExpExecArray | null
    while ((t = tagRe.exec(html))) {
      depth += t[1] ? -1 : 1
      if (!depth) {
        end = tagRe.lastIndex
        break
      }
    }
    // A "reviews" wrapper around most of the page is a layout class, not a quote: keep it.
    if (end < 0 || end - m.index > html.length * 0.3) continue
    out += html.slice(last, m.index) + ' '
    last = end
    open.lastIndex = end
  }
  return out + html.slice(last)
}

/** The first named person on the page who works there, as evidence, or null. */
export function findPerson(html: string, jsonLdBlocks: RegExpMatchArray | null): string | null {
  return personOf(html, jsonLdBlocks)
}
// Asked twice per page (the ✓ and its evidence line); the blocks come from the same page, so the page is the key.
let personKey: string | undefined
let personValue: string | null = null
function personOf(html: string, jsonLdBlocks: RegExpMatchArray | null): string | null {
  if (html !== personKey) {
    personValue = readPerson(html, jsonLdBlocks)
    personKey = html
  }
  return personValue
}
function readPerson(html: string, jsonLdBlocks: RegExpMatchArray | null): string | null {
  for (const b of jsonLdBlocks ?? []) {
    const m = SCHEMA_PERSON_RE.exec(b)
    if (m && /\s/.test(m[1].trim())) return `Code that names “${m[1].trim()}” as founder or staff`
    for (const node of b.matchAll(SCHEMA_PERSON_NODE_RE)) {
      const name = node[0].match(/"name"\s*:\s*"([^"]{3,60})"/)?.[1].trim()
      const job = node[0].match(/"jobTitle"\s*:\s*"([^"]{2,60})"/)?.[1].trim()
      if (name && job && /\s/.test(name)) return `Code that names “${name}”, ${job}`
    }
  }
  const own = withoutQuotes(html)
  // Visible text, then each quoted passage (30+ characters) and the 100 characters after it (its credit) cut out.
  const text = extractText(own).replace(/[“"][^“”"]{30,}?[”"].{0,100}/g, ' ')
  const named = (s: string): { name: string; at: number } | null => {
    for (const { re, listed } of PERSON_RES) {
      for (const m of s.matchAll(new RegExp(re.source, 'g'))) {
        const name = m[1].trim()
        if (NOT_A_NAME.test(name)) continue
        if (listed && !isFirstName(name.split(/\s+/)[0])) continue
        return { name, at: m.index }
      }
    }
    return null
  }
  const found = named(text)
  if (found) return `Found “${found.name}”: ${around(text, found.at, found.name.length + 20)}`
  // A personal LinkedIn link whose address spells a name on the page: linkedin.com/in/svetlanawhitener
  // + "Svetlana Whitener" (inlightcoaching.com, 2026-10-06). Covers first names the Census list lacks.
  // Reads the text before the quote cut: the link is the site's own (quote blocks are already out),
  // so the name it spells is staff, and a stray quote mark can't hide it (InLight's did).
  const ownText = extractText(own)
  for (const { href } of anchors(own)) {
    const slug = href.match(/linkedin\.com\/in\/([^/?#]+)/i)?.[1]
    if (!slug) continue
    let raw = slug
    try {
      raw = decodeURIComponent(slug) // a bad %-escape would throw
    } catch {}
    const letters = raw.toLowerCase().split('-').filter((p) => !/\d/.test(p)).join('').replace(/[^a-z]/g, '')
    if (letters.length < 6) continue
    for (const m of ownText.matchAll(new RegExp(FULL, 'g'))) {
      const name = m[1].trim()
      const flat = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '')
      if (!NOT_A_NAME.test(name) && (flat(name) === letters || flat(name.replace(/\s[A-Z]\.\s/, ' ')) === letters))
        return `Found “${name}”, with a LinkedIn profile (/in/${slug.slice(0, 40)})`
    }
  }
  for (const img of own.matchAll(/<img\b[^>]*>/gi)) {
    const attr = (n: string) =>
      img[0].match(new RegExp(`\\s${n}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'>]+))`, 'i'))?.slice(1).find((v) => v !== undefined) ?? ''
    const alt = attr('alt').trim()
    const shot = HEADSHOT_ALT_RE.exec(alt)
    if (shot && !NOT_A_NAME.test(shot[1])) return `A photo of “${shot[1]}”`
    const inAlt = named(alt)
    if (inAlt) return `A photo of “${inAlt.name}”: “${alt.slice(0, 80)}”`
    // An alt that is only a name doesn't count: customers' photos sit beside their reviews.
    const file = HEADSHOT_FILE_RE.exec(attr('src') || attr('data-src'))
    if (file && isFirstName(file[1])) return `A photo named “${file[0].replace(/^\//, '')}”`
  }
  return null
}

/** pageUrl (the address the page was read from) keeps About links and schema urls on the site itself. */
export function readProofSignals(
  html: string,
  pageText: string,
  jsonLdBlocks: RegExpMatchArray | null,
  pageUrl?: string,
): ProofSignals {
  const hasAboutLink = findAboutLink(html, pageUrl) !== undefined
  const hasTestimonials =
    TESTIMONIAL_RE.test(html) ||
    (html.match(/<blockquote/gi) ?? []).length >= 2
  const badge = imageWords(html).some((w) => IMAGE_CREDENTIALS_RE.test(w))
  const hasCredentials = CREDENTIALS_RE.test(pageText) || DEGREE_RE.test(pageText) || badge
  const hasLicences = LICENCE_RE.test(pageText) || DEGREE_RE.test(pageText) || badge
  const hasOrgSchema = businessEntryOf(jsonLdBlocks, pageText, hostOf(pageUrl)) !== null
  const hasPeople = findPerson(html, jsonLdBlocks) !== null

  const hasAddressInfo = hasReachInfo(html, pageText)
  const hasServiceArea = SERVICE_AREA_RE.test(pageText)
  const hasOneName = readNames(html, pageText, jsonLdBlocks, pageUrl)?.agree ?? false
  const hasBusinessType = BUSINESS_TYPE_RE.test(pageText)

  return {
    hasAboutLink,
    hasTestimonials,
    hasCredentials,
    hasLicences,
    hasOrgSchema,
    hasPeople,
    hasAddressInfo,
    hasServiceArea,
    hasOneName,
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
  pageUrl?: string,
): ProofEvidence {
  const out: ProofEvidence = {}

  const about = findAboutLink(html, pageUrl)
  if (about) {
    const words = extractText(about.inner).trim()
    out.hasAboutLink = `A link to “${about.href.slice(0, 60)}”${words ? ` (“${words.slice(0, 30)}”)` : ''}`
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

  const badge = imageWords(html).find((w) => IMAGE_CREDENTIALS_RE.test(w))
  out.hasCredentials =
    inText(CREDENTIALS_RE, pageText) ??
    inText(DEGREE_RE, pageText) ??
    (badge ? `An image called “${badge.slice(0, 70)}”` : undefined)
  out.hasLicences =
    inText(LICENCE_RE, pageText) ??
    inText(DEGREE_RE, pageText) ??
    (badge ? `An image called “${badge.slice(0, 70)}”` : undefined)

  const entry = businessEntryOf(jsonLdBlocks, pageText, hostOf(pageUrl))
  if (entry)
    out.hasOrgSchema = `Code that says this is ${/^[AEIOU]/.test(entry.type) ? 'an' : 'a'} “${entry.type}” named “${entry.name.slice(0, 60)}”`

  out.hasPeople = findPerson(html, jsonLdBlocks) ?? undefined
  out.hasAddressInfo =
    inText(PHONE_RE, pageText) ??
    inText(STREET_RE, pageText) ??
    (TEL_LINK_RE.test(html) ? 'A tap-to-call phone link' : undefined)
  out.hasServiceArea = inText(SERVICE_AREA_RE, pageText)
  const named = readNames(html, pageText, jsonLdBlocks, pageUrl)
  if (named?.agree) out.hasOneName = `Same name in the ${named.names.map((n) => n.where).join(', ')}: “${named.names[0].name.slice(0, 50)}”`
  out.hasBusinessType = inText(BUSINESS_TYPE_RE, pageText)

  for (const k of Object.keys(out) as (keyof ProofSignals)[]) if (!out[k]) delete out[k]
  return out
}
