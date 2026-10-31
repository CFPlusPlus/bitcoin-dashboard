import { test as base, expect } from '@playwright/test'
import type { BitcoinResources } from '../shared/bitcoin'
import { block, difficulty } from '../src/test/bitcoin-fixtures'
import { marketSnapshot } from '../src/test/market-fixtures'

const resources: BitcoinResources = {
  'difficulty-adjustment': difficulty,
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
export const test = base.extend<{ browserDiagnostics: void; apiStatus: number }>({
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
          (message.location().url.startsWith('http://127.0.0.1:8799/api/bitcoin/') ||
            message.location().url === 'http://127.0.0.1:8799/api/market/snapshot')
        if (message.type() === 'error' && !expectedHttpError) errors.push(message.text())
      })
      await page.route('**/*', async (route) => {
        const url = new URL(route.request().url())
        if (url.origin !== 'http://127.0.0.1:8799') {
          errors.push(`Unexpected external request: ${url.origin}${url.pathname}`)
          await route.abort()
        } else if (url.pathname.startsWith('/api/')) {
          if (url.pathname === '/api/market/snapshot') {
            await route.fulfill({ json: marketSnapshot() })
            return
          }
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

export { expect }
