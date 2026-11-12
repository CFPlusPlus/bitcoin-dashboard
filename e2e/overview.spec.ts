import type { WebSocketRoute } from '@playwright/test'
import { test, expect } from './fixtures'
import { krakenAck, krakenTicker } from '../src/test/kraken-fixtures'

test.use({ timezoneId: 'Europe/Berlin' })
const now = Date.parse('2026-11-12T09:00:00Z')
for (const theme of ['dark', 'light'] as const) {
  for (const width of [320, 390, 768, 1440, 1920]) {
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
      await expect(page.locator('.overview-market-values')).toContainText('1,44 Bio.')
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width,
      )
      await expect(page.getByText('Synthetische Demo-Daten')).toHaveCount(0)
      await page.evaluate(() => document.fonts.ready)
      await page.evaluate(() => {
        const caption = document.createElement('p')
        caption.textContent = 'Testfixture OV-210 · synthetische Prüfdaten · kein Live-Nachweis'
        caption.style.cssText = 'padding:8px 0;font-size:12px;color:var(--foreground-secondary)'
        document.querySelector('main')!.prepend(caption)
      })
      await page.screenshot({
        path: `test-results/phase-2.10/overview-${width}-${theme}-fixture.png`,
        fullPage: true,
      })
      if ([390, 1440].includes(width))
        await page.screenshot({
          path: `docs/screenshots/phase-2.10/overview-${width}-${theme}-fixture.png`,
          fullPage: true,
        })
      if (width === 320) {
        await page.emulateMedia({ reducedMotion: 'reduce' })
        await page.evaluate(() => {
          document.documentElement.style.fontSize = '200%'
        })
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
          320,
        )
        expect(
          await page
            .locator('.overview-price')
            .first()
            .evaluate((el) => getComputedStyle(el).transitionDuration),
        ).toBe('0s')
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
  await page.clock.runFor(300)
  await expect(eur).toContainText('↑ Gestiegen')
  sockets[0].send(
    JSON.stringify(krakenTicker('BTC/EUR', 72009, 'update', await page.evaluate(() => Date.now()))),
  )
  await page.clock.runFor(300)
  await expect(eur).toContainText('↓ Gefallen')
  const after = await eur.locator('.overview-price').boundingBox()
  expect(after).toEqual(before)
  await page.clock.runFor(1500)
  await expect(eur.locator('.overview-price')).toHaveAttribute('data-direction', '0')
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
  await expect(page.locator('.overview-market').getByRole('alert')).toContainText(
    'Ungültige API-Antwort',
  )
  await expect(page.locator('.overview-hashrate').getByRole('alert')).toContainText(
    'Hashrate konnte nicht geladen werden',
  )
})
