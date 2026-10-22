/* VidaRich: 3 options (home page + order page each) for Rich Calandra (2026-10-21).
 * Facts come from the VidaRich print label (V18) and his Judge.me reviews; see
 * Projects/vidarich/agent.md. "†" lines are the label's own wording and carry
 * the label's FDA statement. Unsplash photos are drafts until Chris approves.
 * Café price: Fresh Cup survey of 125 U.S. coffee shops (2023), $4.29 for a
 * 10–12 oz latte (freshcup.com/latte-price).
 * CTA rule: the main button orders online or subscribes; the second button
 * sends people to a local store. */
import type { ReviewContent } from './types'

const A = '/review/vidarich/'

const FDA =
  '†These statements have not been evaluated by the Food and Drug Administration. This product is not intended to diagnose, treat, cure, or prevent any disease.'
const LATTE_NOTE = '*Average 10–12 oz café latte: $4.29, Fresh Cup survey of 125 U.S. coffee shops (2023).'

/* ── icons and background shapes (inline SVG, no outside files) ───────── */

const ICONS: Record<string, string> = {
  leaf: '<path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14"/><path d="M5 19l7-7"/>',
  mushroom: '<path d="M3 12a9 7 0 0 1 18 0z"/><path d="M9.5 12v5a2.5 2.5 0 0 0 5 0v-5"/>',
  bean: '<ellipse cx="12" cy="12" rx="5.5" ry="8.5"/><path d="M12 4c-2 3-2 13 0 16"/>',
  beet: '<path d="M12 21c-4 0-6.5-3-6.5-6.5S8 8 12 8s6.5 3 6.5 6.5S16 21 12 21z"/><path d="M12 8V3M12 8L8.5 4M12 8l3.5-4"/>',
  drop: '<path d="M12 3c3.5 4.5 6 7.5 6 11a6 6 0 0 1-12 0c0-3.5 2.5-6.5 6-11z"/>',
  cup: '<path d="M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16"/><path d="M8 3c-.8 1 .8 2 0 3M12 3c-.8 1 .8 2 0 3"/>',
  scoop: '<path d="M3 12a6.5 4.5 0 0 0 13 0z"/><path d="M16 12l5-5"/>',
  spoon: '<path d="M5 20l8-8"/><ellipse cx="16" cy="8" rx="3" ry="4.6" transform="rotate(45 16 8)"/>',
  shield: '<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/><path d="M9 12l2 2 4-4"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.8l6.1-.9z"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  repeat: '<path d="M4 11a8 8 0 0 1 14-4.6L20 8"/><path d="M20 3v5h-5"/><path d="M20 13a8 8 0 0 1-14 4.6L4 16"/><path d="M4 21v-5h5"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
}
const ic = (name: string, cls = '') =>
  `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`

// A big faint outline icon behind a section.
const decoIcon = (name: string, cls: string) => ic(name, `deco ${cls}`)
const rings = (cls: string) =>
  `<svg class="deco rings ${cls}" viewBox="0 0 200 200" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1">${[24, 44, 64, 84, 99].map((r) => `<circle cx="100" cy="100" r="${r}"/>`).join('')}</svg>`
const waves = (cls: string) =>
  `<svg class="deco waves ${cls}" viewBox="0 0 600 70" preserveAspectRatio="none" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.2">${[15, 35, 55].map((y) => `<path d="M0 ${y} Q75 ${y - 12} 150 ${y} T300 ${y} T450 ${y} T600 ${y}"/>`).join('')}</svg>`
// Gold hero → dark strip: a wavy bottom edge.
const waveEdge = `<svg class="x-wave" viewBox="0 0 1200 32" preserveAspectRatio="none" aria-hidden="true"><path d="M0 0h1200v14c-100 18-200 18-300 0s-200-18-300 0-200 18-300 0-200-18-300 0z" fill="currentColor"/></svg>`

interface Ingredient {
  img: string
  alt: string
  icon: string
  name: string
  short: string
  amt: string
  amtStacked: string
  why: string
}

const ING: Ingredient[] = [
  { img: 'lionsmane.jpg', alt: "A lion's mane mushroom growing on a mossy tree", icon: 'mushroom', name: "Organic lion's mane", short: "Lion's mane", amt: '1000 mg', amtStacked: '1000<br>mg', why: "A white, shaggy mushroom, fruiting body only. On our label: enhances brain function.†" },
  { img: 'cacao-tree.jpg', alt: 'Ripe cacao pods hanging on a cacao tree', icon: 'bean', name: 'Organic cacao', short: 'Cacao', amt: '1200 mg', amtStacked: '1200<br>mg', why: 'Where the light, creamy chocolate taste comes from. On our label: an antioxidant powerhouse.†' },
  { img: 'beets.jpg', alt: 'A bunch of fresh beets with red stems', icon: 'beet', name: 'Organic beet root', short: 'Beet root', amt: '400 mg', amtStacked: '400<br>mg', why: 'Dried and powdered organic beets. On our label: boosts nitric oxide.†' },
  { img: 'spirulina.jpg', alt: 'Deep green spirulina powder spilling from a scoop', icon: 'leaf', name: 'Organic spirulina', short: 'Spirulina', amt: '800 mg', amtStacked: '800<br>mg', why: 'A blue-green algae, dried to a fine powder. Part of what makes it a superfood blend.' },
]

const STORES = ["Green's Natural Foods · Shrewsbury", "Nature's Nutrition · Brick", 'Natural Foods General Store · Toms River', 'Basil Bandwagon · Clinton']

// From the label's badge row. Its "FDA approved facility" badge is left out on purpose.
const BADGES = ['Gluten free', 'Non-GMO', 'GMP', 'Third-party tested', 'Made in USA from global materials']

// Price per cup at each size: $59.98 / 30, $108 / 60, $198 / 120.
const PACKS = [
  { jars: '1 jar', price: '$59.98', cup: '$2.00', save: '' },
  { jars: '2 jars', price: '$108.00', cup: '$1.80', save: 'Save $11.96' },
  { jars: '4 jars', price: '$198.00', cup: '$1.65', save: 'Save $41.92' },
]

