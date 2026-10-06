/* ── Fetch guard (server-only) ─────────────────────────────────────────────
 * Shared by /api/audit and /api/og-check: per-IP rate limiting, SSRF blocking,
 * a capped + timed page fetch, plain-word fetch errors, and the og:image
 * direct-fetch. Extracted from api/audit/route.ts so both tools behave alike.
 * ─────────────────────────────────────────────────────────────────────── */
import 'server-only'
import dns from 'node:dns/promises'
import { isIP } from 'node:net'

export const FETCH_TIMEOUT = 8_000 // 8s per page fetch (each route sets its own maxDuration)
export const USER_AGENT =
  'Mozilla/5.0 (compatible; SiteCheck/1.0; +https://chrishornak.com/audit)'

/* ── Rate limiter (in-memory, resets on cold start) ─────────────────────── */

export function createRateLimiter(limit: number, windowMs: number) {
  const rateMap = new Map<string, number[]>()
  return function isRateLimited(ip: string): boolean {
    const now = Date.now()
    // Long-lived instances (Fluid) would keep every IP forever: drop stale ones now and then.
    if (rateMap.size > 1_000) for (const [k, v] of rateMap) if (!v.some((t) => t > now - windowMs)) rateMap.delete(k)
    const timestamps = (rateMap.get(ip) ?? []).filter((t) => t > now - windowMs)

    if (timestamps.length >= limit) {
      rateMap.set(ip, timestamps)
      return true
    }

    timestamps.push(now)
    rateMap.set(ip, timestamps)
    return false
  }
}

export function clientIp(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headers.get('x-real-ip') ??
    'unknown'
  )
}

/* ── SSRF protection ────────────────────────────────────────────────────── */

const PRIVATE_RANGES = [
  /^127\./, // loopback
  /^10\./, // 10.0.0.0/8
  /^172\.(1[6-9]|2\d|3[01])\./, // 172.16.0.0/12
  /^192\.168\./, // 192.168.0.0/16
  /^0\./, // 0.0.0.0/8
  /^169\.254\./, // link-local (cloud metadata lives here)
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./, // 100.64.0.0/10 carrier-grade NAT
  /^::1$/, // IPv6 loopback
  /^f[cd][0-9a-f]{0,2}:/i, // IPv6 unique local fc00::/7 (fc… and fd…)
  /^fe[89ab][0-9a-f]?:/i, // IPv6 link-local fe80::/10
  /^::$/,  // unspecified
]

function isPrivateIP(ip: string): boolean {
  // IPv4-mapped IPv6 (::ffff:10.0.0.1) is checked as the IPv4 address inside it.
  const v4 = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(ip)?.[1]
  return PRIVATE_RANGES.some((re) => re.test(v4 ?? ip))
}

const DNS_TIMEOUT = 2_500
const withTimeout = <T,>(p: Promise<T>, ms: number): Promise<T | 'timeout'> =>
  Promise.race([p, new Promise<'timeout'>((r) => setTimeout(() => r('timeout'), ms))])

/**
 * What a hostname resolves to: blocked (an IP or record that's private/internal), nxdomain
 * (no address at all, so the site doesn't exist: callers skip paid lookups for it), or ok.
 * A and AAAA are checked side by side, so a public A record can't hide a private AAAA one.
 * A slow DNS answer counts as ok here; the fetch itself then times out.
 */
export async function checkHost(hostname: string): Promise<'ok' | 'blocked' | 'nxdomain'> {
  if (isIP(hostname)) return isPrivateIP(hostname) ? 'blocked' : 'ok'
  const answer = await withTimeout(Promise.allSettled([dns.resolve4(hostname), dns.resolve6(hostname)]), DNS_TIMEOUT)
  if (answer === 'timeout') return 'ok'
  const found = answer.flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
  if (found.some(isPrivateIP)) return 'blocked'
  if (found.length) return 'ok'
  const gone = answer.every(
    (r) => r.status === 'rejected' && ['ENOTFOUND', 'ENODATA'].includes((r.reason as { code?: string })?.code ?? ''),
  )
  return gone ? 'nxdomain' : 'ok'
}

