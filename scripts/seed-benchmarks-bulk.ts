/* ── Benchmark bulk seed ──────────────────────────────────────────────────
 * Scans a broad set of real U.S. small / independent business sites through the
 * SAME parseAudit + scoring pipeline the live tool uses, and inserts the first
 * TARGET that pass cleanly. Real businesses, real scores → legitimate corpus
 * data (is_synthetic = false). Excludes domains already seeded.
 *
 * Safe by design: one fetch per site, polite delay between sites, no retries.
 *
 * Run:  npx tsx scripts/seed-benchmarks-bulk.ts
 * ─────────────────────────────────────────────────────────────────────── */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { parseAudit, type FetchedPage } from '../src/lib/audit-parser'
import { computeOverallScore, computeCategoryScore, type AuditCategory } from '../src/lib/audit-scoring'

const TARGET = 85

// Broad, confident set of real independent businesses across verticals.
// (Excludes the 20 Pittsburgh seed + organic domains already in the corpus.)
const SITES: string[] = [
  // Service-vertical SMBs (chamber-sourced — diverse: mortgage, chiro, tax, fitness, funeral, plumbing, martial arts, financial, hardware, catering)
  'https://www.angelinaspastries.com', 'https://atamcmurray.com', 'https://www.mottomortgagekeystone.com',
  'https://www.1781club.com', 'http://www.blueskycsi.com', 'https://www.crhh-pittsburgh.com',
  'https://www.cts-pgh.com', 'https://www.confluencefp.com', 'https://www.jeffhancher.com',
  'https://www.millersace.com', 'https://www.ajbuerkle.com', 'http://www.aladdinseatery.com',
  'https://bareskin-laser.com', 'https://www.beinhauer.com', 'https://www.bellaserapgh.com',
  'http://bergerchiropracticwellness.com', 'https://berniceaschweissllc.com', 'https://www.binbath.com',
  'https://www.bootcampfit360.com',
  // Restaurants / delis / BBQ
  'https://katzsdelicatessen.com', 'https://franklinbbq.com', 'https://joesstonecrab.com',
  'https://www.commanderspalace.com', 'https://shop.cafedumonde.com', 'https://pizzeriabianco.com',
  'https://pepespizzeria.com', 'https://www.sallysapizza.com', 'https://modernapizza.com',
  'https://www.pinkshollywood.com', 'https://thevarsity.com', 'https://www.zingermans.com',
  'https://www.peterluger.com', 'https://gibsonssteakhouse.com', 'https://russanddaughters.com',
  'https://www.grimaldis-pizza.com', 'https://www.huskrestaurant.com', 'https://gusfriedchicken.com',
  'https://terryblacksbbq.com', 'https://blacksbbq.com', 'https://www.labarbecue.com',
  'https://saltlickbbq.com', 'https://www.serendipity3.com', 'https://www.juniorscheesecake.com',
  // Coffee roasters
  'https://www.intelligentsiacoffee.com', 'https://www.stumptowncoffee.com', 'https://counterculturecoffee.com',
  'https://bluebottlecoffee.com', 'https://www.ritualcoffee.com', 'https://www.vervecoffee.com',
  'https://onyxcoffeelab.com', 'https://www.deathwishcoffee.com', 'https://www.philzcoffee.com',
  'https://dogwoodcoffee.com', 'https://georgehowellcoffee.com', 'https://www.lacolombe.com',
  'https://equatorcoffees.com', 'https://sightglasscoffee.com', 'https://www.templecoffee.com',
  // Breweries / distilleries
  'https://sierranevada.com', 'https://www.stonebrewing.com', 'https://www.dogfish.com',
  'https://www.allagash.com', 'https://www.troegs.com', 'https://www.victorybeer.com',
  'https://www.greatlakesbrewing.com', 'https://www.oskarblues.com', 'https://www.newbelgium.com',
  'https://www.bellsbeer.com', 'https://foundersbrewing.com', 'https://russianriverbrewing.com',
  'https://www.revbrew.com', 'https://halfacrebeer.com', 'https://surlybrewing.com',
  'https://moderntimesbeer.com', 'https://www.creaturecomfortsbeer.com', 'https://www.wickedweedbrewing.com',
  'https://www.mainebeercompany.com', 'https://www.treehousebrew.com', 'https://otherhalfbrewing.com',
  'https://www.mondaynightbrewing.com', 'https://jollypumpkin.com', 'https://www.ballastpoint.com',
  'https://www.lagunitas.com', 'https://www.firestonebeer.com', 'https://www.deschutesbrewery.com',
  'https://www.rogue.com', 'https://abita.com', 'https://www.newglarusbrewing.com',
  'https://topplinggoliath.com', 'https://weldwerksbrewing.com',
  'https://balconesdistilling.com', 'https://westlanddistillery.com', 'https://leopoldbros.com',
  'https://corsairdistillery.com', 'https://catoctincreekdistilling.com', 'https://stranahans.com',
  'https://www.highwest.com', 'https://kovaldistillery.com',
  // Bakeries / sweets / ice cream
  'https://www.levainbakery.com', 'https://milkbarstore.com', 'https://tartinebakery.com',
  'https://www.magnoliabakery.com', 'https://dominiqueansel.com', 'https://georgetowncupcake.com',
  'https://flourbakery.com', 'https://tattebakery.com', 'https://www.portosbakery.com',
  'https://www.labreabakery.com', 'https://doughnutplant.com', 'https://www.federaldonuts.com',
  'https://www.voodoodoughnut.com', 'https://www.saltandstraw.com', 'https://jenis.com',
  'https://www.graeters.com', 'https://amysicecreams.com',
  // Bookstores
  'https://www.powells.com', 'https://www.tatteredcover.com', 'https://www.strandbooks.com',
  'https://www.parnassusbooks.net', 'https://citylights.com', 'https://www.elliottbaybook.com',
  'https://www.politics-prose.com', 'https://www.mcnallyjackson.com', 'https://www.greenlightbookstore.com',
  'https://www.ravenbookstore.com', 'https://www.bookpeople.com',
  // Music / retail
  'https://www.amoeba.com', 'https://waterloorecords.com',
]

