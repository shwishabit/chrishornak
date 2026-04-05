import { chromium } from '@playwright/test'
import path from 'path'
import fs from 'fs'

const BRAND_DIR = path.resolve(__dirname, '..', '..', 'brand')
const IMAGES_DIR = path.resolve(__dirname, '..', 'public', 'images')

async function exportWordmarks() {
  const browser = await chromium.launch()
  // Use 3x DPI for crisp PNGs at small display sizes (h-10 = 40px in nav)
  const context = await browser.newContext({ deviceScaleFactor: 3 })
  const page = await context.newPage()

  const htmlPath = `file://${path.resolve(BRAND_DIR, 'wordmark-export.html').replace(/\\/g, '/')}`
  await page.goto(htmlPath, { waitUntil: 'networkidle' })

  // Wait for Sora font to load
  await page.waitForFunction(() => document.fonts.check('700 120px Sora'))
  await page.waitForTimeout(1000)

  // ============================================================
  // Get measurements from the rendered text
  // ============================================================
  const metrics = await page.evaluate(() => {
    const wm = document.getElementById('wordmark-dark')!
    const iWrap = wm.querySelector('.i-wrap')! as HTMLElement
    const iStem = wm.querySelector('.i-stem')! as HTMLElement
    const iDot = wm.querySelector('.i-dot')! as HTMLElement

    const wmRect = wm.getBoundingClientRect()
    const iWrapRect = iWrap.getBoundingClientRect()
    const iStemRect = iStem.getBoundingClientRect()
    const iDotRect = iDot.getBoundingClientRect()

    // The dot center relative to the wordmark element
    const dotCx = iDotRect.left + iDotRect.width / 2 - wmRect.left
    const dotCy = iDotRect.top + iDotRect.height / 2 - wmRect.top
    const dotR = iDotRect.width / 2

    // Get individual span positions
    const spans = wm.querySelectorAll(':scope > span')
    const spanData: Array<{ text: string; x: number; y: number; w: number; h: number }> = []
    spans.forEach((s) => {
      const r = (s as HTMLElement).getBoundingClientRect()
      spanData.push({
        text: s.textContent || '',
        x: r.left - wmRect.left,
        y: r.top - wmRect.top,
        w: r.width,
        h: r.height,
      })
    })

    return {
      fullWidth: wmRect.width,
      totalHeight: wmRect.height,
      dotCx,
      dotCy,
      dotR,
      iStem: {
        x: iStemRect.left - wmRect.left,
        y: iStemRect.top - wmRect.top,
        w: iStemRect.width,
        h: iStemRect.height,
      },
      spans: spanData,
    }
  })

  console.log('Metrics:', JSON.stringify(metrics, null, 2))

  // ============================================================
  // Export dark PNG
  // ============================================================
  await page.evaluate(() => {
    document.getElementById('wordmark-dark')!.style.display = ''
    document.getElementById('wordmark-light')!.style.display = 'none'
  })

  const darkEl = page.locator('#wordmark-dark')
  const darkPngPath = path.resolve(IMAGES_DIR, 'wordmark-dark.png')
  await darkEl.screenshot({ path: darkPngPath, omitBackground: true })
  console.log(`Exported ${darkPngPath}`)
  fs.copyFileSync(darkPngPath, path.resolve(BRAND_DIR, 'wordmark-dark.png'))

  // ============================================================
  // Export light PNG
  // ============================================================
  await page.evaluate(() => {
    document.getElementById('wordmark-dark')!.style.display = 'none'
    document.getElementById('wordmark-light')!.style.display = ''
  })

  const lightEl = page.locator('#wordmark-light')
  await page.waitForTimeout(200)

  const lightPngPath = path.resolve(IMAGES_DIR, 'wordmark-light.png')
  await lightEl.screenshot({ path: lightPngPath, omitBackground: true })
  console.log(`Exported ${lightPngPath}`)
  fs.copyFileSync(lightPngPath, path.resolve(BRAND_DIR, 'wordmark-light.png'))

  // ============================================================
  // Build SVG files with embedded font
  // ============================================================
  const fontB64 = fs.readFileSync('C:/tmp/sora-700-latin-b64.txt', 'utf-8').trim()

  const svgW = Math.ceil(metrics.fullWidth)
  const svgH = Math.ceil(metrics.totalHeight)

  // iStem serif clip: remove top-left 25% x 35% of the i-stem bounding box
  const clipX = metrics.iStem.x
  const clipY = metrics.iStem.y
  const clipW = metrics.iStem.w * 0.25
  const clipH = metrics.iStem.h * 0.35

  for (const variant of ['dark', 'light'] as const) {
    const textColor = variant === 'dark' ? '#f0f0f0' : '#0a0a0a'

    // We'll use a single text element with dotless-i (ı = U+0131)
    // and a mask to remove the serif flare from the i-stem.
    // The baseline is estimated from the rendered element's first span position.
    // Sora 700 has ascent ~0.928 of font-size. At 120px with 30px padding-top,
    // baseline is roughly at paddingTop + fontSize * ascent = 30 + 120*0.928 = 141.36
    // But we'll compute it more precisely from the span positions.
    // The text "chr" span starts at y=30 (paddingTop) and has height ~88px at 120px font.
    // Baseline = spanTop + spanHeight * 0.85 (approximate for Sora)
    const span0 = metrics.spans[0] // "chr"
    const baseline = span0.y + span0.h * 0.85

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgW} ${svgH}" width="${svgW}" height="${svgH}">
  <defs>
    <style>
      @font-face {
        font-family: 'Sora';
        font-style: normal;
        font-weight: 700;
        src: url(data:font/woff2;base64,${fontB64}) format('woff2');
      }
    </style>
    <mask id="serif-mask">
      <rect x="0" y="0" width="${svgW}" height="${svgH}" fill="white"/>
      <rect x="${clipX.toFixed(1)}" y="${clipY.toFixed(1)}" width="${clipW.toFixed(1)}" height="${clipH.toFixed(1)}" fill="black"/>
    </mask>
  </defs>
  <text
    x="${(span0.x).toFixed(1)}"
    y="${baseline.toFixed(1)}"
    font-family="'Sora', sans-serif"
    font-weight="700"
    font-size="120"
    letter-spacing="-1"
    fill="${textColor}"
    mask="url(#serif-mask)"
  >chr\u0131s hornak</text>
  <circle cx="${metrics.dotCx.toFixed(1)}" cy="${metrics.dotCy.toFixed(1)}" r="${metrics.dotR.toFixed(1)}" fill="#2dd4a8"/>
</svg>`

    const svgPath = path.resolve(BRAND_DIR, `wordmark-${variant}.svg`)
    fs.writeFileSync(svgPath, svg)
    console.log(`Exported ${svgPath}`)
  }

  await browser.close()
  console.log('\nDone! All wordmarks exported.')
}

exportWordmarks().catch(console.error)