/** True when the hostname is (or resolves to) a private/internal address. */
export async function resolveAndCheck(hostname: string): Promise<boolean> {
  return (await checkHost(hostname)) === 'blocked'
}

/* ── Fetch helper ───────────────────────────────────────────────────────── */

export interface FetchResult {
  body: string
  status: number
  finalUrl: string
  headers: Headers
  responseTimeMs: number
}

const MAX_REDIRECTS = 5

/** The body as text, read only up to maxBytes characters (a huge or compressed page can't fill memory). */
async function readCapped(res: Response, maxBytes: number): Promise<string> {
  if (!res.body) return ''
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let out = ''
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      out += decoder.decode(value, { stream: true })
      if (out.length >= maxBytes) {
        reader.cancel().catch(() => {})
        break
      }
    }
  } catch {
    // A body cut off mid-read keeps what arrived.
  }
  return (out + decoder.decode()).slice(0, maxBytes)
}

/**
 * One page read: redirects followed by hand (each hop's host checked against private
 * addresses, so a public site can't bounce the reader inside the network), and the body read
 * only up to maxBytes. The first URL's host is checked by the caller.
 */
export async function safeFetch(
  url: string,
  maxBytes: number,
  timeoutMs: number = FETCH_TIMEOUT,
): Promise<FetchResult | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  const start = Date.now()

  try {
    let current = url
    for (let hop = 0; ; hop++) {
      const res = await fetch(current, {
        signal: controller.signal,
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'text/html,application/xhtml+xml,*/*',
        },
        redirect: 'manual',
      })
      const location = res.headers.get('location')
      if (res.status >= 300 && res.status < 400 && location) {
        res.body?.cancel().catch(() => {})
        if (hop >= MAX_REDIRECTS) return null
        const next = new URL(location, current)
        if (!['http:', 'https:'].includes(next.protocol)) return null
        if ((await checkHost(next.hostname)) === 'blocked') return null
        current = next.toString()
        continue
      }
      const body = await readCapped(res, maxBytes)
      return {
        body,
        status: res.status,
        finalUrl: current,
        headers: res.headers,
        responseTimeMs: Date.now() - start,
      }
    }
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

// Main page fetch with a single transient-blip retry. Vercel's edge can
// intermittently challenge or reset datacenter-IP requests (the audit Lambda)
// while serving browsers cleanly — a once-off null that resolves on a retry.
// We ONLY retry a *fast* failure (a thrown/refused/challenged connection
// returns in well under a second); a slow failure means the 8s timeout fired,
// i.e. the site is genuinely slow/down and there's no time budget to retry.
const FAST_FAIL_MS = 2_000 // a failure quicker than this is a transient blip, not a real timeout
const RETRY_TIMEOUT = 4_000 // shorter budget for the retry so total stays under Vercel's limit
const RETRY_BACKOFF_MS = 250

export async function fetchPageWithRetry(
  url: string,
  maxBytes: number,
): Promise<FetchResult | null> {
  const start = Date.now()
  const first = await safeFetch(url, maxBytes)
  if (first) return first

  // Only retry if the first attempt failed FAST (transient throw, not an 8s timeout).
  if (Date.now() - start >= FAST_FAIL_MS) return null

  await new Promise((resolve) => setTimeout(resolve, RETRY_BACKOFF_MS))
  return safeFetch(url, maxBytes, RETRY_TIMEOUT)
}

/* ── Page fetch errors in plain words ───────────────────────────────────── */

/** Returns null when the page fetched fine, else a message for the user.
 * Users hitting these errors are usually trying to debug their own site;
 * a vague "no response" sends them down the wrong path. */
