import { test, expect } from '@playwright/test'
import {
  Miniflare,
  convertV4MiniflareOptions,
  Log,
  LogLevel,
  Response as RuntimeResponse,
} from 'miniflare'
import { resolve } from 'node:path'
import { rawMarket } from '../src/test/market-fixtures'
import { parseMarketSnapshot } from '../shared/market-validation'
import { MARKET_LIMITS } from '../shared/market'
import { COINGECKO_SNAPSHOT_URL } from '../functions/lib/coingecko'

for (const scenario of [
  'success',
  'missing-secret',
  'not-released',
  'invalid',
  'rate-limit',
  'forbidden',
  'oversized',
  'timeout',
] as const) {
  test(`market compiled Pages worker with intercepted Demo upstream: ${scenario}`, async () => {
    const requests: string[] = []
    const runtime = new Miniflare(
      convertV4MiniflareOptions({
        workers: [
          {
            name: 'pages',
            modules: true,
            scriptPath: resolve('.wrangler/build/index.js'),
            compatibilityDate: '2026-10-26',
            bindings: {
              MARKET_SNAPSHOT_ENABLED: scenario === 'not-released' ? 'false' : 'true',
              ...(scenario === 'missing-secret' ? {} : { COINGECKO_DEMO_API_KEY: 'synthetic-key' }),
            },
            outboundService: async (request) => {
              requests.push(request.url)
              expect(request.url).toBe(COINGECKO_SNAPSHOT_URL)
              expect(request.headers.get('x-cg-demo-api-key')).toBe('synthetic-key')
              for (const name of ['Cookie', 'Authorization', 'Cf-Access-Jwt-Assertion'])
                expect(request.headers.has(name)).toBe(false)
              if (scenario === 'timeout') await new Promise((resolve) => setTimeout(resolve, 9000))
              if (scenario === 'rate-limit') return new RuntimeResponse('private', { status: 429 })
              if (scenario === 'forbidden') return new RuntimeResponse('private', { status: 403 })
              if (scenario === 'oversized')
                return new RuntimeResponse('x'.repeat(MARKET_LIMITS.rawBytes + 1), {
                  headers: { 'Content-Type': 'application/json' },
                })
              return RuntimeResponse.json(scenario === 'invalid' ? {} : rawMarket(Date.now()))
            },
          },
        ],
        log: new Log(LogLevel.NONE),
      }),
    )
    try {
      const response = await runtime.dispatchFetch('http://localhost/api/market/snapshot', {
        headers: {
          Cookie: 'private-cookie',
          Authorization: 'private-auth',
          'Cf-Access-Jwt-Assertion': 'private-access',
        },
      })
      expect(response.headers.get('Cache-Control')).toBe('no-store')
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
      expect(response.headers.has('Access-Control-Allow-Origin')).toBe(false)
      const code =
        scenario === 'missing-secret'
          ? 'MARKET_NOT_CONFIGURED'
          : scenario === 'not-released'
            ? 'MARKET_NOT_RELEASED'
            : scenario === 'rate-limit'
              ? 'UPSTREAM_RATE_LIMIT'
              : scenario === 'forbidden'
                ? 'UPSTREAM_CONFIGURATION'
                : scenario === 'timeout'
                  ? 'UPSTREAM_TIMEOUT'
                  : 'UPSTREAM_INVALID_RESPONSE'
      expect(response.status).toBe(
        scenario === 'success'
          ? 200
          : scenario === 'missing-secret' || scenario === 'not-released'
            ? 503
            : scenario === 'rate-limit'
              ? 429
              : scenario === 'timeout'
                ? 504
                : 502,
      )
      if (scenario === 'success')
        expect(parseMarketSnapshot(await response.json()).data.quotes.usd.price).toBe(80_000)
      else
        expect(await response.json()).toEqual({
          error: { code, ...(scenario === 'rate-limit' ? { retryAfterSeconds: 600 } : {}) },
        })
      expect(response.headers.get('Retry-After')).toBe(scenario === 'rate-limit' ? '600' : null)
      expect(
        (await runtime.dispatchFetch('http://localhost/api/market/snapshot?currency=eur')).status,
      ).toBe(400)
      expect((await runtime.dispatchFetch('http://localhost/api/market/history')).status).toBe(404)
      const post = await runtime.dispatchFetch('http://localhost/api/market/snapshot', {
        method: 'POST',
      })
      expect(post.status).toBe(405)
      expect(post.headers.get('Allow')).toBe('GET')
      expect(requests).toHaveLength(
        scenario === 'missing-secret' || scenario === 'not-released' ? 0 : 1,
      )
    } finally {
      await runtime.dispose()
    }
  })
}
