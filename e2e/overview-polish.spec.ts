import type { Page } from '@playwright/test'
import { test, expect } from './fixtures'
import { hashrateFixture } from '../src/test/kraken-fixtures'
import { marketSnapshot } from '../src/test/market-fixtures'

const now = Date.parse('2026-11-13T09:00:00Z')
test.use({ timezoneId: 'Europe/Berlin' })

async function caption(page: Page, state = 'Prüfdaten') {
  await page.evaluate((state) => {
    const caption = document.createElement('p')
    caption.textContent = `Testfixture OV-211 · synthetische ${state} · kein Live-Nachweis`
    caption.style.cssText = 'padding:8px 0;font-size:12px;color:var(--foreground-secondary)'
    document.querySelector('main')!.prepend(caption)
  }, state)
}

async function alignedMetrics(page: Page) {
  const geometry = await page.locator('.overview-metric').evaluateAll((cards) =>
    cards.map((card) => {
      const box = card.getBoundingClientRect()
      return {
        top: box.top,
        bottom: box.bottom,
        width: box.width,
        value: card.querySelector('.overview-network-value')!.getBoundingClientRect().top,
        footer: card.querySelector('.overview-metric-footer')!.getBoundingClientRect().top,
      }
    }),
  )
  for (const top of new Set(geometry.map((box) => box.top))) {
    const row = geometry.filter((box) => box.top === top)
    for (const key of ['bottom', 'width', 'value', 'footer'] as const)
      expect(
        Math.max(...row.map((box) => box[key])) - Math.min(...row.map((box) => box[key])),
      ).toBeLessThanOrEqual(1)
  }
}

