/* ── Focus and Seen elsewhere (Authority Check only) ─────────────────────
 * Two checks from the SEO panel review (2026-10-02, rounds 2–4):
 *   Focus: the site has its own page for each thing it offers: services,
 *     products, practice areas, treatments, classes, features. Darren Shaw's
 *     2026 survey ranks a dedicated page per service #1 for local organic and
 *     #2 for AI search; it fits a SaaS or national site as well as a plumber.
 *   Seen elsewhere: the site points to other places that list, feature or
 *     recognise it (press, podcasts, associations, chambers, best-of lists,
 *     directories, partner directories). The site picks these links itself,
 *     so the check is worth little; Ahrefs DR stays the main off-site signal.
 * Review sites are counted in review-signals.ts, not here. Social profiles,
 * Wikipedia and podcast apps don't count: a site's own show or a general
 * Wikipedia link isn't someone else recognising it (labelled test set).
 * ─────────────────────────────────────────────────────────────────────── */

import { anchors, extractText } from './proof-signals'
import { reviewSiteOf } from './review-signals'

const bare = (h: string) => h.toLowerCase().replace(/^www\./, '')

/* ── Focus: offer pages ─────────────────────────────────────────────────── */

// A parent page that holds the offers: /services/drain-cleaning/, /practice-areas/dui/, /products/x/.
const OFFER_PARENT_RE =
  /^\/(?:our-)?(?:services?|products?|solutions?|practice-areas?|areas-of-practice|treatments?|procedures?|therap(?:y|ies)|classes|programs?|features?|capabilities|offerings?|what-we-do|specialt(?:y|ies)|collections?|product-category|categories|shop|menu|courses?|packages?)\/[^/?#]+/i
// The menu item those offers hang under: "Services", "What We Do", "Practice Areas"…
const OFFER_MENU_RE =
  /^(?:our )?(?:services?|products?|solutions?|practice areas?|areas of practice|treatments?|procedures?|therapies|classes|programs?|features?|capabilities|offerings?|what we do|specialties|shop|menu|courses?|packages?)$/i
// Pages that are not an offer even when they sit in a menu: posts, places, people, the usual pages.
const NOT_OFFER_RE =
  /\/(?:(?:our|meet|the)-)?(?:index|home|blog|news|articles?|posts?|case-stud(?:y|ies)|portfolio|work|gallery|photos?|videos?|media|press|podcasts?|locations?|areas?-we-serve|service-areas?|cities|directions|hours|team|staff|doctors?|providers|people|about|story|history|mission|values|why|process|approach|results|awards|community|partners|contact|careers?|jobs|employment|warrant(?:y|ies)|ourteam|faqs?|reviews?|testimonials?|privacy|terms|accessibility|sitemap|search|login|sign-?in|sign-?up|register|cart|checkout|account|tag|category|author|resources|newsletter|events?|calendar|schedule|book|booking|appointments?|request|quote|estimate|free-|pricing|rates|specials|coupons|offers|deals|promotions|financing|payments?|insurance|forms|new-patients?|patient-|gift-?cards?|order|reservations?|donate|membership|members|refer|careers|wp-|feed|cdn-cgi|welcome|what-to-expect|(?:your-)?first-visit|how-|tips|helpful|guides?|learn|education|library|links|recalls?|alerts?|wire-fraud|aftercare|featured|brands|departments|franchis|loyalty|join|clients|online-forms?)(?:[\/.?#-]|$)/i

// A town page: the last part of the address ends in a US state ("/plumbing-mt-lebanon-pa",
// "/roof-repair-boise-id") or says "near me". It's a place, not an offer (ajbuerkle.com, live test 2026-10-02).
const TOWN_PAGE_RE =
  /-(?:al|ak|az|ar|ca|co|ct|de|dc|fl|ga|hi|id|il|in|ia|ks|ky|la|me|md|ma|mi|mn|ms|mo|mt|ne|nv|nh|nj|nm|ny|nc|nd|oh|ok|or|pa|ri|sc|sd|tn|tx|ut|vt|va|wa|wv|wi|wy)$|-near-me$/
const isTownPage = (path: string) => TOWN_PAGE_RE.test(path.split('/').filter(Boolean).pop() ?? '')

/** The links in the site's menu: inside <nav> or <header>, else the first list with 4+ links. */
function menuHtml(html: string): string {
  const parts = [...html.matchAll(/<(nav|header)\b[\s\S]*?<\/\1>/gi)].map((m) => m[0])
  if (parts.length) return parts.join(' ')
  return [...html.matchAll(/<ul\b[\s\S]*?<\/ul>/gi)].map((m) => m[0]).find((ul) => (ul.match(/<a\b/gi) ?? []).length >= 4) ?? ''
}

/** A same-site link's path ("/services/seo"), or null for anchors, files and other sites. */
function sitePath(href: string, host: string): string | null {
  if (/^(?:mailto:|tel:|javascript:|#)/i.test(href)) return null
  let u: URL
  try {
    u = new URL(href, `https://${host}/`)
  } catch {
    return null
  }
  if (!['http:', 'https:'].includes(u.protocol) || bare(u.hostname) !== host) return null
  if (/\.(?:png|jpe?g|webp|gif|svg|avif|pdf)$/i.test(u.pathname)) return null
  const path = u.pathname.replace(/\/+$/, '') || '/'
  return path === '/' ? null : path.toLowerCase()
}

/**
 * The site's own pages for what it offers, found two ways: pages under an offer
 * folder (/services/x/), and the links in a menu item called "Services" (or
 * "Practice Areas", "What We Do"…), which catches offers at the top level
 * (/drain-cleaning/). Distinct pages, the parent page itself left out.
 */
export function findOfferPages(html: string, pageUrl: string): string[] {
  let host: string
  try {
    host = bare(new URL(pageUrl).hostname)
  } catch {
    return []
  }
  const pages = new Set<string>()
  for (const a of anchors(html)) {
    const path = sitePath(a.href, host)
    if (path && OFFER_PARENT_RE.test(path) && !NOT_OFFER_RE.test(path) && !isTownPage(path)) pages.add(path)
  }
  // A menu item named for the offers, then the first list after it: its links are the offers.
  const menuItem = /<a\b[^>]*>([\s\S]{0,120}?)<\/a>|<(?:span|button|div)\b[^>]*>([^<]{0,40})<\/(?:span|button|div)>/gi
  for (const m of html.matchAll(menuItem)) {
    const words = extractText(m[1] ?? m[2] ?? '').trim()
    if (!OFFER_MENU_RE.test(words)) continue
    const after = html.slice(m.index! + m[0].length, m.index! + m[0].length + 6_000)
    const list = after.match(/^[\s\S]{0,400}?<ul\b[^>]*>([\s\S]*?)<\/ul>/i)?.[1]
    if (!list) continue
    for (const a of anchors(list)) {
      const path = sitePath(a.href, host)
      if (path && !NOT_OFFER_RE.test(path) && !isTownPage(path)) pages.add(path)
    }
  }
  // The menu's own pages, other than the usual ones (about, contact, blog…): sites that keep
  // their offers at the top level (/plumbing, /heating, /brand-strategy) list them there.
  for (const a of anchors(menuHtml(html))) {
    const path = sitePath(a.href, host)
    if (path && !NOT_OFFER_RE.test(path) && !isTownPage(path) && path.split('/').length <= 4) pages.add(path)
  }
  // The parent pages themselves (/services) aren't offers.
  for (const p of [...pages]) if ([...pages].some((q) => q !== p && q.startsWith(`${p}/`)) && p.split('/').length === 2) pages.delete(p)
  return [...pages]
}

/* ── Seen elsewhere ─────────────────────────────────────────────────────── */

// Where a business is listed, featured or recognised, by host (and path when the host is broad).
const SEEN: { name: string; test: (host: string, path: string) => boolean }[] = [
  { name: 'LinkedIn', test: (h, p) => h.endsWith('linkedin.com') && /^\/(?:company|school|showcase)\//.test(p) },
  { name: 'Crunchbase', test: (h, p) => h === 'crunchbase.com' && p.startsWith('/organization/') },
  { name: 'Google Partners', test: (h, p) => (h === 'google.com' && p.startsWith('/partners/')) || h === 'partners.google.com' },
  { name: 'HubSpot partner directory', test: (h, p) => h === 'ecosystem.hubspot.com' || (h === 'hubspot.com' && p.startsWith('/agencies')) },
  { name: 'Shopify partner directory', test: (h, p) => h === 'shopify.com' && p.startsWith('/partners/directory') },
  { name: 'Meta partner directory', test: (h, p) => h === 'facebook.com' && p.startsWith('/business/marketing-partners') },
  { name: 'Dun & Bradstreet', test: (h, p) => h === 'dnb.com' && p.startsWith('/business-directory') },
  { name: 'Wikidata', test: (h, p) => h === 'wikidata.org' && p.startsWith('/wiki/q') },
  { name: 'AAA', test: (h, p) => h === 'aaa.com' && p.length > 1 },
  { name: 'Yellow Pages', test: (h, p) => h === 'yellowpages.com' && p.length > 1 },
  { name: 'Expertise.com', test: (h, p) => h === 'expertise.com' && p.length > 1 },
  { name: 'UpCity', test: (h, p) => h === 'upcity.com' && p.length > 1 },
  { name: 'DesignRush', test: (h, p) => h === 'designrush.com' && p.length > 1 },
  { name: 'GoodFirms', test: (h, p) => h === 'goodfirms.co' && p.length > 1 },
  { name: 'Alignable', test: (h, p) => h === 'alignable.com' && p.length > 1 },
  { name: 'Manta', test: (h, p) => h === 'manta.com' && p.startsWith('/c/') },
  { name: 'Three Best Rated', test: (h) => h === 'threebestrated.com' },
  { name: 'Super Lawyers', test: (h) => h.endsWith('superlawyers.com') },
  { name: 'Justia', test: (h, p) => h === 'justia.com' && p.startsWith('/lawyers') },
  { name: 'Lawyers.com', test: (h) => h === 'lawyers.com' },
  { name: 'FindLaw', test: (h) => h.endsWith('findlaw.com') },
  { name: 'Product Hunt', test: (h, p) => h === 'producthunt.com' && p.startsWith('/products/') },
  // Press and podcasts: an article or episode, not the outlet's homepage.
  {
    name: 'press',
    test: (h, p) =>
      /(?:^|\.)(?:forbes|inc|entrepreneur|fastcompany|adweek|adage|businessinsider|bizjournals|nytimes|wsj|washingtonpost|usatoday|cnbc|bloomberg|reuters|apnews|techcrunch|theverge|wired|marketingland|searchengineland|searchenginejournal|patch|post-gazette|nbcnews|cbsnews|abcnews|foxbusiness|huffpost|rollingstone|marketwatch|yahoo)\.com$/.test(h) &&
      p.split('/').filter(Boolean).length >= 2,
  },
  // Best-of lists and award sites: "bestofavl.com", "…/best-wedding-photographers/".
  { name: 'best-of list', test: (h, p) => /bestof|best-of|awards?\./.test(h) || /\/(?:best|top)-[\w-]+/.test(p) },
  // Chambers of commerce and associations: a .org whose name says so.
  { name: 'chamber or association', test: (h) => /chamber|association|assn|society|institute|guild|federation|council|alliance|board/.test(h) && /\.(?:org|org\.\w+|net)$/.test(h) },
]

/** The other places this site points to that list or feature it: one name per place, in page order. */
export function findSeenElsewhere(htmls: { html: string; url: string }[]): string[] {
  const out: string[] = []
  for (const { html, url } of htmls) {
    let own = ''
    try {
      own = bare(new URL(url).hostname).replace(/^[^.]+\.(?=[^.]+\.[^.]+$)/, '')
    } catch {}
    const hrefs = [
      ...anchors(html).map((a) => a.href),
      ...[...html.matchAll(/"sameAs"\s*:\s*(\[[^\]]*\]|"[^"]*")/g)].flatMap((m) => [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1].replace(/\\\//g, '/'))),
    ]
    for (const href of hrefs) {
      if (!/^(?:https?:)?\/\//i.test(href) || reviewSiteOf(href)) continue
      let u: URL
      try {
        u = new URL(href, 'https://x.invalid/')
      } catch {
        continue
      }
      const host = bare(u.hostname)
      if (own && (host === own || host.endsWith(`.${own}`))) continue
      const hit = SEEN.find((s) => s.test(host, u.pathname.toLowerCase()))
      const name = hit?.name === 'press' || hit?.name === 'best-of list' || hit?.name === 'chamber or association' ? host : hit?.name
      if (name && !out.includes(name)) out.push(name)
    }
  }
  return out
}
