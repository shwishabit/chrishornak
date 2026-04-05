import { test } from '@playwright/test'

const viewports = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 900 },
]

const pages = [
  { name: 'home', path: '/' },
  { name: 'audit', path: '/audit' },
  { name: 'privacy', path: '/privacy' },
]

const sections = ['about', 'services', 'work', 'connect']

// Scroll through the entire page to trigger all whileInView animations
async function triggerAllAnimations(page: any) {
  const height = await page.evaluate(() => document.body.scrollHeight)
  const viewportHeight = await page.evaluate(() => window.innerHeight)
  const steps = Math.ceil(height / (viewportHeight * 0.5))
  for (let i = 0; i <= steps; i++) {
    await page.evaluate((y: number) => window.scrollTo(0, y), i * viewportHeight * 0.5)
    await page.waitForTimeout(300)
  }
  // Scroll back to top and wait for final animations to settle
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(1000)
}

for (const vp of viewports) {
  for (const pg of pages) {
    test(`${pg.name} — ${vp.name} (${vp.width}px) full page`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.goto(`http://localhost:3000${pg.path}`, { waitUntil: 'networkidle' })
      await page.waitForTimeout(1000)
      await triggerAllAnimations(page)
      await page.screenshot({
        path: `tests/screenshots/${pg.name}-${vp.name}-full.png`,
        fullPage: true,
      })
    })
  }

  // Section-level screenshots on homepage
  for (const section of sections) {
    test(`section ${section} — ${vp.name} (${vp.width}px)`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.goto('http://localhost:3000', { waitUntil: 'networkidle' })
      await page.waitForTimeout(1000)
      await triggerAllAnimations(page)
      const el = page.locator(`#${section}`)
      if (await el.isVisible()) {
        await el.scrollIntoViewIfNeeded()
        await page.waitForTimeout(800)
        await el.screenshot({
          path: `tests/screenshots/section-${section}-${vp.name}.png`,
        })
      }
    })
  }
}
