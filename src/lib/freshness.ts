/* ── Authority Check: "Recently updated" (Trust, up to 4 points) ────────────
 * Sitemap dates alone are easy to fake by accident: many sites' software
 * stamps every page with today's date (SEO panel, round 2). So a date counts
 * only from a source a person sets (Chris, 2026-10-05):
 *   1. The blog feed's newest post date (RSS pubDate / Atom published).
 *   2. A sitemap date that its own page confirms: one of the newest 3 real
 *      pages in the sitemap shows the same day in its own date tags (± 3 days).
 * Finding them without guessing: the sitemap from robots.txt's "Sitemap:"
 * line, then the usual names; the feed from the homepage's own <link>, else
 * the one address for the site's platform. Authority Check only.
 * Parsing is one pass with indexOf, never a backtracking regex over a whole
 * file, and files are cut at PARSE_MAX: a broken or hostile 2 MB sitemap
 * froze the old regexes for minutes (audit 2026-10-05, measured).
 * ─────────────────────────────────────────────────────────────────────── */

import type { FetchResult } from './fetch-guard'
import type { Reader } from './authority-read'
import type { Updated } from './authority-check'

const TIMEOUT = 3_000
const DAY = 86_400_000
/** How far a page's own date may be from its sitemap date and still confirm it. */
const CONFIRM_DAYS = 3
/** Sitemaps, feeds and pages are parsed only this far. */
const PARSE_MAX = 1_000_000
/** How many of the newest real sitemap pages are read to find one that confirms its date. */
const CONFIRM_TRIES = 3

const ok = (r: FetchResult | null): r is FetchResult => !!r && r.status >= 200 && r.status < 300
const decode = (s: string) => s.replace(/&amp;/g, '&').trim()
const pathOf = (url: string) => {
  try {
    return new URL(url).pathname
  } catch {
    return url
  }
}
const bareHost = (u: string) => {
  try {
    return new URL(u).hostname.toLowerCase().replace(/^www\./, '')
  } catch {
    return ''
  }
}
/** The same site: one host, or a subdomain of the other (blog.x.com belongs to x.com). */
const sameSite = (a: string, b: string) => !!a && !!b && (a === b || a.endsWith(`.${b}`) || b.endsWith(`.${a}`))
/** An absolute URL on the same site, or null. */
const onSite = (raw: string, base: string): string | null => {
  try {
    const u = new URL(decode(raw), base)
    return ['http:', 'https:'].includes(u.protocol) && sameSite(bareHost(u.toString()), bareHost(base)) ? u.toString() : null
  } catch {
    return null
  }
}
/** A date we can use: parses, and isn't in the future (1 day of clock slack). */
const usable = (s: string | undefined, now: number): number | null => {
  if (!s) return null
  const t = Date.parse(s.trim())
  return Number.isFinite(t) && t <= now + DAY ? t : null
}
const dayOf = (t: number) => new Date(t).toISOString().slice(0, 10)

/* ── One-pass helpers ────────────────────────────────────────────────────── */

const isTagEnd = (c: string | undefined) => c === undefined || c === '>' || c === '/' || /\s/.test(c)

/** The inside of every <name …>…</name> block, in one pass. Unclosed blocks are skipped. */
function blocksOf(text: string, name: string): string[] {
  const s = text.length > PARSE_MAX ? text.slice(0, PARSE_MAX) : text
  const lower = s.toLowerCase()
  // Matched against lowercased text, so the tag name is lowercased too (pubDate, dc:date).
  const open = `<${name.toLowerCase()}`
  const close = `</${name.toLowerCase()}`
  const out: string[] = []
  let i = 0
  for (;;) {
    i = lower.indexOf(open, i)
    if (i === -1) break
    if (!isTagEnd(lower[i + open.length])) {
      i += open.length
      continue
    }
    const start = lower.indexOf('>', i)
    if (start === -1) break
    const end = lower.indexOf(close, start)
    if (end === -1) break
    out.push(s.slice(start + 1, end))
    i = end + close.length
  }
  return out
}

