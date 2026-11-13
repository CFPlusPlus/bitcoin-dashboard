import type { Page } from '@playwright/test'
import { test, expect } from './fixtures'
import { block, difficulty } from '../src/test/bitcoin-fixtures'
import { hashrateFixture } from '../src/test/kraken-fixtures'

const now = Date.parse('2026-11-13T09:00:00Z')
test.use({ timezoneId: 'Europe/Berlin' })

async function fixture(
  page: Page,
  initial: 'success' | 'loading' | 'invalid' | 'stale' = 'success',
) {
  const state = { mode: initial, height: 900000, blockCalls: 0, hashCalls: 0 }
  await page.clock.install({ time: now })
  await page.route('**/api/bitcoin/difficulty-adjustment', async (route) => {
    const completed = state.height % 2016
    await route.fulfill({
      json: {
        data: {
          ...difficulty,
          remainingBlocks: 2016 - completed,
          progressPercent: (completed / 2016) * 100,
          nextRetargetHeight: state.height - completed + 2016,
          estimatedRetargetAt: new Date(now + 7 * 86400000).toISOString(),
        },
        source: 'mempool.space',
        updatedAt: new Date(now).toISOString(),
      },
    })
  })
  await page.route('**/api/bitcoin/blocks', async (route) => {
    state.blockCalls++
    if (state.mode === 'loading') return
    await route.fulfill({
      json:
        state.mode === 'invalid'
          ? { invalid: true }
          : {
              data: [{ ...block, height: state.height }],
              source: 'mempool.space',
              updatedAt: new Date(
                (await page.evaluate(() => Date.now())) - (state.mode === 'stale' ? 61000 : 0),
              ).toISOString(),
            },
    })
  })
  await page.route('**/api/mining/hashrate', async (route) => {
    state.hashCalls++
    await route.fulfill({ json: hashrateFixture(await page.evaluate(() => Date.now())) })
  })
  return state
}
async function caption(page: Page, state = 'Erfolg') {
  await page.locator('.page-source').evaluate((el, state) => {
    el.textContent = `Testfixture MF-212 · synthetische Prüfdaten · ${state}`
  }, state)
  await page.evaluate(() => document.fonts.ready)
}

