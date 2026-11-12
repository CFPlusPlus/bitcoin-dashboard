import type { Locator, WebSocketRoute } from '@playwright/test'
import { test, expect } from './fixtures'
import { krakenAck, krakenTicker } from '../src/test/kraken-fixtures'

const now = Date.parse('2026-11-12T09:00:00Z')
test.use({
  video: { mode: 'on', size: { width: 1440, height: 900 } },
  viewport: { width: 1440, height: 900 },
})

for (const theme of ['dark', 'light']) {
  for (const width of [390, 1440]) {
    test(`soft price motion at ${width}px ${theme}: opacity, stable positions, bursts and reduced motion`, async ({
      page,
    }, testInfo) => {
      await page.clock.install({ time: now })
      await page.clock.pauseAt(now)
      await page.setViewportSize({ width, height: 900 })
      await page.addInitScript((value) => localStorage.setItem('theme', value), theme)
      let socket: WebSocketRoute
      await page.routeWebSocket('wss://ws.kraken.com/v2', (ws) => {
        socket = ws
        ws.onMessage(() => {
          for (const pair of ['BTC/EUR', 'BTC/USD'] as const) {
            ws.send(JSON.stringify(krakenAck(pair, now)))
            ws.send(JSON.stringify(krakenTicker(pair, 99999.99, 'snapshot', now)))
          }
        })
      })
      await page.goto('/')
      await page.clock.runFor(1)
      const eur = page.getByRole('region', { name: 'BTC/EUR Live-Kurs' })
      const price = eur.locator('.soft-price')
      const indicator = eur.locator('.overview-tick-direction')
      await expect(eur.locator('.sr-only')).toHaveText('99.999,99')
      await page.evaluate(() => document.fonts.ready)
      const before = await price.boundingBox()
      const indicatorBefore = await indicator.boundingBox()
      const neutralColor = await eur
        .locator('.overview-price')
        .evaluate((el) => getComputedStyle(el).color)
      const send = async (value: number) => {
        socket!.send(
          JSON.stringify(
            krakenTicker('BTC/EUR', value, 'update', await page.evaluate(() => Date.now())),
          ),
        )
      }
      await send(100000)
      await page.clock.runFor(1000)
      await expect(price).toHaveAttribute('data-animation', 'number')
      expect(await price.boundingBox()).toEqual(before)
      await send(100001)
      await page.clock.runFor(1000)
      await expect(eur.locator('.sr-only')).toHaveText('100.001,00')
      await expect(eur.locator('[data-changing]')).toHaveCount(1)
      await expect(eur.locator('.price-separator [data-changing]')).toHaveCount(0)
      const unchanged = await eur.locator('.price-digit').first().elementHandle()
      const separator = await eur.locator('.price-separator').first().elementHandle()

      // Seek real browser CSS animations, rather than infer motion quality from a static image.
      const samples = []
      for (const ms of [0, 100, 200, 400]) {
        samples.push(
          await price.evaluate((el, time) => {
            const animations = el.getAnimations({ subtree: true })
            animations.forEach((animation) => {
              animation.pause()
              animation.currentTime = time
            })
            const current = el.querySelector('[data-changing] .price-glyph-current')!
            const old = el.querySelector('.price-glyph-old')!
            return {
              ms: time,
              current: Number(getComputedStyle(current).opacity),
              old: Number(getComputedStyle(old).opacity),
              top: current.getBoundingClientRect().top,
              transforms: [getComputedStyle(current).transform, getComputedStyle(old).transform],
              durations: animations.map((animation) => animation.effect!.getTiming().duration),
              unchangedOpacity: getComputedStyle(
                el.querySelector('.price-digit .price-glyph-current')!,
              ).opacity,
            }
          }, ms),
        )
      }
      expect(samples[0]).toMatchObject({ current: 0, old: 1 })
      expect(samples[3]).toMatchObject({ current: 1, old: 0 })
      for (let index = 0; index < samples.length; index++) {
        const sample = samples[index]
        expect(sample.current + sample.old).toBeCloseTo(1, 4)
        expect(sample.transforms).toEqual(['none', 'none'])
        expect(sample.durations).toEqual([400, 400])
        expect(sample.unchangedOpacity).toBe('1')
        expect(sample.top).toBe(samples[0].top)
        if (index) expect(sample.current).toBeGreaterThan(samples[index - 1].current)
      }
      await testInfo.attach('crossfade-samples.json', {
        body: JSON.stringify(samples, null, 2),
        contentType: 'application/json',
      })

      // Bursts are received in full but only the latest valid tick reaches the next display frame.
      await send(100002)
      await send(100003)
      await send(-1)
      await expect(eur.locator('.sr-only')).toHaveText('100.001,00')
      await page.clock.runFor(1000)
      await expect(eur.locator('.sr-only')).toHaveText('100.003,00')
      await expect(eur.locator('.price-glyph-old')).toHaveText('1')
      expect(await unchanged!.evaluate((el) => el.isConnected)).toBe(true)
      expect(await separator!.evaluate((el) => el.isConnected)).toBe(true)
      expect(await indicator.boundingBox()).toEqual(indicatorBefore)

      await send(100002)
      await page.clock.runFor(1000)
      await expect(indicator).toHaveAttribute('data-direction', '-1')
      await expect(eur).toContainText('24 h · Kraken: +1,25 %')
      expect(
        await eur.locator('.overview-price').evaluate((el) => getComputedStyle(el).color),
      ).toBe(neutralColor)
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await expect(eur.locator('.price-glyph-old')).not.toBeVisible()
      expect(await price.evaluate((el) => el.getAnimations({ subtree: true }).length)).toBe(0)
      expect(await indicator.evaluate((el) => getComputedStyle(el).transitionDuration)).toBe('0s')
      await send(100002.001)
      await page.clock.runFor(1000)
      await expect(price).toHaveAttribute('data-animation', 'none')
      await expect(indicator).toHaveAttribute('data-direction', '0')
      await send(1_000_000_000_000)
      await page.clock.runFor(1000)
      await expect(eur.locator('.sr-only')).toHaveText('1.000.000.000.000,00')
      expect(await price.boundingBox()).toEqual(before)
      await expect(eur.locator('.price-previous')).not.toBeVisible()
      expect(
        await eur
          .locator('.overview-price-number')
          .evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
      ).toBe(true)
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width,
      )
    })
  }
}

