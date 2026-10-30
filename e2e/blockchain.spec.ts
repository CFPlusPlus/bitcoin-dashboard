import { test, expect } from './fixtures'
import type { Page } from '@playwright/test'
import type { BitcoinResources } from '../shared/bitcoin'
import { writeFileSync } from 'node:fs'

test.use({ timezoneId: 'Europe/Berlin' })

// BC-23: explicitly synthetic test fixtures. Never imported by production code.
const blocks = Array.from({ length: 6 }, (_, index) => ({
  hash: (900000 - index).toString(16).padStart(64, '0'),
  height: 900000 - index,
  timestamp: 1793354100 - index * 603,
  transactionCount: 2846 + index * 127,
  sizeBytes: 1543210 + index * 1037,
  weightUnits: 3993216 - index * 971,
}))
const data: BitcoinResources = {
  height: { height: 900000 },
  blocks,
  'latest-block': blocks[0],
  fees: { fastest: 6, halfHour: 4, hour: 3, economy: 2, minimum: 1 },
  mempool: {
    transactionCount: 8426,
    virtualSizeBytes: 13840000,
    totalFeeSats: 48320000,
    feeHistogram: [
      { feeRate: 0.1, virtualSizeBytes: 920000 },
      { feeRate: 1, virtualSizeBytes: 2000000 },
      { feeRate: 1.5, virtualSizeBytes: 2380000 },
      { feeRate: 2, virtualSizeBytes: 3260000 },
      { feeRate: 4, virtualSizeBytes: 2180000 },
      { feeRate: 8, virtualSizeBytes: 1480000 },
      { feeRate: 16, virtualSizeBytes: 960000 },
      { feeRate: 50, virtualSizeBytes: 660000 },
    ],
  },
}

async function fixture(page: Page) {
  const state = {
    failMempool: false,
    emptyHistogram: false,
    rollBlocks: false,
    requests: [] as string[],
  }
  await page.clock.install({ time: new Date('2026-10-30T10:00:30Z') })
  await page.route('**/api/bitcoin/*', async (route) => {
    const resource = new URL(route.request().url()).pathname
      .split('/')
      .at(-1) as keyof BitcoinResources
    state.requests.push(resource)
    const seconds = { height: '12', blocks: '11', fees: '10', mempool: '09', 'latest-block': '11' }[
      resource
    ]
    const retrievedAt = new Date(
      (await page.evaluate(() => Date.now())) - (30 - Number(seconds)) * 1000,
    ).toISOString()
    await route.fulfill({
      json:
        state.failMempool && resource === 'mempool'
          ? { error: 'BC-23 controlled invalid response' }
          : {
              data:
                state.emptyHistogram && resource === 'mempool'
                  ? { ...data.mempool, feeHistogram: [] }
                  : state.rollBlocks && resource === 'blocks'
                    ? [blocks[0]]
                    : data[resource],
              source: 'mempool.space',
              updatedAt: retrievedAt,
            },
    })
  })
  return state
}

async function ready(page: Page) {
  await page.goto('/blockchain')
  await expect(page.getByRole('button', { name: 'Block 900.000 auswählen' })).toBeVisible()
  await expect(page.getByRole('combobox')).toBeEnabled()
  await page.evaluate(() => document.fonts.ready)
}

for (const theme of ['dark', 'light']) {
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 320, height: 844 },
    { width: 1920, height: 1080 },
  ]) {
    test(`BC-23 visual reference ${viewport.width}x${viewport.height} ${theme}`, async ({
      page,
    }) => {
      const state = await fixture(page)
      await page.setViewportSize(viewport)
      await page.addInitScript((value) => localStorage.setItem('theme', value), theme)
      await ready(page)
      expect(state.requests.sort()).toEqual(['blocks', 'fees', 'height', 'mempool'])
      // Test-runner annotation, never a synthetic production data mode.
      await page.locator('.page-source').evaluate((element) => {
        element.textContent = 'Testfixture BC-23 · synthetische Daten'
      })
      await page.getByRole('combobox').selectOption('fee-1')
      await page.getByRole('combobox').blur()
      await page.mouse.move(0, 0)
      await page.evaluate(() => window.scrollTo(0, 0))
      await expect(page.getByRole('alert')).toHaveCount(0)
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        viewport.width,
      )
      const layout = await page.evaluate(() => {
        const box = (selector: string) =>
          document.querySelector(selector)!.getBoundingClientRect().toJSON()
        return {
          chart: box('.mempool-analysis'),
          network: box('.network-rail'),
          bars: [...document.querySelectorAll('.histogram-bar')].map(
            (bar) => bar.getBoundingClientRect().height,
          ),
        }
      })
      expect(layout.bars.every((height) => height > 0)).toBe(true)
      if (viewport.width <= 700) expect(layout.chart.y).toBeLessThan(layout.network.y)
      else {
        expect(layout.chart.x).toBeGreaterThan(layout.network.x)
        expect(layout.chart.y).toBe(layout.network.y)
      }
      const path = `test-results/blockchain/blockchain-${viewport.width}x${viewport.height}-${theme}`
      await page.screenshot({ path: `${path}.png` })
      writeFileSync(
        `${path}-layout.json`,
        JSON.stringify(
          {
            ...layout,
            pageHeight: await page.evaluate(() => document.documentElement.scrollHeight),
          },
          null,
          2,
        ),
      )
      if ([1440, 390].includes(viewport.width))
        await page.screenshot({ path: `${path}-full.png`, fullPage: true })
    })
  }
}

