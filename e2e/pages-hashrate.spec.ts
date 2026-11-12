import { test, expect } from '@playwright/test'
import {
  Miniflare,
  convertV4MiniflareOptions,
  Log,
  LogLevel,
  Response as RuntimeResponse,
} from 'miniflare'
import { resolve } from 'node:path'
import { parseHashrate } from '../shared/hashrate'

for (const scenario of ['disabled', 'success', 'rate-limit', 'invalid'] as const) {
  test(`compiled hashrate Function: ${scenario}, fixed provider and release gate`, async () => {
    let calls = 0
    const runtime = new Miniflare(
      convertV4MiniflareOptions({
        workers: [
          {
            name: 'pages',
            modules: true,
            scriptPath: resolve('.wrangler/build/index.js'),
            compatibilityDate: '2026-10-26',
            bindings: { MINING_HASHRATE_ENABLED: String(scenario !== 'disabled') },
            outboundService: async (request) => {
              calls++
              expect(request.url).toBe('https://mempool.space/api/v1/mining/hashrate/1m')
              for (const header of ['Cookie', 'Authorization', 'Cf-Access-Jwt-Assertion'])
                expect(request.headers.has(header)).toBe(false)
              return scenario === 'rate-limit'
                ? new RuntimeResponse('private', { status: 429 })
                : RuntimeResponse.json({ currentHashrate: scenario === 'invalid' ? 0 : 1.05e21 })
            },
          },
        ],
        log: new Log(LogLevel.NONE),
      }),
    )
    try {
      const url = 'https://dashboard.test/api/mining/hashrate'
      const response = await runtime.dispatchFetch(url, {
        headers: { Cookie: 'private', 'Cf-Access-Jwt-Assertion': 'private' },
      })
      expect(response.status).toBe(
        scenario === 'disabled'
          ? 503
          : scenario === 'rate-limit'
            ? 429
            : scenario === 'invalid'
              ? 502
              : 200,
      )
      expect(response.headers.get('Cache-Control')).toBe('no-store')
      if (scenario === 'success') {
        const value = parseHashrate(await response.json())
        expect(value.data.hashesPerSecond).toBe(1.05e21)
        expect(await (await runtime.dispatchFetch(url)).json()).toEqual(value)
      }
      if (scenario === 'rate-limit') expect((await runtime.dispatchFetch(url)).status).toBe(429)
      expect((await runtime.dispatchFetch(url + '?url=https://evil.test')).status).toBe(400)
      expect((await runtime.dispatchFetch(url, { method: 'POST' })).status).toBe(405)
      expect(calls).toBe(scenario === 'disabled' ? 0 : 1)
    } finally {
      await runtime.dispose()
    }
  })
}