// Real 5-star review lines (Judge.me, read 2026-10-21). Taste and routine only.
const REV = {
  donna: { q: 'Tastes great love it and my husband loves it', by: 'Donna W.' },
  daniel: { q: 'Everything in your morning coffee to start the day off right.', by: 'Daniel A.' },
  jeffrey: { q: "great product. I can't have my coffee any other way now.", by: 'Jeffrey N.' },
  gme: { q: 'I met the owner of this company recently at the Greens market in Shrewsbury… I did buy one container and remain very happy.', by: 'gme' },
}
const STARS = '<span class="stars" aria-label="5 out of 5 stars">★★★★★</span>'

/* ── shared pieces ────────────────────────────────────────────────────── */

const nav = (cta: string) => `
<nav class="x-nav">
  <div class="x-nav-l"><span class="wm" role="img" aria-label="VidaRich Coffee Booster"></span>
    <span class="links"><a href="#">Shop</a><a href="#" class="hide-sm">Ingredients</a><a href="#" class="hide-sm">How to mix</a><a href="#" class="hide-sm">Find a store</a></span></div>
  <div class="x-nav-r"><a href="#" class="hide-sm muted-link">Wholesale login</a><a href="#" class="btn btn-sm btn-primary">${cta}</a></div>
</nav>`

const trust = `
<div class="x-trust">
  <div>${STARS}<span><b>4.8</b> from 50 reviews</span></div>
  <div>${ic('shield')}<span><b>30-day</b> money-back guarantee</span></div>
  <div>${ic('cup')}<span><b>$1.65</b> a cup with 4 jars</span></div>
</div>`

const LOCAL = 'Find a store near you'
const ctaRow = (primary: string, secondary = LOCAL, cls = '') =>
  `<div class="x-ctarow ${cls}"><a href="#" class="btn btn-primary">${primary}</a>${secondary ? `<a href="#" class="btn btn-ghost">${secondary === LOCAL ? ic('pin') : ''}${secondary}</a>` : ''}</div>`

const MIX_ICONS = ['cup', 'scoop', 'spoon']
const mixSteps = (third: { img: string; alt: string }, captions = ['Start with hot coffee', 'Add one scoop', 'Stir until smooth and creamy']) => {
  const imgs = [
    { img: 'pour.jpg', alt: 'Fresh hot coffee being poured into a white mug' },
    { img: 'jar-hand.jpg', alt: 'A hand holding a jar of VidaRich over a cup' },
    third,
  ]
  return `
<div class="x-mix">${imgs.map((m, i) => `<figure><div class="ph"><img src="${A}${m.img}" alt="${m.alt}"></div><figcaption class="display">${ic(MIX_ICONS[i], 'step-ic')}${captions[i]}</figcaption></figure>`).join('')}</div>
<p class="note">[Rich to confirm the best way so every scoop mixes in fully.]</p>`
}

const shopSection = `
<div class="x-head">
  <h2 class="display">Try it where you shop. <em>Look for a tasting near you.</em></h2>
  <figure class="x-pull">${STARS}<blockquote>"${REV.gme.q}"</blockquote><figcaption>${REV.gme.by} · verified review</figcaption></figure>
</div>
<div class="x-stores">
  <div class="tile"><img src="${A}shelf.jpg" alt="VidaRich jars on an end-cap at Green's Natural Foods in Shrewsbury"><span class="pill">Green's Natural Foods · Shrewsbury</span></div>
  <div class="tile"><img src="${A}booth.jpg" alt="A VidaRich tasting table at a Good Life booth"><span class="pill">Tastings with Rich</span></div>
  <div class="list"><div class="display list-h">On the shelf near you</div><div class="list-b">${STORES.map((s) => `<span>${ic('pin')}${s}</span>`).join('')}<span class="hl">[Full list from his store finder]</span></div><a href="#" class="btn vs-btn">${ic('pin')}Find a store near you</a></div>
</div>`

const ctaBand = (headline: string, sub: string, deco = '') => `
<section class="x-ctaband has-deco">${deco}
  <div class="pad sec x-ctaband-in">
    <div><h2 class="display">${headline}</h2><p class="lead">${sub}</p></div>
    <div class="x-ctaband-btns"><a href="#" class="btn btn-lg cta-main">${ic('repeat')}Subscribe and save</a><a href="#" class="btn btn-lg cta-alt">${ic('pin')}Find a store near you</a><span class="cta-fine">Or buy one jar for $59.98 · 30-day money-back guarantee</span></div>
  </div>
</section>`

const footer = () => `
<footer class="x-foot"><span class="wm wm-c" role="img" aria-label="VidaRich Coffee Booster"></span><p class="fine">${FDA}</p><p class="fine">${LATTE_NOTE}</p></footer>`

/* ── "Your coffee, with and without": a different design per option ───── */

const ADDS: [string, string][] = [
  ['Grass-fed collagen', '5 g'],
  ["Organic lion's mane", '1000 mg'],
  ['Organic cordyceps', '500 mg'],
  ['Organic cacao', '1200 mg'],
  ['Organic spirulina', '800 mg'],
  ['Organic beet root', '400 mg'],
]

// A: AG1-style comparison table. Everything left-aligned in fixed columns.
const vsTable = `
<section class="sec pad">
  <div class="x-head"><h2 class="display">Your coffee, with and without</h2><p class="lead muted">Same coffee, same routine. One scoop adds all of this.</p></div>
  <div class="x-cmp" role="table" aria-label="Your coffee compared with your coffee plus VidaRich">
    <div class="cmp-row cmp-h" role="row"><span role="columnheader">Per cup</span><span role="columnheader">${ic('cup')}Your coffee</span><span role="columnheader" class="vida">${ic('cup')}Your coffee + VidaRich</span></div>
    ${ADDS.map(([l, v]) => `<div class="cmp-row" role="row"><span role="rowheader">${l}</span><span role="cell" class="no"><i aria-hidden="true">–</i>None</span><span role="cell" class="vida"><i class="ok" aria-hidden="true">✓</i>${v}</span></div>`).join('')}
    <div class="cmp-row" role="row"><span role="rowheader">Taste</span><span role="cell" class="no"><i aria-hidden="true">–</i>Just coffee</span><span role="cell" class="vida"><i class="ok" aria-hidden="true">✓</i>Light, creamy chocolate</span></div>
    <div class="cmp-row cmp-f" role="row"><span role="cell"></span><span role="cell"></span><span role="cell" class="vida"><a href="#" class="btn vs-btn">Shop Coffee Booster</a></span></div>
  </div>
</section>`

