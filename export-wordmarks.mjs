import { chromium } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function exportWordmarks() {
  const browser = await chromium.launch()
  const page = await browser.newPage()

  const htmlPath = `file:///${path.resolve(__dirname, '..', 'brand', 'wordmark-export.html').replace(/\\/g, '/')}`
  await page.goto(htmlPath, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)

  // Trigger the update function so sliders apply their default values
  await page.evaluate(() => {
    document.getElementById('dot-x').dispatchEvent(new Event('input'))
  })
  await page.waitForTimeout(500)

  // --- DARK WORDMARK ---
  // Add slight letter-spacing for bloom compensation
  await page.evaluate(() => {
    document.querySelector('#dark-wm .wordmark-text').style.letterSpacing = '0.3px'
  })
  await page.waitForTimeout(200)

  // Use clip-path inset to remove BOTH native dot and serif (cover won't work on transparent bg)
  await page.evaluate(() => {
    document.querySelectorAll('.i-clipped').forEach(el => {
      el.style.clipPath = 'inset(26% 0 0 0)'
    })
  })
  await page.waitForTimeout(200)

  // Now make backgrounds transparent for export
  await page.evaluate(() => {
    document.body.style.background = 'transparent'
    document.querySelectorAll('.preview-panel, .wordmark-container, .dot-cover').forEach(el => {
      el.style.background = 'transparent'
    })
  })
  await page.waitForTimeout(300)

  await page.locator('#dark-wm').screenshot({
    path: path.resolve(__dirname, 'public', 'images', 'wordmark-dark.png'),
    omitBackground: true,
  })
  console.log('Exported wordmark-dark.png')

  // --- LIGHT WORDMARK ---
  // Reset letter-spacing for light version (natural spacing)
  await page.evaluate(() => {
    document.querySelector('#light-wm .wordmark-text').style.letterSpacing = '-1px'
  })
  await page.waitForTimeout(200)

  await page.locator('#light-wm').screenshot({
    path: path.resolve(__dirname, 'public', 'images', 'wordmark-light.png'),
    omitBackground: true,
  })
  console.log('Exported wordmark-light.png')

  await browser.close()
}

exportWordmarks()
