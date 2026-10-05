/* ── Findability score for local pages ─────────────────────────────────────
 * Runs the live Findability rules (audit-parser.ts + audit-scoring.ts) on pages
 * served by the local dev server, so a change can be scored before it ships.
 *
 *   npx tsx scripts/score-local.mts /authority-check /og-image-checker
 *
 * Reads localhost only (default http://localhost:3003, or BASE=...). The dev
 * server sends fewer headers than Vercel, so score a page you didn't change
 * beside the one you did: the same gap shows in both (D327).
 * ─────────────────────────────────────────────────────────────────────── */

import { parseAudit, type FetchedPage } from '../src/lib/audit-parser'
import { computeOverallScore } from '../src/lib/audit-scoring'

const BASE = process.env.BASE ?? 'http://localhost:3003'
const paths = process.argv.slice(2)
if (!paths.length) {
  console.log('Usage: npx tsx scripts/score-local.mts /path [/path …]')
  process.exit(1)
}

const text = async (path: string) => {
  const r = await fetch(`${BASE}${path}`)
  return r.ok ? r.text() : ''
}
const [robotsTxt, sitemapXml, llmsTxt] = await Promise.all([text('/robots.txt'), text('/sitemap.xml'), text('/llms.txt')])

for (const path of paths) {
  const start = Date.now()
  const res = await fetch(`${BASE}${path}`)
  const html = await res.text()
  const page: FetchedPage = {
    url: `${BASE}${path}`,
    requestedUrl: `${BASE}${path}`,
    html,
    robotsTxt,
    sitemapXml,
    llmsTxt,
    headers: Object.fromEntries(res.headers.entries()),
    statusCode: res.status,
    isHttps: true,
    responseTimeMs: Date.now() - start,
  }
  const parsed = parseAudit(page)
  const score = computeOverallScore(parsed.categories)
  const misses = parsed.categories.flatMap((c) =>
    c.items.filter((i) => i.status !== 'pass').map((i) => `  ${i.status.toUpperCase()} ${c.name} · ${i.label}: ${i.value}`),
  )
  console.log(`${path}: ${score}`)
  if (misses.length) console.log(misses.join('\n'))
}
