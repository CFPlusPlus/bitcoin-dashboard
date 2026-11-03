import { test, expect } from './fixtures'
import { marketHistory } from '../src/test/market-history-fixtures'
import { MARKET_TEST_NOW, marketSnapshot } from '../src/test/market-fixtures'
import { historyDays, marketCurrency } from '../shared/market-validation'

for (const theme of ['dark', 'light'] as const) {
  test(`historical chart in ${theme}: all ranges, common fiat, cache and responsive layout`, async ({
    page,
  }) => {
    await page.clock.install({ time: MARKET_TEST_NOW })
    await page.addInitScript((value) => localStorage.setItem('theme', value), theme)
    let historyCalls = 0
    let snapshotCalls = 0
    await page.route('**/api/market/snapshot', (route) => {
      snapshotCalls++
      return route.fulfill({ json: marketSnapshot(MARKET_TEST_NOW) })
    })
    await page.route('**/api/market/history?**', (route) => {
      historyCalls++
      const url = new URL(route.request().url())
      return route.fulfill({
        json: marketHistory(
          MARKET_TEST_NOW,
          historyDays(Number(url.searchParams.get('days'))),
          marketCurrency(url.searchParams.get('currency')),
        ),
      })
    })
    await page.goto('/market')
    const chart = page.locator('.market-history')
    await expect(chart.locator('canvas')).toBeVisible()
    await expect(chart.getByRole('button', { name: '30 T', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    for (const [days, label] of [
      [1, '24 h'],
      [7, '7 T'],
      [90, '90 T'],
      [365, '1 J'],
    ] as const) {
      const button = chart.getByRole('button', { name: label, exact: true })
      await button.focus()
      await page.keyboard.press('Enter')
      await expect(
        chart.getByRole('img', {
          name: `Bitcoin-Kursverlauf in USD · ${days} ${days === 1 ? 'Tag' : 'Tage'}`,
        }),
      ).toBeVisible()
      await expect(button).toHaveAttribute('aria-pressed', 'true')
    }
    await chart.getByRole('button', { name: '30 T', exact: true }).click()
    await expect(chart.getByRole('img', { name: /USD · 30 Tage/ })).toBeVisible()
    expect(historyCalls).toBe(5)
    await page.getByRole('combobox', { name: 'Währung' }).selectOption('eur')
    await expect(chart.getByRole('img', { name: /EUR · 30 Tage/ })).toBeVisible()
    await expect(page.getByLabel(/Bitcoin-Kurs: 72\.000,00/)).toBeVisible()
    expect(snapshotCalls).toBe(1)
    expect(historyCalls).toBe(6)
    for (const width of [1440, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 })
      await expect(chart.locator('canvas')).toBeVisible()
      await expect
        .poll(() =>
          chart
            .locator('canvas')
            .evaluate(
              (canvas) =>
                canvas.getBoundingClientRect().width <=
                canvas.closest('.market-chart-canvas')!.clientWidth,
            ),
        )
        .toBe(true)
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
        .toBe(true)
      await page.screenshot({
        path: `test-results/phase-2.8/history-${width}-${theme}.png`,
        fullPage: true,
      })
    }
    await page
      .getByRole('button', {
        name: theme === 'dark' ? 'Light Mode aktivieren' : 'Dark Mode aktivieren',
      })
      .click()
    await expect(chart.locator('canvas')).toBeVisible()
    expect(historyCalls).toBe(6)
  })
}

test.describe('history refresh failure', () => {
  test.use({ apiStatus: 502 })
  test('a new currency waits for its own data; refresh failure retains the matching history', async ({
    page,
  }) => {
    await page.clock.install({ time: MARKET_TEST_NOW })
    let release: (() => void) | undefined
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    let fail = false
    await page.route('**/api/market/history?**', async (route) => {
      const url = new URL(route.request().url())
      const currency = marketCurrency(url.searchParams.get('currency'))
      if (currency === 'eur') await gate
      if (fail)
        return route.fulfill({
          status: 502,
          json: { error: { code: 'UPSTREAM_INVALID_RESPONSE' } },
        })
      return route.fulfill({ json: marketHistory(MARKET_TEST_NOW, 30, currency) })
    })
    await page.goto('/market')
    const chart = page.locator('.market-history')
    await expect(chart.getByRole('img', { name: /USD/ })).toBeVisible()
    await page.getByRole('combobox', { name: 'Währung' }).selectOption('eur')
    await expect(chart.getByText('Historische Kursdaten werden geladen …')).toBeVisible()
    await expect(chart.getByRole('img')).toHaveCount(0)
    release!()
    await expect(chart.getByRole('img', { name: /EUR/ })).toBeVisible()
    fail = true
    await page.clock.fastForward(60_000)
    // Avoid snapshot polling so only the intended chart refresh is involved.
    await chart.getByRole('button', { name: 'Kursverlauf aktualisieren' }).click()
    await expect(chart.getByRole('alert')).toContainText(
      'letzte gültige Kursverlauf bleibt sichtbar',
    )
    await expect(chart.getByRole('img', { name: /EUR/ })).toBeVisible()
  })
})

test.describe('shared market cooldown', () => {
  test.use({ apiStatus: 429 })
  test('a history 429 suppresses new ranges, fiat and snapshot polling', async ({ page }) => {
    await page.clock.install({ time: MARKET_TEST_NOW })
    let historyCalls = 0
    let snapshotCalls = 0
    await page.route('**/api/market/snapshot', (route) => {
      snapshotCalls++
      return route.fulfill({ json: marketSnapshot(MARKET_TEST_NOW) })
    })
    await page.route('**/api/market/history?**', (route) => {
      historyCalls++
      return route.fulfill({
        status: 429,
        json: { error: { code: 'UPSTREAM_RATE_LIMIT', retryAfterSeconds: 600 } },
      })
    })
    await page.goto('/market')
    const chart = page.locator('.market-history')
    await expect(chart.getByRole('alert')).toContainText('Abruflimit')
    await chart.getByRole('button', { name: '7 T', exact: true }).click()
    await page.getByRole('combobox', { name: 'Währung' }).selectOption('eur')
    await page.clock.fastForward(599_000)
    expect(historyCalls).toBe(1)
    expect(snapshotCalls).toBe(1)
    await expect(chart.getByRole('button', { name: 'Kursverlauf aktualisieren' })).toBeDisabled()
    await expect(page.getByRole('button', { name: 'Aktualisieren', exact: true })).toBeDisabled()
  })
})
