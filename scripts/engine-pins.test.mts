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
test('Computec Technical Services: a trade only inside the name is a guess (unclear), never a pass', () => {
  // Chris 2026-11-19: we can't tell a trade from a brand word, so a name-only trade is unclear, half points.
  const guess = (html: string, url?: string) => {
    const t = trade(html, url)
    assert.equal(t?.word, 'computec technical services') // the guess keeps the name's words: it's a guess
    assert.equal(t?.clear, false)
    assert.equal(t?.fromName, true)
  }
  // The title spells the address's initials (CTS = cts-pgh.com).
  guess(`<title>Welcome to Computec Technical Services!</title>`, 'https://www.cts-pgh.com/')
  // The same from og:site_name, the © line and the logo's alt text.
  guess(`<meta property="og:site_name" content="Computec Technical Services, LLC"><title>Computec Technical Services | Home</title>`)
  guess(`<title>Computec Technical Services</title><footer>© 2025 Computec Technical Services. All rights reserved.</footer>`)
  guess(`<img src="/logo.png" alt="Computec Technical Services logo"><h1>Computec Technical Services</h1>`)
  // A shop named for its trade: a guess too, not a miss.
  const stamping = trade(`<meta property="og:site_name" content="Acme Metal Stamping Services"><title>Acme Metal Stamping Services | Home</title>`)
  assert.equal(stamping?.word, 'metal stamping services')
  assert.equal(stamping?.clear, false)
  // A real trade beside the name still counts.
  assert.equal(trade(`<meta property="og:site_name" content="Computec Technical Services"><title>Computec Technical Services | Metal Stamping Services in Pittsburgh</title>`)?.word, 'metal stamping services')
  assert.equal(trade(`<meta property="og:site_name" content="Computec Technical Services"><title>Computec Technical Services | Managed IT Services</title>`)?.word, 'IT Services')
})

/* Research #2 + #3: points by place; a weak or tied word lower on the page is unclear, not a pass. */
test('points by place: up front wins, weak body words are unclear', () => {
  // Title + headline beat a brand word that is only in the title.
  assert.equal(trade(`<title>Acme Studio | Plumbing Pittsburgh</title><h1>Plumbing repairs, same day</h1>`)?.word, 'Plumbing')
  // "Accounting" folds into the up-front "Accounting Firm".
  assert.equal(trade(`<title>Pittsburgh, PA Accounting Firm</title><p>accounting help. accounting news.</p>`)?.word, 'Accounting Firm')
  // confluencefp.com: a disclaimer's "accounting" was the trade; the title says "Wealth Management".
  assert.equal(trade(`<title>Confluence Financial Partners | Wealth Management Pittsburgh</title><p>We do not provide tax, legal or accounting advice.</p>`)?.word, 'Wealth Management')
  // Up-front word: clear.
  assert.equal(trade(`<title>Smith Plumbing</title>`)?.clear, true)
  // aladdinseatery.com: no title, a menu word lower down: unclear.
  const menu = trade(`<title></title><h1>Welcome to Aladdin’s</h1><nav>Menu Our Menu Catering Menu Locations</nav><p>${'x '.repeat(400)} Catering for events. Catering menu.</p>`)
  assert.equal(menu?.word, 'Catering')
  assert.equal(menu?.clear, false)
  // jeffhancher.com: two words about equal, nothing up front: unclear, with the rival named.
  const tie = trade(`<title>Home | Lead. Inspire. Win.</title><p>90-Day Firm Feedback. Keynote Speaker.</p>`)
  assert.equal(tie?.clear, false)
  assert.ok(tie?.rival)
})

/* Code audit 2026-11-19: each of these was a real wrong answer. */
test('audit pins: stems, whole-word names, vague types, real snippet, up front first', () => {
  // "gym" and "gyms" are one trade, not a tie.
  const gyms = trade(`<title>Home</title><p>${'x '.repeat(400)} gym gym gym gym gyms gyms gyms</p>`)
  assert.equal(gyms?.rival, null)
  // "consulting" and "construction" are two trades: construction's mentions don't count for consulting.
  const two = trade(`<title>Home</title><p>Consulting. ${'x '.repeat(400)} construction construction construction construction construction</p>`)
  assert.equal(two?.word.toLowerCase(), 'construction')
  // A short name doesn't eat the front of a word.
  assert.equal(trade(`<meta property="og:site_name" content="Sun"><h1>Sunroom Installation Services</h1>`)?.word, 'sunroom installation services')
  // A category type is not a trade.
  assert.equal(trade(ld('EducationalOrganization', `<title>Gleason Family</title><p>412-555-0100</p>`)), null)
  assert.equal(trade(ld('FoodEstablishment', `<title>Gleason Family</title><p>412-555-0100</p>`)), null)
  // The snippet is the real word, not "spa" inside "workspace".
  const page = `<title>Home</title><p>Our workspace is calm. ${'x '.repeat(300)} Day spa. Spa. Spa. Spa. Spa.</p>`
  const spa = trade(page)
  assert.equal(extractText(page).slice(spa!.index, spa!.index + 3).toLowerCase(), 'spa')
  // An up-front guess beats many body mentions of another word.
  assert.equal(trade(`<meta name="description" content="Metal stamping services for manufacturers."><p>${'consulting '.repeat(8)}</p>`)?.word, 'metal stamping services')
})

/* Code audit 2026-11-19: a page of unclosed meta tags must not hang the read. */
test('unclosed meta tags stay fast', () => {
  const start = performance.now()
  trade(`<title>x</title>${'<meta name="description" '.repeat(6000)}`)
  trade(`${'<meta property="og:site_name" '.repeat(6000)}<title>Acme Metal Stamping Services</title>`)
  assert.ok(performance.now() - start < 2000, `took ${Math.round(performance.now() - start)} ms`)
})

