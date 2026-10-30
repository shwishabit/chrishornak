/* VidaRich round 2 (2026-10-30): Option A with Rich's notes, in green and in the
 * jar's brown + gold, for his final approval before the Shopify build. Wording
 * comes from Projects/vidarich/reference/rich-review-2026-10-28.json and
 * rich-followup-2026-10-29.json. Prices and the 10% subscribe discount were read
 * from the live product page on 2026-10-30. The coffee shop figures were read
 * from joe.coffee/coffee-industry-trends on 2026-10-30. */
import type { ReviewContent, ReviewNotes, ReviewOption } from './types'
import { A, FDA, REV, STARS, decoIcon, factsPanel, ic, reviewCards, rings } from './vidarich'

const SHOP_NOTE =
  '*Coffee shop prices: national averages at independent cafés from <a href="https://joe.coffee/coffee-industry-trends/">Joe Coffee, State of Coffee Q2 2026</a>: drip coffee $4.89, latte $5.54, cold brew $5.46, matcha $6.23.'

const COLLAGEN_NOTE =
  'Collagen works best when your body has the nutrients needed to support it. Collagen Peptides are a dense source of L-Glycine and other important amino acids, but nutrients like Vitamin C, Copper, Zinc and Manganese help your body produce, strengthen, and maintain its own collagen. These other nutrients were all very intentionally built into the VidaRich Superfood blend.†'

const GUARANTEE = 'Full refund of the purchase price on your first single jar purchased online.'

// Rich's order. Dose shows in the corner of each photo.
const TILES = [
  { img: 'lionsmane.jpg', alt: "A lion's mane mushroom growing on a mossy tree", icon: 'mushroom', name: "Organic lion's mane", amt: '1000 mg', why: 'A white, shaggy mushroom, fruiting body only. On our label: enhances brain function.†' },
  { img: 'site-cordyceps.jpg', alt: 'A pile of dried cordyceps mushrooms', icon: 'mushroom', name: 'Organic cordyceps', amt: '500 mg', why: 'Fruiting body only. On our label: improves stamina.†' },
  { img: 'cacao-tree.jpg', alt: 'Ripe cacao pods hanging on a cacao tree', icon: 'bean', name: 'Organic cacao', amt: '1200 mg', why: 'Where the light, creamy chocolate taste comes from. On our label: an antioxidant powerhouse.†' },
  { img: 'site-spirulina.jpg', alt: 'Bright green spirulina powder on dark wood', icon: 'leaf', name: 'Organic spirulina', amt: '800 mg', why: 'A blue-green algae, dried to a fine powder. Part of what makes it a superfood blend.' },
  { img: 'beets.jpg', alt: 'A bunch of fresh beets with red stems', icon: 'beet', name: 'Organic beet root', amt: '400 mg', why: 'Dried and powdered organic beets. On our label: boosts nitric oxide.†' },
]

const ADDS: [string, string][] = [
  ['Collagen peptides', '5 g'],
  ["Organic lion's mane", '1000 mg'],
  ['Organic cordyceps', '500 mg'],
  ['Organic cacao', '1200 mg'],
  ['Organic spirulina', '800 mg'],
  ['Organic beet root', '400 mg'],
]

const PACKS = [
  { name: '1 jar', servings: '30 servings', price: '$59.98', cup: '$2.00', save: '', sub: '$53.98', subCup: '$1.80', subSave: 'Save $6.00' },
  { name: '2/Pak', servings: '60 servings', price: '$108.00', cup: '$1.80', save: 'Save $11.96', sub: '$97.20', subCup: '$1.62', subSave: 'Save $22.76' },
  { name: '4/Pak', servings: '120 servings', price: '$198.00', cup: '$1.65', save: 'Save $41.92', sub: '$178.20', subCup: '$1.49', subSave: 'Save $61.72' },
]

// Subscribe prices: $53.98 for 1 jar was read from the live store. The 2/Pak and 4/Pak figures are 10% off the
// listed price. The live page did not show them, so Rich confirms these at review.

