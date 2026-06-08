/* ── Benchmark seed ───────────────────────────────────────────────────────
 * Audits a curated set of real Pittsburgh-area local business sites through the
 * SAME parseAudit + scoring pipeline the live tool uses, and inserts the first
 * TARGET that pass cleanly into the benchmark corpus (audit_runs).
 *
 * These are real businesses with real scores — they are legitimate corpus data
 * (is_synthetic = false). The benchmarks page discloses the seed sample.
 *
 * Run:  npx tsx scripts/seed-benchmarks.ts
 * Env:  reads SUPABASE_URL + SUPABASE_ANON_KEY from .env.local (or the shell)
 * ─────────────────────────────────────────────────────────────────────── */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { parseAudit, type FetchedPage } from '../src/lib/audit-parser'
import {
  computeOverallScore,
  computeCategoryScore,
  type AuditCategory,
} from '../src/lib/audit-scoring'

const TARGET = 20

// Curated, most-confident-first. The script keeps the first TARGET that pass,
// so extras at the end are backups for any that 404 / block / time out.
const SITES: string[] = [
  'https://www.kennywood.com',
  'https://www.phipps.conservatory.org',
  'https://www.warhol.org',
  'https://www.aviary.org',
  'https://carnegiemuseums.org',
  'https://www.heinzhistorycenter.org',
  'https://www.pittsburghzoo.org',
  'https://mattress.org',
  'https://www.thefrickpittsburgh.org',
  'https://primantibros.com',
  'https://www.pamelasdiner.com',
  'https://www.klavonsicecream.com',
  'https://www.mineospizza.com',
  'https://www.prantlsbakery.com',
  'https://churchbrew.com',
  'https://www.wiglewhiskey.com',
  'https://www.millieshomemade.com',
  'https://commonplacecoffee.com',
  'https://eatgaucho.com',
  'https://www.maggiesfarmrum.com',
  'https://www.eastendbrewing.com',
  'https://www.enricobiscotti.com',
  'https://www.laprima.com',
  'https://bicycleheaven.org',
  'https://www.soergels.com',
  'https://www.burghersbrewing.com',
  'https://www.dishosteria.com',
  'https://www.aptekapgh.com',
  'https://www.driftwoodovenpgh.com',
  'https://gristhouse.com',
  'https://www.tracebrewing.com',
  'https://www.randylandpgh.com',
  'https://www.jennyleebakery.com',
  'https://www.legumebistro.com',
]

/* ── env loader (.env.local) ──────────────────────────────────────────── */
try {
  const env = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
  for (const line of env.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim()
  }
} catch { /* fall back to shell env */ }

/* ── fetch helpers (mirror src/app/api/audit/route.ts) ──────────────────── */
const MAX_HTML = 2 * 1024 * 1024
const MAX_AUX = 50_000
const FETCH_TIMEOUT = 12_000
const USER_AGENT = 'Mozilla/5.0 (compatible; SiteCheck/1.0; +https://chrishornak.com/audit)'
const MAX_CSS_SHEETS = 5
const MAX_CSS_TOTAL = 200_000
const MAX_CSS_PER_SHEET = 80_000

interface FetchResult { body: string; status: number; finalUrl: string; headers: Headers }

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
  } catch {
    clearTimeout(timeout)
    return null
  }
}

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
    return { url: resolved, status: res.status, redirected: res.status >= 300 && res.status < 400, contentType: res.headers.get('content-type') ?? undefined }
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
      const r = new URL(href, baseUrl).toString()
      if (/^https?:/.test(r)) urls.push(r)
    } catch { /* skip */ }
    if (urls.length >= MAX_CSS_SHEETS) break
  }
  if (urls.length === 0) return ''
  const results = await Promise.all(urls.map(async (u) => {
    const r = await safeFetch(u, MAX_CSS_PER_SHEET)
    return r && r.status < 400 ? r.body : ''
  }))
  let combined = ''
  for (const css of results) {
    if (combined.length + css.length > MAX_CSS_TOTAL) { combined += css.slice(0, MAX_CSS_TOTAL - combined.length); break }
    combined += css + '\n'
  }
  return combined
}

async function fetchPage(targetUrl: string): Promise<FetchedPage | null> {
  const parsed = new URL(targetUrl)
  const commonSitemaps = [`${parsed.origin}/sitemap.xml`, `${parsed.origin}/sitemap_index.xml`, `${parsed.origin}/wp-sitemap.xml`]
  const start = Date.now()
  const [pageResult, robotsResult, llmsTxtResult, ...sitemapResults] = await Promise.all([
    safeFetch(targetUrl, MAX_HTML),
    safeFetch(`${parsed.origin}/robots.txt`, MAX_AUX),
    safeFetch(`${parsed.origin}/llms.txt`, MAX_AUX),
    ...commonSitemaps.map((p) => safeFetch(p, MAX_AUX)),
  ])
  const responseTimeMs = Date.now() - start
  if (!pageResult || pageResult.status === 0 || pageResult.status >= 400) return null

  const robotsBody = robotsResult && robotsResult.status >= 200 && robotsResult.status < 400 ? robotsResult.body : ''
  const sitemapResult = sitemapResults.find((r) => r && r.status >= 200 && r.status < 400 && r.body.length > 100) ?? null
  const securityHeaders: Record<string, string> = {}
  for (const key of ['content-security-policy', 'x-frame-options', 'strict-transport-security', 'x-content-type-options']) {
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

function registrableDomain(u: string): string {
  return new URL(u).hostname.replace(/^www\./, '').toLowerCase()
}

/* ── Run ─────────────────────────────────────────────────────────────── */
async function main() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_ANON_KEY
  if (!url || !key) {
    console.error('Missing SUPABASE_URL / SUPABASE_ANON_KEY (checked .env.local + shell).')
    process.exit(1)
  }
  const sb = createClient(url, key, { auth: { persistSession: false } })

  let inserted = 0
  const seen = new Set<string>()

  for (const site of SITES) {
    if (inserted >= TARGET) break
    const domain = (() => { try { return registrableDomain(site) } catch { return '' } })()
    if (!domain || seen.has(domain)) continue

    process.stdout.write(`• ${domain} … `)
    let page: FetchedPage | null = null
    try { page = await fetchPage(site) } catch { page = null }
    if (!page) { console.log('skip (unreachable)'); continue }

    const parsed = parseAudit(page)
    const categories = parsed.categories as unknown as AuditCategory[]
    const overall = computeOverallScore(categories)

    const categoryScores: Record<string, number> = {}
    for (const cat of parsed.categories) categoryScores[cat.name] = computeCategoryScore(cat as unknown as AuditCategory)

    const issues = parsed.categories.flatMap((cat) =>
      cat.items
        .filter((it) => it.status === 'fail' || it.status === 'warn')
        .map((it) => ({ c: cat.name, l: it.label, s: it.status })),
    )

    const { error } = await sb.from('audit_runs').insert({
      domain,
      overall_score: overall,
      category_scores: categoryScores,
      issues,
      status: 'completed',
      is_synthetic: false,
    })
    if (error) { console.log(`db error: ${error.message}`); continue }

    seen.add(domain)
    inserted++
    console.log(`scored ${overall}  (${inserted}/${TARGET})`)
    await new Promise((r) => setTimeout(r, 400))
  }

  console.log(`\nSeeded ${inserted} sites into the benchmark corpus.`)
  process.exit(0)
}

main().catch((e) => { console.error(e); process.exit(1) })
