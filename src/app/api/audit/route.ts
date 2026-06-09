import { NextRequest, NextResponse } from 'next/server'
import dns from 'node:dns/promises'
import { isIP } from 'node:net'

/* ── Configuration ──────────────────────────────────────────────────────── */

const MAX_HTML = 2 * 1024 * 1024 // 2 MB
const MAX_AUX = 50_000 // 50 KB for robots.txt / sitemap.xml
const FETCH_TIMEOUT = 8_000 // 8s per fetch (within Vercel's 10s limit)
const USER_AGENT =
  'Mozilla/5.0 (compatible; SiteCheck/1.0; +https://chrishornak.com/audit)'

// External CSS: pull up to N linked stylesheets so the focus-indicator check
// (and any future CSS-aware check) can see styles bundled by Next/React/etc.
const MAX_CSS_SHEETS = 5
const MAX_CSS_TOTAL = 200_000 // 200 KB combined cap across all sheets
const MAX_CSS_PER_SHEET = 80_000 // 80 KB per sheet

const RATE_WINDOW = 60_000 // 60 seconds
const RATE_LIMIT = 10 // requests per window per IP

/* ── Rate limiter (in-memory, resets on cold start) ─────────────────────── */

const rateMap = new Map<string, number[]>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const timestamps = (rateMap.get(ip) ?? []).filter((t) => t > now - RATE_WINDOW)

  if (timestamps.length >= RATE_LIMIT) {
    rateMap.set(ip, timestamps)
    return true
  }

  timestamps.push(now)
  rateMap.set(ip, timestamps)
  return false
}

/* ── SSRF protection ────────────────────────────────────────────────────── */

const PRIVATE_RANGES = [
  /^127\./, // loopback
  /^10\./, // 10.0.0.0/8
  /^172\.(1[6-9]|2\d|3[01])\./, // 172.16.0.0/12
  /^192\.168\./, // 192.168.0.0/16
  /^0\./, // 0.0.0.0/8
  /^169\.254\./, // link-local
  /^::1$/, // IPv6 loopback
  /^fc00:/i, // IPv6 unique local
  /^fe80:/i, // IPv6 link-local
  /^::$/,  // unspecified
]

function isPrivateIP(ip: string): boolean {
  return PRIVATE_RANGES.some((re) => re.test(ip))
}

async function resolveAndCheck(hostname: string): Promise<boolean> {
  try {
    // If hostname is already an IP, check directly
    if (isIP(hostname)) {
      return isPrivateIP(hostname)
    }
    const addresses = await dns.resolve4(hostname)
    return addresses.some(isPrivateIP)
  } catch {
    // Also try IPv6
    try {
      const addresses = await dns.resolve6(hostname)
      return addresses.some(isPrivateIP)
    } catch {
      // DNS resolution failed — let the fetch itself fail later
      return false
    }
  }
}

/* ── Fetch helper ───────────────────────────────────────────────────────── */

async function safeFetch(
  url: string,
  maxBytes: number,
  timeoutMs: number = FETCH_TIMEOUT,
): Promise<{ body: string; status: number; finalUrl: string; headers: Headers; responseTimeMs: number } | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  const start = Date.now()

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,*/*',
      },
      redirect: 'follow',
    })

    const text = await res.text()
    clearTimeout(timeout)

    return {
      body: text.slice(0, maxBytes),
      status: res.status,
      finalUrl: res.url,
      headers: res.headers,
      responseTimeMs: Date.now() - start,
    }
  } catch {
    clearTimeout(timeout)
    return null
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

async function fetchPageWithRetry(
  url: string,
  maxBytes: number,
): Promise<{ body: string; status: number; finalUrl: string; headers: Headers; responseTimeMs: number } | null> {
  const start = Date.now()
  const first = await safeFetch(url, maxBytes)
  if (first) return first

  // Only retry if the first attempt failed FAST (transient throw, not an 8s timeout).
  if (Date.now() - start >= FAST_FAIL_MS) return null

  await new Promise((resolve) => setTimeout(resolve, RETRY_BACKOFF_MS))
  return safeFetch(url, maxBytes, RETRY_TIMEOUT)
}

/* ── og:image direct-fetch (Facebook-scraper simulation) ───────────────── */

/** Hit the page's og:image URL with a Facebook-like UA, manual redirect
 * handling, HEAD-then-GET fallback. Lets the parser distinguish "og:image is
 * in markup" from "og:image actually serves as an image to social scrapers".
 * Returns undefined when no og:image is present in markup. */