// Rich's 4 steps, with the same words on both pages.
const STEPS: [string, string, string][] = [
  ['scoop', 'Add the scoop in first', 'One scoop in the bottom of your cup.'],
  ['drop', 'Pour in your drink', 'Your beverage of choice, hot or cold.'],
  ['spoon', 'Stir, blend or froth', 'Until creamy smooth.'],
  ['cup', 'Enjoy!!!', 'A light, creamy chocolate taste.'],
]

// Icons cut from the print label. The FDA one reads "Registered Facility" (Rich, Q4); the label itself says "Approved".
const BADGES: [string, string][] = [
  ['fda', 'Made in an FDA-registered facility'],
  ['gluten', 'Gluten free'],
  ['nongmo', 'Made with non-GMO ingredients'],
  ['gmp', 'Good Manufacturing Practice'],
  ['tested', 'Third-party tested'],
  ['usa', 'Made in USA from global materials'],
]

const FAQ: [string, string][] = [
  ['How do I take it?', 'Add the scoop to your cup first. Pour in your drink, hot or cold. Stir, blend or froth until creamy smooth.'],
  ['What does it taste like?', 'A light, creamy chocolate flavor.'],
  ['Is it worth the price?', 'One jar works out to $2.00 a serving, and $1.65 a serving with a 4/Pak. That is less than half the price of your local coffee shop.*'],
  ['Can I pause or cancel my subscription?', 'Yes. Skip, reschedule, edit or cancel deliveries anytime.'],
  ['Where can I buy it in person?', 'At natural food stores near you. Use the store finder to see the closest one.'],
  ['What is your guarantee?', `Try it for 30 days. ${GUARANTEE}`],
  ['Who should not take it?', 'It is for healthy adults. Not for anyone under 18, or if you are pregnant or nursing. If you have a medical condition, ask your doctor first.'],
  ['Allergens?', 'Contains tree nuts (coconut) and milk. Made in a facility that also processes milk, eggs, fish, shellfish, tree nuts, peanuts, soy, wheat and sesame.'],
]

// Sharper copies of Rich's product photos (Real-ESRGAN). Nothing in the photos was added or removed.
const hd = (html: string) => html.replace(/(jar-mug|jar-hand|jar-beans|booth|shelf|rich-store)\.jpg/g, 'hd-$1.jpg')

// Order page photos: Gemini scenes with the jar first, then Rich's real tasting table and store shelf.
const PHOTOS = [
  ['gem-kitchen.jpg', 'A jar of VidaRich and a cup of coffee on a marble kitchen island'],
  ['gem-marble.jpg', 'A jar of VidaRich on marble in window light'],
  ['gem-wood-mug.jpg', 'A jar of VidaRich beside a cup of coffee and coffee beans on a wood table'],
  ['gem-outdoor.jpg', 'A jar of VidaRich on an outdoor table in the sun'],
  ['gem-beans.jpg', 'A jar of VidaRich on rustic wood with coffee beans'],
  ['hd-booth.jpg', 'Rich Calandra at a VidaRich tasting table'],
  ['hd-shelf.jpg', 'VidaRich on a store shelf'],
]
const photoCarousel = `
<div class="x-carousel">
  <div class="car-wrap">
    <div class="car-track" tabindex="0" role="region" aria-label="Product photos. Scroll sideways for more.">${PHOTOS.map(([f, alt]) => `<figure class="car-slide"><img src="${A}${f}" alt="${alt}" style="object-position: ${f === 'gem-kitchen.jpg' || f === 'gem-wood-mug.jpg' ? '78%' : '50%'} 50%"></figure>`).join('')}</div>
    <div class="car-nav"><button type="button" class="car-btn" data-car="-1" aria-label="Previous photo">←</button><span class="car-hint">${PHOTOS.length} photos · swipe or use the arrows</span><button type="button" class="car-btn" data-car="1" aria-label="Next photo">→</button></div>
  </div>
</div>`

const logo = (cls = '') => `<img class="vr-logo ${cls}" src="${A}logo.svg" alt="VidaRich Coffee Booster" width="500" height="257">`

