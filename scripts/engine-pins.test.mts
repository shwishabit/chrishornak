/* ── Engine pins: known misses that must not come back ──────────────────────
 *   npx tsx --test scripts/engine-pins.test.mts
 * No network. Pages are short copies of the real wording (bloghands.com from the
 * saved Swift Site Audit report, drafts/check-fixtures/bloghands.json in the SGM
 * repo) or the saved homepage in scripts/ac-fixtures/pages/ (git-ignored, so
 * that test skips on a machine without it).
 * ─────────────────────────────────────────────────────────────────────── */

import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { broadAsk, readB2bSignals } from '../src/lib/b2b-signals'
import { extractText, findJsonLdBlocks, findTrade } from '../src/lib/proof-signals'

const trade = (html: string, url = 'https://example.com/') =>
  findTrade(html, extractText(html), findJsonLdBlocks(html), url)

/* bloghands.com, 2026-11-18: "Says what you do" read "auto" from "let auto-approve handle it". */
test('auto-approve: a compound word is not the trade', () => {
  const page = `<title>Blog Hands — Monthly blog posts in your brand voice</title>
    <meta name="description" content="Monthly blog posts in your brand voice. AI by default, human on demand, shipped on a cadence. Drop your URL and your first post is free.">
    <h1>We write your blog. So you don’t have to.</h1>
    <p>Drafts land in your inbox. One click to approve, or let auto-approve handle it. The cadence never slips. Set it to auto.</p>`
  assert.equal(trade(page, 'https://bloghands.com/')?.word.toLowerCase(), 'blog posts')
  // With nothing up front, the body's "auto-approve" / "set it to auto" still don't count.
  const bodyOnly = `<title>Blog Hands</title><p>One click to approve, or let auto-approve handle it. Set it to auto.</p>`
  assert.equal(trade(bodyOnly, 'https://bloghands.com/'), null)
})

/* bloghands.com, 2026-11-18: "No 'Book a call' button" while the page's ask was "Claim my free post". */
test('Claim my free post: a free-offer button is a direct ask', () => {
  const b2b = readB2bSignals(`<header><a href="/start">Claim my free post</a></header>`, 'https://bloghands.com/')
  assert.equal(b2b.demo, 'Claim my free post')
  assert.ok(broadAsk('Claim my free post'))
  // Shop perks and lead magnets are not an ask.
  assert.equal(readB2bSignals(`<a href="/shipping">Get free shipping</a>`, 'https://shop.example.com/').demo, null)
  assert.equal(broadAsk('Get the free guide'), false)
})

/* cts-pgh.com: "Computec Technical Solutions" is the company's name, not its trade (label: false). */
const CTS = join(dirname(fileURLToPath(import.meta.url)), 'ac-fixtures', 'pages', 'cts-pgh.com.json')
test('Computec Technical Solutions: the saved homepage has no trade', { skip: !existsSync(CTS) && 'saved page not on this machine' }, () => {
  const home = JSON.parse(readFileSync(CTS, 'utf8')).home as { body: string; finalUrl: string }
  assert.equal(trade(home.body, home.finalUrl), null)
})
test('Computec Technical Services: a name ending in a trade word is still a name', () => {
  // The title spells the address's initials (CTS = cts-pgh.com): a name, not "technical services".
  assert.equal(trade(`<title>Welcome to Computec Technical Services!</title>`, 'https://www.cts-pgh.com/'), null)
  // The same from og:site_name, the © line and the logo's alt text.
  assert.equal(trade(`<meta property="og:site_name" content="Computec Technical Services, LLC"><title>Computec Technical Services | Home</title>`), null)
  assert.equal(trade(`<title>Computec Technical Services</title><footer>© 2025 Computec Technical Services. All rights reserved.</footer>`), null)
  assert.equal(trade(`<img src="/logo.png" alt="Computec Technical Services logo"><h1>Computec Technical Services</h1>`), null)
  // A real trade beside the name still counts.
  assert.equal(trade(`<meta property="og:site_name" content="Computec Technical Services"><title>Computec Technical Services | Metal Stamping Services in Pittsburgh</title>`)?.word, 'metal stamping services')
  assert.equal(trade(`<meta property="og:site_name" content="Computec Technical Services"><title>Computec Technical Services | Managed IT Services</title>`)?.word, 'IT Services')
})

/* Research #5: the schema business type is strong evidence. */
const ld = (type: unknown, extra = '') =>
  `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': type, name: 'Gleason Family', telephone: '412-555-0100', url: 'https://example.com/' })}</script>${extra}`
test('schema @type: a specific business type names the trade', () => {
  const body = `<title>Gleason Family | Pittsburgh</title><h1>Smiles for the whole family</h1><p>Call 412-555-0100. Our studio, our studio, our studio.</p>`
  const t = trade(ld('Dentist', body))
  assert.equal(t?.word, 'dentist')
  assert.match(t?.where ?? '', /page code/)
  // The specific type wins over a vague one on the same entry.
  assert.equal(trade(ld(['LocalBusiness', 'Dentist'], body))?.word, 'dentist')
  assert.equal(trade(ld('HVACBusiness', body))?.word, 'HVAC')
  assert.equal(trade(ld('AutoRepair', body))?.word, 'auto repair')
  // A vague type says nothing: the body word is the fallback, as before.
  assert.equal(trade(ld('Organization', body))?.word.toLowerCase(), 'studio')
  // Plain words up front still come first.
  assert.equal(trade(ld('Dentist', `<title>Gleason Family Dentistry</title><p>412-555-0100</p>`))?.word, 'Dentistry')
})
