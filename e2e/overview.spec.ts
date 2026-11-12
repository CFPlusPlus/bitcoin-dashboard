import type { WebSocketRoute } from '@playwright/test'
import { test, expect } from './fixtures'
import { krakenAck, krakenTicker } from '../src/test/kraken-fixtures'

test.use({ timezoneId: 'Europe/Berlin' })
const now = Date.parse('2026-11-12T09:00:00Z')
for (const theme of ['dark', 'light'] as const) {
  for (const width of [320, 390, 768, 1100, 1440, 1920]) {
    test(`overview ${width}px ${theme}: controlled live fixtures, responsive and accessible`, async ({
      page,
    }) => {
      await page.clock.install({ time: now })
      await page.setViewportSize({ width, height: width >= 1440 ? 1000 : 844 })
      await page.addInitScript((value) => localStorage.setItem('theme', value), theme)
      await page.goto('/')
      await expect(page.getByRole('heading', { level: 1, name: 'Guten Morgen' })).toBeVisible()
      await expect(page).toHaveTitle('Übersicht · Bitcoin Dashboard')
      await expect(page.getByRole('region', { name: 'BTC/EUR Live-Kurs' })).toContainText(
        '72.000,00',
      )
      await expect(page.getByRole('region', { name: 'BTC/USD Live-Kurs' })).toContainText(
        '80.000,00',
      )
      await expect(page.locator('[data-pair-status="live"]')).toHaveCount(2)
      await expect(page.locator('canvas')).toBeVisible()
      await expect(page.getByRole('progressbar')).toBeVisible()
      await expect(page.getByText('Schätzwert verfügbar')).toBeVisible()
      await expect(page.getByRole('alert')).toHaveCount(0)
      await expect(page.locator('.overview-market').first()).toContainText('1,44 Bio.')
      const metrics = page.locator('.overview-metric')
      await expect(metrics).toHaveCount(5)
      const geometry = await metrics.evaluateAll((cards) =>
        cards.map((card) => {
          const box = card.getBoundingClientRect()
          return {
            top: box.top,
            bottom: box.bottom,
            width: box.width,
            title: card.querySelector('[data-slot="card-title"]')!.getBoundingClientRect().top,
            value: card.querySelector('.overview-network-value')!.getBoundingClientRect().top,
            footer: card.querySelector('.overview-metric-footer')!.getBoundingClientRect().top,
          }
        }),
      )
      for (const row of new Set(geometry.map((box) => box.top))) {
        const boxes = geometry.filter((box) => box.top === row)
        for (const key of ['bottom', 'width', 'title', 'value', 'footer'] as const)
          expect(
            Math.max(...boxes.map((box) => box[key])) - Math.min(...boxes.map((box) => box[key])),
          ).toBeLessThanOrEqual(1)
      }
      if (width > 1100) expect(new Set(geometry.map((box) => box.top)).size).toBe(1)
      const liveBox = await page.locator('.overview-live').boundingBox()
      const blocksBox = await page.locator('.overview-blocks').boundingBox()
      expect(blocksBox?.x).toBe(liveBox?.x)
      expect(blocksBox?.width).toBe(liveBox?.width)
      if (width > 1100) {
        const historyBox = await page.locator('.market-history').boundingBox()
        const contextBox = await page.locator('.overview-context').boundingBox()
        expect(historyBox?.y).toBe(contextBox?.y)
        expect(
          Math.abs(historyBox!.y + historyBox!.height - contextBox!.y - contextBox!.height),
        ).toBeLessThanOrEqual(1)
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width,
      )
      await expect(page.getByText('Synthetische Demo-Daten')).toHaveCount(0)
      await page.evaluate(() => document.fonts.ready)
      await page.evaluate(() => {
        const caption = document.createElement('p')
        caption.textContent = 'Testfixture OV-2101 · synthetische Prüfdaten · kein Live-Nachweis'
        caption.style.cssText = 'padding:8px 0;font-size:12px;color:var(--foreground-secondary)'
        document.querySelector('main')!.prepend(caption)
      })
      await page.screenshot({
        path: `test-results/phase-2.10.1/overview-${width}-${theme}-fixture.png`,
        fullPage: true,
      })
      if ([390, 1100, 1440].includes(width))
        await page.screenshot({
          path: `docs/screenshots/phase-2.10.1/overview-${width}-${theme}-fixture.png`,
          fullPage: true,
        })
      // Every requested width also gets a 200% text pass, including the live digits.
      {
        await page.emulateMedia({ reducedMotion: 'reduce' })
        await page.evaluate(() => {
          document.documentElement.style.fontSize = '200%'
        })
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
          width,
        )
        for (const number of await page.locator('.overview-price-number').all()) {
          expect(await number.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true)
        }
        expect(
          await page
            .locator('.overview-price')
            .first()
            .evaluate((el) => getComputedStyle(el).transitionDuration),
        ).toBe('0s')
        if (width === 320)
          await page.screenshot({
            path: `docs/screenshots/phase-2.10.1/overview-320-text-200-${theme}-fixture.png`,
            fullPage: true,
          })
      }
    })
  }
}

