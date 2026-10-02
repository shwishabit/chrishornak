/* ── Authority Check: labelled fixture test ────────────────────────────────
 * Scores saved homepages with the live check code (src/lib/authority-read.ts)
 * and prints every check that disagrees with the hand label.
 *
 *   npx tsx scripts/ac-fixtures.mts record a.com b.com …   read each homepage ONCE (plus the extra reads
 *                                                          the check makes) and save it; skips saved sites
 *   npx tsx scripts/ac-fixtures.mts score [--out run.json] [--group holdout]
 *                                                          score every labelled site (or one group) from the saved pages.
 *                                                          Groups: agency, pittsburgh (rules were tuned on these), holdout
 *                                                          (fresh sites, never used to tune: the honest number)
 *   npx tsx scripts/ac-fixtures.mts refresh                 fetch ONLY the extra reads new code asks for that aren't saved
 *                                                          yet (e.g. About pages), once each; homepages are never re-read
 *   npx tsx scripts/ac-fixtures.mts findability [--out f.json] [--base g.json]
 *                                                          the same pages through the Findability Check; --base shows what moved
 *   npx tsx scripts/ac-fixtures.mts digest a.com            the page as a labeller reads it: text, links, images, schema
 *
 * Saved pages: scripts/ac-fixtures/pages/ (git-ignored: other people's HTML).
 * Labels: scripts/ac-fixtures/labels.json, rubric in scripts/ac-fixtures/RUBRIC.md.
 * No Ahrefs or Open PageRank calls, ever (Chris, 2026-10-02: keep Ahrefs use low);
 * authority scores are not part of this test.
 * Score never touches the network: a read the saved set doesn't have counts as
 * no answer and is printed as MISSING, so record it on purpose if it matters.
 * ─────────────────────────────────────────────────────────────────────── */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import Module from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { FetchResult } from '../src/lib/fetch-guard'
import type { Reader } from '../src/lib/authority-read'
import type { ProofId } from '../src/lib/authority-check'

// fetch-guard.ts imports 'server-only' (a Next.js build guard, not an installed package): an empty module here.
const M = Module as unknown as { _load: (req: string, ...rest: unknown[]) => unknown }
const nodeLoad = M._load
M._load = function (req: string, ...rest: unknown[]) {
  return req === 'server-only' ? {} : nodeLoad.call(this, req, ...rest)
}
const { fetchPageWithRetry, pageErrorMessage } = await import('../src/lib/fetch-guard')
const { liveReader, MAX_HTML, readSite } = await import('../src/lib/authority-read')
const { PROOF_CHECKS, parseSite } = await import('../src/lib/authority-check')
const { extractText, findAboutPage, findJsonLdBlocks } = await import('../src/lib/proof-signals')

const DIR = join(dirname(fileURLToPath(import.meta.url)), 'ac-fixtures')
const PAGES = join(DIR, 'pages')

interface SavedPage {
  status: number
  finalUrl: string
  body: string
}
interface Fixture {
  domain: string
  fetchedAt: string
  home: SavedPage | null
  pages: Record<string, SavedPage | null>
  redirects: Record<string, string | null>
}
interface Label {
  group: string
  /** true = the site shows it · false = it doesn't · null = can't tell, not scored. */
  expect: Partial<Record<ProofId, boolean | null>>
  why?: Partial<Record<ProofId, string>>
}

const fileOf = (domain: string) => join(PAGES, `${domain}.json`)
const asResult = (p: SavedPage): FetchResult => ({ ...p, headers: new Headers(), responseTimeMs: 0 })
const load = (domain: string): Fixture => JSON.parse(readFileSync(fileOf(domain), 'utf8'))

/* ── record ─────────────────────────────────────────────────────────────── */

