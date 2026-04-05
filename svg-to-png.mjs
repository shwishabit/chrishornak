import { chromium } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function convert() {
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ deviceScaleFactor: 3 })

  for (const [svg, png] of [
    ['public/images/wordmark-dark.svg', 'public/images/wordmark-dark.png'],
    ['public/images/wordmark-light.svg', 'public/images/wordmark-light.png'],
  ]) {
    const page = await ctx.newPage()
    const svgPath = `file:///${path.resolve(__dirname, svg).replace(/\\/g, '/')}`
    await page.goto(svgPath, { waitUntil: 'networkidle' })
    await page.waitForTimeout(500)
    await page.locator('svg').screenshot({
      path: path.resolve(__dirname, png),
      omitBackground: true,
    })
    const dims = await page.locator('svg').boundingBox()
    console.log(`${png} — ${Math.round(dims.width * 3)}x${Math.round(dims.height * 3)}px`)
    await page.close()
  }

  await browser.close()
}

convert()
