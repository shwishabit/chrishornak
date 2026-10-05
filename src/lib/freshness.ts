/* ── Authority Check: "Recently updated" (shown only, for now) ─────────────
 * Sitemap dates alone are easy to fake by accident: many sites' software
 * stamps every page with today's date (SEO panel, round 2). So a date counts
 * only from a source a person sets (Chris, 2026-10-05):
 *   1. The blog feed's newest post date (RSS pubDate / Atom published).
 *   2. A sitemap date that its own page confirms: the newest page in the
 *      sitemap shows the same day in its code or text (± 3 days).
 * Finding them without guessing: the sitemap from robots.txt's "Sitemap:"
 * line, then the usual names; the feed from the homepage's own <link>, else
 * the one address for the site's platform. Authority Check only.
 * ─────────────────────────────────────────────────────────────────────── */

import type { FetchResult } from './fetch-guard'
import type { Reader } from './authority-read'
import type { Updated } from './authority-check'

const TIMEOUT = 3_000
const DAY = 86_400_000
/** How far a page's own date may be from its sitemap date and still confirm it. */
const CONFIRM_DAYS = 3

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
/** A date we can use: parses, and isn't in the future (1 day of clock slack). */
const usable = (s: string | undefined, now: number): number | null => {
  if (!s) return null
  const t = Date.parse(s.trim())
  return Number.isFinite(t) && t <= now + DAY ? t : null
}
const dayOf = (t: number) => new Date(t).toISOString().slice(0, 10)

/* ── Sitemap ─────────────────────────────────────────────────────────────── */

/** The usual sitemap addresses, after robots.txt's own lines. */
export const SITEMAP_PATHS = ['/sitemap.xml', '/sitemap_index.xml', '/wp-sitemap.xml']

export const isSitemap = (r: FetchResult | null): r is FetchResult =>
  ok(r) && /<(?:urlset|sitemapindex)\b/i.test(r.body)

/** "Sitemap: https://…" lines in robots.txt, on the site's own host. */
export function sitemapsFromRobots(txt: string, siteUrl: string): string[] {
  const host = bareHost(siteUrl)
  return [...txt.matchAll(/^\s*sitemap\s*:\s*(\S+)/gim)].map((m) => m[1]).filter((u) => bareHost(u) === host)
}

interface Dated {
  t: number
  url: string
}

/** Every dated entry: pages in a urlset, or sub-sitemaps in an index. */
export function sitemapEntries(xml: string, now: number): { entries: Dated[]; isIndex: boolean; urls: number } {
  const isIndex = /<sitemapindex\b/i.test(xml)
  const entries: Dated[] = []
  let urls = 0
  for (const m of xml.matchAll(/<(?:url|sitemap)\b[^>]*>([\s\S]*?)<\/(?:url|sitemap)>/gi)) {
    const loc = /<loc>\s*([^<]+?)\s*<\/loc>/i.exec(m[1])?.[1]
    if (!loc) continue
    urls++
    const t = usable(/<lastmod>\s*([^<]+?)\s*<\/lastmod>/i.exec(m[1])?.[1], now)
    if (t !== null) entries.push({ t, url: decode(loc) })
  }
  return { entries, isIndex, urls }
}

/** Most entries share one day: likely stamped by software (5+ dates, 80%+ on one day). */
export function isStamped(entries: Dated[]): boolean {
  if (entries.length < 5) return false
  const perDay = new Map<string, number>()
  for (const e of entries) perDay.set(dayOf(e.t), (perDay.get(dayOf(e.t)) ?? 0) + 1)
  return Math.max(...perDay.values()) / entries.length >= 0.8
}

const newest = (entries: Dated[]) => entries.reduce<Dated | null>((a, b) => (!a || b.t > a.t ? b : a), null)

/* ── Feed ────────────────────────────────────────────────────────────────── */

// WordPress gives every page its own comments feed ("/about/feed/"): not the blog.
const BLOG_SEGMENT_RE = /^(?:blog|news|articles|insights|posts|journal|updates|stories|resources)$/i