const nav = (cta: string) => `
<nav class="x-nav">
  <div class="x-nav-l">${logo()}
    <span class="links"><a href="#">Shop</a><a href="#" class="hide-sm">Ingredients</a><a href="#" class="hide-sm">How to mix</a><a href="#" class="hide-sm">Find a store</a></span></div>
  <div class="x-nav-r"><a href="#" class="hide-sm muted-link">Wholesale login</a><a href="#" class="btn btn-sm btn-primary">${cta}</a></div>
</nav>`

const trust = `
<div class="x-trust">
  <div>${STARS}<span><b>4.8</b> from 50 reviews</span></div>
  <div>${ic('shield')}<span><b>30-day</b> money-back guarantee on your first jar</span></div>
  <div>${ic('cup')}<span><b>$1.65</b> a serving with a 4/Pak</span></div>
</div>`

const footer = `
<footer class="x-foot">${logo('vr-logo-foot')}<p class="fine">${FDA}</p><p class="fine">${SHOP_NOTE}</p></footer>`

const hero = `${nav('Shop now')}
<section class="x-hero vr-hero"><img src="${A}hero-jar.jpg" alt="A person stirring a white cup of coffee at a wooden table, beside a jar of VidaRich Coffee Booster"><div class="scrim"></div>
  <p class="vr-banner">Over <span class="vr-count" data-from="100000" data-to="135000">135,000</span> servings sold</p>
  <div class="copy"><h1 class="display">Your Daily Routine, Upgraded.</h1><p class="lead">Collagen, organic mushrooms and superfoods for your morning coffee or daily drink of choice.</p>
  <div class="btns"><a href="#" class="btn btn-light">Shop Coffee Booster</a><a href="#" class="btn btn-ghost">${ic('pin')}Find a store</a></div></div>
</section>
${trust}`

const collagen = `
<section class="sec pad vr-collagen">
  <div class="vr-dose"><b class="display">5 g</b><span>in every scoop</span></div>
  <div class="vr-collagen-copy"><h2 class="display">Collagen Peptides</h2><p class="lead muted">${COLLAGEN_NOTE}</p></div>
</section>`

const superfoods = `
<section class="x-band sec pad has-deco">${decoIcon('mushroom', 'd-br')}
  <div class="x-head"><div class="x-head-copy"><h2 class="display">Powered by functional mushrooms and the world’s finest superfoods, all working together.</h2></div><a href="#">See the full label</a></div>
  <div class="x-cards vr-five">${TILES.map((i) => `<div class="x-card light"><div class="ph"><img src="${A}${i.img}" alt="${i.alt}"><span class="badge">${i.amt}</span></div><div class="body"><b class="name">${ic(i.icon, 'name-ic')}${i.name}</b><span class="why">${i.why}</span></div></div>`).join('')}</div>
  <p class="x-also">Also in every scoop: 100 mg L-theanine and MCT creamer.</p>
  <div class="x-ctarow"><a href="#" class="btn btn-light">Shop Coffee Booster · $59.98</a></div>
</section>`

const yourDrink = `
<section class="sec pad">
  <div class="x-head"><div class="x-head-copy"><h2 class="display">Your Drink, just Better!</h2><p class="lead muted">Coffee, tea, smoothies or just water. Whatever your favorite, just add one scoop of VidaRich to elevate your daily routine.</p></div></div>
  <div class="x-mugs vr-mugs">
    <div class="mug plain"><div class="ph"><img src="${A}pour.jpg" alt="A plain cup of coffee being poured"></div><b class="display">Your Drink</b><ul>${ADDS.map(([l]) => `<li><i aria-hidden="true">–</i><span>${l}</span><b>0</b></li>`).join('')}<li><i aria-hidden="true">–</i><span>Just the taste of your drink</span></li></ul></div>
    <div class="mug-vs" aria-hidden="true">vs</div>
    <div class="mug vida"><div class="ph"><img src="${A}drink-scoop.jpg" alt="A scoop of VidaRich going into a white cup of coffee, beside the jar"></div><b class="display">Your Drink + VidaRich</b>
      <ul>${ADDS.map(([l, v]) => `<li><i aria-hidden="true">✓</i><span>${l}</span><b>${v}</b></li>`).join('')}<li><i aria-hidden="true">✓</i><span>Light, creamy chocolate taste</span></li></ul>
      <a href="#" class="btn btn-light">Shop now · $59.98</a></div>
  </div>
</section>`