test('Kraken UI changes without layout shift, becomes stale independently, reconnects and releases the socket on navigation', async ({
  page,
}) => {
  await page.clock.install({ time: now })
  const sockets: WebSocketRoute[] = []
  let closed = 0
  await page.routeWebSocket('wss://ws.kraken.com/v2', (ws) => {
    sockets.push(ws)
    ws.onClose(() => closed++)
    ws.onMessage(async () => {
      const at = await page.evaluate(() => Date.now())
      for (const pair of ['BTC/EUR', 'BTC/USD'] as const) {
        ws.send(JSON.stringify(krakenAck(pair, at)))
        ws.send(
          JSON.stringify(krakenTicker(pair, pair === 'BTC/EUR' ? 72000 : 80000, 'snapshot', at)),
        )
      }
    })
  })
  await page.goto('/')
  const eur = page.getByRole('region', { name: 'BTC/EUR Live-Kurs' })
  await expect(eur).toContainText('72.000,00')
  expect(sockets).toHaveLength(1)
  const before = await eur.locator('.overview-price').boundingBox()
  sockets[0].send(
    JSON.stringify(krakenTicker('BTC/EUR', 72010, 'update', await page.evaluate(() => Date.now()))),
  )
  await page.clock.runFor(1000)
  await expect(eur.getByRole('img', { name: /Gestiegen um 10 EUR/ })).toBeVisible()
  sockets[0].send(
    JSON.stringify(krakenTicker('BTC/EUR', 72009, 'update', await page.evaluate(() => Date.now()))),
  )
  await page.clock.runFor(1000)
  await expect(eur.getByRole('img', { name: /Gefallen um 1 EUR/ })).toBeVisible()
  const after = await eur.locator('.overview-price').boundingBox()
  expect(after).toEqual(before)
  await page.clock.runFor(1500)
  await expect(eur.locator('.overview-tick-direction')).toHaveAttribute('data-direction', '-1')
  for (let i = 0; i < 13; i++) {
    sockets[0].send(JSON.stringify({ channel: 'heartbeat' }))
    sockets[0].send(
      JSON.stringify(
        krakenTicker('BTC/USD', 80000 + i, 'update', await page.evaluate(() => Date.now())),
      ),
    )
    await page.clock.runFor(5000)
  }
  await expect(eur.locator('[data-pair-status]')).toHaveAttribute('data-pair-status', 'stale')
  await expect(
    page.getByRole('region', { name: 'BTC/USD Live-Kurs' }).locator('[data-pair-status]'),
  ).toHaveAttribute('data-pair-status', 'live')
  expect(sockets).toHaveLength(1)
  sockets[0].close({ code: 1000, reason: 'Controlled fixture disconnect' })
  await expect(page.locator('.overview-connection')).toContainText('wiederhergestellt')
  await page.clock.runFor(6500)
  await expect(eur).toContainText('72.000,00')
  expect(sockets).toHaveLength(2)
  const closedBeforeNavigation = closed
  await page.getByRole('navigation').getByRole('link', { name: 'Markt', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Markt', exact: true })).toBeVisible()
  await expect.poll(() => closed).toBe(closedBeforeNavigation + 1)
  await page.getByRole('navigation').getByRole('link', { name: 'Übersicht', exact: true }).click()
  await expect(page.locator('[data-pair-status="live"]')).toHaveCount(2)
  expect(sockets).toHaveLength(3)
})

test('greeting crosses its local time boundary; fiat, history ranges and navigation share existing caches', async ({
  page,
}) => {
  await page.clock.install({ time: Date.parse('2026-11-12T09:59:55Z') })
  const requests: string[] = []
  page.on('request', (request) => {
    if (request.url().includes('/api/market/')) requests.push(request.url())
  })
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: 'Guten Morgen' })).toBeVisible()
  await expect(page.locator('canvas')).toBeVisible()
  await page.clock.runFor(30000)
  await expect(page.getByRole('heading', { level: 1, name: 'Guten Tag' })).toBeVisible()
  const select = page.getByRole('combobox', { name: 'Marktkennzahlen & Chart' })
  await select.focus()
  await select.selectOption('usd')
  await expect(page.getByRole('img', { name: /USD · 30 Tage/ })).toBeVisible()
  for (const label of ['24 h', '7 T', '90 T', '1 J', '30 T']) {
    await page.getByRole('button', { name: label, exact: true }).focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('button', { name: label, exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await expect(page.locator('canvas')).toBeVisible()
  }
  await page.getByRole('navigation').getByRole('link', { name: 'Markt', exact: true }).click()
  await expect(page.getByRole('img', { name: /USD · 30 Tage/ })).toBeVisible()
  expect(requests.filter((url) => url.includes('/snapshot'))).toHaveLength(1)
  expect(requests.filter((url) => url.includes('/history'))).toHaveLength(6)
})

test('invalid market and hashrate responses leave real-history and chain fixtures usable', async ({
  page,
}) => {
  await page.route('**/api/market/snapshot', (route) => route.fulfill({ json: { invalid: true } }))
  await page.route('**/api/mining/hashrate', (route) =>
    route.fulfill({ json: { data: { hashesPerSecond: 'bad' } } }),
  )
  await page.goto('/')
  await expect(page.locator('canvas')).toBeVisible()
  await expect(page.getByRole('link', { name: '900.000', exact: true })).toBeVisible()
  await expect(page.getByRole('progressbar')).toBeVisible()
  await expect(page.locator('.overview-market').first().getByRole('alert')).toContainText(
    'Ungültige API-Antwort',
  )
  await expect(page.locator('.overview-hashrate').getByRole('alert')).toContainText(
    'Hashrate konnte nicht geladen werden',
  )
})

for (const state of ['loading', 'error'] as const) {
  for (const width of [390, 1440]) {
    test(`overview ${state} cards stay aligned at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.route('**/api/**', (route) => {
        if (state === 'error') return route.fulfill({ json: { invalid: true } })
        // Deliberately keep requests pending to inspect the real loading UI.
      })
      await page.goto('/')
      const metrics = page.locator('.overview-metric')
      await expect(metrics).toHaveCount(5)
      if (state === 'error') await expect(metrics.getByRole('alert')).toHaveCount(5)
      else await expect(page.getByText('Hashrate wird geladen …')).toBeVisible()
      const boxes = await metrics.evaluateAll((cards) =>
        cards.map((card) => {
          const box = card.getBoundingClientRect()
          return {
            top: box.top,
            bottom: box.bottom,
            footer: card.querySelector('footer')!.getBoundingClientRect().top,
          }
        }),
      )
      if (width === 1440) {
        for (const key of ['top', 'bottom', 'footer'] as const)
          expect(new Set(boxes.map((box) => box[key])).size).toBe(1)
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width,
      )
      await page.evaluate((state) => {
        const caption = document.createElement('p')
        caption.textContent = `Testfixture OV-2101 · synthetischer ${state === 'error' ? 'Fehlerzustand' : 'Ladezustand'}`
        document.querySelector('main')!.prepend(caption)
      }, state)
      await page.screenshot({
        path: `test-results/phase-2.10.1/overview-${state}-${width}-fixture.png`,
        fullPage: true,
      })
    })
  }
}
