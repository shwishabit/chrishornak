/* ── Benchmark local-SMB seed ─────────────────────────────────────────────
 * Ordinary small businesses harvested from the Enigma local-business directory
 * across WV / OH / PA / KY small + mid cities (Wheeling, Weirton, Parkersburg,
 * Morgantown, Steubenville, Zanesville, Johnstown, Ashland). Local vets,
 * dentists, tire shops, diners, furniture stores, jewelers, salons, markets —
 * a far more representative "average small business" sample than notable
 * independents. Homepages only; national chains and social-only listings dropped.
 *
 * Run:  npx tsx scripts/seed-benchmarks-local.ts
 * ─────────────────────────────────────────────────────────────────────── */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { parseAudit, type FetchedPage } from '../src/lib/audit-parser'
import { computeOverallScore, computeCategoryScore, type AuditCategory } from '../src/lib/audit-scoring'

const TARGET = 100

const SITES: string[] = [
  // Wheeling, WV
  'https://www.oionline.com', 'https://generationswhg.com', 'https://www.ogdennews.com',
  'https://smithoilinc.com', 'https://unclepetes.top', 'https://www.wheeling-glendaleanimalhospital.com',
  'https://www.zambitodentistry.com', 'https://www.keyanimal.com', 'https://www.miklasmeatmarket.com',
  'https://charhouseontheboulevard.com', 'https://www.avenueeats.com', 'https://thrivewheeling.com',
  'https://www.victorychevroletgmchighlands.com', 'http://www.ntwonline.com', 'https://www.riesbeckfoods.com',
  // Weirton, WV
  'https://summitsalonacademyweirton.com', 'https://fergusontirepros.com', 'https://www.theoyiannis.com',
  'https://www.weirtonlumber.com', 'https://www.speedyfurniture.com', 'https://deejaysfamousribs.com',
  'https://r22sportsbar.com', 'https://www.chicofiesta.com', 'https://www.elevationweightloss.com',
  'https://crazymexicanrg.com', 'https://mariosrestaurantandlounge.com', 'http://www.basilssportsbar.com',
  'https://lacucinaweirton.com',
  // Parkersburg, WV
  'https://www.parkersburgveterinaryhospital.net', 'https://www.cascable.com', 'https://kingsbuffetgrill.shop',
  'https://www.twistedglasssmokeshop.com', 'https://losagavesrest.com', 'https://www.groggs.com',
  'https://www.twinstate.net', 'https://granazteca.com', 'https://www.lastrancasmexicancantina.com',
  'http://www.hornorharrison.com', 'https://theblennerhassett.com', 'https://www.stokedcoffee.com',
  'https://www.motherearthworks.com',
  // Morgantown, WV
  'https://www.bfscompanies.com', 'https://www.subarumorgantown.com', 'https://www.joedefaziooilco.com',
  'https://www.cheatlakevets.com', 'https://www.piesandpints.net', 'https://www.premiergmofwv.com',
  'https://www.keglerssportsbar.com', 'https://www.mosestoyotaofmorgantown.com', 'https://oliveriosristorante.com',
  'https://amplifychildrensacademy.com', 'https://www.chucksfurniture.com', 'https://fusionsteakhouse.com',
  'https://www.premiernissanofwv.com',
  // Steubenville, OH
  'https://www.snydertire.com', 'https://www.7rangesentertainment.com', 'https://www.legalhair.net',
  'https://www.naplesspaghettihouse.com', 'https://daretocompareus.com', 'https://www.ftsteubenmall.com',
  'https://www.ohiovalleyhonda.com', 'https://www.raymondchevygmc.com', 'https://www.steubenvilleteamford.com',
  'https://thehalosalon.com', 'https://www.sumosteubenville.com', 'https://www.teamtoyotaohio.com',
  'https://steubenvilledentalstudio.com',
  // Zanesville, OH
  'https://www.coconisfurniture.com', 'https://www.chiropracticassociates.org', 'https://www.quinnsupply.com',
  'https://thebarnzanesville.com', 'https://www.pughsdiamonds.com', 'https://www.thecoffeecupandbakery.com',
  'https://www.americanpridepower.com', 'https://www.zanesvillehonda.com', 'https://www.zanesvilletoyota.com',
  // Johnstown, PA
  'https://www.thebalancerestaurant.com', 'https://www.randysbilo.com', 'https://www.conzattis.com',
  'https://idealsupermarket.com', 'https://www.johnstowngalleria.com', 'https://www.parkhomestores.com',
  'https://www.johnstownveterinary.com', 'https://www.italianovenrestaurant.com', 'https://johnstowneats.com',
  'https://kabukijohnstownpa.com', 'https://www.spanglersubaru.com', 'https://www.eyecare2020.net',
  'https://carmanstire.com', 'https://richlandvet.com',
  // Ashland, KY
  'https://ashlandtowncenter.com', 'https://www.foodfairmarkets.com', 'http://ashlandanimalclinic.com',
  'https://smokinjsribs.com', 'https://backyardpizzaky.com', 'https://www.borderssportinggoods.com',
  'https://www.cannonsburgcompanion.com', 'https://www.superquik.net', 'https://www.gillums.com',
  'https://elcolonialmexi.com', 'https://www.sargentstires.com', 'https://www.horizonweightloss.com',
  'https://www.pollocksjewelers.com',
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
  const c = new AbortController(); const t = setTimeout(() => c.abort(), FETCH_TIMEOUT)
  try {
    const res = await fetch(url, { signal: c.signal, headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml,*/*' }, redirect: 'follow' })
    const text = await res.text(); clearTimeout(t)
    return { body: text.slice(0, maxBytes), status: res.status, finalUrl: res.url, headers: res.headers }
  } catch { clearTimeout(t); return null }
}
async function checkOgImage(html: string, baseUrl: string) {
  const m = html.match(/<meta[^>]*(?:name|property)=["']og:image["'][^>]*content=["']([^"']*)["']/i) || html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*(?:name|property)=["']og:image["']/i)
  const raw = m?.[1]; if (!raw) return undefined
  let r: string; try { r = new URL(raw, baseUrl).toString() } catch { return { url: raw } }
  if (!/^https?:/i.test(r)) return { url: r }
  const c = new AbortController(); const t = setTimeout(() => c.abort(), FETCH_TIMEOUT)
  const h = { 'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)', Accept: 'image/*,*/*;q=0.8' }
  try {
    let res = await fetch(r, { method: 'HEAD', signal: c.signal, headers: h, redirect: 'manual' })
    if (res.status === 405 || res.status === 501) res = await fetch(r, { method: 'GET', signal: c.signal, headers: h, redirect: 'manual' })
    clearTimeout(t)
    return { url: r, status: res.status, redirected: res.status >= 300 && res.status < 400, contentType: res.headers.get('content-type') ?? undefined }
  } catch { clearTimeout(t); return { url: r } }
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
  console.log(`\nInserted ${inserted} local SMB sites.`)
  process.exit(0)
}
main().catch((e) => { console.error(e); process.exit(1) })
