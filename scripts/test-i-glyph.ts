import { chromium } from '@playwright/test'
import path from 'path'

async function testIGlyph() {
  const browser = await chromium.launch()
  const context = await browser.newContext({ deviceScaleFactor: 2 })
  const page = await context.newPage()

  const htmlPath = `file://${path.resolve(__dirname, '..', '..', 'brand', 'test-i-comparison.html').replace(/\\/g, '/')}`
  await page.goto(htmlPath, { waitUntil: 'networkidle' })
  await page.waitForFunction(() => document.fonts.check('700 200px Sora'))
  await page.waitForTimeout(1000)

  await page.screenshot({
    path: path.resolve(__dirname, '..', '..', 'brand', 'test-i-comparison.png'),
    fullPage: true,
  })
  console.log('Saved test-i-comparison.png')

  await browser.close()
}

testIGlyph().catch(console.error)
