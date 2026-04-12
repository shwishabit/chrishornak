import { chromium } from '@playwright/test'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

interface Metrics {
  chrWidth: number
  iWidth: number
  fullWidth: number
  totalHeight: number
  fontSize: number
  dotCx: number
  dotCy: number
  dotR: number
  paddingTop: number
  paddingLeft: number
  bbox: { x: number; y: number; width: number; height: number }
}

async function exportWordmarks() {
  const browser = await chromium.launch()
  // Use 3x DPI for crisp PNGs at small display sizes (h-10 = 40px in nav)
  const context = await browser.newContext({ deviceScaleFactor: 3 })
  const page = await context.newPage()

  const htmlPath = `file://${path.resolve(__dirname, 'wordmark-export.html').replace(/\\/g, '/')}`
  await page.goto(htmlPath, { waitUntil: 'networkidle' })

  // Wait for Sora font to load
  await page.waitForFunction(() => document.fonts.check('700 120px Sora'))
  await page.waitForTimeout(500)

  // ============================================================
  // STEP 1: Fine-tune the dot position and clip interactively
  // ============================================================
  // Get measurements from the rendered text
  const metrics = await page.evaluate((): Metrics => {
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

    return {
      chrWidth: iWrapRect.left - wmRect.left,
      iWidth: iWrapRect.width,
      fullWidth: wmRect.width,
      totalHeight: wmRect.height,
      fontSize: 120,
      dotCx,
      dotCy,
      dotR,
      paddingTop: 30,
      paddingLeft: 4,
      bbox: {
        x: wmRect.x,
        y: wmRect.y,
        width: wmRect.width,
        height: wmRect.height,
      },
    }
  })

  console.log('Metrics:', JSON.stringify(metrics, null, 2))

  // ============================================================
  // STEP 2: Export dark PNG
  // ============================================================
  const darkEl = page.locator('#wordmark-dark')

  // Ensure only dark is visible
  await page.evaluate(() => {
    document.getElementById('wordmark-dark')!.style.display = ''
    document.getElementById('wordmark-light')!.style.display = 'none'
  })

  const darkPngPath = path.resolve(__dirname, '..', 'site', 'public', 'images', 'wordmark-dark.png')
  await darkEl.screenshot({
    path: darkPngPath,
    omitBackground: true,
  })
  console.log(`Exported ${darkPngPath}`)

  // Also save to brand folder
  const darkPngBrand = path.resolve(__dirname, 'wordmark-dark.png')
  fs.copyFileSync(darkPngPath, darkPngBrand)

  // ============================================================
  // STEP 3: Export light PNG
  // ============================================================
  await page.evaluate(() => {
    document.getElementById('wordmark-dark')!.style.display = 'none'
    document.getElementById('wordmark-light')!.style.display = ''
  })

  const lightEl = page.locator('#wordmark-light')
  await page.waitForTimeout(200)

  const lightPngPath = path.resolve(__dirname, '..', 'site', 'public', 'images', 'wordmark-light.png')
  await lightEl.screenshot({
    path: lightPngPath,
    omitBackground: true,
  })
  console.log(`Exported ${lightPngPath}`)

  // Also save to brand folder
  const lightPngBrand = path.resolve(__dirname, 'wordmark-light.png')
  fs.copyFileSync(lightPngPath, lightPngBrand)

  // ============================================================
  // STEP 4: Build SVG files with embedded font
  // ============================================================
  // Read the base64 woff2 font
  const fontB64 = fs.readFileSync('/tmp/sora-700-latin-b64.txt', 'utf-8').trim()

  // Calculate SVG viewBox dimensions from metrics
  // We use a normalized coordinate system based on actual rendered size
  const svgWidth = Math.ceil(metrics.fullWidth)
  const svgHeight = Math.ceil(metrics.totalHeight)

  // We need the dotless-i positions for SVG clipping
  // In SVG we'll use <text> with embedded font and a <clipPath> on the "i" glyph area
  // But since SVG <text> doesn't allow per-character clipping easily,
  // we'll use a different strategy:
  // 1. Render "chr" then dotless-i then "s hornak" as separate <text> elements
  // 2. Clip the dotless-i area
  // 3. Add teal circle

  // Get exact character positions
  const charPositions = await page.evaluate(() => {
    // Restore dark for measurements
    document.getElementById('wordmark-dark')!.style.display = ''
    document.getElementById('wordmark-light')!.style.display = 'none'

    const wm = document.getElementById('wordmark-dark')!
    const spans = wm.querySelectorAll(':scope > span')
    const wmRect = wm.getBoundingClientRect()

    const positions: Array<{ text: string; x: number; y: number; width: number; height: number }> = []
    spans.forEach((span) => {
      const rect = span.getBoundingClientRect()
      positions.push({
        text: span.textContent || '',
        x: rect.left - wmRect.left,
        y: rect.top - wmRect.top,
        width: rect.width,
        height: rect.height,
      })
    })

    // Get the i-stem specifically
    const iStem = wm.querySelector('.i-stem')! as HTMLElement
    const iStemRect = iStem.getBoundingClientRect()

    // Get computed baseline: distance from top of element to text baseline
    // We can estimate this from the font metrics
    // For Sora 700 at 120px, the ascent is roughly 0.83 * fontSize
    const baseline = 120 * 0.93 + 30 // fontSize * ascent-ratio + paddingTop

    return {
      spans: positions,
      iStem: {
        x: iStemRect.left - wmRect.left,
        y: iStemRect.top - wmRect.top,
        width: iStemRect.width,
        height: iStemRect.height,
      },
      baseline,
    }
  })

  console.log('Char positions:', JSON.stringify(charPositions, null, 2))

  // Build SVG for each variant
  for (const variant of ['dark', 'light'] as const) {
    const textColor = variant === 'dark' ? '#f0f0f0' : '#0a0a0a'

    // SVG approach: use a single <text> element with dotless-i,
    // clip the top-left serif area, and overlay a teal circle
    const iStem = charPositions.iStem

    // The clip rect covers the serif area of the dotless-i
    // We remove the top-left portion (25% width, 35% height from top-left)
    const clipX = iStem.x
    const clipY = iStem.y
    const clipW = iStem.width * 0.25
    const clipH = iStem.height * 0.35

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgWidth} ${svgHeight}" width="${svgWidth}" height="${svgHeight}">
  <defs>
    <style>
      @font-face {
        font-family: 'Sora';
        font-style: normal;
        font-weight: 700;
        src: url(data:font/woff2;base64,${fontB64}) format('woff2');
      }
    </style>
    <!-- Clip path to remove the serif/flare on the dotless-i -->
    <!-- This clips out a rectangle at the top-left of the i-stem area -->
    <clipPath id="i-clip">
      <!-- Full SVG area minus the serif region -->
      <rect x="0" y="0" width="${svgWidth}" height="${svgHeight}"/>
    </clipPath>
    <!-- Mask to hide the i-stem serif: covers everything except the serif area -->
    <mask id="i-mask">
      <!-- White = visible -->
      <rect x="0" y="0" width="${svgWidth}" height="${svgHeight}" fill="white"/>
      <!-- Black = hidden: the serif area -->
      <rect x="${clipX}" y="${clipY}" width="${clipW}" height="${clipH}" fill="black"/>
    </mask>
  </defs>
  <!-- Text with mask applied to remove i-stem serif -->
  <text
    x="${metrics.paddingLeft}"
    y="${charPositions.baseline}"
    font-family="'Sora', sans-serif"
    font-weight="700"
    font-size="120"
    letter-spacing="-1"
    fill="${textColor}"
    mask="url(#i-mask)"
  >chr\u0131s hornak</text>
  <!-- Teal dot centered above i-stem -->
  <circle cx="${metrics.dotCx}" cy="${metrics.dotCy}" r="${metrics.dotR}" fill="#2dd4a8"/>
</svg>`

    const svgPath = path.resolve(__dirname, `wordmark-${variant}.svg`)
    fs.writeFileSync(svgPath, svg)
    console.log(`Exported ${svgPath}`)
  }

  await browser.close()
  console.log('\nDone! All wordmarks exported.')
}

exportWordmarks().catch(console.error)