async function record(domains: string[]) {
  mkdirSync(PAGES, { recursive: true })
  for (const d of domains) {
    const site = parseSite(d)
    if (!site) {
      console.log(`${d}: not a web address`)
      continue
    }
    if (existsSync(fileOf(site.bare))) {
      console.log(`${site.bare}: already saved, skipped`)
      continue
    }
    const fx: Fixture = { domain: site.bare, fetchedAt: new Date().toISOString(), home: null, pages: {}, redirects: {} }
    const home = await fetchPageWithRetry(site.homepage, MAX_HTML)
    if (home) fx.home = { status: home.status, finalUrl: home.finalUrl, body: home.body }
    if (home && !pageErrorMessage(home, site.host)) {
      const recorder: Reader = {
        async page(url) {
          const r = await liveReader.page(url)
          fx.pages[url] = r ? { status: r.status, finalUrl: r.finalUrl, body: r.body } : null
          return r
        },
        async redirect(url) {
          return (fx.redirects[url] = await liveReader.redirect(url))
        },
      }
      await readSite(home, recorder)
    }
    writeFileSync(fileOf(site.bare), JSON.stringify(fx))
    const extra = Object.keys(fx.pages).length + Object.keys(fx.redirects).length
    console.log(`${site.bare}: ${home ? home.status : 'no answer'}, ${Math.round((home?.body.length ?? 0) / 1024)} KB, ${extra} extra read(s)`)
    await new Promise((r) => setTimeout(r, 500)) // one site at a time
  }
}

/* ── refresh: save the extra reads new code asks for ────────────────────────
 * When the check learns a new extra read (the About page, 2026-10-02), the
 * saved sites lack it. This replays every saved site and fetches ONLY the
 * reads that aren't saved yet, once each, then saves them. Homepages are
 * never fetched again.
 * ─────────────────────────────────────────────────────────────────────── */

async function refresh() {
  let fetched = 0
  for (const f of readdirSync(PAGES)) {
    const fx: Fixture = JSON.parse(readFileSync(join(PAGES, f), 'utf8'))
    if (!fx.home || pageErrorMessage(asResult(fx.home), fx.domain)) continue
    const added: string[] = []
    const reader: Reader = {
      async page(url) {
        if (url in fx.pages) return fx.pages[url] ? asResult(fx.pages[url]!) : null
        const r = await liveReader.page(url)
        fx.pages[url] = r ? { status: r.status, finalUrl: r.finalUrl, body: r.body } : null
        added.push(`${url} → ${r?.status ?? 'no answer'}`)
        return r
      },
      async redirect(url) {
        if (url in fx.redirects) return fx.redirects[url]
        const to = (fx.redirects[url] = await liveReader.redirect(url))
        added.push(`${url} → ${to ?? 'no answer'}`)
        return to
      },
    }
    await readSite(asResult(fx.home), reader)
    if (!added.length) continue
    fetched += added.length
    writeFileSync(join(PAGES, f), JSON.stringify(fx))
    console.log(`${fx.domain}: ${added.join(' · ')}`)
    await new Promise((r) => setTimeout(r, 500)) // one site at a time
  }
  console.log(`\n${fetched} new read(s) saved`)
}

/* ── score ──────────────────────────────────────────────────────────────── */

function replayReader(fx: Fixture, missing: string[], skip?: string | null): Reader {
  return {
    async page(url) {
      if (url === skip) return null
      if (!(url in fx.pages)) {
        missing.push(`page ${url}`)
        return null
      }
      const p = fx.pages[url]
      return p ? asResult(p) : null
    },
    async redirect(url) {
      if (!(url in fx.redirects)) {
        missing.push(`redirect ${url}`)
        return null
      }
      return fx.redirects[url]
    },
  }
}