const price = `
<section class="sec pad x-band has-deco">${rings('r-tr')}
  <div class="x-head"><h2 class="display">Less than half the price of your local coffee shoppe*</h2><p class="lead">The more jars you get, the less each serving costs.</p></div>
  <div class="x-value">
    ${PACKS.map((p, i) => `<div class="v ${i === 2 ? 'best' : ''}">${i === 2 ? '<span class="v-tag">Best value</span>' : ''}<b class="display">${p.cup}</b><span>a serving with ${p.name}</span><small>${p.price}${p.save ? ` · ${p.save}` : ''}</small></div>`).join('')}
    <div class="v latte vr-shop">${ic('cup', 'v-ic')}<b class="display">$5.00–6.00</b><span>average coffee shop drink*</span><small>For one cup, every time.</small></div>
  </div>
  <div class="x-ctarow"><a href="#" class="btn btn-light">Get a 4/Pak and save $41.92</a><a href="#" class="btn btn-ghost">${ic('pin')}Find a store near you</a></div>
</section>`

const mixHome = `
<section class="sec pad tint has-deco">${decoIcon('leaf', 'd-br')}
  <div class="x-head"><h2 class="display">How to mix it</h2></div>
  <div class="x-cards vr-mix">${STEPS.map(([icon, h, p], i) => `<div class="x-card light"><div class="ph vr-mix-ph">${ic(icon)}<span class="badge">Step ${i + 1}</span></div><div class="body"><b class="name">${h}</b><span class="why">${p}</span></div></div>`).join('')}</div>
  <div class="x-ctarow"><a href="#" class="btn btn-primary">Get your first jar</a><a href="#" class="btn btn-ghost">${ic('pin')}Find a store near you</a></div>
</section>`

const reviews = (photo: boolean, link: string) => `
<section class="sec pad"><div class="x-head"><h2 class="display">4.8 out of 5 from 50 reviews</h2><a href="#">${link}</a></div>${hd(reviewCards(photo))}</section>`

const stores = `
<section class="sec pad">
  <div class="x-head">
    <h2 class="display">Try it where you shop. <em>Look for a tasting near you.</em></h2>
    <figure class="x-pull">${STARS}<blockquote>"${REV.gme.q}"</blockquote><figcaption>${REV.gme.by} · verified review</figcaption></figure>
  </div>
  <div class="x-stores">
    <div class="tile"><img src="${A}hd-shelf.jpg" alt="VidaRich jars on a store end-cap"><span class="pill">On the shelf near you</span></div>
    <a href="#" class="tile"><img src="${A}hd-booth.jpg" alt="Rich Calandra at a VidaRich tasting table"><span class="pill">Tastings with Rich: see all events</span></a>
    <div class="list"><div class="display list-h">Stores that carry us</div><div class="list-b">${['Soulberry Natural Market', 'Kimberton Whole Foods', 'Basil Bandwagon'].map((s) => `<span>${ic('pin')}${s}</span>`).join('')}</div><a href="#" class="btn vs-btn">${ic('pin')}Find a store near you</a></div>
  </div>
</section>`

const closing = `
<section class="x-ctaband has-deco">${rings('r-l')}
  <div class="pad sec x-ctaband-in">
    <div><h2 class="display">This Sh!t Works…</h2><p class="lead">Try it for 30 days. ${GUARANTEE}</p></div>
    <div class="x-ctaband-btns"><a href="#" class="btn btn-lg cta-main">${ic('repeat')}Subscribe and save 10%</a><a href="#" class="btn btn-lg cta-alt">${ic('pin')}Find a store near you</a><span class="cta-fine">Or buy one jar for $59.98 · 30-day money-back guarantee on your first jar</span></div>
  </div>
</section>`