/* ── env loader ───────────────────────────────────────────────────────── */
try {
  const env = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
  for (const line of env.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim()
  }
} catch { /* shell env */ }

/* ── fetch helpers (mirror route.ts) ──────────────────────────────────── */
const MAX_HTML = 2 * 1024 * 1024, MAX_AUX = 50_000, FETCH_TIMEOUT = 12_000
const USER_AGENT = 'Mozilla/5.0 (compatible; SiteCheck/1.0; +https://chrishornak.com/audit)'
const MAX_CSS_SHEETS = 5, MAX_CSS_TOTAL = 200_000, MAX_CSS_PER_SHEET = 80_000
interface FetchResult { body: string; status: number; finalUrl: string; headers: Headers }

async function safeFetch(url: string, maxBytes: number): Promise<FetchResult | null> {
  const c = new AbortController()
  const t = setTimeout(() => c.abort(), FETCH_TIMEOUT)
  try {
    const res = await fetch(url, { signal: c.signal, headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml,*/*' }, redirect: 'follow' })
    const text = await res.text()
    clearTimeout(t)
    return { body: text.slice(0, maxBytes), status: res.status, finalUrl: res.url, headers: res.headers }
  } catch { clearTimeout(t); return null }
}

async function checkOgImage(html: string, baseUrl: string) {
  const m = html.match(/<meta[^>]*(?:name|property)=["']og:image["'][^>]*content=["']([^"']*)["']/i) ||
    html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*(?:name|property)=["']og:image["']/i)
  const raw = m?.[1]; if (!raw) return undefined
  let resolved: string; try { resolved = new URL(raw, baseUrl).toString() } catch { return { url: raw } }
  if (!/^https?:/i.test(resolved)) return { url: resolved }
  const c = new AbortController(); const t = setTimeout(() => c.abort(), FETCH_TIMEOUT)
  const h = { 'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)', Accept: 'image/*,*/*;q=0.8' }
  try {
    let res = await fetch(resolved, { method: 'HEAD', signal: c.signal, headers: h, redirect: 'manual' })
    if (res.status === 405 || res.status === 501) res = await fetch(resolved, { method: 'GET', signal: c.signal, headers: h, redirect: 'manual' })
    clearTimeout(t)
    return { url: resolved, status: res.status, redirected: res.status >= 300 && res.status < 400, contentType: res.headers.get('content-type') ?? undefined }
  } catch { clearTimeout(t); return { url: resolved } }
}

async function fetchExternalCss(html: string, baseUrl: string): Promise<string> {
  const urls: string[] = []
  for (const tag of html.matchAll(/<link\b[^>]*rel=["'][^"']*\bstylesheet\b[^"']*["'][^>]*>/gi)) {
    const href = tag[0].match(/href=["']([^"']+)["']/i)?.[1]; if (!href) continue
    const media = tag[0].match(/media=["']([^"']+)["']/i); if (media && /\bprint\b/i.test(media[1])) continue
    try { const r = new URL(href, baseUrl).toString(); if (/^https?:/.test(r)) urls.push(r) } catch { /* skip */ }
    if (urls.length >= MAX_CSS_SHEETS) break
  }
  if (!urls.length) return ''
  const results = await Promise.all(urls.map(async (u) => { const r = await safeFetch(u, MAX_CSS_PER_SHEET); return r && r.status < 400 ? r.body : '' }))
  let combined = ''
  for (const css of results) { if (combined.length + css.length > MAX_CSS_TOTAL) { combined += css.slice(0, MAX_CSS_TOTAL - combined.length); break } combined += css + '\n' }
  return combined
}

async function fetchPage(targetUrl: string): Promise<FetchedPage | null> {
  const parsed = new URL(targetUrl)
  const sitemaps = [`${parsed.origin}/sitemap.xml`, `${parsed.origin}/sitemap_index.xml`, `${parsed.origin}/wp-sitemap.xml`]
  const start = Date.now()
  const [page, robots, llms, ...sm] = await Promise.all([
    safeFetch(targetUrl, MAX_HTML), safeFetch(`${parsed.origin}/robots.txt`, MAX_AUX),
    safeFetch(`${parsed.origin}/llms.txt`, MAX_AUX), ...sitemaps.map((p) => safeFetch(p, MAX_AUX)),
  ])
  const responseTimeMs = Date.now() - start
  if (!page || page.status === 0 || page.status >= 400) return null
  const robotsBody = robots && robots.status >= 200 && robots.status < 400 ? robots.body : ''
  const sitemap = sm.find((r) => r && r.status >= 200 && r.status < 400 && r.body.length > 100) ?? null
  const headers: Record<string, string> = {}
  for (const k of ['content-security-policy', 'x-frame-options', 'strict-transport-security', 'x-content-type-options']) { const v = page.headers.get(k); if (v) headers[k] = v }
  const [externalCss, ogImage] = await Promise.all([fetchExternalCss(page.body, page.finalUrl), checkOgImage(page.body, page.finalUrl)])
  return {
    url: page.finalUrl, requestedUrl: targetUrl, html: page.body, robotsTxt: robotsBody,
    sitemapXml: sitemap ? sitemap.body : '', llmsTxt: llms && llms.status >= 200 && llms.status < 400 ? llms.body : '',
    headers, statusCode: page.status, isHttps: page.finalUrl.startsWith('https'), responseTimeMs, externalCss, ogImage,
  }
}

const reg = (u: string) => new URL(u).hostname.replace(/^www\./, '').toLowerCase()

async function main() {
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_ANON_KEY
  if (!url || !key) { console.error('Missing SUPABASE_URL / SUPABASE_ANON_KEY'); process.exit(1) }
  const sb = createClient(url, key, { auth: { persistSession: false } })

  let inserted = 0
  const seen = new Set<string>()
  for (const site of SITES) {
    if (inserted >= TARGET) break
    let domain = ''; try { domain = reg(site) } catch { continue }
    if (!domain || seen.has(domain)) continue
    process.stdout.write(`• ${domain} … `)
    let page: FetchedPage | null = null
    try { page = await fetchPage(site) } catch { page = null }
    if (!page) { console.log('skip'); continue }
    const parsed = parseAudit(page)
    const overall = computeOverallScore(parsed.categories as unknown as AuditCategory[])
    const categoryScores: Record<string, number> = {}
    for (const cat of parsed.categories) categoryScores[cat.name] = computeCategoryScore(cat as unknown as AuditCategory)
    const issues = parsed.categories.flatMap((cat) => cat.items.filter((it) => it.status === 'fail' || it.status === 'warn').map((it) => ({ c: cat.name, l: it.label, s: it.status })))
    const { error } = await sb.from('audit_runs').insert({ domain, overall_score: overall, category_scores: categoryScores, issues, status: 'completed', is_synthetic: false })
    if (error) { console.log(`db error: ${error.message}`); continue }
    seen.add(domain); inserted++
    console.log(`${overall}  (${inserted}/${TARGET})`)
    await new Promise((r) => setTimeout(r, 400))
  }
  console.log(`\nInserted ${inserted} new sites.`)
  process.exit(0)
}
main().catch((e) => { console.error(e); process.exit(1) })