async function score(out?: string, group?: string, noAbout = false) {
  const labels: Record<string, Label> = JSON.parse(readFileSync(join(DIR, 'labels.json'), 'utf8'))
  const ids = PROOF_CHECKS.map((c) => c.id)
  const tally = Object.fromEntries(ids.map((id) => [id, { right: 0, falseNo: 0, falseYes: 0 }]))
  const wrong: string[] = []
  const runs: Record<string, { proof: ProofId[] | null; evidence?: Record<string, string> }> = {}
  const notes: string[] = []

  for (const [domain, label] of Object.entries(labels)) {
    if (group && label.group !== group) continue
    if (!existsSync(fileOf(domain))) {
      notes.push(`${domain}: no saved page`)
      continue
    }
    const fx = load(domain)
    if (!fx.home || pageErrorMessage(asResult(fx.home), domain)) {
      notes.push(`${domain}: homepage not readable (${fx.home?.status ?? 'no answer'}), not scored`)
      runs[domain] = { proof: null }
      continue
    }
    const missing: string[] = []
    // --no-about: as if the About page didn't answer, to measure what reading it adds.
    const skip = noAbout ? findAboutPage(fx.home.body, fx.home.finalUrl) : null
    const read = await readSite(asResult(fx.home), replayReader(fx, missing, skip))
    for (const m of missing) notes.push(`${domain}: MISSING ${m}`)
    runs[domain] = { proof: read.proof, evidence: read.evidence }
    for (const id of ids) {
      const want = label.expect[id]
      if (want === undefined || want === null) continue
      const got = read.proof.includes(id)
      if (got === want) tally[id].right++
      else {
        tally[id][got ? 'falseYes' : 'falseNo']++
        const said = got ? `said yes: ${read.evidence[id] ?? '(no evidence)'}` : 'said no'
        wrong.push(`${got ? '!' : '✕'} ${id.padEnd(11)} ${domain.padEnd(28)} ${said}${label.why?.[id] ? `\n    label: ${label.why[id]}` : ''}`)
      }
    }
  }

  console.log('\nCheck        right  false-no  false-yes')
  let r = 0, fn = 0, fy = 0
  for (const id of ids) {
    const t = tally[id]
    r += t.right; fn += t.falseNo; fy += t.falseYes
    console.log(`${id.padEnd(12)} ${String(t.right).padStart(5)}  ${String(t.falseNo).padStart(8)}  ${String(t.falseYes).padStart(9)}`)
  }
  console.log(`${'TOTAL'.padEnd(12)} ${String(r).padStart(5)}  ${String(fn).padStart(8)}  ${String(fy).padStart(9)}   (${((100 * r) / (r + fn + fy)).toFixed(1)}% right)`)
  console.log(`\nWrong cells (✕ = missed, ! = passed but not there):\n${wrong.join('\n')}`)
  if (notes.length) console.log(`\nNotes:\n${notes.join('\n')}`)
  if (out) writeFileSync(out, JSON.stringify(runs, null, 1))
}

/* ── digest ─────────────────────────────────────────────────────────────── */

/** What a labeller needs, without the page's scripts and styles. */
function digest(domain: string) {
  const fx = load(domain)
  if (!fx.home) return console.log('no homepage saved')
  const html = fx.home.body
  const strip = (s: string) => s.replace(/<!--[\s\S]*?-->/g, ' ')
  const lines: string[] = [`# ${domain} · ${fx.home.status} · ${fx.home.finalUrl} · saved ${fx.fetchedAt}`]
  lines.push('\n## Visible text\n' + extractText(strip(html)))
  // Attribute values with or without quotes (minified pages drop them: smartsites.com, pghdma.com).
  const attr = (tag: string, n: string) =>
    tag.match(new RegExp(`\\s${n}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'>]+))`, 'i'))?.slice(1).find((v) => v !== undefined) ?? ''
  lines.push('\n## Links (href | words)')
  for (const m of html.matchAll(/(<a\b[^>]*>)([\s\S]*?)<\/a>/gi))
    if (attr(m[1], 'href')) lines.push(`${attr(m[1], 'href').slice(0, 140)} | ${extractText(m[2]).slice(0, 80)}`)
  lines.push('\n## Images (src | alt | title)')
  for (const m of html.matchAll(/<img\b[^>]*>/gi))
    lines.push(`${(attr(m[0], 'src') || attr(m[0], 'data-src')).slice(0, 140)} | ${attr(m[0], 'alt')} | ${attr(m[0], 'title')}`)
  lines.push('\n## JSON-LD')
  for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi))
    if (/ld\+json/i.test(attr(`<x ${m[1]}>`, 'type'))) lines.push(m[2].replace(/\s+/g, ' ').slice(0, 4000))
  for (const [url, p] of Object.entries(fx.pages)) lines.push(`\n## Extra page ${url} · ${p?.status ?? 'no answer'}\n${p ? extractText(strip(p.body)).slice(0, 6000) : ''}`)
  for (const [url, to] of Object.entries(fx.redirects)) lines.push(`\n## Short link ${url} → ${to ?? 'no answer'}`)
  console.log(lines.join('\n'))
}