test('BC-23 keyboard, independent hover preview and selection after polling', async ({ page }) => {
  const state = await fixture(page)
  await ready(page)
  const bars = page
    .getByRole('group', { name: 'Gebührenbereiche im Histogramm' })
    .getByRole('button')
  await bars.nth(1).focus()
  await page.keyboard.press('Enter')
  await bars.nth(3).hover()
  await expect(bars.nth(1)).toHaveAttribute('aria-pressed', 'true')
  await expect(bars.nth(3)).toHaveAttribute('aria-pressed', 'false')
  await expect(page.locator('.histogram-inspection')).toContainText('Vorschau')
  await page.mouse.move(0, 0)
  await page.keyboard.press('ArrowRight')
  await expect(bars.nth(2)).toBeFocused()
  await page.keyboard.press('Enter')
  await page.clock.runFor(61_000)
  await expect
    .poll(() => state.requests.filter((resource) => resource === 'mempool').length)
    .toBe(2)
  await expect(bars.nth(2)).toHaveAttribute('aria-pressed', 'true')
  await page.keyboard.press('Escape')
  await expect(page.getByRole('combobox')).toHaveValue('')
  await page.getByRole('combobox').selectOption('fee-2')
  state.emptyHistogram = true
  await page.clock.runFor(60_000)
  await expect(page.getByText('Kein Histogrammvolumen verfügbar.')).toBeVisible()
  await expect(page.getByText(/fixierte Bereich ist nicht mehr verfügbar/)).toBeVisible()
})

test('BC-23 row selection, block rollover and independent explorer link', async ({ page }) => {
  const state = await fixture(page)
  await ready(page)
  await page.getByRole('button', { name: 'Block 899.999 auswählen' }).focus()
  await page.keyboard.press('Space')
  await expect(page.getByRole('region', { name: 'Block 899.999', exact: true })).toContainText(
    blocks[1].hash,
  )
  await expect(page).toHaveURL('/blockchain')
  await expect(page.getByRole('link', { name: 'Im Blockexplorer' })).toHaveAttribute(
    'href',
    `https://mempool.space/block/${blocks[1].hash}`,
  )
  state.rollBlocks = true
  await page.clock.runFor(61_000)
  await expect(page.getByRole('region', { name: 'Block 900.000', exact: true })).toBeVisible()
  await expect(page.getByText(/ausgewählte Block ist nicht mehr in der Liste/)).toBeVisible()
})

test('BC-23 stale mempool remains inspectable, other resources work, retry recovers', async ({
  page,
}) => {
  const state = await fixture(page)
  await page.setViewportSize({ width: 1440, height: 900 })
  await ready(page)
  await page.getByRole('combobox').selectOption('fee-1')
  state.failMempool = true
  await page.clock.runFor(61_000)
  await expect(page.getByRole('alert')).toContainText('Ungültige API-Antwort')
  await expect(page.getByRole('region', { name: 'Unbestätigter Blockspace' })).toContainText(
    'Veraltete Daten',
  )
  await expect(page.getByRole('combobox')).toHaveValue('fee-1')
  await expect(page.getByRole('button', { name: 'Block 900.000 auswählen' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Gebührenempfehlungen' })).toContainText('6 sat/vB')
  await page.locator('.page-source').evaluate((element) => {
    element.textContent = 'Testfixture BC-23 · Refreshfehler'
  })
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.screenshot({
    path: 'test-results/blockchain/blockchain-stale-dark-full.png',
    fullPage: true,
  })
  state.failMempool = false
  await page.getByRole('button', { name: 'Erneut versuchen', exact: true }).click()
  await expect(page.getByRole('alert')).toHaveCount(0)
})

test('BC-23 touch selection and enlarged text retain all information', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 320, height: 844 },
    hasTouch: true,
    reducedMotion: 'reduce',
  })
  const page = await context.newPage()
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await fixture(page)
  await ready(page)
  await page.getByRole('group').getByRole('button').nth(1).tap()
  await expect(page.getByRole('combobox')).toHaveValue('fee-1')
  await page.getByRole('button', { name: 'Block 899.999 auswählen' }).tap()
  await expect(page.getByRole('region', { name: 'Block 899.999', exact: true })).toBeVisible()
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%'
  })
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320)
  await expect(page.getByRole('combobox')).toBeVisible()
  expect(errors).toEqual([])
  await context.close()
})
