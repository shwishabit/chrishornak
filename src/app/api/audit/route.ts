import { NextRequest, NextResponse } from 'next/server'
import {
  createRateLimiter,
  clientIp,
  resolveAndCheck,
  safeFetch,
  fetchPageWithRetry,
  pageErrorMessage,
  checkOgImage,
  hasCheckKey,
} from '@/lib/fetch-guard'
import { parseAudit, type FetchedPage } from '@/lib/audit-parser'
import { computeCategoryScore, computeOverallScore } from '@/lib/audit-scoring'

/* ── Configuration ──────────────────────────────────────────────────────── */

const MAX_HTML = 2 * 1024 * 1024 // 2 MB
const MAX_AUX = 50_000 // 50 KB for robots.txt / sitemap.xml

// External CSS: pull up to N linked stylesheets so the focus-indicator check
// (and any future CSS-aware check) can see styles bundled by Next/React/etc.
const MAX_CSS_SHEETS = 5
const MAX_CSS_TOTAL = 200_000 // 200 KB combined cap across all sheets
const MAX_CSS_PER_SHEET = 80_000 // 80 KB per sheet

// Rate limiter, SSRF block, fetch helpers and checkOgImage live in
// lib/fetch-guard.ts (shared with /api/og-check).
const isRateLimited = createRateLimiter(10, 60_000) // 10 requests per 60s per IP

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
  const ip = clientIp(request.headers)
  const keyed = hasCheckKey(request.headers)

  if (!keyed && isRateLimited(ip)) {
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
  const pageError = pageErrorMessage(pageResult, parsed.hostname)
  if (!pageResult || pageError) {
    return NextResponse.json({ error: pageError }, { status: 502, headers })
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

  // A keyed caller (SGM's server) gets the scores instead of the raw page: the
  // browser normally scores it (AuditTool.tsx), a server can't (Grill Me 2026-10-06).
  if (keyed) return NextResponse.json(scoreAudit(body), { status: 200, headers })

  return NextResponse.json(body, { status: 200, headers })
}

/** The same parse + score the Findability Check runs in the browser, done here. */
function scoreAudit(page: FetchedPage) {
  const parsed = parseAudit(page)
  const categories = parsed.categories.map((c) => ({
    name: c.name,
    score: computeCategoryScore({ ...c, icon: null }),
    items: c.items,
  }))
  return {
    url: page.url,
    requestedUrl: page.requestedUrl,
    statusCode: page.statusCode,
    overall: computeOverallScore(parsed.categories.map((c) => ({ ...c, icon: null }))),
    categories,
  }
}
