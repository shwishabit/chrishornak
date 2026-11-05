/* VidaRich: the built site, page by page and section by section, so Rich leaves notes the same way
 * he did on the Round 1 and Round 2 designs (Chris, 2026-11-05). Each section is a screenshot of the
 * Horizon draft (theme 159216926910): desktop 1440 wide, phone 390 wide at 2x, swapped by screen width.
 * Shots: Projects/vidarich/reference/audit-local/sections.cjs, compressed with
 * .agent/scripts/photo-optimize.mjs (jpg q78) into public/review/vidarich/site/. Retake both after any
 * change to the draft. */
import type { ReviewContent, ReviewPage, ReviewSection } from './types'

const THEME = '159216926910'
const PREVIEW = (path: string) => `https://3d4533-ba.myshopify.com${path}${path.includes('?') ? '&' : '?'}preview_theme_id=${THEME}`
const DIR = '/review/vidarich/site/'

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

export const vidarichSite: ReviewContent = {
  slug: 'vidarich-site',
  title: 'VidaRich: your new site',
  client: 'Rich Calandra, VidaRich',
  intro:
    'Rich, this is your new site, page by page, the same way you gave notes on the design. It is not live yet, and your current site stays up until you say go. Pick a page at the top. Next to each part, tap Like, Don’t like or Change it and type what you want changed. On a phone, the note box sits at the bottom of the screen. Your notes save as you go. When you are done, go to Finish and press Finalize review. The 4 questions from my email can go in General comments on the Finish page.',
  assets: DIR,
  options: [
    {
      key: 'S',
      name: 'Your new site',
      story:
        'The Green design you picked in Round 2, built on your Shopify store. These are pictures of the real pages; each page has a link to click through it yourself. On a phone you see the phone version.',
      theme: 't-green',
      palette: ['#1E3D2F', '#F1F5F1', '#C9A24A'],
      pages: [
        page('home', 'Home page', 'H', '/', [
          ['Menu bar', 87, 120],
          ['Top: Your Daily Routine, Upgraded.', 673, 1646],
          ['Collagen Peptides', 673, 1306],
          ['The 5 superfoods', 954, 2780],
          ['Your Drink vs Your Drink + VidaRich', 1346, 4010],
          ['Price per serving', 659, 2318],
          ['How to mix', 694, 1700],
          ['Reviews', 586, 1912],
          ['Try it where you shop', 754, 2268],
          ['This Sh!t Works: subscribe or try one jar', 348, 848],
          ['Footer', 324, 1330],
        ]),
        page('order', 'Order page', 'O', '/products/vidarich-coffee-booster', [
          ['Photo and buy box', 1357, 3746],
          ['Supplement Facts', 1043, 4196],
          ['How to mix', 385, 956],
          ['Reviews', 2072, 5176],
          ['Questions and answers', 865, 1560],
          ['10% sign-up band and footer', 721, 2632],
        ]),
        page('ingredients', 'Ingredients', 'I', '/pages/ingredients?view=ingredients', [
          ['Top', 470, 842],
          ['Every ingredient', 2006, 4414],
          ['Fruiting body only. No mycelium.', 633, 1582],
          ['The full label', 1044, 3026],
          ['This Sh!t Works: subscribe or try one jar', 348, 846],
        ]),
        page('about', 'About', 'A', '/pages/contact?view=about', [
          ['Top: The Rich in VidaRich', 366, 660],
          ['Made in New Jersey, sold in stores', 842, 1682],
          ['My promise to you', 976, 1906],
          ['This Sh!t Works: subscribe or try one jar', 348, 848],
        ]),
        page('storefinder', 'Store finder', 'F', '/a/store-locator/list', [
          ['Top and state buttons', 400, 776],
          ['Store list and map', 974, 1824],
          ['10% sign-up band and footer', 721, 2630],
        ]),
        page('contact', 'Contact', 'C', '/pages/contact', [
          ['Top', 290, 380],
          ['Form and other ways to reach you', 717, 2494],
          ['10% sign-up band and footer', 721, 2630],
        ]),
        page('newsletter', 'Newsletter', 'N', '/pages/contact?view=newsletter', [['Try your first jar for 10% off', 631, 1452]]),
        page('event', 'Event page', 'E', '/pages/event', [
          ['Form and what one scoop adds', 918, 2974],
          ['Fine print', 137, 430],
        ]),
      ],
    },
  ],
  fineprint:
    'Pictures of the new site taken on November 5, 2026. Prices, reviews, stores and the Supplement Facts come from your Shopify store and your label. Coffee shop prices on the site: Joe Coffee, State of Coffee Q2 2026.',
}
