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
  /** Trust signals: licenses, awards, years in business. */
  hasCredentials: boolean
  /** Trust signals: Organization / LocalBusiness / Person / ProfessionalService JSON-LD. */
  hasOrgSchema: boolean
  /** Trust signals: a named person who works there (findPerson). */
  hasPeople: boolean
  /** Entity clarity: address, location, phone, service area words. */
  hasAddressInfo: boolean
  /** Entity clarity: a plain business-type word (plumber, bakery, agency…). */
  hasBusinessType: boolean
}


// The rules, once. All non-global, so .test()/.exec() keep no state between calls.
// About links (widened 2026-10-02): by a path segment, or by the link's words ("MORE ABOUT ME"),
// on the site itself: not linkedin.com/company/…/about, not an image file ("…/isteam/…").
// The word starts the page name ("/company/", "/our-team/", "/meet-the-team/"), so service
// pages like "/michigan-seo-company/" or "/thought-leadership/" don't count.
const ABOUT_PATH_RE =
  /\/(?:our-|meet-(?:the-|our-)?|the-)?(?:about|team|who-we-are|story|company|people|mission|history|staff|leadership|founders?|owners?|why-us|culture|values|firm|attorneys|lawyers|doctors|dentists|providers|practice)(?:[\/.?#-]|$)/i
const ABOUT_WORDS_RE =
  /^(?:(?:more |learn more )?about(?: us| me)?|about (?:the|our) (?:company|team|firm|practice|story|people|doctors?|attorneys?)|our (?:story|team|people|company|firm|practice|history|mission|staff|doctors|attorneys)|meet (?:the |our |dr\.? )?\w+|who we are|company|the team|team)$/i
const NOT_SITE_RE =
  /^(?:mailto:|tel:|javascript:)|\/\/(?:[\w-]+\.)*(?:linkedin|facebook|instagram|twitter|x|youtube|tiktok|pinterest|google|yelp|bbb|wsimg)\.(?:com|org)\b|\.(?:png|jpe?g|webp|gif|svg|avif|pdf)(?:[?#]|$)/i
const isAboutLink = (a: { href: string; inner: string }) =>
  !NOT_SITE_RE.test(a.href) &&
  (ABOUT_PATH_RE.test(a.href.replace(/^https?:\/\/[^/]+/i, '')) || ABOUT_WORDS_RE.test(extractText(a.inner).trim()))
const findAboutLink = lastOf((html: string): { href: string; inner: string } | undefined => anchors(html).find(isAboutLink))

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
  const bare = (h: string) => h.toLowerCase().replace(/^www\./, '')
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
// The same, read from what images are called: alt, title, file name (badges are images).
const IMAGE_CREDENTIALS_RE =
  /\b(badges?|certified|certification|accredited|awards?|winner|aaha|(?:premier|certified|google|meta|microsoft|hubspot|shopify|tiktok|amazon|klaviyo|official|preferred|authorized|select) partner|inc\.? ?5000|clutch|upcity|designrush|goodfirms|bbb|best of \d{4}|top rated)\b/i // not "David Kadosh | Partner" (a client's job title)
const ORG_SCHEMA_RE = /Organization|LocalBusiness|Person|ProfessionalService/i
// schema.org's LocalBusiness subtypes, named as an @type on their own ("Dentist", "AutoRepair",
// "LegalService", "HVACBusiness"): by suffix, then the ones with no shared ending. Plain "Service"
// (an offer, not a business) doesn't count.
const ORG_SUBTYPE_RE =
  /"@type"\s*:\s*(?:\[(?:\s*"[^"]*"\s*,)*\s*)?"(?:\w*(?:Business|Store|Shop|Contractor|Salon|Agency|Restaurant|Establishment|Clinic)|Dentist|Physician|Attorney|Notary|Plumber|Electrician|Locksmith|HousePainter|MovingCompany|Bakery|Brewery|Winery|Distillery|BarOrPub|Florist|Hotel|Motel|Resort|Hostel|BedAndBreakfast|DaySpa|HealthClub|ExerciseGym|TattooParlor|AutoRepair|AutoDealer|AutoRental|AutoWash|GasStation|MotorcycleDealer|MotorcycleRepair|ChildCare|Optician|Pharmacy|VeterinaryCare|RealEstateAgent|AccountingService|FinancialService|LegalService|EmergencyService|BankOrCreditUnion|DryCleaningOrLaundry|SelfStorage|Corporation|NGO|SportsActivityLocation|GolfCourse)"/
const isOrgSchema = (block: string) => ORG_SCHEMA_RE.test(block) || ORG_SUBTYPE_RE.test(block)
const ADDRESS_RE = /\b(address|location|phone|tel|headquarter|based in|serving|office)\b/i
// The things themselves, not only the words (9 of 39 fixture sites showed a number or street with
// neither word, 2026-10-02): a phone number, a tel: link, a street address.
const PHONE_RE = /(?:\+?1[\s.-]?)?\(?\b[2-9]\d{2}\)?[\s.-]\d{3}[\s.-]\d{4}\b/
const TEL_LINK_RE = /href\s*=\s*["']?tel:/i
const STREET_RE =
  /\b\d{1,6}\s+(?:[NSEW]\.?\s+)?(?:(?:[A-Z][a-z]+\.?|\d+(?:st|nd|rd|th))\s+){1,3}(?:St|Street|Ave|Avenue|Rd|Road|Blvd|Boulevard|Dr|Drive|Ln|Lane|Way|Pkwy|Parkway|Ct|Court|Pl|Place|Hwy|Highway|Pike|Sq|Square|Ter|Terrace|Cir|Circle)\b/
const hasReachInfo = (html: string, pageText: string) =>
  ADDRESS_RE.test(pageText) || PHONE_RE.test(pageText) || STREET_RE.test(pageText) || TEL_LINK_RE.test(html)
const BUSINESS_TYPE_RE =
  /\b(agency|company|firm|consultant|freelanc|studio|practice|shop|store|restaurant|salon|spa|clinic|gym|church|school|contractor|dentist|doctor|lawyer|attorney|plumb|electric|mover|moving|clean|bakery|brewery|florist|veterinar|daycare|auto|insurance|account|roofing|hvac|landscap|photograph|catering|fitness|wellness|therapy|coaching|nonprofit|realtor|real estate|architect|engineer|construct|tattoos?|piercing|yoga|pilates|pest control|exterminators?|chiropractors?|chiropractic|massage|barbers?|optometrists?|pharmacy|grooming)\b/i

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

export function readProofSignals(
  html: string,
  pageText: string,
  jsonLdBlocks: RegExpMatchArray | null,
): ProofSignals {
  const hasAboutLink = findAboutLink(html) !== undefined
  const hasTestimonials =
    TESTIMONIAL_RE.test(html) ||
    (html.match(/<blockquote/gi) ?? []).length >= 2
  const hasCredentials =
    CREDENTIALS_RE.test(pageText) || DEGREE_RE.test(pageText) || imageWords(html).some((w) => IMAGE_CREDENTIALS_RE.test(w))
  const hasOrgSchema = jsonLdBlocks?.some(isOrgSchema) ?? false
  const hasPeople = findPerson(html, jsonLdBlocks) !== null

  const hasAddressInfo = hasReachInfo(html, pageText)
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

  const about = findAboutLink(html)
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

  const block = jsonLdBlocks?.find(isOrgSchema)
  if (block) {
    const type = ORG_SCHEMA_RE.exec(block)?.[0] ?? ORG_SUBTYPE_RE.exec(block)![0].match(/"(\w+)"$/)![1]
    out.hasOrgSchema = `Code that says this is a “${type}”`
  }

  out.hasPeople = findPerson(html, jsonLdBlocks) ?? undefined
  out.hasAddressInfo =
    inText(PHONE_RE, pageText) ??
    inText(STREET_RE, pageText) ??
    (TEL_LINK_RE.test(html) ? 'A tap-to-call phone link' : undefined) ??
    inText(ADDRESS_RE, pageText)
  out.hasBusinessType = inText(BUSINESS_TYPE_RE, pageText)

  for (const k of Object.keys(out) as (keyof ProofSignals)[]) if (!out[k]) delete out[k]
  return out
}