/* Code audit 2026-11-19: tag removal re-scanned to the end from every unclosed "<" (0.8 s per 150 KB). */
test('page text stays fast on unclosed tags', () => {
  const start = performance.now()
  for (const bad of ['<x ', '<script ', '<style ']) extractText(bad.repeat(40000))
  assert.ok(performance.now() - start < 500, `took ${Math.round(performance.now() - start)} ms`)
  assert.equal(extractText('a<>b<c<d>e <SCRIPT>1</Script>f &amp; <style>x</style>g <scripts>z</script>w tail <a href'), 'a<>b e f g w tail <a href')
})

/* Code audit 2026-11-19: a page built to be slow stops at the time limit (time-limit.ts). */
test('time limit stops a stuck read, and passes a normal one', async () => {
  const { TimeLimitError, withinTime, timeBudget } = await import('../src/lib/time-limit')
  const stuck = '<title><h1>'.repeat(60000)
  const start = performance.now()
  assert.throws(() => withinTime(300, () => /<title[^>]*>([\s\S]*?)<\/title>/i.exec(stuck)), TimeLimitError)
  assert.ok(performance.now() - start < 1500, `took ${Math.round(performance.now() - start)} ms`)
  assert.equal(withinTime(300, () => 2 + 2), 4)
  // An error inside the read is the read's own error, not a time limit.
  assert.throws(() => withinTime(300, () => { throw new RangeError('own') }), RangeError)
  // A shared allowance: once spent, the next step stops at once.
  const timed = timeBudget(200)
  assert.throws(() => timed(() => /<title[^>]*>([\s\S]*?)<\/title>/i.exec(stuck)), TimeLimitError)
  assert.throws(() => timed(() => 1), TimeLimitError)
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

/* Engine round 3 (2026-11-19, research #4): every ask candidate is scored, not first match wins. */
test('ask: booking words on a phone button, ordering, and a guess is never a pass', () => {
  const read = (html: string) => readB2bSignals(html, 'https://example.com/')
  // ruffingautomotive.com: the only ask is a tel: button "Call to Schedule"; a bare number is not one.
  assert.equal(read(`<a class="wp-block-button__link" href="tel:4125619911">Call to Schedule</a>`).demo, 'Call to Schedule')
  assert.equal(read(`<a href="tel:4125619911">(412) 561-9911</a>`).demo, null)
  // lagourmandinebakery.com / aladdinseatery.com: ordering is the ask for a bakery or restaurant.
  assert.equal(read(`<a class="btn" href="/same-day-pick-up/bread">Order Now!</a>`).demo, 'Order Now!')
  // The strongest candidate wins, not the first: a repeated hero button beats a footer-style phone line.
  const two = read(`<header><a href="tel:4127938000">Call Us Today! (412)793-8000</a></header><h1>Plumbing</h1>
    <a class="btn" href="/schedule">Schedule Service</a><a class="btn" href="/schedule">Schedule Service</a>`)
  assert.equal(two.demo, 'Schedule Service')
  // Unseen wording: an action word on a hero button, twice, is a guess (unclear), never a pass.
  const g = read(`<h1>Loans made simple</h1><a class="btn btn-primary" href="/apply">Apply now</a><a class="btn" href="/apply">Apply now</a>`)
  assert.equal(g.demo, null)
  assert.deepEqual(g.unclear, ['ask'])
  assert.equal(g.askGuess, 'Apply now')
  // Contact words and plain links are never a guess.
  const c = read(`<h1>Photos</h1><a class="btn" href="/contact">Get In Touch</a><a class="btn" href="/schedule">Class Schedule</a><a class="btn" href="/schedule">Class Schedule</a>`)
  assert.equal(c.askGuess, null)
  assert.deepEqual(c.unclear, [])
})

/* Engine round 3 (research #8): weighted site type, with unclear when neither side wins. */
test('site type: shop code or a cart icon is a theme, not a store', () => {
  const read = (html: string) => readB2bSignals(html, 'https://example.com/')
  // group8a.com: an agency on Shopify (theme code, a cart notice) with a "Let's Talk" ask.
  const agency = read(`<script src="https://cdn.shopify.com/x.js"></script><div id="cart-notification" aria-label="Item added to your cart">Add to cart</div>
    <a href="/cart">Cart</a><h1>Growth agency</h1><a href="/contact">Let's Talk</a>`)
  assert.equal(agency.siteType, 'service')
  assert.deepEqual(agency.unclear, [])
  // A florist: prices, a shop link, a cart and no booking ask is a store.
  const prices = '<p>$45.00</p><p>$60.00</p><p>$85.00</p>'
  const store = read(`<a href="/cart" class="header-cart">Cart</a><a href="/shop">Shop</a><h1>Fresh flowers</h1>${prices}`)
  assert.equal(store.siteType, 'ecommerce')
  // monexglobal.com: product schema and a shop link, but a booking ask too: unclear, leaning store.
  const mixed = read(`<script type="application/ld+json">{"@type":"Product","name":"FX"}</script><a href="/products/fx">Products</a>
    <h1>Global payments</h1><a href="/contact">Talk to a Specialist</a>`)
  assert.equal(mixed.siteType, 'service')
  assert.deepEqual(mixed.unclear, ['siteType'])
  assert.equal(mixed.typeGuess, 'ecommerce')
})

test('ask + site type stay fast on unclosed tags', () => {
  const start = performance.now()
  for (const bad of ['<button ', '<button>', '<div role=button ', '<div role=button>', '<input type=submit ']) readB2bSignals(bad.repeat(20000), 'https://example.com/')
  assert.ok(performance.now() - start < 2000, `took ${Math.round(performance.now() - start)} ms`)
})
