/* ── Real-world findability test harness ──────────────────────────────────
 *
 * Fetches a curated set of real small-business sites, runs each through
 * the same parseAudit + scoring pipeline the live tool uses, and dumps
 * per-site JSON + a summary table for diagnostic review.
 *
 * Run:  npx tsx scripts/test-real-sites.ts
 * Output: scripts/test-output/<hostname>.json + console summary
 * ─────────────────────────────────────────────────────────────────────── */

import { writeFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseAudit, type FetchedPage } from '../src/lib/audit-parser'
import {
  CATEGORY_WEIGHTS,
  computeOverallScore,
  computeCategoryScore,
  type AuditCategory,
} from '../src/lib/audit-scoring'

/* ── Test set ───────────────────────────────────────────────────────────── */

const SITES: { name: string; url: string; vertical: string; chamberTier?: string }[] = [
  // Chamber-sourced small business sites (Peters Township PA)
  { name: "Angelina's Bakery", url: 'https://www.angelinaspastries.com', vertical: 'Bakery', chamberTier: 'C/30' },
  { name: 'ATA McMurray Martial Arts', url: 'https://atamcmurray.com', vertical: 'Martial Arts', chamberTier: 'C/30' },
  { name: 'Motto Mortgage Keystone', url: 'https://www.mottomortgagekeystone.com', vertical: 'Mortgage', chamberTier: 'C/25' },
  { name: '1781 Club', url: 'https://www.1781club.com', vertical: 'Golf Club', chamberTier: 'C/25' },
  { name: 'Blue Sky Closing Services', url: 'http://www.blueskycsi.com', vertical: 'Real Estate (HTTP only)', chamberTier: 'C/30' },
  { name: 'Castle Rock Hormone Health', url: 'https://www.crhh-pittsburgh.com', vertical: 'Health/Wellness', chamberTier: 'C/25' },
  { name: 'Computec Technical Solutions', url: 'https://www.cts-pgh.com', vertical: 'Telecom', chamberTier: 'B/50' },
  { name: 'SW Regional Chamber', url: 'http://southwestcommunitieschamber.org/', vertical: 'Chamber (HTTP only)', chamberTier: 'B/60' },
  { name: 'Confluence Financial', url: 'https://www.confluencefp.com', vertical: 'Financial Planning', chamberTier: 'skip/0' },
  { name: 'Jeff Hancher Enterprises', url: 'https://www.jeffhancher.com/', vertical: 'Consulting', chamberTier: 'skip/0' },
  { name: "Miller's Ace Hardware", url: 'https://www.millersace.com/', vertical: 'Hardware', chamberTier: 'skip/5' },
  // Round 2 — broader vertical coverage from chamber CSV
  { name: 'A.J. Buerkle Plumbing', url: 'https://www.ajbuerkle.com', vertical: 'Plumbing', chamberTier: 'skip/0' },
  { name: "Aladdin's Eatery", url: 'http://www.aladdinseatery.com/', vertical: 'Restaurant (HTTP)', chamberTier: 'skip/15' },
  { name: 'BARE Skin and Laser', url: 'https://bareskin-laser.com', vertical: 'Spa', chamberTier: 'skip/15' },
  { name: 'Beinhauer Funeral', url: 'https://www.beinhauer.com', vertical: 'Funeral Services', chamberTier: 'skip/0' },
  { name: 'Bella Sera Catering', url: 'https://www.bellaserapgh.com', vertical: 'Catering', chamberTier: 'skip/0' },
  { name: 'Berger Chiropractic', url: 'http://bergerchiropracticwellness.com', vertical: 'Chiropractic (HTTP)', chamberTier: 'skip/0' },
  { name: 'Bernice Schweiss Tax', url: 'https://berniceaschweissllc.com', vertical: 'Tax Prep', chamberTier: 'skip/5' },
  { name: 'Bin Bath Cleaning', url: 'https://www.binbath.com/pittsburgh', vertical: 'Cleaning', chamberTier: 'skip/0' },
  { name: 'BOOTCAMP FIT360', url: 'https://www.bootcampfit360.com', vertical: 'Fitness', chamberTier: 'skip/0' },
  { name: 'Capstone Construction', url: 'https://www.capstonequalityservices.com/', vertical: 'Construction', chamberTier: 'skip/0' },
  // Baseline (already known to PASS post-workarounds)
  { name: 'PA Pardon (baseline)', url: 'https://www.papardon.com', vertical: 'Law (Chris-built)' },
  // Content / publishing vertical — drove the keyword-list calibration sweep
  { name: 'Blog Hands (baseline)', url: 'https://bloghands.com', vertical: 'Content/Publishing (Chris-built)' },
]

/* ── Fetch helpers (mirror src/app/api/audit/route.ts) ──────────────────── */