for (const theme of ['dark', 'light'] as const) {
  for (const width of [320, 390, 768, 1024, 1440, 1920]) {
    test(`mining fundamentals ${width}px ${theme}: KPIs, grid, accessibility and reduced motion`, async ({
      page,
    }) => {
      const state = await fixture(page)
      await page.setViewportSize({ width, height: 1000 })
      await page.addInitScript((value) => localStorage.setItem('theme', value), theme)
      await page.goto('/mining')
      await expect(page.locator('.mining-kpi')).toHaveCount(5)
      await expect(page.locator('.mining-hashrate .overview-value-number')).toHaveText('1.050,00')
      await expect(page.getByRole('region', { name: 'Aktuelle Difficulty' })).toContainText(
        '123,46',
      )
      await expect(page.getByRole('region', { name: 'Bitcoin-Angebot · Modell' })).toContainText(
        '19.875.003',
      )
      await expect(
        page.getByRole('region', { name: 'Angebotsinflation · Schätzung' }),
      ).toContainText('0,826')
      await expect(
        page.getByRole('region', { name: 'Nächstes Halving', exact: true }),
      ).toContainText('150.000')
      const halving = page.getByRole('region', { name: 'Halving-Analyse' })
      await expect(
        halving.getByRole('progressbar', { name: 'Fortschritt im Halving-Zyklus' }),
      ).toHaveAttribute('value', String((60000 / 210000) * 100))
      await expect(halving).toContainText('5 · nach 4 Halvings')
      await expect(halving).toContainText('840.000')
      const supply = page.getByRole('region', { name: 'Bitcoin-Angebotsanalyse' })
      await expect(supply).toContainText('1.124.996,8519 BTC')
      await expect(supply).toContainText('20.999.999,9769 BTC')
      await expect(supply).toContainText('164.250 BTC / Jahr')
      await expect(
        supply.getByRole('progressbar', { name: 'Anteil am Subventionsmaximum' }),
      ).toHaveAttribute('max', '100')
      expect(
        await halving.getByRole('progressbar').evaluate((el) => ({
          valueColor: getComputedStyle(el, '::-webkit-progress-value').backgroundColor,
          accent: getComputedStyle(document.documentElement).getPropertyValue('--accent').trim(),
          transitions: getComputedStyle(el).transitionDuration,
        })),
      ).toMatchObject({ transitions: '0s' })
      await expect(page.getByText('Platzhalter · Noch nicht verbunden')).toHaveCount(2)
      expect(state.blockCalls).toBe(1)
      expect(state.hashCalls).toBe(1)
      await caption(page)
      if ([390, 1440].includes(width))
        await page.screenshot({
          path: `docs/screenshots/phase-2.12/mining-${width}-${theme}-fixture.png`,
          fullPage: true,
        })
      for (const size of ['100%', '200%']) {
        await page.evaluate((size) => {
          document.documentElement.style.fontSize = size
        }, size)
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
          width,
        )
        const geometry = await page.locator('.mining-kpi').evaluateAll((cards) =>
          cards.map((card) => ({
            top: card.getBoundingClientRect().top,
            bottom: card.getBoundingClientRect().bottom,
            width: card.getBoundingClientRect().width,
            value: card
              .querySelector('.mining-value, .overview-network-value')!
              .getBoundingClientRect().top,
          })),
        )
        for (const top of new Set(geometry.map((box) => box.top))) {
          const row = geometry.filter((box) => box.top === top)
          for (const key of ['width', 'bottom', 'value'] as const)
            expect(
              Math.max(...row.map((box) => box[key])) - Math.min(...row.map((box) => box[key])),
            ).toBeLessThanOrEqual(1)
        }
        if (size === '100%' && width >= 1440)
          expect(new Set(geometry.map((box) => box.top)).size).toBe(1)
        if (size === '100%') {
          const lines = await page
            .locator('.mining-kpi .mining-value-number, .mining-kpi .overview-value-number')
            .evaluateAll((values) =>
              values.map((value) => {
                const range = document.createRange()
                range.selectNodeContents(value)
                return range.getClientRects().length
              }),
            )
          expect(lines).toEqual([1, 1, 1, 1, 1])
        }
        if (width === 320 && size === '200%')
          await page.screenshot({
            path: `docs/screenshots/phase-2.12/mining-320-text-200-${theme}-fixture.png`,
            fullPage: true,
          })
      }
      await page.emulateMedia({ reducedMotion: 'reduce' })
      expect(
        await page
          .locator('.mining-fundamentals')
          .evaluate((el) => el.getAnimations({ subtree: true }).length),
      ).toBe(0)
      const semantic = await halving.getByRole('progressbar').ariaSnapshot()
      expect(semantic).toContain('Fortschritt im Halving-Zyklus')
    })
  }
  for (const mode of ['loading', 'invalid', 'stale'] as const) {
    test(`mining fundamentals ${mode} ${theme}: isolated states and fixture screenshot`, async ({
      page,
    }) => {
      await fixture(page, mode)
      await page.setViewportSize({ width: 390, height: 844 })
      await page.addInitScript((value) => localStorage.setItem('theme', value), theme)
      await page.goto('/mining')
      await expect(page.locator('.mining-hashrate .overview-value-number')).toHaveText('1.050,00')
      const snapshot = page.getByRole('region', { name: 'Datenstand der Mining-Kennzahlen' })
      if (mode === 'loading') {
        await expect(snapshot.getByRole('status')).toContainText('Daten werden geladen')
        await expect(
          page.getByRole('region', { name: 'Halving-Analyse' }).getByRole('progressbar'),
        ).toHaveCount(0)
      }
      if (mode === 'invalid') {
        await expect(snapshot.getByRole('alert')).toContainText('Ungültige API-Antwort')
        await expect(
          page.getByRole('region', { name: 'Aktuelle Difficulty' }).locator('.mining-value-number'),
        ).toHaveText('—')
      }
      if (mode === 'stale') {
        await expect(snapshot).toContainText('Veraltete Daten')
        await expect(page.getByRole('region', { name: 'Aktuelle Difficulty' })).toContainText(
          '123,46',
        )
      }
      await caption(page, mode)
      await page.screenshot({
        path: `docs/screenshots/phase-2.12/mining-${mode}-${theme}-fixture.png`,
        fullPage: true,
      })
    })
  }
}