/** Every <name …> start tag, whole, in one pass. */
function tagsOf(text: string, name: string): string[] {
  const s = text.length > PARSE_MAX ? text.slice(0, PARSE_MAX) : text
  const lower = s.toLowerCase()
  const open = `<${name.toLowerCase()}`
  const out: string[] = []
  let i = 0
  for (;;) {
    i = lower.indexOf(open, i)
    if (i === -1) break
    const end = lower.indexOf('>', i)
    if (end === -1) break
    if (isTagEnd(lower[i + open.length])) out.push(s.slice(i, end + 1))
    i = end + 1
  }
  return out
}

/** The text inside the first <name>…</name> of a small block. */
const inner = (block: string, name: string): string | undefined => blocksOf(block, name)[0]?.trim() || undefined
const attr = (tag: string, name: string) => new RegExp(`\\s${name}\\s*=\\s*["']([^"']*)["']`, 'i').exec(tag)?.[1]

/* ── Sitemap ─────────────────────────────────────────────────────────────── */

/** The usual sitemap addresses, after robots.txt's own lines. */
export const SITEMAP_PATHS = ['/sitemap.xml', '/sitemap_index.xml', '/wp-sitemap.xml']

export const isSitemap = (r: FetchResult | null): r is FetchResult =>
  ok(r) && /<(?:urlset|sitemapindex)\b/i.test(r.body.slice(0, 5_000))

/** "Sitemap: https://…" lines in robots.txt, on the same site. */
export function sitemapsFromRobots(txt: string, siteUrl: string): string[] {
  return txt
    .slice(0, 100_000)
    .split(/\r?\n/)
    .map((l) => /^\s*sitemap\s*:\s*(\S+)/i.exec(l)?.[1])
    .filter((u): u is string => !!u)
    .map((u) => onSite(u, siteUrl))
    .filter((u): u is string => !!u)
}

interface Dated {
  t: number
  url: string
}

/** Every dated entry on the same site: pages in a urlset, or sub-sitemaps in an index. */
export function sitemapEntries(xml: string, now: number, sitemapUrl: string): { entries: Dated[]; isIndex: boolean; urls: number } {
  const isIndex = /<sitemapindex\b/i.test(xml.slice(0, 5_000))
  const entries: Dated[] = []
  let urls = 0
  for (const block of blocksOf(xml, isIndex ? 'sitemap' : 'url')) {
    const loc = inner(block, 'loc')
    const url = loc ? onSite(loc, sitemapUrl) : null
    if (!url) continue
    urls++
    const t = usable(inner(block, 'lastmod'), now)
    if (t !== null) entries.push({ t, url })
  }
  return { entries, isIndex, urls }
}

/** The day most entries share, when it's likely stamped by software (5+ dates, 80%+ on it). */
function stampedDay(entries: Dated[]): string | null {
  if (entries.length < 5) return null
  const perDay = new Map<string, number>()
  for (const e of entries) perDay.set(dayOf(e.t), (perDay.get(dayOf(e.t)) ?? 0) + 1)
  const [day, n] = [...perDay.entries()].reduce((a, b) => (b[1] > a[1] ? b : a))
  return n / entries.length >= 0.8 ? day : null
}

export const isStamped = (entries: Dated[]): boolean => stampedDay(entries) !== null

/**
 * The entries worth trusting: a stamped day's dates are set aside and the rest kept
 * (a mixed sitemap: build-time dates on most pages, real ones on posts, like chrishornak.com's
 * before 2026-10-05). Empty when every date is on the stamped day.
 */
export function realEntries(entries: Dated[]): Dated[] {
  const day = stampedDay(entries)
  return day ? entries.filter((e) => dayOf(e.t) !== day) : entries
}