// B: Years-style "two mugs": two side-by-side cards, the VidaRich one loud.
const vsMugs = `
<section class="sec pad has-deco dots">
  <h2 class="display center">Same mug. A lot more in it.</h2>
  <div class="x-mugs">
    <div class="mug plain"><div class="ph"><img src="${A}pour.jpg" alt="A plain cup of coffee being poured"></div><b class="display">Just coffee</b><ul>${ADDS.map(([l]) => `<li><i aria-hidden="true">–</i><span>${l}</span><b>0</b></li>`).join('')}<li><i aria-hidden="true">–</i><span>Just the coffee taste</span></li></ul></div>
    <div class="mug-vs" aria-hidden="true">vs</div>
    <div class="mug vida"><div class="ph"><img src="${A}jar-mug.jpg" alt="A creamy cup of coffee next to a jar of VidaRich"><span class="sticker sm"><b>54</b><span>CAL</span></span></div><b class="display">Coffee + VidaRich</b>
      <ul>${ADDS.map(([l, v]) => `<li><i aria-hidden="true">✓</i><span>${l}</span><b>${v}</b></li>`).join('')}<li><i aria-hidden="true">✓</i><span>Light, creamy chocolate taste</span></li></ul>
      <a href="#" class="btn btn-primary">Shop now · $59.98</a></div>
  </div>
</section>`

// C: Seed-style calm "what one scoop adds": a cup photo beside big number tiles.
const vsScoop = `
<section class="sec pad tint has-deco sun">
  <div class="x-adds">
    <div class="ph"><img src="${A}jar-mug.jpg" alt="A creamy cup of coffee next to a jar of VidaRich"></div>
    <div class="copy">
      <h2 class="display">Your coffee, with one scoop.</h2>
      <p class="lead muted">Nothing about your morning changes, except what is in the cup.</p>
      <div class="tiles">${ADDS.slice(0, 4).map(([l, v]) => `<div class="tile"><b class="display">${v}</b><span>${l}</span></div>`).join('')}</div>
      <p class="muted">Plus organic spirulina, beet root and L-theanine.</p>
      ${ctaRow('Start your ritual')}
    </div>
  </div>
</section>`

/* ── value: the price, framed fairly, a different design per option ───── */

// A: "the math" tiles.
const valueTiles = `
<section class="sec pad x-band has-deco">${rings('r-tr')}
  <div class="x-head"><h2 class="display">Less than half the price of a café latte.*</h2><p class="lead">The more jars you get, the less each cup costs.</p></div>
  <div class="x-value">
    ${PACKS.map((p, i) => `<div class="v ${i === 2 ? 'best' : ''}">${i === 2 ? '<span class="v-tag">Best value</span>' : ''}<b class="display">${p.cup}</b><span>a cup with ${p.jars}</span><small>${p.price}${p.save ? ` · ${p.save}` : ''}</small></div>`).join('')}
    <div class="v latte">${ic('cup', 'v-ic')}<b class="display">$4.29</b><span>an average café latte*</span><small>For one cup, every time.</small></div>
  </div>
  <div class="x-ctarow"><a href="#" class="btn btn-light">Get 4 jars and save $41.92</a><a href="#" class="btn btn-ghost">${ic('pin')}Find a store near you</a></div>
</section>`

// B: big playful price tags.
const valueTags = `
<section class="sec pad x-pricetags has-deco dots">
  <div class="pt-copy"><h2 class="display">$1.65 a cup. Cheaper than your latte.*</h2><p class="lead strong">Stock up and every scoop costs less.</p>${ctaRow('Grab 4 jars · save $41.92')}</div>
  <div class="pt-tags">${PACKS.map((p, i) => `<div class="tag t${i}"><b class="display">${p.cup}</b><span>a cup</span><small>${p.jars} · ${p.price}</small></div>`).join('')}</div>
</section>`

// C: a quiet ledger: what a month of mornings costs. ($59.98 < 14 × $4.29 = $60.06)
const valueLedger = `
<section class="sec pad has-deco x-ledger">${waves('w-bottom')}
  <div class="lg-in">
    <div class="lg-copy"><h2 class="display">Thirty mornings, for less than 14 café lattes.*</h2><p class="lead muted">One jar is 30 scoops. Stock up and each morning costs less.</p>${ctaRow('Choose your jars')}</div>
    <dl class="lg">
      ${PACKS.map((p) => `<div><dt>${p.jars} · ${p.price}</dt><dd>${p.cup} a morning</dd></div>`).join('')}
      <div class="latte"><dt>Café latte*</dt><dd>$4.29 a cup</dd></div>
    </dl>
  </div>
</section>`

/* ── testimonials ─────────────────────────────────────────────────────── */

const reviewCards = (withPhoto: boolean) => `
<div class="x-quotes">
  <figure class="q">${STARS}<blockquote class="display">"${REV.donna.q}"</blockquote><figcaption>${REV.donna.by}, verified buyer</figcaption></figure>
  <figure class="q">${STARS}<blockquote class="display">"${REV.daniel.q}"</blockquote><figcaption>${REV.daniel.by}, verified buyer</figcaption></figure>
  ${withPhoto ? `<figure class="q ph"><img src="${A}rich-store.jpg" alt="Rich Calandra holding VidaRich in a natural food store"><figcaption class="pill">Rich Calandra, owner</figcaption></figure>` : `<figure class="q">${STARS}<blockquote class="display">"${REV.jeffrey.q}"</blockquote><figcaption>${REV.jeffrey.by}, verified buyer</figcaption></figure>`}
</div>`

// B: a loud, type-only quote with a big score card. No photo, so no one reads a face as the reviewer.
const loudQuote = (r: { q: string; by: string }, btns: string) => `
<section class="sec pad brand x-loudquote">
  <figure class="lq-quote">${STARS}<blockquote class="display">"${r.q}"</blockquote><figcaption>${r.by}, verified buyer</figcaption></figure>
  <div class="lq-side"><div class="lq-score"><b class="display">4.8</b><span>out of 5</span><small>from 50 reviews</small></div><div class="btns">${btns}</div></div>
</section>`

