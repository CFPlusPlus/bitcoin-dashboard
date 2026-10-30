import { test as base, expect } from '@playwright/test'
import type { BitcoinResources } from '../shared/bitcoin'
import { block } from '../src/test/bitcoin-fixtures'

const resources: BitcoinResources = {
  height: { height: 900000 },
  'latest-block': block,
  blocks: [block],
  fees: { fastest: 2, halfHour: 1.5, hour: 1, economy: 0.5, minimum: 0.1 },
  mempool: {
    transactionCount: 123,
    virtualSizeBytes: 456789,
    totalFeeSats: 9876,
    feeHistogram: [{ feeRate: 0.1, virtualSizeBytes: 1234 }],
  },
}

// Every UI test is isolated, mocks same-origin data and rejects unexpected traffic/errors.
const test = base.extend<{ browserDiagnostics: void; apiStatus: number }>({
  apiStatus: [200, { option: true }],
  browserDiagnostics: [
    async ({ page, apiStatus }, use) => {
      const errors: string[] = []
      page.on('pageerror', (error) => errors.push(error.message))
      page.on('console', (message) => {
        const expectedHttpError =
          apiStatus !== 200 &&
          new RegExp(
            `Failed to load resource: the server responded with a status of ${apiStatus}\\b`,
          ).test(message.text()) &&
          message.location().url.startsWith('http://127.0.0.1:8799/api/bitcoin/')
        if (message.type() === 'error' && !expectedHttpError) errors.push(message.text())
      })
      await page.route('**/*', async (route) => {
        const url = new URL(route.request().url())
        if (url.origin !== 'http://127.0.0.1:8799') {
          errors.push(`Unexpected external request: ${url.origin}${url.pathname}`)
          await route.abort()
        } else if (url.pathname.startsWith('/api/')) {
          const resource = url.pathname.replace('/api/bitcoin/', '')
          if (!Object.hasOwn(resources, resource)) {
            errors.push(`Unmocked API request: ${url.pathname}`)
            await route.abort()
            return
          }
          await route.fulfill({
            status: apiStatus,
            json:
              apiStatus === 200
                ? {
                    data: resources[resource as keyof BitcoinResources],
                    source: 'mempool.space',
                    updatedAt: '2026-10-30T10:00:00.000Z',
                  }
                : { error: 'CONTROLLED_TEST_ERROR' },
          })
        } else await route.continue()
      })
      await use()
      expect(errors, 'Unexpected browser errors or external requests').toEqual([])
    },
    { auto: true },
  ],
})

const views = [
  ['/', 'Übersicht'],
  ['/market', 'Markt'],
  ['/blockchain', 'Blockchain'],
  ['/mining', 'Netzwerk & Mining'],
] as const

test('home renders data and navigation reaches all four views', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Übersicht', exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: '900.000', exact: true })).toBeVisible()
  await expect(page.getByRole('alert')).toHaveCount(0)
  for (const [path, title] of [...views.slice(1), views[0]]) {
    await page.getByRole('navigation').getByRole('link', { name: title, exact: true }).click()
    await expect(page).toHaveURL(path)
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible()
    await expect(
      page.getByRole('navigation').getByRole('link', { name: title, exact: true }),
    ).toHaveAttribute('aria-current', 'page')
  }
})

for (const [path, title] of views.slice(1)) {
  test(`direct entry and reload: ${path}`, async ({ page }) => {
    const response = await page.goto(path)
    expect(response?.status()).toBe(200)
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible()
    await page.reload()
    await expect(page).toHaveURL(path)
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible()
  })
}

test('unknown frontend route renders React 404 and a working return link', async ({ page }) => {
  await page.goto('/does-not-exist/deep-link')
  await expect(page.getByRole('heading', { name: 'Seite nicht gefunden' })).toBeVisible()
  await page.getByRole('link', { name: 'Zur Übersicht', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Übersicht', exact: true })).toBeVisible()
})

for (const status of [401, 403, 502, 504]) {
  test.describe(`API ${status}`, () => {
    test.use({ apiStatus: status })
    test('preserves the application and navigation', async ({ page }) => {
      await page.goto('/blockchain')
      await expect(page.getByRole('alert').first()).toContainText(
        status < 500 ? 'Zugriff verweigert' : 'Daten konnten nicht geladen werden',
      )
      await expect(
        page.getByRole('button', { name: 'Erneut versuchen', exact: true }).first(),
      ).toBeVisible()
      await page.getByRole('navigation').getByRole('link', { name: 'Markt', exact: true }).click()
      await expect(page.getByRole('heading', { name: 'Markt', exact: true })).toBeVisible()
    })
  })
}

test('light and dark themes persist after reload', async ({ page }) => {
  await page.goto('/mining')
  await expect(page.locator('html')).toHaveClass(/dark/)
  await page.getByRole('button', { name: 'Light Mode aktivieren' }).click()
  await expect(page.locator('html')).not.toHaveClass(/dark/)
  await page.reload()
  await expect(page.getByRole('button', { name: 'Dark Mode aktivieren' })).toBeVisible()
  await expect(page.locator('html')).not.toHaveClass(/dark/)
  await page.getByRole('button', { name: 'Dark Mode aktivieren' }).click()
  await page.reload()
  await expect(page.locator('html')).toHaveClass(/dark/)
})