export function pageErrorMessage(
  pageResult: FetchResult | null,
  hostname: string,
): string | null {
  if (pageResult && pageResult.status !== 0 && pageResult.status < 400) return null
  if (!pageResult) {
    return (
      `We couldn't reach ${hostname}. ` +
      `The site may be offline, the domain may not resolve (DNS), ` +
      `or the connection was refused or timed out. ` +
      `Check that the URL is right and that your site is online — ` +
      `if it loads in your browser but not here, your hosting may be blocking automated requests.`
    )
  }
  if (pageResult.status === 403) {
    return (
      `${hostname} returned 403 Forbidden. ` +
      `Most often this is bot protection (Cloudflare, security plugin, host firewall) ` +
      `blocking automated requests — including SEO and accessibility tools. ` +
      `To audit, temporarily lower your security level or whitelist this audit's User-Agent.`
    )
  }
  if (pageResult.status === 404) {
    return (
      `${hostname} returned 404 Not Found at the URL you provided. ` +
      `Your home page may be unpublished, your domain may not be pointing at your site, ` +
      `or this URL may be incorrect.`
    )
  }
  if (pageResult.status >= 500) {
    return (
      `${hostname} returned a ${pageResult.status} server error. ` +
      `Your hosting is reachable but having trouble serving the page. Try again in a minute, ` +
      `or check your hosting dashboard for outages.`
    )
  }
  return `${hostname} returned status ${pageResult.status} — try again or check the URL.`
}

/** Short reason a rival's homepage could not be read, naming the rival,
 * not "your site". null when it fetched fine (same test as pageErrorMessage). */
export function rivalPageError(pageResult: FetchResult | null, hostname: string): string | null {
  if (pageErrorMessage(pageResult, hostname) === null) return null
  if (!pageResult) return `We couldn't reach ${hostname}.`
  if (pageResult.status === 401 || pageResult.status === 403) {
    return `${hostname} blocks automated checks (${pageResult.status}).`
  }
  if (pageResult.status === 404) return `${hostname} has no homepage at that address (404).`
  if (pageResult.status >= 500) return `${hostname} had a server error (${pageResult.status}).`
  return `${hostname} returned status ${pageResult.status}.`
}

/* ── og:image direct-fetch (Facebook-scraper simulation) ───────────────── */

/** Headers for fetching a share image. Our own honest UA, not Facebook's:
 * bot shields (WordPress security plugins, CDNs) check that a request calling
 * itself facebookexternalhit comes from Meta's IPs and 403 it when it doesn't,
 * while the real Facebook still gets the image (directom.com, 2026-09-30). */
export const IMAGE_HEADERS = {
  'User-Agent': USER_AGENT,
  Accept: 'image/*,*/*;q=0.8',
}

/** Hit the page's og:image URL the way a link-preview scraper would: manual
 * redirect handling, HEAD-then-GET fallback. Lets the parser distinguish "og:image is
 * in markup" from "og:image actually serves as an image to social scrapers".
 * Returns undefined when no og:image is present in markup. */
export async function checkOgImage(
  html: string,
  baseUrl: string,
): Promise<{ url: string; status?: number; redirected?: boolean; contentType?: string } | undefined> {
  // Match both attribute orders — some sites/CMS write content="" first,
  // property="" second. Mirror the dual pattern used by the parser's meta() helper.
  const ogMatch =
    html.match(/<meta[^>]*(?:name|property)=["']og:image["'][^>]*content=["']([^"']*)["']/i) ||
    html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*(?:name|property)=["']og:image["']/i)
  const rawUrl = ogMatch?.[1]
  if (!rawUrl) return undefined

  let resolved: string
  try {
    resolved = new URL(rawUrl, baseUrl).toString()
  } catch {
    return { url: rawUrl }
  }
  if (!/^https?:/i.test(resolved)) return { url: resolved }

  const ctrl = new AbortController()
  const timeout = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT)
  try {
    let res = await fetch(resolved, {
      method: 'HEAD',
      signal: ctrl.signal,
      headers: IMAGE_HEADERS,
      redirect: 'manual',
    })
    // Some servers reject HEAD. Fall back to GET (we won't read the body).
    if (res.status === 405 || res.status === 501) {
      res = await fetch(resolved, {
        method: 'GET',
        signal: ctrl.signal,
        headers: IMAGE_HEADERS,
        redirect: 'manual',
      })
    }
    clearTimeout(timeout)
    return {
      url: resolved,
      status: res.status,
      redirected: res.status >= 300 && res.status < 400,
      contentType: res.headers.get('content-type') ?? undefined,
    }
  } catch {
    clearTimeout(timeout)
    return { url: resolved }
  }
}
