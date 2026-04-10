import { NextRequest, NextResponse } from 'next/server'
import dns from 'node:dns/promises'
import { isIP } from 'node:net'

/* ── Configuration ──────────────────────────────────────────────────────── */

const MAX_HTML = 2 * 1024 * 1024 // 2 MB
const MAX_AUX = 50_000 // 50 KB for robots.txt / sitemap.xml
const FETCH_TIMEOUT = 8_000 // 8s per fetch (within Vercel's 10s limit)
const USER_AGENT =
  'Mozilla/5.0 (compatible; SiteCheck/1.0; +https://chrishornak.com/audit)'

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
): Promise<{ body: string; status: number; finalUrl: string; headers: Headers } | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT)

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
    }
  } catch {
    clearTimeout(timeout)
    return null
  }
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

  const [pageResult, robotsResult, ...sitemapResults] = await Promise.all([
    safeFetch(targetUrl, MAX_HTML),
    safeFetch(`${parsed.origin}/robots.txt`, MAX_AUX),
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

  // Check page response
  if (!pageResult || pageResult.status === 0 || pageResult.status >= 400) {
    const msg = pageResult
      ? `Could not reach ${parsed.hostname} (${pageResult.status})`
      : `Could not reach ${parsed.hostname} (no response)`
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

  // Build response — matches proxy.mjs JSON shape exactly
  const body = {
    url: pageResult.finalUrl,
    html: pageResult.body,
    robotsTxt: robotsBody,
    sitemapXml:
      sitemapResult && sitemapResult.status >= 200 && sitemapResult.status < 400
        ? sitemapResult.body
        : '',
    headers: securityHeaders,
    statusCode: pageResult.status,
    isHttps: pageResult.finalUrl.startsWith('https'),
  }

  return NextResponse.json(body, { status: 200, headers })
}