// B: how to mix as three big icon steps, so the page is not photo after photo.
const mixIcons = `
<div class="x-mixic">
  ${[
    ['cup', 'Start with hot coffee', 'Any coffee you like.'],
    ['scoop', 'Add one scoop', 'About 11.5 g. One jar is 30 cups.'],
    ['spoon', 'Stir until smooth', 'Light, creamy, chocolatey.'],
  ].map(([icon, h, p], i) => `<div class="st"><span class="ic-wrap">${ic(icon)}<span class="n">${i + 1}</span></span><b class="display">${h}</b><p>${p}</p></div>`).join('')}
</div>
<p class="note center">[Rich to confirm the best way so every scoop mixes in fully.]</p>`

// C: one large, quiet quote.
const bigQuote = `
<section class="sec pad x-bigquote">
  ${STARS}
  <blockquote class="display">"${REV.daniel.q}"</blockquote>
  <figcaption>${REV.daniel.by}, verified buyer · 4.8 out of 5 from 50 reviews</figcaption>
  ${ctaRow('Start your ritual', LOCAL, 'center')}
</section>`

/* ── order page pieces ────────────────────────────────────────────────── */

const buyBox = (plan: string) => `
<div class="x-buy">
  <div class="buy-meta">${STARS} 4.8 · 50 reviews</div>
  <h1 class="display buy-title">Coffee Booster</h1>
  <p class="buy-sub">Collagen, organic mushrooms and cacao for your morning coffee. 30 servings a jar.</p>
  <div class="buy-price"><b>$59.98</b><span>from $1.65 a cup · less than half a café latte*</span></div>
  <div class="buy-opts">
    <label class="buy-opt on"><input type="radio" name="${plan}" checked><span class="t"><b>${ic('repeat')}Subscribe and save [SUB %]</b><small>Delivered every month · pause or cancel anytime</small></span></label>
    <label class="buy-opt"><input type="radio" name="${plan}"><span class="t"><b>One-time purchase</b></span></label>
  </div>
  <div class="buy-k">How many jars a month?</div>
  <div class="buy-packs">${PACKS.map((p, i) => `<span class="pack ${i === 0 ? 'on' : ''}"><b>${p.jars} a month</b><small>${p.price}</small><small class="cup">${p.cup} a cup</small>${p.save ? `<small class="save">${p.save}</small>` : ''}</span>`).join('')}</div>
  <a href="#" class="btn btn-primary btn-lg buy-cta">Add to cart</a>
  <div class="buy-trust"><span>${ic('shield')}30-day money-back guarantee</span><span>${ic('check')}Checkout with Shop Pay</span></div>
  <a href="#" class="buy-local">${ic('pin')}Prefer to buy in person? Find a store near you</a>
</div>`

// Product photos as one scrolling carousel (swipe, scroll or the arrows), not a grid of thumbnails.
// pos (a CSS class) keeps faces in frame when a tall slide crops a photo.
const PRODUCT_PHOTOS: { img: string; alt: string; pos?: string }[] = [
  { img: 'jar-mug.jpg', alt: 'A jar of VidaRich Coffee Booster beside a creamy cup of coffee' },
  { img: 'jar-beans.jpg', alt: 'The jar standing in coffee beans' },
  { img: 'jar-hand.jpg', alt: 'The jar held over a cup' },
  { img: 'booth.jpg', alt: 'A VidaRich tasting table', pos: 'pos-top' },
  { img: 'shelf.jpg', alt: 'VidaRich on a store shelf' },
]
const carousel = `
<div class="x-carousel">
  <div class="car-wrap">
    <div class="car-track" tabindex="0" role="region" aria-label="Product photos. Scroll sideways for more.">${PRODUCT_PHOTOS.map((p) => `<figure class="car-slide"><img src="${A}${p.img}" alt="${p.alt}"${p.pos ? ` class="${p.pos}"` : ''}></figure>`).join('')}</div>
    <span class="car-note">[Rich's reshoot photos go here]</span>
    <div class="car-nav"><button type="button" class="car-btn" data-car="-1" aria-label="Previous photo">←</button><span class="car-hint">${PRODUCT_PHOTOS.length} photos · swipe or use the arrows</span><button type="button" class="car-btn" data-car="1" aria-label="Next photo">→</button></div>
  </div>
</div>`

// How to mix, with line icons and no photos (order pages already show the jar).
const mixLine = (title: string) => `
<h2 class="display">${title}</h2>
<ol class="x-mixline">
  ${[
    ['cup', 'Pour your coffee, hot', 'Any coffee you like.'],
    ['scoop', 'Add one scoop', 'About 11.5 g. One jar is 30 cups.'],
    ['spoon', 'Stir until smooth', 'A light, creamy chocolate taste.'],
  ].map(([icon, h, p]) => `<li><span class="ml-ic">${ic(icon)}</span><div><b>${h}</b><span class="muted">${p}</span></div></li>`).join('')}
</ol>
<p class="note">[Rich to confirm the best way so every scoop mixes in fully.]</p>`

// The label's Supplement Facts panel, as real text (V18 print label).
type FactRow = [string, string, string, ('group' | 'sub' | 'indent')?]
const FACTS: FactRow[] = [
  ['Calories', '54', '**'],
  ['Total Fat', '2 g', '3%*'],
  ['Saturated Fat', '1.6 g', '8%*', 'indent'],
  ['Total Carbohydrate', '3.5 g', '1%*'],
  ['Dietary Fiber', '&lt;1 g', '1%*', 'indent'],
  ['Protein', '5.5 g', '**'],
  ['Sodium (as Himalayan Pink Sea Salt)', '10 mg', '1%'],
  ['Hydrolyzed Bovine Collagen', '5 g', '**', 'group'],
  ['Organic Mushroom Blend', '', '', 'sub'],
  ["Organic Lion's Mane (Hericium erinaceus) (Fruiting Body)", '1000 mg', '**', 'indent'],
  ['Organic Cordyceps (Cordyceps sinensis) (Fruiting Body)', '500 mg', '**', 'indent'],
  ['Organic Cacao Powder 10–12%', '1200 mg', '**', 'group'],
  ['Organic Spirulina', '800 mg', '**'],
  ['Organic Beet Root Powder', '400 mg', '**'],
  ['L-Theanine', '100 mg', '**'],
]
const AMINO: [string, string][] = [
  ['Alanine', '410'], ['Arginine', '348.5'], ['Aspartic Acid', '264'], ['Glutamic Acid', '462.5'], ['Glycine', '1103'], ['Histidine', '34.5'],
  ['Hydroxyproline', '510.5'], ['Hydroxylysine', '25'], ['Isoleucine', '70.5'], ['Leucine', '13.5'], ['Lysine', '169.5'], ['Methionine', '41'],
  ['Phenylalanine', '89.5'], ['Proline', '640'], ['Serine', '153.5'], ['Threonine', '84'], ['Tyrosine', '23.5'], ['Valine', '104'],
]