const MAX_HTML = 2 * 1024 * 1024
const MAX_AUX = 50_000
const FETCH_TIMEOUT = 12_000 // a bit higher than prod's 8s — we're not Vercel-constrained
const USER_AGENT = 'Mozilla/5.0 (compatible; SiteCheck/1.0; +https://chrishornak.com/audit)'

// External CSS — mirror route.ts limits so harness data matches prod
const MAX_CSS_SHEETS = 5
const MAX_CSS_TOTAL = 200_000
const MAX_CSS_PER_SHEET = 80_000

async function checkOgImage(html: string, baseUrl: string) {
  const ogMatch =
    html.match(/<meta[^>]*(?:name|property)=["']og:image["'][^>]*content=["']([^"']*)["']/i) ||
    html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*(?:name|property)=["']og:image["']/i)
  const rawUrl = ogMatch?.[1]
  if (!rawUrl) return undefined
  let resolved: string
  try { resolved = new URL(rawUrl, baseUrl).toString() } catch { return { url: rawUrl } }
  if (!/^https?:/i.test(resolved)) return { url: resolved }
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT)
  const fbHeaders = {
    'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
    Accept: 'image/*,*/*;q=0.8',
  }
  try {
    let res = await fetch(resolved, { method: 'HEAD', signal: ctrl.signal, headers: fbHeaders, redirect: 'manual' })
    if (res.status === 405 || res.status === 501) {
      res = await fetch(resolved, { method: 'GET', signal: ctrl.signal, headers: fbHeaders, redirect: 'manual' })
    }
    clearTimeout(t)
    return {
      url: resolved,
      status: res.status,
      redirected: res.status >= 300 && res.status < 400,
      contentType: res.headers.get('content-type') ?? undefined,
    }
  } catch {
    clearTimeout(t)
    return { url: resolved }
  }
}

async function fetchExternalCss(html: string, baseUrl: string): Promise<string> {
  const linkPattern = /<link\b[^>]*rel=["'][^"']*\bstylesheet\b[^"']*["'][^>]*>/gi
  const urls: string[] = []
  for (const tag of html.matchAll(linkPattern)) {
    const href = tag[0].match(/href=["']([^"']+)["']/i)?.[1]
    if (!href) continue
    const mediaMatch = tag[0].match(/media=["']([^"']+)["']/i)
    if (mediaMatch && /\bprint\b/i.test(mediaMatch[1])) continue
    try {
      const resolved = new URL(href, baseUrl).toString()
      if (!/^https?:/.test(resolved)) continue
      urls.push(resolved)
    } catch {}
    if (urls.length >= MAX_CSS_SHEETS) break
  }
  if (urls.length === 0) return ''
  const results = await Promise.all(
    urls.map(async (u) => {
      const r = await safeFetch(u, MAX_CSS_PER_SHEET)
      return r && r.status < 400 ? r.body : ''
    }),
  )
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

interface FetchResult {
  body: string
  status: number
  finalUrl: string
  headers: Headers
}

async function safeFetch(url: string, maxBytes: number): Promise<FetchResult | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml,*/*' },
      redirect: 'follow',
    })
    const text = await res.text()
    clearTimeout(timeout)
    return { body: text.slice(0, maxBytes), status: res.status, finalUrl: res.url, headers: res.headers }
  } catch (err) {
    clearTimeout(timeout)
    return null
  }
}

async function fetchPage(targetUrl: string): Promise<FetchedPage | { error: string }> {
  const parsed = new URL(targetUrl)
  const commonSitemaps = [
    `${parsed.origin}/sitemap.xml`,
    `${parsed.origin}/sitemap_index.xml`,
    `${parsed.origin}/wp-sitemap.xml`,
  ]
  const start = Date.now()
  const [pageResult, robotsResult, llmsTxtResult, ...sitemapResults] = await Promise.all([
    safeFetch(targetUrl, MAX_HTML),
    safeFetch(`${parsed.origin}/robots.txt`, MAX_AUX),
    safeFetch(`${parsed.origin}/llms.txt`, MAX_AUX),
    ...commonSitemaps.map((p) => safeFetch(p, MAX_AUX)),
  ])
  const responseTimeMs = Date.now() - start

  if (!pageResult || pageResult.status === 0 || pageResult.status >= 400) {
    return { error: pageResult ? `status ${pageResult.status}` : 'no response' }
  }

  const robotsBody = robotsResult && robotsResult.status >= 200 && robotsResult.status < 400 ? robotsResult.body : ''
  const sitemapResult = sitemapResults.find(
    (r) => r && r.status >= 200 && r.status < 400 && r.body.length > 100,
  ) ?? null

  const securityHeaders: Record<string, string> = {}
  for (const key of [
    'content-security-policy',
    'x-frame-options',
    'strict-transport-security',
    'x-content-type-options',
  ]) {
    const v = pageResult.headers.get(key)
    if (v) securityHeaders[key] = v
  }

  const [externalCss, ogImage] = await Promise.all([
    fetchExternalCss(pageResult.body, pageResult.finalUrl),
    checkOgImage(pageResult.body, pageResult.finalUrl),
  ])

  return {
    url: pageResult.finalUrl,
    requestedUrl: targetUrl,
    html: pageResult.body,
    robotsTxt: robotsBody,
    sitemapXml: sitemapResult ? sitemapResult.body : '',
    llmsTxt: llmsTxtResult && llmsTxtResult.status >= 200 && llmsTxtResult.status < 400 ? llmsTxtResult.body : '',
    headers: securityHeaders,
    statusCode: pageResult.status,
    isHttps: pageResult.finalUrl.startsWith('https'),
    responseTimeMs,
    externalCss,
    ogImage,
  }
}

/* ── Run ────────────────────────────────────────────────────────────────── */

async function main() {
  const outDir = resolve(process.cwd(), 'scripts/test-output')
  mkdirSync(outDir, { recursive: true })

  type Summary = {
    name: string
    url: string
    vertical: string
    chamberTier?: string
    error?: string
    overall?: number
    categories?: Record<string, number>
    flags?: string[]
  }

  const summaries: Summary[] = []

  for (const site of SITES) {
    process.stdout.write(`▸ ${site.name.padEnd(34)} `)
    const page = await fetchPage(site.url)
    if ('error' in page) {
      process.stdout.write(`✗ ${page.error}\n`)
      summaries.push({ name: site.name, url: site.url, vertical: site.vertical, chamberTier: site.chamberTier, error: page.error })
      continue
    }

    const parsed = parseAudit(page)
    // Scoring funcs only read name + items; icon is required by the type but unused here.
    const categories = parsed.categories.map((c) => ({ name: c.name, items: c.items })) as unknown as AuditCategory[]
    const overall = computeOverallScore(categories)
    const catScores: Record<string, number> = {}
    for (const cat of categories) catScores[cat.name] = computeCategoryScore(cat)

    // Flag interesting findings — anything that hints at a parser bug
    const flags: string[] = []
    for (const cat of parsed.categories) {
      for (const it of cat.items) {
        if (it.status === 'fail' && /no\s+(images|q&a|content|alt)/i.test(it.value ?? '')) {
          flags.push(`${cat.name}/${it.label}: "${it.value}"`)
        }
        if (it.status === 'warn' && /no\s+(meta description|title|alt)/i.test(it.value ?? '')) {
          flags.push(`${cat.name}/${it.label}: "${it.value}"`)
        }
      }
    }

    summaries.push({
      name: site.name,
      url: site.url,
      vertical: site.vertical,
      chamberTier: site.chamberTier,
      overall,
      categories: catScores,
      flags,
    })

    // Save full structured result
    const slug = new URL(site.url).hostname.replace(/^www\./, '').replace(/[^a-z0-9.-]/gi, '_')
    writeFileSync(
      resolve(outDir, `${slug}.json`),
      JSON.stringify(
        {
          site: site.name,
          requestedUrl: site.url,
          finalUrl: page.url,
          statusCode: page.statusCode,
          responseTimeMs: page.responseTimeMs,
          isHttps: page.isHttps,
          overall,
          categoryScores: catScores,
          parsed,
        },
        null,
        2,
      ),
    )

    process.stdout.write(`✓ overall=${overall}\n`)
  }

  // Save summary
  writeFileSync(resolve(outDir, '_summary.json'), JSON.stringify(summaries, null, 2))

  // Console summary table
  console.log('\n──── SUMMARY ────────────────────────────────────────────────────────────')
  const cats = Object.keys(CATEGORY_WEIGHTS)
  console.log(
    'name'.padEnd(32) + 'overall ' + cats.map((c) => c.slice(0, 5).padEnd(7)).join(' '),
  )
  for (const s of summaries) {
    if (s.error) {
      console.log(s.name.padEnd(32) + 'ERROR   ' + s.error)
      continue
    }
    const row =
      s.name.padEnd(32) +
      String(s.overall).padEnd(8) +
      cats.map((c) => String(s.categories?.[c] ?? '-').padEnd(7)).join(' ')
    console.log(row)
  }

  console.log('\n──── FLAGGED FINDINGS (potential parser tells) ──────────────────────────')
  for (const s of summaries) {
    if (s.flags && s.flags.length > 0) {
      console.log(`\n${s.name} (${s.vertical}):`)
      s.flags.forEach((f) => console.log('  •', f))
    }
  }

  console.log(`\nFull per-site JSON written to: ${outDir}`)
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
