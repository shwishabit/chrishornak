/* VidaRich Round 4 (2026-11-09): the built site after Rich's round 3 notes and Chris's notes, section by
 * section, same flow as the round 3 review (vidarich-site.ts). Shots of the Horizon draft (theme 159216926910):
 * desktop 1440 wide, phone 390 wide at 2x. Taken with Projects/vidarich/reference/audit-local/sections.cjs,
 * compressed with .agent/scripts/photo-optimize.mjs (jpg q78) into public/review/vidarich/round4/. */
import type { ReviewContent, ReviewPage, ReviewSection } from './types'

const THEME = '159216926910'
const PREVIEW = (path: string) => `https://3d4533-ba.myshopify.com${path}${path.includes('?') ? '&' : '?'}preview_theme_id=${THEME}`
const DIR = '/review/vidarich/round4/'

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

/** [label, desktop height at 1440 wide, phone height at 780 wide] */
type Shot = [string, number, number]

function page(key: string, label: string, letter: string, path: string, shots: Shot[]): ReviewPage {
  const sections: ReviewSection[] = shots.map(([sLabel, dh, ph], i) => {
    const n = i + 1
    const link =
      i === 0
        ? `<a class="rv-live" href="${PREVIEW(path)}" target="_blank" rel="noopener" style="display:flex;justify-content:flex-end;gap:6px;padding:10px 16px;font:600 14px system-ui,sans-serif;color:#1E3D2F;background:#F1F5F1;border-bottom:1px solid #E4ECE4;text-decoration:underline">Open the ${esc(label.toLowerCase())} on the new site ↗</a>`
        : ''
    const alt = `${label}: ${sLabel}`
    const html = `${link}<picture><source media="(max-width: 760px)" srcset="${DIR}${key}-${n}-phone.jpg" width="780" height="${ph}"><img src="${DIR}${key}-${n}-desk.jpg" width="1440" height="${dh}" alt="${esc(alt)}" loading="${i < 2 ? 'eager' : 'lazy'}" decoding="async" style="display:block;width:100%;height:auto"></picture>`
    return { key: `${letter}${n}`, label: sLabel, html }
  })
  return { key, label, sections }
}

export const vidarichRound4: ReviewContent = {
  slug: 'vidarich-round4',
  title: 'VidaRich: your new site, round 4',
  client: 'Rich Calandra, VidaRich',
  intro:
    'Rich, here is the site with your round 3 notes built in. New: the home page in your new order, Coffee Booster and Mushroom Coffee side by side with the label promises from your jar under them, the Superfood Blend with L-theanine and Learn more links, the benefits table, your promise, and the VidaRich Community sign-up ($10 off the first order with the code Newbie). Also new: a Mushroom Coffee coming-soon page and an Events page you fill in yourself. Same as before: pick a page at the top, tap Like, Don’t like or Change it next to each part, and type what you want changed. When you are done, go to Finish and press Finalize review.',
  assets: DIR,
  options: [
    {
      key: 'S',
      name: 'Your new site',
      story:
        'Pictures of the real pages on your Shopify store, not live yet. Each page has a link to click through it yourself. On a phone you see the phone version.',
      theme: 't-green',
      palette: ['#1E3D2F', '#F1F5F1', '#C9A24A'],
      pages: [
        page('home', 'Home page', 'H', '/', [
          ["Menu bar", 87, 120],
          ["Top, with the label promises under it", 673, 1554],
          ["Shop VidaRich: Coffee Booster + Mushroom Coffee", 1107, 1458],
          ["VidaRich Superfood Blend", 792, 2832],
          ["Reviews", 498, 1638],
          ["Your Drink Just Got Better: Just coffee vs + VidaRich", 937, 2620],
          ["How to mix", 716, 1744],
          ["Price per serving", 770, 2762],
          ["Find VidaRich in a store near you", 559, 1650],
          ["My promise to you", 976, 2090],
          ["This Sh!t Works", 285, 610],
          ["Join the VidaRich Community + footer", 779, 2724],
        ]),
        page('order', 'Order page', 'O', '/products/vidarich-coffee-booster', [
          ["Photo and buy box", 1398, 3878],
          ["Collagen Peptides (moved here)", 674, 1306],
          ["Supplement Facts", 1043, 4196],
          ["How to mix", 379, 1022],
          ["Reviews", 2072, 5094],
          ["Questions and answers", 865, 1562],
          ["This Sh!t Works!! sign-up band + footer", 748, 2714],
        ]),
        page('mushroom', 'Mushroom Coffee page', 'M', '/pages/contact?view=mushroom', [
          ["Mushroom Coffee: coming soon", 863, 2562],
          ["What is in it", 159, 294],
        ]),
        page('events', 'Events page', 'E', '/pages/contact?view=events', [
          ["Events (you add them in Shopify)", 577, 880],
        ]),
        page('ingredients', 'Ingredients', 'I', '/pages/ingredients?view=ingredients', [
          ["Top", 470, 842],
          ["Every ingredient", 2006, 4414],
          ["Fruiting body only. No mycelium.", 633, 1582],
          ["The full label", 1044, 3026],
          ["This Sh!t Works", 357, 894],
        ]),
        page('about', 'About', 'A', '/pages/contact?view=about', [
          ["Top: The Rich in VidaRich + my promise", 813, 2196],
          ["Made in New Jersey, sold in stores", 654, 1906],
          ["This Sh!t Works", 357, 794],
        ]),
        page('newsletter', 'Newsletter', 'N', '/pages/contact?view=newsletter', [
          ["Join the VidaRich Community", 631, 1452],
        ]),
      ],
    },
  ],
  fineprint:
    'Pictures of the new site taken on November 9, 2026. Prices, reviews, stores and the Supplement Facts come from your Shopify store and your label. Coffee shop prices on the site: Joe Coffee, State of Coffee Q2 2026.',
}
