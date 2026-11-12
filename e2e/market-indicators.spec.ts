import { test, expect } from './fixtures'
import { MARKET_TEST_NOW, marketSnapshot } from '../src/test/market-fixtures'
import { dominance, fearGreed } from '../src/test/market-indicator-fixtures'

for (const theme of ['dark', 'light'] as const) {
  for (const width of [1440, 390]) {
    test.describe(`Phase 2.9 ${width} ${theme}`, () => {
      test.use({
        viewport: { width, height: 1000 },
        hasTouch: width === 390,
        isMobile: width === 390,
      })
      test('calculator, independent indicators, keyboard/touch and fixture screenshot', async ({
        page,
      }) => {
        await page.clock.install({ time: MARKET_TEST_NOW })
        await page.addInitScript((value) => localStorage.setItem('theme', value), theme)
        let snapshotCalls = 0
        let dominanceCalls = 0
        let sentimentCalls = 0
        await page.route('**/api/market/snapshot', (route) => {
          snapshotCalls++
          return route.fulfill({ json: marketSnapshot(MARKET_TEST_NOW) })
        })
        await page.route('**/api/market/dominance', (route) => {
          dominanceCalls++
          return route.fulfill({ json: dominance(MARKET_TEST_NOW) })
        })
        await page.route('**/api/market/fear-greed', (route) => {
          sentimentCalls++
          return route.fulfill({ json: fearGreed(MARKET_TEST_NOW) })
        })
        await page.goto('/market')
        const calculator = page.getByRole('region', { name: 'Sats-Rechner' })
        await expect(calculator.getByText('0,00138889', { exact: true })).toBeVisible()
        await expect(page.getByLabel('BTC-Dominanz: 57,95 %')).toBeVisible()
        await expect(page.getByLabel('Fear & Greed: 28 von 100')).toBeVisible()
        const sentiment = page.getByRole('region', { name: 'Fear & Greed', exact: true })
        await expect(sentiment.getByRole('link', { name: 'Alternative.me' })).toBeVisible()
        await expect(sentiment.getByText('Angst', { exact: true })).toBeVisible()
        await expect(sentiment.getByRole('meter')).toHaveAttribute('value', '28')
        const input = calculator.getByRole('textbox', { name: 'Betrag' })
        await input.fill('72.000')
        await expect(calculator.getByText('100.000.000', { exact: true })).toBeVisible()
        const unit = calculator.getByRole('combobox', { name: 'Eingabeeinheit' })
        await unit.focus()
        await page.keyboard.press('ArrowUp')
        await page.keyboard.press('Enter')
        await expect(unit).toHaveValue('sats')
        await expect(unit).toBeFocused()
        await input.fill('9.007.199.254.740.993')
        await expect(calculator.getByText('90.071.992,54740993', { exact: true })).toBeVisible()
        await input.fill('-1')
        await expect(input).toHaveAttribute('aria-invalid', 'true')
        await expect(calculator.getByRole('status')).toContainText('nicht negativen Betrag')
        await unit.selectOption('BTC')
        await input.fill('0,00000001')
        await expect(calculator.locator('[data-unit="sats"]')).toHaveText('1')
        await page.getByRole('combobox', { name: 'Währung', exact: true }).selectOption('eur')
        await expect(page.getByRole('img', { name: /EUR · 30 Tage/ })).toBeVisible()
        await expect(unit).toHaveValue('BTC')
        await expect(input).toHaveValue('0,00000001')
        await unit.selectOption('EUR')
        await input.fill('100')
        await expect(calculator.getByText('111,11', { exact: true })).toBeVisible()
        if (width === 390) {
          await input.tap()
          await expect(input).toBeFocused()
        }
        await page.evaluate(() => document.fonts.ready)
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        )
        for (const control of await calculator.locator('input, select').all()) {
          const box = await control.boundingBox()
          expect(box!.height).toBeGreaterThanOrEqual(44)
        }
        expect([snapshotCalls, dominanceCalls, sentimentCalls]).toEqual([1, 1, 1])
        await input.blur()
        await page.screenshot({
          path: `test-results/phase-2.9/market-${width}-${theme}-fixture.png`,
          fullPage: true,
        })
      })
    })
  }
}

test.describe('isolated indicator errors', () => {
  test.use({ apiStatus: 502 })
  test('Alternative.me failure leaves snapshot, history, dominance and calculator available', async ({
    page,
  }) => {
    await page.route('**/api/market/fear-greed', (route) =>
      route.fulfill({ status: 502, json: { error: { code: 'UPSTREAM_INVALID_RESPONSE' } } }),
    )
    await page.goto('/market')
    const sentiment = page.getByRole('region', { name: 'Fear & Greed', exact: true })
    await expect(sentiment.getByRole('alert')).toContainText('Ungültige Antwort')
    await expect(sentiment.getByRole('link', { name: 'Alternative.me' })).toBeVisible()
    await expect(page.getByLabel(/Bitcoin-Kurs: 80\.000/)).toBeVisible()
    await expect(page.getByLabel('BTC-Dominanz: 57,95 %')).toBeVisible()
    await expect(page.getByRole('img', { name: /USD · 30 Tage/ })).toBeVisible()
    await expect(
      page.getByRole('region', { name: 'Sats-Rechner' }).getByText('138.889'),
    ).toBeVisible()
  })
})
test.describe('snapshot unavailable', () => {
  test.use({ apiStatus: 503 })
  test('BTC/sats remains usable with both new resources gated and no fiat rates', async ({
    page,
  }) => {
    await page.route('**/api/market/snapshot', (route) =>
      route.fulfill({ status: 503, json: { error: { code: 'MARKET_NOT_RELEASED' } } }),
    )
    for (const resource of ['dominance', 'fear-greed'])
      await page.route(`**/api/market/${resource}`, (route) =>
        route.fulfill({ status: 503, json: { error: { code: 'MARKET_NOT_RELEASED' } } }),
      )
    await page.goto('/market')
    const calculator = page.getByRole('region', { name: 'Sats-Rechner' })
    await expect(calculator.getByText(/Fiat-Kurse nicht verfügbar/)).toBeVisible()
    await calculator.getByRole('combobox').selectOption('sats')
    await calculator.getByRole('textbox').fill('1')
    await expect(calculator.locator('[data-unit="BTC"]')).toHaveText('0,00000001')
    await expect(calculator.locator('[data-unit="EUR"]')).toHaveText('Nicht verfügbar')
    await expect(calculator.locator('[data-unit="USD"]')).toHaveText('Nicht verfügbar')
    await expect(page.getByRole('alert')).toHaveCount(3)
  })
})