const newest = (entries: Dated[]) => entries.reduce<Dated | null>((a, b) => (!a || b.t > a.t ? b : a), null)

/* ── Feed ────────────────────────────────────────────────────────────────── */

// WordPress gives every page its own comments feed ("/about/feed/"): not the blog.
const BLOG_SEGMENT_RE = /^(?:blog|news|articles|insights|posts|journal|updates|stories|resources)$/i

/** The blog feed the homepage points to (<link rel="alternate" type="application/rss+xml">), on the same site. */
export function findFeedUrl(html: string, pageUrl: string): string | null {
  // Feed links sit near the top, but not always inside <head>: Next.js can stream metadata into
  // the body (chrishornak.com, 2026-10-05). The first 300 KB are scanned, in one pass.
  for (const tag of tagsOf(html.slice(0, 300_000), 'link')) {
    if (!/type\s*=\s*["']application\/(?:rss|atom)\+xml["']/i.test(tag) || /comments/i.test(tag)) continue
    const href = attr(tag, 'href')
    const url = href ? onSite(href, pageUrl) : null
    if (!url) continue
    const segs = new URL(url).pathname.split('/').filter(Boolean)
    // "/<page>/feed/" is a page's comments feed unless the page is the blog.
    if (segs.length === 2 && /^feed$/i.test(segs[1]) && !BLOG_SEGMENT_RE.test(segs[0])) continue
    return url
  }
  return null
}

/** No feed link: the one feed address for the site's platform, or null. */
export function guessFeedUrl(html: string, pageUrl: string): string | null {
  const at = (p: string) => {
    try {
      return new URL(p, pageUrl).toString()
    } catch {
      return null
    }
  }
  const sample = html.slice(0, 300_000)
  if (/\/wp-content\/|\/wp-includes\//i.test(sample)) return at('/feed/')
  if (/static\.wixstatic\.com|wix\.com\b/i.test(sample)) return at('/blog-feed.xml')
  if (/squarespace/i.test(sample)) return at('/blog?format=rss')
  if (/cdn\.shopify\.com/i.test(sample)) return at('/blogs/news.atom')
  if (tagsOf(sample, 'meta').some((t) => /generator/i.test(t) && /ghost/i.test(t))) return at('/rss/')
  if (/js\.hs-scripts\.com|hubspot/i.test(sample)) return at('/blog/rss.xml')
  return null
}

/** The newest post in an RSS or Atom feed: its publish date (Atom: published, else updated). */
export function newestFeedPost(xml: string, now: number): Dated | null {
  const posts: Dated[] = []
  for (const item of blocksOf(xml, 'item')) {
    const t = usable(inner(item, 'pubDate') ?? inner(item, 'dc:date'), now)
    if (t !== null) posts.push({ t, url: decode(inner(item, 'link') ?? '') })
  }
  for (const entry of blocksOf(xml, 'entry')) {
    const t = usable(inner(entry, 'published') ?? inner(entry, 'updated'), now)
    const link = tagsOf(entry, 'link').map((l) => attr(l, 'href')).find(Boolean) ?? ''
    if (t !== null) posts.push({ t, url: decode(link) })
  }
  return newest(posts)
}

/* ── A page's own dates ──────────────────────────────────────────────────── */

const PAGE_META = /(?:property|name|itemprop)\s*=\s*["'](?:article:modified_time|article:published_time|og:updated_time|datemodified|datepublished|last-modified)["']/i
// Only the page's own JSON-LD node: not a review widget's or an event's dates.
const PAGE_TYPES = /^(?:Article|BlogPosting|NewsArticle|TechArticle|Report|WebPage|AboutPage|ContactPage|CollectionPage|FAQPage|ItemPage|ProfilePage|Product|Service)$/i
const MONTHS = 'jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?'
const VISIBLE_DATE_RE = new RegExp(
  `(?:updated|published|posted|last edited)(?:\\s+on)?:?\\s+((?:${MONTHS})\\.?\\s+\\d{1,2}(?:st|nd|rd|th)?,?\\s+\\d{4}|\\d{1,2}\\s+(?:${MONTHS})\\.?,?\\s+\\d{4}|\\d{4}-\\d{2}-\\d{2})`,
  'i',
)

/** JSON-LD nodes of a page type, walking @graph. */
function pageNodes(json: unknown): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = []
  const walk = (v: unknown) => {
    if (Array.isArray(v)) return v.forEach(walk)
    if (!v || typeof v !== 'object') return
    const o = v as Record<string, unknown>
    const types = ([] as unknown[]).concat(o['@type'] ?? [])
    if (types.some((t) => typeof t === 'string' && PAGE_TYPES.test(t))) out.push(o)
    if (o['@graph']) walk(o['@graph'])
  }
  walk(json)
  return out
}

/**
 * The dates a page gives itself: page-level meta tags, the page's own JSON-LD node
 * (Article / WebPage…, not a review or event inside it), <time datetime> inside
 * <article> or <main>, and "Updated on …" in the main text.
 */
export function pageDates(html: string, now: number): number[] {
  const page = html.length > PARSE_MAX ? html.slice(0, PARSE_MAX) : html
  const raw: string[] = []
  for (const tag of tagsOf(page, 'meta')) if (PAGE_META.test(tag)) raw.push(attr(tag, 'content') ?? '')
  for (const json of blocksOf(page, 'script')) {
    const t = json.trimStart()
    if (!/^[[{]/.test(t) || !t.includes('"@type"') || !/date(?:Modified|Published)/.test(t)) continue
    try {
      for (const n of pageNodes(JSON.parse(json))) for (const k of ['dateModified', 'datePublished']) if (typeof n[k] === 'string') raw.push(n[k] as string)
    } catch {}
  }
  const main = [...blocksOf(page, 'article'), ...blocksOf(page, 'main')].join(' ')
  for (const tag of tagsOf(main, 'time')) raw.push(attr(tag, 'datetime') ?? '')
  const text = (main || page)
    .slice(0, 200_000)
    .replace(/<[^>]{0,2000}>/g, ' ')
    .replace(/&nbsp;|&#160;| /gi, ' ')
  const seen = VISIBLE_DATE_RE.exec(text)?.[1]
  if (seen) raw.push(seen.replace(/(\d)(st|nd|rd|th)\b/gi, '$1'))
  return raw.map((s) => usable(s, now)).filter((t): t is number => t !== null)
}

/** The page shows a date within CONFIRM_DAYS of the sitemap's date. */
export function confirms(html: string, t: number, now: number): boolean {
  return pageDates(html, now).some((d) => Math.abs(d - t) <= CONFIRM_DAYS * DAY)
}

/* ── The reads ───────────────────────────────────────────────────────────── */

/** First-round reads, started by readSite alongside its other reads. */
export interface FreshStart {
  robots: Promise<FetchResult | null>
  sitemap: Promise<FetchResult | null>
  feed: Promise<FetchResult | null>
}

export function startFreshness(home: FetchResult, reader: Reader): FreshStart {
  const at = (p: string) => new URL(p, home.finalUrl).toString()
  const feedUrl = findFeedUrl(home.body, home.finalUrl) ?? guessFeedUrl(home.body, home.finalUrl)
  return {
    robots: reader.page(at('/robots.txt'), TIMEOUT).catch(() => null),
    sitemap: reader.page(at(SITEMAP_PATHS[0]), TIMEOUT).catch(() => null),
    feed: feedUrl ? reader.page(feedUrl, TIMEOUT).catch(() => null) : Promise.resolve(null),
  }
}

/** The site's sitemap: robots.txt's first, then the usual names. Read side by side; best match wins. */
export async function resolveSitemap(home: FetchResult, start: FreshStart, reader: Reader, deadline: number): Promise<FetchResult | null> {
  const [robots, first] = await Promise.all([start.robots, start.sitemap])
  const fromRobots = ok(robots) && !/<html\b/i.test(robots.body.slice(0, 2_000)) ? sitemapsFromRobots(robots.body, home.finalUrl) : []
  const firstUrl = new URL(SITEMAP_PATHS[0], home.finalUrl).toString()
  // robots.txt names it: that wins, even over /sitemap.xml.
  const wanted = [...fromRobots, ...SITEMAP_PATHS.map((p) => new URL(p, home.finalUrl).toString())].filter(
    (u, i, all) => all.indexOf(u) === i,
  )
  if (isSitemap(first) && (!fromRobots.length || fromRobots.includes(firstUrl))) return first
  if (Date.now() > deadline) return isSitemap(first) ? first : null
  const rest = wanted.filter((u) => u !== firstUrl).slice(0, 3)
  const reads = await Promise.all(rest.map((u) => reader.page(u, TIMEOUT).catch(() => null)))
  for (const u of wanted) {
    const r = u === firstUrl ? first : reads[rest.indexOf(u)]
    if (isSitemap(r ?? null)) return r!
  }
  return null
}

/** "Recently updated": the feed's newest post, or one of the sitemap's newest pages when the page confirms its date. */
export async function readFreshness(
  sitemap: FetchResult | null,
  start: FreshStart,
  reader: Reader,
  now: number,
  deadline: number,
): Promise<Updated> {
  const feedRes = await start.feed
  const post = ok(feedRes) ? newestFeedPost(feedRes.body, now) : null

  // The sitemap's newest pages, confirmed by the page itself.
  let page: Dated | null = null
  let claim: Dated | null = null
  let why: Updated['why'] = sitemap ? undefined : 'none'
  if (sitemap) {
    const top = sitemapEntries(sitemap.body, now, sitemap.finalUrl)
    let entries = top.entries
    if (top.isIndex) {
      // The sub-sitemap that changed last (else the first), then its pages.
      const pick = newest(top.entries)?.url ?? (blocksOf(sitemap.body, 'loc')[0] ? onSite(blocksOf(sitemap.body, 'loc')[0], sitemap.finalUrl) : null)
      const sub = pick && Date.now() <= deadline ? await reader.page(pick, TIMEOUT).catch(() => null) : null
      if (!isSitemap(sub)) why = 'not-read'
      entries = isSitemap(sub) ? sitemapEntries(sub.body, now, sub.finalUrl).entries : []
    }
    const real = realEntries(entries)
    if (why === 'not-read') {
      // the sub-sitemap couldn't be read: nothing was checked
    } else if (!entries.length) why = 'no-dates'
    else if (!real.length) why = 'stamped'
    else {
      // The newest few real pages, newest first: the first that shows its own date confirms it.
      const tries = [...real].sort((a, b) => b.t - a.t).slice(0, CONFIRM_TRIES)
      claim = tries[0]
      let readAny = false
      for (const c of tries) {
        if (Date.now() > deadline) break
        const res = await reader.page(c.url, TIMEOUT).catch(() => null)
        if (!ok(res)) continue
        readAny = true
        if (confirms(res.body, c.t, now)) {
          page = c
          break
        }
      }
      if (!page) why = readAny ? 'unconfirmed' : 'not-read'
    }
  }

  const best = post && page ? (post.t >= page.t ? { d: post, source: 'feed' as const } : { d: page, source: 'page' as const })
    : post ? { d: post, source: 'feed' as const }
    : page ? { d: page, source: 'page' as const }
    : null
  if (best) return { newest: dayOf(best.d.t), path: best.d.url ? pathOf(best.d.url) : undefined, source: best.source }
  return {
    newest: null,
    why,
    ...(claim ? { claimed: dayOf(claim.t), claimedPath: pathOf(claim.url) } : {}),
  }
}