const buyBox = (plan: string) => `
<div class="x-buy">
  <div class="buy-meta">${STARS} 4.8 · 50 reviews</div>
  <h1 class="display buy-title">Coffee Booster</h1>
  <p class="buy-sub">Collagen, organic mushrooms and superfoods for your morning coffee or daily drink of choice. 30 servings a jar.</p>
  <div class="buy-price"><b><span class="only-sub">$53.98</span><span class="only-one">$59.98</span></b><span>from <span class="only-sub">$1.49</span><span class="only-one">$1.65</span> a serving · less than half the price of your local coffee shoppe*</span></div>
  <div class="buy-opts">
    <label class="buy-opt on"><input type="radio" name="${plan}" checked><span class="t"><b>${ic('repeat')}Subscribe and save 10%</b><small>Delivered every month · skip or cancel anytime</small></span></label>
    <label class="buy-opt"><input type="radio" name="${plan}"><span class="t"><b>One-time purchase</b></span></label>
  </div>
  <div class="buy-k"><span class="only-sub">How many jars a month?</span><span class="only-one">How many jars?</span></div>
  <div class="buy-packs">${PACKS.map((p, i) => `<span class="pack ${i === 0 ? 'on' : ''}"><b>${p.name} (${p.servings})<span class="only-sub"> a month</span></b><small class="only-sub">${p.sub}</small><small class="only-one">${p.price}</small><small class="cup only-sub">${p.subCup} a serving</small><small class="cup only-one">${p.cup} a serving</small><small class="save only-sub">${p.subSave}</small>${p.save ? `<small class="save only-one">${p.save}</small>` : ''}</span>`).join('')}</div>
  <a href="#" class="btn btn-primary btn-lg buy-cta">Add to cart</a>
  <div class="buy-trust"><span>${ic('shield')}30-day money-back guarantee on your first single jar purchased online</span><span>${ic('check')}Checkout with Shop Pay</span></div>
  <a href="#" class="buy-local">${ic('pin')}Prefer to buy in person? Find a store near you</a>
</div>`

const insideList = `<ul class="facts-list"><li>${ic('drop')}<div><b>Collagen Peptides · 5 g</b><span>Hydrolyzed bovine collagen peptides.</span></div></li>${TILES.map((i) => `<li>${ic(i.icon)}<div><b>${i.name} · ${i.amt}</b><span>${i.why}</span></div></li>`).join('')}</ul>`

const inside = `
<section class="sec pad x-band has-deco">${rings('r-tr')}
  <div class="x-facts"><div>${factsPanel}</div><div class="facts-copy"><h2 class="display">What's inside every scoop</h2><p class="lead">Every amount, straight from the label on the jar.</p>${insideList}<div class="vr-badges">${BADGES.map(([f, l]) => `<span class="vr-badge" role="img" aria-label="${l}" style="--b: url(${A}badges/${f}.png)"></span>`).join('')}</div></div></div>
</section>`

const mixShort = `
<section class="sec pad tint has-deco">${decoIcon('leaf', 'd-br')}
  <h2 class="display">How to mix it</h2>
  <ol class="x-mixline vr-mixline">${STEPS.map(([icon, h, p]) => `<li><span class="ml-ic">${ic(icon)}</span><div><b>${h}</b><span class="muted">${p}</span></div></li>`).join('')}</ol>
</section>`

const faq = `
<section class="sec pad">
  <div class="x-faq"><h2 class="display">Questions, answered</h2>
  <div class="faq-list">${FAQ.map(([q, a], i) => `<details${i === 0 ? ' open' : ''}><summary>${q}</summary><p>${a}</p></details>`).join('')}</div></div>
</section>`