async function checkOgImage(
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
  const fbHeaders = {
    'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
    Accept: 'image/*,*/*;q=0.8',
  }
  try {
    let res = await fetch(resolved, {
      method: 'HEAD',
      signal: ctrl.signal,
      headers: fbHeaders,
      redirect: 'manual',
    })
    // Some servers reject HEAD. Fall back to GET (we won't read the body).
    if (res.status === 405 || res.status === 501) {
      res = await fetch(resolved, {
        method: 'GET',
        signal: ctrl.signal,
        headers: fbHeaders,
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

/* ── External CSS fetcher ───────────────────────────────────────────────── */

/** Pull up to MAX_CSS_SHEETS linked stylesheets from the page HTML, fetch in
 * parallel, return the concatenation (capped). Used by CSS-aware checks like
 * the focus-indicator check that need to see bundled styles. */
async function fetchExternalCss(html: string, baseUrl: string): Promise<string> {
  const linkPattern =
    /<link\b[^>]*rel=["'][^"']*\bstylesheet\b[^"']*["'][^>]*>/gi
  const hrefPattern = /href=["']([^"']+)["']/i

  const urls: string[] = []
  for (const tag of html.matchAll(linkPattern)) {
    const href = tag[0].match(hrefPattern)?.[1]
    if (!href) continue
    // Skip media-conditional sheets that wouldn't apply to the rendered page
    // (e.g., media="print"). They rarely contain :focus rules and pulling them
    // wastes the cap.
    const mediaMatch = tag[0].match(/media=["']([^"']+)["']/i)
    if (mediaMatch && /\bprint\b/i.test(mediaMatch[1])) continue
    try {
      const resolved = new URL(href, baseUrl).toString()
      if (!/^https?:/.test(resolved)) continue
      urls.push(resolved)
    } catch {
      // skip malformed href
    }
    if (urls.length >= MAX_CSS_SHEETS) break
  }
  if (urls.length === 0) return ''

  const results = await Promise.all(
    urls.map(async (u) => {
      const r = await safeFetch(u, MAX_CSS_PER_SHEET)
      if (!r || r.status >= 400) return ''
      return r.body
    }),
  )
  // Concatenate respecting the total cap
  let combined = ''
  for (const css of results) {
    if (combined.length + css.length > MAX_CSS_TOTAL) {
      combined += css.slice(0, MAX_CSS_TOTAL - combined.length)
      break
    }
    combined += css + '\n'
  }
  return combined
}

/* ── CORS helper ────────────────────────────────────────────────────────── */

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

/* ── OPTIONS handler (CORS preflight) ───────────────────────────────────── */

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() })
}

/* ── GET handler ────────────────────────────────────────────────────────── */

export async function GET(request: NextRequest) {
  const headers = corsHeaders()

  // Rate limiting — use forwarded IP or fall back to a default
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a minute and try again.' },
      { status: 429, headers },
    )
  }

  // Validate ?url= parameter
  const targetUrl = request.nextUrl.searchParams.get('url')

  if (!targetUrl) {
    return NextResponse.json(
      { error: 'Missing ?url= parameter' },
      { status: 400, headers },
    )
  }

  let parsed: URL
  try {
    parsed = new URL(targetUrl)
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return NextResponse.json(
        { error: 'URL must use http or https' },
        { status: 400, headers },
      )
    }
  } catch {
    return NextResponse.json(
      { error: 'Invalid URL' },
      { status: 400, headers },
    )
  }

  // SSRF protection — block private/internal IPs
  const isPrivate = await resolveAndCheck(parsed.hostname)
  if (isPrivate) {
    return NextResponse.json(
      { error: 'Cannot fetch internal or private addresses' },
      { status: 400, headers },
    )
  }

  // Fetch page, robots.txt, and common sitemap paths all in parallel
  const commonSitemaps = [
    `${parsed.origin}/sitemap.xml`,
    `${parsed.origin}/sitemap_index.xml`,
    `${parsed.origin}/wp-sitemap.xml`,
  ]

  const [pageResult, robotsResult, llmsTxtResult, ...sitemapResults] = await Promise.all([
    fetchPageWithRetry(targetUrl, MAX_HTML),
    safeFetch(`${parsed.origin}/robots.txt`, MAX_AUX),
    safeFetch(`${parsed.origin}/llms.txt`, MAX_AUX),
    ...commonSitemaps.map((path) => safeFetch(path, MAX_AUX)),
  ])

  // Check robots.txt for a Sitemap: directive we haven't already tried
  const robotsBody =
    robotsResult && robotsResult.status >= 200 && robotsResult.status < 400
      ? robotsResult.body
      : ''
  const robotsSitemapMatch = robotsBody.match(/^sitemap:\s*(.+)/im)
  const robotsSitemapUrl = robotsSitemapMatch?.[1]?.trim()

  // If robots.txt points to a sitemap we didn't already fetch, grab it now
  if (robotsSitemapUrl && !commonSitemaps.includes(robotsSitemapUrl)) {
    sitemapResults.push(await safeFetch(robotsSitemapUrl, MAX_AUX))
  }

  const sitemapResult = sitemapResults.find(
    (r) => r && r.status >= 200 && r.status < 400 && r.body.length > 100,
  ) ?? null

  // Check page response with friendlier, more specific error messages.
  // Users hitting these errors are usually trying to debug their own site;
  // a vague "no response" sends them down the wrong path.
  if (!pageResult || pageResult.status === 0 || pageResult.status >= 400) {
    let msg: string
    if (!pageResult) {
      msg =
        `We couldn't reach ${parsed.hostname}. ` +
        `The site may be offline, the domain may not resolve (DNS), ` +
        `or the connection was refused or timed out. ` +
        `Check that the URL is right and that your site is online — ` +
        `if it loads in your browser but not here, your hosting may be blocking automated requests.`
    } else if (pageResult.status === 403) {
      msg =
        `${parsed.hostname} returned 403 Forbidden. ` +
        `Most often this is bot protection (Cloudflare, security plugin, host firewall) ` +
        `blocking automated requests — including SEO and accessibility tools. ` +
        `To audit, temporarily lower your security level or whitelist this audit's User-Agent.`
    } else if (pageResult.status === 404) {
      msg =
        `${parsed.hostname} returned 404 Not Found at the URL you provided. ` +
        `Your home page may be unpublished, your domain may not be pointing at your site, ` +
        `or this URL may be incorrect.`
    } else if (pageResult.status >= 500) {
      msg =
        `${parsed.hostname} returned a ${pageResult.status} server error. ` +
        `Your hosting is reachable but having trouble serving the page. Try again in a minute, ` +
        `or check your hosting dashboard for outages.`
    } else {
      msg = `${parsed.hostname} returned status ${pageResult.status} — try again or check the URL.`
    }
    return NextResponse.json({ error: msg }, { status: 502, headers })
  }

  // Extract security headers (same set as proxy.mjs)
  const securityHeaders: Record<string, string> = {}
  for (const key of [
    'content-security-policy',
    'x-frame-options',
    'strict-transport-security',
    'x-content-type-options',
  ]) {
    const val = pageResult.headers.get(key)
    if (val) securityHeaders[key] = val
  }

  // Pull external stylesheets so CSS-aware checks (focus indicators, etc.) can
  // see styles that modern bundlers split into separate files. Capped: at most
  // MAX_CSS_SHEETS files, MAX_CSS_TOTAL bytes total. Best-effort — failures are
  // silent (focus check has a fallback that warns rather than false-passing).
  // og:image direct-fetch runs in parallel; verifies the share image actually
  // serves cleanly to social scrapers (FB doesn't follow redirects on og:image).
  const [externalCss, ogImageResult] = await Promise.all([
    fetchExternalCss(pageResult.body, pageResult.finalUrl),
    checkOgImage(pageResult.body, pageResult.finalUrl),
  ])

  // Build response
  const body = {
    url: pageResult.finalUrl,
    requestedUrl: targetUrl,
    html: pageResult.body,
    robotsTxt: robotsBody,
    sitemapXml:
      sitemapResult && sitemapResult.status >= 200 && sitemapResult.status < 400
        ? sitemapResult.body
        : '',
    llmsTxt:
      llmsTxtResult && llmsTxtResult.status >= 200 && llmsTxtResult.status < 400
        ? llmsTxtResult.body
        : '',
    headers: securityHeaders,
    statusCode: pageResult.status,
    isHttps: pageResult.finalUrl.startsWith('https'),
    responseTimeMs: pageResult.responseTimeMs,
    externalCss,
    ogImage: ogImageResult,
  }

  return NextResponse.json(body, { status: 200, headers })
}
