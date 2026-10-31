import { test, expect } from './fixtures'
import { marketSnapshot, MARKET_TEST_NOW } from '../src/test/market-fixtures'

for (const theme of ['dark', 'light'] as const) {
  for (const width of [1440, 1920, 768, 390, 320]) {
    test(`market snapshot ${width} ${theme}: real React, both fiat currencies and reflow`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 1000 })
      await page.addInitScript((value) => localStorage.setItem('theme', value), theme)
      let calls = 0
      await page.route('**/api/market/snapshot', (route) => {
        calls++
        return route.fulfill({ json: marketSnapshot(MARKET_TEST_NOW) })
      })
      await page.clock.install({ time: MARKET_TEST_NOW })
      await page.goto('/market')
      await expect(page.getByLabel(/Bitcoin-Kurs: 80\.000,00/)).toBeVisible()
      await expect(page.getByText('Synthetische Demo-Daten')).toBeVisible()
      await expect(page.getByText('Chart-Vorschau · Index statt Kurswerten')).toBeVisible()
      const currency = page.getByRole('combobox', { name: 'Währung' })
      await currency.focus()
      await page.keyboard.press('ArrowDown')
      await page.keyboard.press('Enter')
      await expect(currency).toHaveValue('eur')
      await expect(currency).toBeFocused()
      await expect(page.getByLabel(/Bitcoin-Kurs: 72\.000,00/)).toBeVisible()
      await expect(page.getByLabel(/Marktkapitalisierung: 1\.440\.000\.000\.000,00/)).toBeVisible()
      await expect(page.getByText('+1,25 %', { exact: true })).toBeVisible()
      await expect(page.locator('time[datetime="2026-02-01T12:00:00.000Z"]')).toBeVisible()
      await expect(page.getByRole('link', { name: 'Powered by CoinGecko' })).toHaveAttribute(
        'href',
        'https://www.coingecko.com/en/api/',
      )
      await page.evaluate(() => document.fonts.ready)
      await expect(page.locator('canvas').first()).toBeVisible()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      )
      expect(calls).toBe(1)
      await page.screenshot({
        path: `docs/screenshots/phase-2.7/market-${width}-${theme}.png`,
        fullPage: true,
      })
    })
  }
  test(`market 200 percent text at 320px ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 844 })
    await page.addInitScript((value) => localStorage.setItem('theme', value), theme)
    await page.route('**/api/market/snapshot', (route) =>
      route.fulfill({ json: marketSnapshot(MARKET_TEST_NOW) }),
    )
    await page.clock.install({ time: MARKET_TEST_NOW })
    await page.goto('/market')
    await expect(page.getByLabel(/Bitcoin-Kurs: 80\.000,00/)).toBeVisible()
    await page.addStyleTag({ content: 'html { font-size: 200% !important; }' })
    const panel = await page.locator('.market-snapshot').boundingBox()
    for (const control of await page
      .locator('.market-controls select, .market-controls button')
      .all()) {
      const box = await control.boundingBox()
      expect(box!.x + box!.width).toBeLessThanOrEqual(panel!.x + panel!.width)
    }
    await expect(page.locator('canvas').first()).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.screenshot({
      path: `docs/screenshots/phase-2.7/market-320-text-200-${theme}.png`,
      fullPage: true,
    })
  })
}

test('market keyboard refresh and inactive route budget', async ({ page }) => {
  let calls = 0
  await page.clock.install({ time: MARKET_TEST_NOW })
  await page.route('**/api/market/snapshot', (route) => {
    calls++
    return route.fulfill({ json: marketSnapshot(MARKET_TEST_NOW) })
  })
  await page.goto('/market')
  await expect(page.getByLabel(/Bitcoin-Kurs: 80\.000,00/)).toBeVisible()
  await page.clock.fastForward(60_000)
  const button = page.getByRole('button', { name: 'Aktualisieren', exact: true })
  await expect(button).toBeEnabled()
  await button.focus()
  await page.keyboard.press('Enter')
  await expect(button).toBeDisabled()
  expect(calls).toBe(2)
  await page
    .getByRole('navigation')
    .getByRole('link', { name: 'Netzwerk & Mining', exact: true })
    .click()
  await page.clock.fastForward(6 * 60_000)
  expect(calls).toBe(2)
  await page.getByRole('navigation').getByRole('link', { name: 'Markt', exact: true }).click()
  await expect.poll(() => calls).toBe(3)
})

for (const state of ['loading', 'error', 'stale', 'cooldown', 'not-released'] as const) {
  test.describe(`market ${state}`, () => {
    test.use({
      apiStatus:
        state === 'error' ? 502 : state === 'cooldown' ? 429 : state === 'not-released' ? 503 : 200,
    })
    for (const theme of ['dark', 'light'] as const) {
      test(`visible and accessible ${theme}`, async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 })
        await page.addInitScript((value) => localStorage.setItem('theme', value), theme)
        await page.clock.install({ time: MARKET_TEST_NOW })
        let calls = 0
        await page.route('**/api/market/snapshot', async (route) => {
          calls++
          if (state === 'loading') return
          if (state === 'error')
            return route.fulfill({
              status: 502,
              json: { error: { code: 'UPSTREAM_INVALID_RESPONSE' } },
            })
          if (state === 'not-released')
            return route.fulfill({ status: 503, json: { error: { code: 'MARKET_NOT_RELEASED' } } })
          if (state === 'cooldown')
            return route.fulfill({
              status: 429,
              json: { error: { code: 'UPSTREAM_RATE_LIMIT', retryAfterSeconds: 600 } },
              headers: { 'Retry-After': '600' },
            })
          return route.fulfill({ json: marketSnapshot(MARKET_TEST_NOW - 20 * 60_000) })
        })
        await page.goto('/market')
        if (state === 'loading')
          await expect(page.getByRole('status').first()).toContainText('Marktdaten werden geladen')
        else if (state === 'stale') {
          await expect(page.getByText('Veraltet · Letzter erfolgreicher Snapshot')).toBeVisible()
          await expect(page.getByText(/Marktquellstand ist mindestens/)).toBeVisible()
        } else await expect(page.getByRole('alert')).toBeVisible()
        if (state !== 'stale')
          await expect(page.getByLabel('Bitcoin-Kurs: —', { exact: true })).toBeVisible()
        if (state === 'cooldown') {
          await expect(
            page.getByRole('button', { name: 'Aktualisieren', exact: true }),
          ).toBeDisabled()
          await page
            .getByRole('navigation')
            .getByRole('link', { name: 'Markt', exact: true })
            .click()
          await page.clock.fastForward(599_000)
          expect(calls).toBe(1)
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        )
        await expect(page.locator('canvas').first()).toBeVisible()
        await page.screenshot({
          path: `docs/screenshots/phase-2.7/market-${state}-390-${theme}.png`,
          fullPage: true,
        })
      })
    }
  })
}

test.describe('market refresh failure', () => {
  test.use({ apiStatus: 502 })
  test('keeps the successful values and timestamps and recovers with keyboard refresh', async ({
    page,
  }) => {
    await page.clock.install({ time: MARKET_TEST_NOW })
    let calls = 0
    await page.route('**/api/market/snapshot', (route) => {
      calls++
      return calls === 2
        ? route.fulfill({ status: 502, json: { error: { code: 'UPSTREAM_INVALID_RESPONSE' } } })
        : route.fulfill({ json: marketSnapshot(MARKET_TEST_NOW) })
    })
    await page.goto('/market')
    await expect(page.getByLabel(/Bitcoin-Kurs: 80\.000,00/)).toBeVisible()
    const button = page.getByRole('button', { name: 'Aktualisieren', exact: true })
    await page.clock.fastForward(60_000)
    await button.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('alert')).toContainText(
      'letzte erfolgreiche Snapshot bleibt sichtbar',
    )
    await expect(page.getByLabel(/Bitcoin-Kurs: 80\.000,00/)).toBeVisible()
    await expect(page.locator('time[datetime="2026-10-31T10:00:00.000Z"]')).toBeVisible()
    await page.clock.fastForward(60_000)
    await button.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('alert')).toHaveCount(0)
    expect(calls).toBe(3)
  })
})