test('mining shares overview caches, preserves snapshots on failure, retries by keyboard and crosses a halving', async ({
  page,
}) => {
  const state = await fixture(page)
  await page.goto('/')
  await expect(page.getByRole('cell', { name: '2.345', exact: true })).toBeVisible()
  await expect(page.getByText('Schätzwert verfügbar')).toBeVisible()
  await page.getByRole('link', { name: 'Netzwerk & Mining', exact: true }).click()
  await expect(page.getByRole('region', { name: 'Aktuelle Difficulty' })).toContainText('123,46')
  expect(state.blockCalls).toBe(1)
  expect(state.hashCalls).toBe(1)
  const snapshot = page.getByRole('region', { name: 'Datenstand der Mining-Kennzahlen' })
  const timestamp = await snapshot.locator('time').getAttribute('datetime')
  state.mode = 'invalid'
  await page.clock.fastForward(60001)
  await expect(snapshot.getByRole('alert')).toContainText('Ungültige API-Antwort')
  await expect(snapshot.locator('time')).toHaveAttribute('datetime', timestamp!)
  await expect(page.getByRole('region', { name: 'Nächstes Halving', exact: true })).toContainText(
    '150.000',
  )
  state.mode = 'success'
  state.height = 1050000
  const retry = snapshot.getByRole('button', { name: 'Erneut versuchen', exact: true })
  await retry.focus()
  await expect(retry).toBeFocused()
  await page.keyboard.press('Tab')
  await page.keyboard.press('Shift+Tab')
  await expect(retry).toBeFocused()
  expect(await retry.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe('solid')
  await page.keyboard.press('Enter')
  await expect(
    page.getByRole('region', { name: 'Halving-Analyse' }).getByRole('progressbar'),
  ).toHaveAttribute('value', '0')
  await expect(page.getByRole('region', { name: 'Nächstes Halving', exact: true })).toContainText(
    '210.000',
  )
  await expect(page.getByRole('region', { name: 'Bitcoin-Angebotsanalyse' })).toContainText(
    '82.125 BTC / Jahr',
  )
  await page.getByRole('link', { name: 'Übersicht', exact: true }).click()
  await expect(page.getByRole('cell', { name: '2.345', exact: true })).toBeVisible()
  expect(state.blockCalls).toBe(3)
  expect(state.hashCalls).toBe(1)
})

test('mining offline retains data, warns with age and reconnects using shared policies', async ({
  page,
  context,
}) => {
  const state = await fixture(page)
  await page.goto('/mining')
  await expect(page.getByRole('region', { name: 'Aktuelle Difficulty' })).toContainText('123,46')
  await context.setOffline(true)
  await page.evaluate(() => window.dispatchEvent(new Event('offline')))
  await page.clock.fastForward(60001)
  const snapshot = page.getByRole('region', { name: 'Datenstand der Mining-Kennzahlen' })
  await expect(snapshot).toContainText('Offline · Abruf pausiert')
  await expect(snapshot).toContainText('Veraltete Daten')
  await expect(page.getByRole('region', { name: 'Aktuelle Difficulty' })).toContainText('123,46')
  expect(state.blockCalls).toBe(1)
  await caption(page, 'Offline mit letztem Datenstand')
  await page.screenshot({
    path: 'docs/screenshots/phase-2.12/mining-offline-dark-fixture.png',
    fullPage: true,
  })
  await context.setOffline(false)
  await page.evaluate(() => window.dispatchEvent(new Event('online')))
  await expect(snapshot.getByText(/Offline · Abruf pausiert/)).toHaveCount(0)
  await expect.poll(() => state.blockCalls).toBe(2)
})
