import { chromium } from '@playwright/test'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const brandDir = path.resolve(__dirname, '..', 'brand', 'Canva SVGs')
const outDir = path.resolve(__dirname, 'public', 'images')

async function exportCanvaLogos() {
  const browser = await chromium.launch()
  const context = await browser.newContext({ deviceScaleFactor: 2 })

  for (const [svgFile, pngName] of [
    ['White Text Logo.svg', 'wordmark-dark.png'],
    ['Black Text Logo.svg', 'wordmark-light.png'],
  ]) {
    const page = await context.newPage()
    let svgContent = fs.readFileSync(path.resolve(brandDir, svgFile), 'utf-8')
    svgContent = svgContent.replace(/<metadata>[\s\S]*?<\/metadata>/g, '')

    await page.setContent(`
      <html>
      <body style="margin:0; padding:0; background:transparent; display:inline-flex;">
        ${svgContent}
      </body>
      </html>
    `, { waitUntil: 'networkidle' })
    await page.waitForTimeout(500)

    // Get tight bbox of only path/circle elements (the actual logo)
    const bounds = await page.evaluate(() => {
      const svg = document.querySelector('svg')
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity

      svg.querySelectorAll('path, circle, ellipse').forEach(el => {
        try {
          const bbox = el.getBBox()
          if (bbox.width > 0 && bbox.height > 0 && bbox.width < 5000) {
            minX = Math.min(minX, bbox.x)
            minY = Math.min(minY, bbox.y)
            maxX = Math.max(maxX, bbox.x + bbox.width)
            maxY = Math.max(maxY, bbox.y + bbox.height)
          }
        } catch {}
      })

      return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
    })

    console.log(`${svgFile} content bbox:`, bounds)

    // Tight crop with minimal padding
    const padX = bounds.width * 0.01
    const padY = bounds.height * 0.03
    const vb = `${bounds.x - padX} ${bounds.y - padY} ${bounds.width + padX * 2} ${bounds.height + padY * 2}`

    await page.evaluate((vb) => {
      const svg = document.querySelector('svg')
      svg.setAttribute('viewBox', vb)
      svg.setAttribute('width', '800')
      svg.removeAttribute('height')
    }, vb)
    await page.waitForTimeout(300)

    await page.locator('svg').screenshot({
      path: path.resolve(outDir, pngName),
      omitBackground: true,
    })
    console.log(`Exported ${pngName}`)
    await page.close()
  }

  await browser.close()
}

exportCanvaLogos()