const factsPanel = `
<div class="x-sfp" role="table" aria-label="Supplement Facts">
  <div class="sfp-title">Supplement Facts</div>
  <div class="sfp-serv">Serving size: Approx. 1 Scoop (11.5 g)<br>Servings Per Container: 30</div>
  <div class="sfp-row sfp-h" role="row"><span role="columnheader"></span><span role="columnheader">Amount per Serving</span><span role="columnheader">%DV*</span></div>
  ${FACTS.map(([n, a, dv, kind]) => `<div class="sfp-row ${kind ?? ''}" role="row"><span role="rowheader">${n}</span><span role="cell">${a}</span><span role="cell">${dv}</span></div>`).join('')}
  <div class="sfp-foot">*Daily Value (DV) based on a 2,000 calorie diet<br>**Daily Value not established</div>
</div>
<p class="sfp-other"><b>Other ingredients:</b> Coconut Milk Powder (Cocos nucifera), MCT Creamer Powder (Medium-chain triglyceride), Cocoa Powder, Monk Fruit Extract (Luo Han Guo), Himalayan Pink Sea Salt.</p>
<p class="sfp-other"><b>Contains:</b> Tree nuts (coconut), milk.</p>
<details class="sfp-amino"><summary>Bovine collagen amino acid profile (per 5 g)</summary><div class="amino">${AMINO.map(([n, v]) => `<span>${n}</span><b>${v} mg</b>`).join('')}</div></details>`

const whyList = `<ul class="facts-list">${ING.map((i) => `<li>${ic(i.icon)}<div><b>${i.name} · ${i.amt}</b><span>${i.why}</span></div></li>`).join('')}<li>${ic('mushroom')}<div><b>Organic cordyceps · 500 mg</b><span>Fruiting body. On our label: improves stamina.†</span></div></li><li>${ic('drop')}<div><b>Grass-fed collagen · 5 g</b><span>Hydrolyzed bovine collagen peptides.</span></div></li></ul>`
const badges = `<div class="x-badges">${BADGES.map((b) => `<span>${ic('check')}${b}</span>`).join('')}</div>`

const FAQ: [string, string][] = [
  ['How do I take it?', 'Add one scoop (about 11.5 g) to your favorite cup of coffee and stir. It works in warm water too.'],
  ['What does it taste like?', 'A light, creamy chocolate flavor.'],
  ['How do I get it to mix in fully?', '[Rich to confirm the best way: hot coffee first, then stir or froth.]'],
  ['Is it worth the price?', 'One jar works out to $2.00 a cup, and $1.65 a cup with 4 jars. That is less than half the price of an average café latte.*'],
  ['Can I pause or cancel my subscription?', 'Yes, anytime, from your account.'],
  ['Where can I buy it in person?', 'At natural food stores in New Jersey and Pennsylvania. Use the store finder to see the one nearest you.'],
  ['What is your guarantee?', "Try it for 30 days. If it's not for you, get your money back."],
  ['Who should not take it?', 'It is for healthy adults. Not for anyone under 18, or if you are pregnant or nursing. If you have a medical condition, ask your doctor first.'],
  ['Allergens?', 'Contains tree nuts (coconut) and milk. Made in a facility that also processes milk, eggs, fish, shellfish, tree nuts, peanuts, soy, wheat and sesame.'],
]

const faqSection = (title: string) => `
<section class="sec pad">
  <div class="x-faq"><h2 class="display">${title}</h2>
  <div class="faq-list">${FAQ.map(([q, a], i) => `<details${i === 0 ? ' open' : ''}><summary>${q}</summary><p>${a}</p></details>`).join('')}</div></div>
</section>`

/* ── the review ───────────────────────────────────────────────────────── */