/* ── findability ────────────────────────────────────────────────────────────
 * The shared rules (proof-signals.ts) also score the Findability Check, so
 * every change there is measured here too: each saved homepage through
 * parseAudit, with robots / sitemap / llms.txt / CSS left empty (the same
 * for every run, so only the change shows). --base compares with a saved run.
 * ─────────────────────────────────────────────────────────────────────── */

async function findability(out?: string, base?: string) {
  const { parseAudit } = await import('../src/lib/audit-parser')
  const { computeOverallScore } = await import('../src/lib/audit-scoring')
  type Run = Record<string, { overall: number; items: Record<string, string> }>
  const run: Run = {}
  for (const f of readdirSync(PAGES)) {
    const fx: Fixture = JSON.parse(readFileSync(join(PAGES, f), 'utf8'))
    if (!fx.home || pageErrorMessage(asResult(fx.home), fx.domain)) continue
    const parsed = parseAudit({
      url: fx.home.finalUrl,
      requestedUrl: `https://${fx.domain}/`,
      html: fx.home.body,
      robotsTxt: '',
      sitemapXml: '',
      llmsTxt: '',
      headers: {},
      statusCode: fx.home.status,
      isHttps: fx.home.finalUrl.startsWith('https'),
      responseTimeMs: 500,
    })
    const cats = parsed.categories.map((c) => ({ name: c.name, items: c.items })) as Parameters<typeof computeOverallScore>[0]
    const items: Record<string, string> = {}
    for (const c of parsed.categories) for (const it of c.items) items[`${c.name} / ${it.label}`] = `${it.status}: ${it.value}`
    run[fx.domain] = { overall: computeOverallScore(cats), items }
  }
  if (out) writeFileSync(out, JSON.stringify(run, null, 1))
  if (!base) {
    for (const [d, r] of Object.entries(run)) console.log(`${String(r.overall).padStart(3)}  ${d}`)
    return
  }
  const before: Run = JSON.parse(readFileSync(base, 'utf8'))
  let moved = 0
  for (const [d, r] of Object.entries(run)) {
    const b = before[d]
    if (!b) continue
    const changed = Object.keys(r.items).filter((k) => r.items[k] !== b.items[k])
    if (!changed.length && r.overall === b.overall) continue
    moved++
    console.log(`${d}: ${b.overall} → ${r.overall}`)
    for (const k of changed) console.log(`    ${k}\n      was ${b.items[k] ?? '-'}\n      now ${r.items[k]}`)
  }
  console.log(`\n${moved} of ${Object.keys(run).length} sites changed on Findability`)
}

/* ── main ───────────────────────────────────────────────────────────────── */

const [cmd, ...args] = process.argv.slice(2)
const flag = (name: string) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined)
if (cmd === 'record') await record(args)
else if (cmd === 'score') await score(flag('--out'), flag('--group'), args.includes('--no-about'))
else if (cmd === 'refresh') await refresh()
else if (cmd === 'findability') await findability(flag('--out'), flag('--base'))
else if (cmd === 'digest') for (const d of args) digest(d)
else if (cmd === 'list') console.log(readdirSync(PAGES).map((f) => f.replace(/\.json$/, '')).join('\n'))
else console.log('Use: record <domains…> | score [--out file] | findability [--out file] [--base file] | digest <domain> | list')