/** The blog feed the homepage points to (<link rel="alternate" type="application/rss+xml">), on its own host. */
export function findFeedUrl(html: string, pageUrl: string): string | null {
  const host = bareHost(pageUrl)
  for (const m of html.matchAll(/<link\b[^>]*>/gi)) {
    const tag = m[0]
    if (!/type\s*=\s*["']application\/(?:rss|atom)\+xml["']/i.test(tag)) continue
    const href = /href\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1]
    if (!href || /comments/i.test(href) || /comments/i.test(tag)) continue
    let u: URL
    try {
      u = new URL(decode(href), pageUrl)
    } catch {
      continue
    }
    if (bareHost(u.toString()) !== host) continue
    const segs = u.pathname.split('/').filter(Boolean)
    // "/<page>/feed/" is a page's comments feed unless the page is the blog.
    if (segs.length === 2 && /^feed$/i.test(segs[1]) && !BLOG_SEGMENT_RE.test(segs[0])) continue
    return u.toString()
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
  if (/\/wp-content\/|\/wp-includes\//i.test(html)) return at('/feed/')
  if (/static\.wixstatic\.com|wix\.com\b/i.test(html)) return at('/blog-feed.xml')
  if (/squarespace/i.test(html)) return at('/blog?format=rss')
  if (/cdn\.shopify\.com/i.test(html)) return at('/blogs/news.atom')
  if (/<meta[^>]+generator[^>]+ghost/i.test(html)) return at('/rss/')
  if (/js\.hs-scripts\.com|hubspot/i.test(html)) return at('/blog/rss.xml')
  return null
}

/** The newest post in an RSS or Atom feed: its publish date (Atom: published, else updated). */
export function newestFeedPost(xml: string, now: number): Dated | null {
  const posts: Dated[] = []
  for (const m of xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)) {
    const t = usable(/<pubDate>\s*([^<]+?)\s*<\/pubDate>/i.exec(m[1])?.[1] ?? /<dc:date>\s*([^<]+?)\s*<\/dc:date>/i.exec(m[1])?.[1], now)
    const link = /<link>\s*([^<]+?)\s*<\/link>/i.exec(m[1])?.[1] ?? ''
    if (t !== null) posts.push({ t, url: decode(link) })
  }
  for (const m of xml.matchAll(/<entry\b[^>]*>([\s\S]*?)<\/entry>/gi)) {
    const t = usable(/<published>\s*([^<]+?)\s*<\/published>/i.exec(m[1])?.[1] ?? /<updated>\s*([^<]+?)\s*<\/updated>/i.exec(m[1])?.[1], now)
    const link = /<link\b[^>]*href\s*=\s*["']([^"']+)["']/i.exec(m[1])?.[1] ?? ''
    if (t !== null) posts.push({ t, url: decode(link) })
  }
  return newest(posts)
}

/* ── A page's own dates ──────────────────────────────────────────────────── */

const MONTHS = 'jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?'
const VISIBLE_DATE_RE = new RegExp(
  `(?:updated|published|posted|modified|last edited)(?:\\s+on)?:?\\s+((?:${MONTHS})\\.?\\s+\\d{1,2},?\\s+\\d{4}|\\d{1,2}\\s+(?:${MONTHS})\\.?,?\\s+\\d{4}|\\d{4}-\\d{2}-\\d{2})`,
  'gi',
)

/** The dates a page gives itself: article / Open Graph meta, JSON-LD, <time datetime>, "Updated on …" text. */
export function pageDates(html: string, now: number): number[] {
  const raw: string[] = []
  for (const m of html.matchAll(/<meta\b[^>]*>/gi)) {
    if (!/(?:property|name|itemprop)\s*=\s*["'](?:article:modified_time|article:published_time|og:updated_time|datemodified|datepublished|last-modified)["']/i.test(m[0])) continue
    const c = /content\s*=\s*["']([^"']+)["']/i.exec(m[0])?.[1]
    if (c) raw.push(c)
  }
  for (const m of html.matchAll(/"date(?:Modified|Published)"\s*:\s*"([^"]+)"/g)) raw.push(m[1])
  for (const m of html.matchAll(/<time\b[^>]*datetime\s*=\s*["']([^"']+)["']/gi)) raw.push(m[1])
  const text = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ')
  for (const m of text.matchAll(VISIBLE_DATE_RE)) raw.push(m[1].replace(/(\d)(st|nd|rd|th)\b/gi, '$1'))
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
  const fromRobots = ok(robots) && !/<html\b/i.test(robots.body) ? sitemapsFromRobots(robots.body, home.finalUrl) : []
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

/** "Recently updated": the feed's newest post, or the sitemap's newest page when the page confirms its date. */
export async function readFreshness(
  sitemap: FetchResult | null,
  start: FreshStart,
  reader: Reader,
  now: number,
  deadline: number,
): Promise<Updated> {
  const feedRes = await start.feed
  const post = ok(feedRes) ? newestFeedPost(feedRes.body, now) : null

  // The sitemap's newest page, confirmed by the page itself.
  let page: Dated | null = null
  let claim: Dated | null = null
  let why: Updated['why'] = sitemap ? undefined : 'none'
  if (sitemap) {
    let { entries, isIndex } = sitemapEntries(sitemap.body, now)
    if (isIndex) {
      // The sub-sitemap that changed last (else the first), then its pages.
      const subs = sitemapEntries(sitemap.body, now)
      const pick = newest(subs.entries)?.url ?? /<loc>\s*([^<]+?)\s*<\/loc>/i.exec(sitemap.body)?.[1]
      const sub = pick && Date.now() <= deadline ? await reader.page(decode(pick), TIMEOUT).catch(() => null) : null
      entries = isSitemap(sub) ? sitemapEntries(sub.body, now).entries : []
    }
    if (!entries.length) why = 'no-dates'
    else if (isStamped(entries)) why = 'stamped'
    else {
      claim = newest(entries)
      const res = claim && Date.now() <= deadline ? await reader.page(claim.url, TIMEOUT).catch(() => null) : null
      if (claim && ok(res) && confirms(res.body, claim.t, now)) page = claim
      else why = 'unconfirmed'
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
