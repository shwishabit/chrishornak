// Capture clean hero screenshots of live projects for the /work portfolio.
// Shoots at 2x (2880x1800) then downscales to 1440-wide webp via sharp.
// Run: node scripts/capture-work-shots.mjs
import { chromium } from '@playwright/test'
import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const OUT = path.join(process.cwd(), 'public/images/work')

const sites = [
  // Client work
  { slug: 'pontiva', url: 'https://pontivaadvisory.com' },
  { slug: 'pa-pardon', url: 'https://www.papardon.com/' },
  { slug: 'tommie-whitener', url: 'https://tommiewhitener.com' },
  { slug: 'speranza', url: 'https://www.speranzaconsulting.com/' },
  { slug: 'custom-craft', url: 'https://www.customcraftwv.com/' },
  // Built & owned
  { slug: 'swift-growth', url: 'https://swiftgrowth.marketing' },
  { slug: 'bloghands', url: 'https://bloghands.com' },
  { slug: 'f0rmless', url: 'https://f0rmless.com' },
  { slug: 'findability', url: 'https://chrishornak.com/audit' },
]

const run = async () => {
  await mkdir(OUT, { recursive: true })
  const browser = await chromium.launch()
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  })

  for (const s of sites) {
    const page = await ctx.newPage()
    try {
      await page.goto(s.url, { waitUntil: 'networkidle', timeout: 45000 })
    } catch {
      try {
        await page.goto(s.url, { waitUntil: 'domcontentloaded', timeout: 45000 })
      } catch (e) {
        console.error(`✗ ${s.slug} — navigation failed: ${e.message}`)
        await page.close()
        continue
      }
    }
    // settle: fonts, hero animation, lazy images
    await page.waitForTimeout(3500)
    try { await page.evaluate(() => document.fonts && document.fonts.ready) } catch {}
    const buf = await page.screenshot({ type: 'png' }) // viewport only, 2880x1800
    const dest = path.join(OUT, `${s.slug}.webp`)
    await sharp(buf).resize(1440).webp({ quality: 82 }).toFile(dest)
    const meta = await sharp(buf).metadata()
    console.log(`✓ ${s.slug} — captured ${meta.width}x${meta.height} → ${dest}`)
    await page.close()
  }

  await browser.close()
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