test.describe('local motion recording', () => {
  test('records repeated real-time fades with synthetic Kraken ticks and no idle animation', async ({
    page,
  }) => {
    let socket: WebSocketRoute
    await page.routeWebSocket('wss://ws.kraken.com/v2', (ws) => {
      socket = ws
      ws.onMessage(() => {
        for (const pair of ['BTC/EUR', 'BTC/USD'] as const) {
          ws.send(JSON.stringify(krakenAck(pair)))
          ws.send(JSON.stringify(krakenTicker(pair, 72000, 'snapshot')))
        }
      })
    })
    await page.goto('/')
    const eur = page.getByRole('region', { name: 'BTC/EUR Live-Kurs' })
    await expect(eur.locator('.sr-only')).toHaveText('72.000,00')
    await page.evaluate(() => {
      const caption = document.createElement('p')
      caption.textContent =
        'Testfixture OV-2102 · synthetische Kraken-Nachrichten · 400-ms-Crossfade'
      document.querySelector('main')!.prepend(caption)
    })
    const positions: Awaited<ReturnType<Locator['boundingBox']>>[] = []
    for (const value of [72001, 72002, 72001, 72001, 72003, 71999.99]) {
      socket!.send(JSON.stringify(krakenTicker('BTC/EUR', value)))
      await expect(eur.locator('.sr-only')).toHaveText(
        new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2 }).format(value),
      )
      // Allow each 400ms fade to finish and record it at natural speed.
      await expect
        .poll(() =>
          eur
            .locator('.soft-price')
            .evaluate((el) =>
              el
                .getAnimations({ subtree: true })
                .some((animation) => animation.playState === 'running'),
            ),
        )
        .toBe(false)
      positions.push(await eur.locator('.overview-price-number').boundingBox())
    }
    expect(positions.every((box) => JSON.stringify(box) === JSON.stringify(positions[0]))).toBe(
      true,
    )
    expect(await eur.locator('.overview-tick').innerText()).toContain(
      'Letzter Handelspreis · Kraken',
    )
  })
})
