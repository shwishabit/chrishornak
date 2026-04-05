import { chromium } from '@playwright/test'
import path from 'path'

async function measureISerif() {
  const browser = await chromium.launch()
  const context = await browser.newContext({ deviceScaleFactor: 4 })
  const page = await context.newPage()

  // Create a simple HTML to render just the dotless-i at large size for measurement
  await page.setContent(`
    <html>
    <head>
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@700&display=swap" rel="stylesheet">
      <style>
        * { margin: 0; padding: 0; }
        body { background: white; padding: 40px; font-family: 'Sora', sans-serif; }
        .test {
          font-size: 200px;
          font-weight: 700;
          color: #000;
          line-height: 1;
          display: inline-block;
          background: #eee;
        }
        .i-only {
          font-size: 200px;
          font-weight: 700;
          color: #000;
          line-height: 1;
          display: inline-block;
          background: #eee;
          margin-left: 40px;
        }
        /* Show the actual painted pixels by coloring bg differently */
        .context {
          font-size: 200px;
          font-weight: 700;
          color: #000;
          line-height: 1;
          display: inline-block;
          background: #fdd;
          margin-left: 40px;
        }
      </style>
    </head>
    <body>
      <div>
        <span class="test" id="dotless">ı</span>
        <span class="i-only" id="regular">i</span>
        <span class="context" id="ctx">rıs</span>
      </div>
    </body>
    </html>
  `)

  await page.waitForFunction(() => document.fonts.check('700 200px Sora'))
  await page.waitForTimeout(1000)

  // Take screenshot
  await page.screenshot({
    path: path.resolve(__dirname, '..', '..', 'brand', 'i-serif-measure.png'),
    fullPage: true,
  })

  // Now measure the exact glyph metrics using canvas
  const measurements = await page.evaluate(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 400
    canvas.height = 400
    const ctx = canvas.getContext('2d')!
    ctx.font = '700 200px Sora'
    ctx.fillStyle = '#000'

    // Measure text bounding box
    const mDotless = ctx.measureText('ı')
    const mRegular = ctx.measureText('i')
    const mR = ctx.measureText('r')

    return {
      dotless: {
        width: mDotless.width,
        actualBoundingBoxAscent: mDotless.actualBoundingBoxAscent,
        actualBoundingBoxDescent: mDotless.actualBoundingBoxDescent,
        actualBoundingBoxLeft: mDotless.actualBoundingBoxLeft,
        actualBoundingBoxRight: mDotless.actualBoundingBoxRight,
      },
      regular: {
        width: mRegular.width,
        actualBoundingBoxAscent: mRegular.actualBoundingBoxAscent,
        actualBoundingBoxDescent: mRegular.actualBoundingBoxDescent,
        actualBoundingBoxLeft: mRegular.actualBoundingBoxLeft,
        actualBoundingBoxRight: mRegular.actualBoundingBoxRight,
      },
      r: {
        width: mR.width,
        actualBoundingBoxAscent: mR.actualBoundingBoxAscent,
        actualBoundingBoxDescent: mR.actualBoundingBoxDescent,
      },
    }
  })

  console.log('Measurements:', JSON.stringify(measurements, null, 2))

  // The key metrics:
  // - actualBoundingBoxAscent tells us how far above the baseline the glyph extends
  // - For dotless-i, this includes the serif flare
  // - For comparison, 'r' should have a similar x-height without the serif

  await browser.close()
}

measureISerif().catch(console.error)
