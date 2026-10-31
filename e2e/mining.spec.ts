import type { Page } from '@playwright/test'
import { test, expect } from './fixtures'
import { difficulty } from '../src/test/bitcoin-fixtures'

test.use({ timezoneId: 'Europe/Berlin' })
const now = '2026-10-31T14:30:00.000Z'

async function fixture(page: Page, mode: 'success' | 'loading' | 'error' | 'stale' = 'success') {
  const state = { mode, calls: 0, epoch: difficulty }
  await page.clock.install({ time: new Date(now) })
  await page.route('**/api/bitcoin/difficulty-adjustment', async (route) => {
    state.calls++
    if (state.mode === 'loading') return
    await route.fulfill({
      json:
        state.mode === 'error'
          ? { invalid: true }
          : {
              source: 'mempool.space',
              updatedAt:
                state.mode === 'stale'
                  ? '2026-10-31T14:09:00.000Z'
                  : new Date(await page.evaluate(() => Date.now())).toISOString(),
              data: state.epoch,
            },
    })
  })
  return state
}

async function annotate(page: Page) {
  await page.locator('.page-source').evaluate((element) => {
    element.textContent = 'Testfixture DA-25 · synthetische Prüfdaten'
  })
  await page.evaluate(() => document.fonts.ready)
}

for (const theme of ['dark', 'light']) {
  for (const viewport of [
    { width: 1440, height: 1000 },
    { width: 390, height: 844 },
    { width: 320, height: 844 },
    { width: 768, height: 1024 },
    { width: 1920, height: 1080 },
  ]) {
    test(`DA-25 rendered mining ${viewport.width} ${theme}`, async ({ page }) => {
      const state = await fixture(page)
      await page.setViewportSize(viewport)
      await page.addInitScript((value) => localStorage.setItem('theme', value), theme)
      await page.goto('/mining')
      await expect(page.getByLabel('Erwartete Difficulty-Anpassung: -3,7 %')).toBeVisible()
      await expect(page.getByText('1.762', { exact: true })).toBeVisible()
      await expect(page.getByText('975.744', { exact: true })).toBeVisible()
      await expect(page.getByRole('progressbar')).toHaveAttribute(
        'value',
        String(difficulty.progressPercent),
      )
      await expect(page.getByRole('alert')).toHaveCount(0)
      expect(state.calls).toBe(1)
      await annotate(page)
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        viewport.width,
      )
      await page.screenshot({
        path: `test-results/mining/mining-${viewport.width}-${theme}.png`,
        fullPage: true,
      })
    })
  }
  for (const mode of ['loading', 'error', 'stale'] as const) {
    for (const width of [1440, 390]) {
      test(`DA-25 ${mode} ${width} ${theme}`, async ({ page }) => {
        await fixture(page, mode)
        await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 })
        await page.addInitScript((value) => localStorage.setItem('theme', value), theme)
        await page.goto('/mining')
        if (mode === 'loading')
          await expect(page.getByRole('status')).toContainText('Daten werden geladen')
        if (mode === 'error') {
          await expect(page.getByRole('alert')).toContainText('Ungültige API-Antwort')
          await expect(page.getByLabel('Erwartete Difficulty-Anpassung: —')).toBeVisible()
        }
        if (mode === 'stale')
          await expect(
            page.getByText('Veraltete Daten · letzter erfolgreicher Abruf bleibt sichtbar.'),
          ).toBeVisible()
        await annotate(page)
        await page.screenshot({
          path: `test-results/mining/mining-${mode}-${width}-${theme}.png`,
          fullPage: true,
        })
      })
    }
  }
}

test('DA-25 keyboard retry, last success and epoch reset', async ({ page }) => {
  const state = await fixture(page, 'error')
  await page.goto('/mining')
  await expect(page.getByRole('alert')).toBeVisible()
  const retry = page.getByRole('button', { name: 'Erneut versuchen', exact: true })
  await retry.focus()
  await expect(retry).toBeFocused()
  expect(await retry.evaluate((element) => getComputedStyle(element).outlineStyle)).toBe('solid')
  state.mode = 'success'
  await page.keyboard.press('Enter')
  await expect(page.getByText('1.762', { exact: true })).toBeVisible()
  const retrievedAt = await page.locator('.resource-status time').getAttribute('datetime')
  state.mode = 'error'
  await page.clock.fastForward(600_001)
  await expect(page.getByRole('alert')).toBeVisible()
  await expect(page.getByText('1.762', { exact: true })).toBeVisible()
  await expect(page.locator('.resource-status time')).toHaveAttribute('datetime', retrievedAt!)
  state.mode = 'success'
  state.epoch = {
    ...difficulty,
    remainingBlocks: 2016,
    progressPercent: 0,
    nextRetargetHeight: 977760,
    estimatedChangePercent: 0,
  }
  await retry.press('Enter')
  await expect(page.getByText('2.016', { exact: true })).toBeVisible()
  await expect(page.getByText('977.760', { exact: true })).toBeVisible()
  await expect(page.getByLabel('Erwartete Difficulty-Anpassung: 0 %')).toBeVisible()
  await expect(page.getByRole('progressbar')).toHaveAttribute('value', '0')
})

test('DA-25 200 percent text at 320px remains readable without page overflow', async ({ page }) => {
  await fixture(page)
  await page.setViewportSize({ width: 320, height: 844 })
  await page.goto('/mining')
  await expect(page.getByText('1.762', { exact: true })).toBeVisible()
  await page.addStyleTag({ content: 'html { font-size: 200%; }' })
  const overflow = await page.locator('body *').evaluateAll((elements) =>
    elements
      .filter((element) => element.getBoundingClientRect().right > window.innerWidth)
      .map((element) => ({
        tag: element.tagName,
        class: element.className,
        width: element.getBoundingClientRect().width,
        text: element.textContent?.slice(0, 65),
      })),
  )
  expect(overflow).toEqual([])
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320)
  await page.screenshot({ path: 'test-results/mining/mining-320-text-200.png', fullPage: true })
})

test.describe('DA-25 rate limit', () => {
  test.use({ apiStatus: 429 })
  test('pauses requests and keyboard retry until the local cooldown ends', async ({ page }) => {
    await page.clock.install({ time: new Date(now) })
    let calls = 0
    await page.route('**/api/bitcoin/difficulty-adjustment', async (route) => {
      calls++
      await route.fulfill({
        status: 429,
        headers: { 'Retry-After': '600' },
        json: { error: 'UPSTREAM_RATE_LIMIT' },
      })
    })
    await page.goto('/mining')
    await expect(page.getByRole('alert')).toContainText('Abruflimit')
    const retry = page.getByRole('button', { name: 'Erneut versuchen', exact: true })
    await expect(retry).toBeDisabled()
    await page.clock.fastForward(599_000)
    expect(calls).toBe(1)
    await page.clock.fastForward(1001)
    await expect.poll(() => calls).toBe(2)
  })
})