for (const theme of ['dark', 'light'] as const) {
  for (const width of [320, 390, 768, 1024, 1440, 1920]) {
    test(`overview polish ${width}px ${theme}: readable values and text enlargement`, async ({
      page,
    }) => {
      await page.clock.install({ time: now })
      await page.setViewportSize({ width, height: 900 })
      await page.addInitScript((value) => localStorage.setItem('theme', value), theme)
      await page.goto('/')
      await expect(page.locator('canvas')).toBeVisible()
      await expect(page.getByText('Schätzwert verfügbar')).toBeVisible()
      await page.evaluate(() => document.fonts.ready)
      await caption(page)
      if ([390, 1440].includes(width))
        await page.screenshot({
          path: `docs/screenshots/phase-2.11/overview-${width}-${theme}-fixture.png`,
          fullPage: true,
        })
      for (const size of ['100%', '200%']) {
        await page.evaluate((size) => {
          document.documentElement.style.fontSize = size
        }, size)
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
          width,
        )
        await alignedMetrics(page)
        const values = await page.locator('.overview-value-number').evaluateAll((values) =>
          values.map((value) => {
            const range = document.createRange()
            range.selectNodeContents(value)
            return {
              text: value.textContent,
              lines: range.getClientRects().length,
              fits: value.scrollWidth <= value.clientWidth + 1,
            }
          }),
        )
        for (const value of values) {
          expect(value.lines, `${width}px ${size}: ${value.text}`).toBe(1)
          expect(value.fits).toBe(true)
        }
        if (width === 320 && size === '200%')
          await page.screenshot({
            path: `docs/screenshots/phase-2.11/overview-320-text-200-${theme}-fixture.png`,
            fullPage: true,
          })
      }
      await page.emulateMedia({ reducedMotion: 'reduce' })
      expect(
        await page
          .locator('.soft-price')
          .first()
          .evaluate((el) => el.getAnimations({ subtree: true }).length),
      ).toBe(0)
      const select = page.getByRole('combobox', { name: 'Marktkennzahlen & Chart' })
      await select.focus()
      await expect(select).toBeFocused()
      expect(await select.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe('solid')
      await select.selectOption('usd')
      await expect(page.getByRole('img', { name: /USD · 30 Tage/ })).toBeVisible()
      await expect(page.locator('.overview-market .overview-unit')).toHaveText(['USD', 'USD'])
      await page.getByRole('button', { name: '24 h', exact: true }).focus()
      await page.keyboard.press('Tab')
      const week = page.getByRole('button', { name: '7 T', exact: true })
      await expect(week).toBeFocused()
      await page.keyboard.press('Enter')
      await expect(week).toHaveAttribute('aria-pressed', 'true')
      await expect(page.getByRole('img', { name: /USD · 7 Tage/ })).toBeVisible()
    })
  }
  test(`overview long valid hashrate ${theme}: full precision without clipping`, async ({
    page,
  }) => {
    await page.clock.install({ time: now })
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.addInitScript((value) => localStorage.setItem('theme', value), theme)
    await page.route('**/api/mining/hashrate', (route) =>
      route.fulfill({
        json: {
          ...hashrateFixture(now),
          data: { hashesPerSecond: 1e30, estimationBlocks: 1008, unit: 'H/s' },
        },
      }),
    )
    await page.goto('/')
    await expect(page.getByText('Schätzwert verfügbar')).toBeVisible()
    const number = page.locator('.overview-hashrate .overview-value-number')
    await expect(number).toHaveText('1.000.000.000.000,00')
    for (const width of [320, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      for (const size of ['100%', '200%']) {
        await page.evaluate((size) => {
          document.documentElement.style.fontSize = size
        }, size)
        expect(await number.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true)
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
          width,
        )
        await alignedMetrics(page)
      }
    }
  })

  test(`overview ${theme}: loading slots retain chart space and halving detail position`, async ({
    page,
  }) => {
    await page.clock.install({ time: now })
    await page.setViewportSize({ width: 390, height: 900 })
    await page.addInitScript((value) => localStorage.setItem('theme', value), theme)
    let release!: () => void
    const waiting = new Promise<void>((resolve) => {
      release = resolve
    })
    await page.route('**/api/**', async (route) => {
      await waiting
      await route.fallback()
    })
    await page.goto('/')
    const placeholder = page.locator('.market-history .chart-placeholder')
    await expect(placeholder).toBeVisible()
    await expect(page.getByRole('progressbar')).toHaveCount(0)
    const beforeChart = await placeholder.boundingBox()
    const beforeFacts = await page.locator('.overview-facts').boundingBox()
    const beforeHalving = await page.locator('.overview-halving').boundingBox()
    await alignedMetrics(page)
    release()
    await expect(page.locator('canvas')).toBeVisible()
    await expect(page.getByRole('progressbar')).toBeVisible()
    const afterChart = await page.locator('.market-chart-canvas').boundingBox()
    const afterFacts = await page.locator('.overview-facts').boundingBox()
    expect(afterChart?.height).toBe(beforeChart?.height)
    // Compare the offset within the halving card; preceding content may gain timestamps.
    expect(afterFacts!.y - (await page.locator('.overview-halving').boundingBox())!.y).toBe(
      beforeFacts!.y - beforeHalving!.y,
    )
  })

  test(`overview ${theme}: stale and invalid states remain visible with aligned footers`, async ({
    page,
  }) => {
    await page.clock.install({ time: now })
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.addInitScript((value) => localStorage.setItem('theme', value), theme)
    await page.route('**/api/market/snapshot', (route) =>
      route.fulfill({ json: marketSnapshot(now - 3600000) }),
    )
    await page.route('**/api/mining/hashrate', (route) =>
      route.fulfill({ json: hashrateFixture(now - 3600000) }),
    )
    await page.goto('/')
    await expect(page.locator('.overview-market [data-state="stale"]')).toHaveCount(2)
    await expect(page.locator('.overview-hashrate [data-state="stale"]')).toContainText('Veraltet')
    await alignedMetrics(page)
    await caption(page, 'veraltete Daten')
    await page.screenshot({
      path: `docs/screenshots/phase-2.11/overview-stale-${theme}-fixture.png`,
      fullPage: true,
    })
    await page.route('**/api/**', (route) => route.fulfill({ json: { invalid: true } }))
    await page.reload()
    await expect(page.locator('.overview-metric').getByRole('alert')).toHaveCount(5)
    await expect(page.locator('.overview-market .overview-value-number')).toHaveText(['—', '—'])
    await alignedMetrics(page)
    await page.setViewportSize({ width: 320, height: 900 })
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%'
    })
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320)
    await expect(page.locator('.overview-metric').getByRole('alert')).toHaveCount(5)
    await caption(page, 'Fehlerdaten · 200 % Text')
    await page.screenshot({
      path: `docs/screenshots/phase-2.11/overview-error-320-text-200-${theme}-fixture.png`,
      fullPage: true,
    })
  })

  test(`overview ${theme}: offline pauses are explicit and semantic text colors meet AA`, async ({
    page,
    context,
  }) => {
    await page.clock.install({ time: now })
    await page.addInitScript((value) => localStorage.setItem('theme', value), theme)
    await page.goto('/')
    await expect(page.locator('canvas')).toBeVisible()
    await expect(page.getByText('Schätzwert verfügbar')).toBeVisible()
    const contrast = await page.locator('.overview-hashrate').evaluate((el) => {
      const css = getComputedStyle(el)
      const luminance = (name: string) => {
        const token = css.getPropertyValue(name).trim().slice(1)
        const hex = token.length === 3 ? [...token].map((digit) => digit + digit).join('') : token
        const rgb = [0, 2, 4]
          .map((start) => parseInt(hex.slice(start, start + 2), 16) / 255)
          .map((value) => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4))
        return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722
      }
      const background = luminance('--surface')
      return ['--foreground', '--foreground-secondary', '--warning'].map((name) => {
        const color = luminance(name)
        return (Math.max(color, background) + 0.05) / (Math.min(color, background) + 0.05)
      })
    })
    for (const ratio of contrast) expect(ratio).toBeGreaterThanOrEqual(4.5)
    await context.setOffline(true)
    await page.clock.runFor(16 * 60000)
    for (const selector of [
      '.overview-market',
      '.overview-hashrate',
      '.overview-halving',
      '.overview-mempool',
    ])
      await expect(page.locator(selector).first()).toContainText('Offline')
    await expect(page.locator('.overview-metric').filter({ hasText: 'Blockhöhe' })).toContainText(
      'Offline',
    )
    await expect(page.locator('.overview-metric').filter({ hasText: 'Gebühren' })).toContainText(
      'Offline',
    )
    await expect(page.locator('.overview-connection')).toContainText('Offline')
    await expect(page.locator('.overview-hashrate .overview-value-number')).toHaveText('1.050,00')
  })
}