export const vidarich: ReviewContent = {
  slug: 'vidarich',
  title: 'VidaRich: 3 website options',
  client: 'Rich Calandra, VidaRich',
  intro:
    'Each option tells the VidaRich story from a different angle, with a home page and an order page. Open “Why this design” to see the thinking behind the fonts, colors and page order. Beside every part, tap Like, Don’t like or Change it and add a note if you want. Everything saves as you go. Mix and match freely: “I like A2 but with B’s colors” is a great note. Use Next at the bottom to move through every page, then send it from Finish.',
  assets: A,
  fineprint:
    'Draft designs. Photos marked Unsplash are placeholders until approved. Ingredient lines marked † are the wording on your label, shown with the label’s FDA statement; you approve every line before launch. ' + LATTE_NOTE,
  options: [
    {
      key: 'A',
      name: "What's inside and why",
      story: 'Calm and premium, like AG1. Real ingredient photos lead, and each one says why it is in the jar.',
      theme: 't-green',
      palette: ['#FFFFFF', '#1E3D2F', '#C9A24A'],
      notes: {
        feel: 'Calm, clean and premium, the way a health brand you trust looks. Lots of white space and real photos of each ingredient.',
        type: {
          display: 'Source Serif 4',
          body: 'Figtree',
          sample: { family: 'var(--f-serif)', weight: 400 },
          why: 'A book-like serif for headlines feels careful and credible. Figtree is round and very easy to read at any age.',
        },
        colors: [
          { hex: '#1E3D2F', name: 'Forest green' },
          { hex: '#FFFFFF', name: 'White' },
          { hex: '#C9A24A', name: 'Jar gold (accent)' },
        ],
        colorWhy: 'Green says nature and health and is calm to look at. Gold comes from your jar, so it only marks the important parts: stars, prices, badges.',
        audience: 'For the 45–65 coffee drinker who reads the label first. It answers “what is in it, and is it real?” before it asks for the sale.',
        flow: [
          { step: 'Attention', keys: 'A1', text: 'Photo hero and one clear promise.' },
          { step: 'Interest', keys: 'A2–A3', text: 'Why each ingredient is in the jar, then your coffee with and without.' },
          { step: 'Desire', keys: 'A4–A7', text: 'The price per cup, how easy it is, real reviews, and where to try it.' },
          { step: 'Action', keys: 'A8', text: 'Subscribe online, or find a store. Every section also ends with a button.' },
        ],
      },
      pages: [
        {
          key: 'home',
          label: 'Home page',
          sections: [
            {
              key: 'A1',
              label: 'Top of the page',
              html: `${nav('Shop now')}
<section class="x-hero"><img src="${A}hero-stir.jpg" alt="Hands stirring a spoon in a white cup of coffee"><div class="scrim"></div>
  <div class="copy"><h1 class="display">Your coffee. Upgraded.</h1><p class="lead">One scoop of collagen, organic mushrooms and cacao, stirred into the coffee you already love.</p>
  <div class="btns"><a href="#" class="btn btn-light">Shop Coffee Booster</a><a href="#" class="btn btn-ghost">${ic('pin')}Find a store</a></div></div></section>
${trust}`,
            },
            {
              key: 'A2',
              label: 'Every ingredient earns its place',
              html: `<section class="x-band sec pad has-deco">${decoIcon('mushroom', 'd-br')}<div class="x-head"><div class="x-head-copy"><h2 class="display">Every ingredient earns its place.</h2><p class="lead">Organic mushrooms, cacao and superfoods, each at the amount printed on the label.</p></div><a href="#">See the full label</a></div>
<div class="x-cards">${ING.map((i) => `<div class="x-card light"><div class="ph"><img src="${A}${i.img}" alt="${i.alt}"><span class="badge">${i.amt}</span></div><div class="body"><b class="name">${ic(i.icon, 'name-ic')}${i.name}</b><span class="why">${i.why}</span></div></div>`).join('')}</div>
<p class="x-also">Also in every scoop: 5 g grass-fed bovine collagen · 500 mg organic cordyceps (on our label: improves stamina†) · 100 mg L-theanine</p>
<div class="x-ctarow"><a href="#" class="btn btn-light">Shop Coffee Booster · $59.98</a></div></section>`,
            },
            { key: 'A3', label: 'Your coffee, with and without', html: vsTable },
            { key: 'A4', label: 'Price and value', html: valueTiles },
            {
              key: 'A5',
              label: 'How to mix it',
              html: `<section class="sec pad tint has-deco">${decoIcon('leaf', 'd-br')}<div class="x-head"><h2 class="display">How to mix it</h2></div>${mixSteps({ img: 'jar-mug.jpg', alt: 'A creamy cup of coffee next to a jar of VidaRich' })}${ctaRow('Get your first jar')}</section>`,
            },
            { key: 'A6', label: 'What people say', html: `<section class="sec pad"><div class="x-head"><h2 class="display">4.8 out of 5 from 50 reviews</h2><a href="#">Read all 50 reviews</a></div>${reviewCards(true)}${ctaRow('Shop now')}</section>` },
            { key: 'A7', label: 'Try it where you shop', html: `<section class="sec pad">${shopSection}</section>` },
            { key: 'A8', label: 'Closing call to action', html: ctaBand('Try it for 30 days.', 'If VidaRich isn’t for you, get your money back. Subscribers can pause or cancel anytime.', rings('r-l')) },
            { key: 'A9', label: 'Footer', html: footer() },
          ],
        },
        {
          key: 'order',
          label: 'Order page',
          sections: [
            { key: 'AP1', label: 'Product and buy box', html: `${nav('Cart (0)')}<section class="sec pad x-pdp"><div class="pdp-l">${carousel}</div>${buyBox('plan-a')}</section>` },
            {
              key: 'AP2',
              label: 'Supplement Facts and why',
              html: `<section class="sec pad x-band has-deco">${rings('r-tr')}<div class="x-facts"><div>${factsPanel}</div><div class="facts-copy"><h2 class="display">What's inside every scoop</h2><p class="lead">Every amount, straight from the label on the jar.</p>${whyList}${badges}</div></div></section>`,
            },
            { key: 'AP3', label: 'How to mix it', html: `<section class="sec pad tint has-deco">${decoIcon('leaf', 'd-br')}${mixLine('How to mix it')}</section>` },
            { key: 'AP4', label: 'Reviews', html: `<section class="sec pad"><div class="x-head"><h2 class="display">4.8 out of 5 from 50 reviews</h2><a href="#">Read all reviews</a></div>${reviewCards(false)}</section>` },
            { key: 'AP5', label: 'Questions', html: faqSection('Questions, answered') },
            { key: 'AP6', label: 'Footer', html: footer() },
          ],
        },
      ],
    },
    {
      key: 'B',
      name: 'Fun and full of flavor',
      story: 'Bold and playful, like Years Beer. Gold leads, the way Years uses blue. Taste comes first.',
      theme: 't-gold',
      palette: ['#F7F4EE', '#C9A24A', '#201E1B'],
      notes: {
        feel: 'Bold, fun and confident. Big type, stickers and price tags, the way Years Beer uses its blue.',
        type: {
          display: 'Fraunces (soft, extra bold)',
          body: 'Figtree',
          sample: { family: 'var(--f-fraunces)', weight: 800, vs: "'SOFT' 100" },
          why: 'A heavy serif with soft, round edges feels friendly and tasty, not clinical. Figtree keeps the small text clear.',
        },
        colors: [
          { hex: '#C9A24A', name: 'Jar gold' },
          { hex: '#201E1B', name: 'Ink' },
          { hex: '#F7F4EE', name: 'Cream' },
        ],
        colorWhy: 'Gold leads because it is already on your jar, so the website and the store shelf look like one brand. Dark ink gives strong contrast for easy reading.',
        audience: 'For the Starbucks and Panera fan who buys on taste. It leads with flavor and fun, and the price tags make the value hard to miss.',
        flow: [
          { step: 'Attention', keys: 'B1–B2', text: 'The jar, big and gold, with a sticker and a checkmark strip.' },
          { step: 'Interest', keys: 'B3–B5', text: 'What is in the scoop, what it tastes like, and how to mix it.' },
          { step: 'Desire', keys: 'B6–B8', text: 'Same mug with more in it, the price per cup, and the store shelf.' },
          { step: 'Action', keys: 'B9', text: 'Subscribe online, or find a store. Every section also ends with a button.' },
        ],
      },
      pages: [
        {
          key: 'home',
          label: 'Home page',
          sections: [
            {
              key: 'B1',
              label: 'Top of the page',
              html: `<div class="x-strip top">Made for your coffee · On the shelf in NJ and PA natural food stores</div>
<section class="x-goldhero">${nav('Shop now')}
  <div class="grid"><div class="jarwrap"><div class="jar"><img src="${A}jar-beans.jpg" alt="VidaRich Coffee Booster jar standing in coffee beans"></div><div class="sticker"><b>54</b><span>CALORIES</span><small>PER SCOOP</small></div></div>
  <div class="copy"><h1 class="display">Your coffee. Upgraded.</h1><p class="lead strong">Collagen, mushrooms and cacao in one scoop. A light, creamy chocolate taste.</p><div class="btns"><a href="#" class="btn btn-primary btn-lg">Shop now · $59.98</a><a href="#" class="btn btn-ghost btn-lg">${ic('pin')}Find a store</a></div></div></div></section>${waveEdge}`,
            },
            {
              key: 'B2',
              label: 'Checkmark strip',
              html: `<div class="x-strip"><span><i>✓</i> 5 g collagen</span><span><i>✓</i> Organic mushrooms</span><span><i>✓</i> $1.65 a cup with 4 jars</span><span><i>✓</i> 30-day money back</span></div>`,
            },
            {
              key: 'B3',
              label: "What's in the scoop",
              html: `<section class="sec pad has-deco dots"><h2 class="display center">What's in the scoop</h2>
<div class="x-cards">${ING.map((i) => `<div class="x-card"><div class="ph"><img src="${A}${i.img === 'cacao-tree.jpg' ? 'cacao-open.jpg' : i.img}" alt="${i.alt}"><span class="badge round">${i.amtStacked}</span></div><div class="body"><b class="name">${i.short}</b><span class="why">${i.why}</span></div></div>`).join('')}</div>
<p class="x-also center">Plus 5 g grass-fed collagen · 500 mg organic cordyceps (improves stamina†) · 100 mg L-theanine</p>${ctaRow('Grab a jar', '', 'center')}</section>`,
            },
            {
              key: 'B4',
              label: 'Taste quote',
              html: loudQuote(REV.donna, `<a href="#" class="btn btn-primary">Shop now · $59.98</a><a href="#" class="btn btn-ghost">Read all 50 reviews</a>`),
            },
            {
              key: 'B5',
              label: 'How to mix it',
              html: `<section class="sec pad has-deco dots"><h2 class="display center">How to mix it</h2>${mixIcons}${ctaRow('Get your first jar', LOCAL, 'center')}</section>`,
            },
            { key: 'B6', label: 'Your coffee, with and without', html: vsMugs },
            { key: 'B7', label: 'Price and value', html: valueTags },
            {
              key: 'B8',
              label: 'Find us on the shelf',
              html: `<section class="sec pad"><h2 class="display">Find us on the shelf</h2>
<div class="x-tiles"><div class="t"><img src="${A}shelf.jpg" alt="VidaRich on an end-cap at Green's Natural Foods"></div><div class="t"><img src="${A}booth.jpg" alt="A VidaRich tasting table at a Good Life booth"></div><div class="t"><img src="${A}jar-hand.jpg" alt="A hand holding VidaRich above a cup of coffee"></div>
<div class="t brand"><div class="display">Kimberton, Green's, Basil Bandwagon and more</div><a href="#" class="btn btn-primary">${ic('pin')}Find a store near you</a></div></div></section>`,
            },
            { key: 'B9', label: 'Closing call to action', html: ctaBand('Grab a jar. Or two.', 'Buy 2 jars and save $11.96. Or subscribe and never run out.') },
            { key: 'B10', label: 'Footer', html: footer() },
          ],
        },
        {
          key: 'order',
          label: 'Order page',
          sections: [
            {
              key: 'BP1',
              label: 'Product and buy box',
              html: `<section class="x-goldhero">${nav('Cart (0)')}
  <div class="grid x-pdp-gold"><div class="jarwrap"><div class="jar"><img src="${A}jar-beans.jpg" alt="VidaRich Coffee Booster jar standing in coffee beans"></div><div class="sticker"><b>54</b><span>CALORIES</span><small>PER SCOOP</small></div></div>${buyBox('plan-b')}</div></section>${waveEdge}`,
            },
            {
              key: 'BP2',
              label: 'Checkmark strip',
              html: `<div class="x-strip"><span><i>✓</i> Light, creamy chocolate</span><span><i>✓</i> 5 g collagen</span><span><i>✓</i> From $1.65 a cup</span><span><i>✓</i> 30-day money back</span></div>`,
            },
            {
              key: 'BP3',
              label: 'Supplement Facts',
              html: `<section class="sec pad has-deco dots"><div class="x-facts flip"><div class="facts-copy"><h2 class="display">What's in the scoop</h2><div class="x-bignums">${ADDS.map(([l, v]) => `<div><b class="display">${v}</b><span>${l}</span></div>`).join('')}</div>${badges}</div><div>${factsPanel}</div></div></section>`,
            },
            {
              key: 'BP4',
              label: 'How to mix it',
              html: `<section class="sec pad has-deco dots"><h2 class="display center">How to mix it</h2>${mixIcons}</section>`,
            },
            {
              key: 'BP5',
              label: 'Reviews',
              html: loudQuote(REV.jeffrey, `<a href="#" class="btn btn-primary">Add to cart</a><a href="#" class="btn btn-ghost">Read all 50 reviews</a>`),
            },
            { key: 'BP6', label: 'Questions', html: faqSection('Got questions?') },
            { key: 'BP7', label: 'Footer', html: footer() },
          ],
        },
      ],
    },
    {
      key: 'C',
      name: 'Your morning ritual',
      story: 'Quiet and unhurried, like Seed. A Shore sunrise, then the morning routine itself: pour, scoop, stir.',
      theme: 't-stone',
      palette: ['#F6F4EF', '#D9D3C7', '#22201D'],
      notes: {
        feel: 'Quiet, unhurried and grown-up, like Seed. Lots of space, soft light, and the morning shown as a small daily ritual.',
        type: {
          display: 'Geist Light',
          body: 'Geist',
          sample: { family: 'var(--f-geist)', weight: 300 },
          why: 'A thin, modern sans feels calm and current. One font family for everything keeps the page simple and quiet.',
        },
        colors: [
          { hex: '#F6F4EF', name: 'Morning stone' },
          { hex: '#22201D', name: 'Ink' },
          { hex: '#C9A24A', name: 'Jar gold (accent)' },
        ],
        colorWhy: 'Warm stone and soft gray feel like early light at the Shore. Ink keeps the words easy to read, and gold appears only in small touches.',
        audience: 'For Shore locals with a daily routine. It opens on a Jersey Shore sunrise and a one-minute ritual, so it feels like their morning, not a sales pitch.',
        flow: [
          { step: 'Attention', keys: 'C1', text: 'A Shore sunrise and one calm promise.' },
          { step: 'Interest', keys: 'C2–C4', text: 'The one-minute ritual, a real review, and what is in the scoop.' },
          { step: 'Desire', keys: 'C5–C7', text: 'Your coffee with one scoop, the cost per morning, and where to try it.' },
          { step: 'Action', keys: 'C8', text: 'Subscribe online, or find a store. Every section also ends with a button.' },
        ],
      },
      pages: [
        {
          key: 'home',
          label: 'Home page',
          sections: [
            {
              key: 'C1',
              label: 'Top of the page',
              html: `${nav('Shop now')}
<section class="x-hero"><img src="${A}shore.jpg" alt="A misty sunrise over a Jersey Shore beach with houses along the dunes"><div class="scrim"></div>
  <div class="copy"><h1 class="display">Your morning, one scoop richer.</h1><p class="lead">Collagen, organic mushrooms and cacao, stirred into your first cup. From a Lavallette, NJ company.</p>
  <div class="btns"><a href="#" class="btn btn-primary">Shop Coffee Booster</a><a href="#" class="btn btn-ghost">${ic('pin')}Find a store</a></div></div></section>`,
            },
            {
              key: 'C2',
              label: 'The morning ritual (how to mix)',
              html: `<section class="sec pad has-deco sun"><div class="x-ritual">
  <div class="rt-ph"><img src="${A}hero-stir.jpg" alt="Stirring a spoon in a white cup of coffee"></div>
  <div class="rt-copy"><h2 class="display">The ritual takes one minute.</h2>
    <ol class="rt-steps">
      <li><span class="ml-ic">${ic('cup')}</span><div><span class="step">First</span><h3>Pour your coffee, hot.</h3><p class="muted">Any coffee you like. Hot coffee helps it mix in smoothly.</p></div></li>
      <li><span class="ml-ic">${ic('scoop')}</span><div><span class="step">Then</span><h3>Add one scoop.</h3><p class="muted">About 11.5 g. A jar holds 30 mornings.</p></div></li>
      <li><span class="ml-ic">${ic('spoon')}</span><div><span class="step">Last</span><h3>Stir until smooth and creamy.</h3><p class="muted">A light, creamy chocolate taste. Works in warm water too.</p></div></li>
    </ol>
    <p class="note">[Rich to confirm the best way so every scoop mixes in fully.]</p>${ctaRow('Start your ritual')}
  </div>
</div></section>`,
            },
            { key: 'C3', label: 'What people say', html: bigQuote },
            {
              key: 'C4',
              label: "What's in the scoop",
              html: `<section class="sec pad"><div class="x-head"><h2 class="display">What's in the scoop, and why</h2><a href="#">See the full label</a></div>
<div class="x-round">${ING.map((i) => `<div class="it"><img src="${A}${i.img}" alt=""><div><b>${i.short} · ${i.amt}</b><span class="muted">${i.why}</span></div></div>`).join('')}</div>
<p class="x-also">Also: 5 g grass-fed collagen · 500 mg organic cordyceps (improves stamina†) · 100 mg L-theanine</p></section>`,
            },
            { key: 'C5', label: 'Your coffee, with one scoop', html: vsScoop },
            { key: 'C6', label: 'Price and value', html: valueLedger },
            { key: 'C7', label: 'Try it where you shop', html: `<section class="sec pad">${shopSection}</section>` },
            { key: 'C8', label: 'Closing call to action', html: ctaBand('Make tomorrow morning the first.', 'Start with one jar, or subscribe and pause anytime. From $1.65 a cup, with a 30-day money-back guarantee.', waves('w-top')) },
            { key: 'C9', label: 'Footer', html: footer() },
          ],
        },
        {
          key: 'order',
          label: 'Order page',
          sections: [
            { key: 'CP1', label: 'Product and buy box', html: `${nav('Cart (0)')}<section class="sec pad x-pdp x-pdp-seed"><div class="pdp-l">${carousel}</div>${buyBox('plan-c')}</section>` },
            { key: 'CP2', label: 'The ritual (how to mix)', html: `<section class="sec pad tint has-deco sun">${mixLine('The ritual takes one minute.')}</section>` },
            {
              key: 'CP3',
              label: 'Supplement Facts',
              html: `<section class="sec pad has-deco">${waves('w-bottom')}<div class="x-facts calm"><div class="facts-copy"><h2 class="display">Every amount, right on the label.</h2><p class="lead muted">Here is the full panel from the jar, as plain text you can read and zoom.</p>${badges}</div><div>${factsPanel}</div></div></section>`,
            },
            { key: 'CP4', label: 'Reviews', html: `<section class="sec pad tint"><div class="x-head"><h2 class="display">4.8 out of 5 from 50 reviews</h2><a href="#">Read all reviews</a></div>${reviewCards(false)}</section>` },
            { key: 'CP5', label: 'Questions', html: faqSection('Questions') },
            { key: 'CP6', label: 'Footer', html: footer() },
          ],
        },
      ],
    },
  ],
}
