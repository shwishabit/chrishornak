import { chromium } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function exportOG() {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } })

  const htmlPath = `file:///${path.resolve(__dirname, '..', 'brand', 'og-image.html').replace(/\\/g, '/')}`
  await page.goto(htmlPath, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)

  await page.screenshot({
    path: path.resolve(__dirname, 'public', 'images', 'og-image.png'),
    clip: { x: 0, y: 0, width: 1200, height: 630 },
  })
  console.log('Exported og-image.png (1200x630)')

  await browser.close()
}

exportOG()