const pages = (p: string): ReviewOption['pages'] => [
  {
    key: 'home',
    label: 'Home page',
    sections: [
      { key: `${p}1`, label: 'Top of the page', html: hero },
      { key: `${p}2`, label: 'Collagen', html: collagen },
      { key: `${p}3`, label: 'Superfoods', html: superfoods },
      { key: `${p}4`, label: 'Your Drink, just Better!', html: yourDrink },
      { key: `${p}5`, label: 'Price', html: price },
      { key: `${p}6`, label: 'How to mix it', html: mixHome },
      { key: `${p}7`, label: 'What people say', html: reviews(true, 'Read all 50 reviews') },
      { key: `${p}8`, label: 'Where to buy', html: stores },
      { key: `${p}9`, label: 'Closing section', html: closing },
      { key: `${p}10`, label: 'Footer', html: footer },
    ],
  },
  {
    key: 'order',
    label: 'Order page',
    sections: [
      { key: `${p}P1`, label: 'Product and buy box', html: `${nav('Cart (0)')}<section class="sec pad x-pdp"><div class="pdp-l">${photoCarousel}</div>${buyBox(`plan-${p}`)}</section>` },
      { key: `${p}P2`, label: 'What’s inside', html: inside },
      { key: `${p}P3`, label: 'How to mix it, short view', html: mixShort },
      { key: `${p}P4`, label: 'Reviews', html: reviews(false, 'Read all reviews') },
      { key: `${p}P5`, label: 'Questions', html: faq },
      { key: `${p}P6`, label: 'Footer', html: footer },
    ],
  },
]

const flow: ReviewNotes['flow'] = [
  { step: 'Attention', keys: 'Top of the page', text: 'The jar, your headline and the servings banner.' },
  { step: 'Interest', keys: 'Collagen to Your Drink', text: 'What is in the jar, and what it adds to your drink.' },
  { step: 'Desire', keys: 'Price to Where to buy', text: 'The price per serving, how easy it is, real reviews and where to try it.' },
  { step: 'Action', keys: 'Closing section', text: 'Subscribe online, or find a store.' },
]

const type: ReviewNotes['type'] = {
  display: 'Source Serif 4',
  body: 'Figtree',
  sample: { family: 'var(--f-serif)', weight: 400 },
  why: 'The same fonts as Option A. The serif feels careful and credible, and Figtree is easy to read at any age.',
}

const audience = 'For the coffee drinker who reads the label first. It answers “what is in it, and is it real?” before it asks for the sale.'

export const vidarichRound2: ReviewContent = {
  slug: 'vidarich-round2',
  title: 'VidaRich: final look',
  client: 'Rich Calandra, VidaRich',
  intro:
    'Rich, this is Option A with your notes in place, in green and in the jar’s brown and gold. Look at both, then tell us which color you want on the Finish page. Tap Like or Change it beside any part. When you press Finalize, we build the real site from this page. The logo now uses the outline from your official logo, so it has more color.',
  assets: A,
  options: [
    {
      key: '1',
      name: 'Green',
      story: 'Forest green leads, with jar gold on the stars, prices and badges.',
      theme: 't-green t-r2',
      palette: ['#FFFFFF', '#1E3D2F', '#C9A24A'],
      notes: {
        feel: 'Calm, clean and premium, with green from the Seed and AG1 look you liked.',
        type,
        colors: [
          { hex: '#1E3D2F', name: 'Forest green' },
          { hex: '#FFFFFF', name: 'White' },
          { hex: '#C9A24A', name: 'Jar gold (accent)' },
        ],
        colorWhy: 'Green says nature and health. It stands apart from the brown jar, so the jar pops against it.',
        audience,
        flow,
      },
      pages: pages('G'),
    },
    {
      key: '2',
      name: 'Brown and gold',
      story: 'The exact brown from your label leads, with gold lettering on brown.',
      theme: 't-green t-r2 t-brown',
      palette: ['#FFFFFF', '#503617', '#D1AF75'],
      notes: {
        feel: 'Warm and rich, like the jar. The website and the shelf match.',
        type,
        colors: [
          { hex: '#503617', name: 'Jar brown' },
          { hex: '#FFFFFF', name: 'White' },
          { hex: '#D1AF75', name: 'Jar gold' },
        ],
        colorWhy: 'The site and the jar share one look, so a shopper who knows the jar knows the site right away.',
        audience,
        flow,
      },
      pages: pages('B'),
    },
  ],
  fineprint: 'Draft for approval. Reviews, prices and the Supplement Facts come from your store and label. You can change words, photos and reviews after the site is live. ' + SHOP_NOTE.replace(/<[^>]+>/g, ''),
}
