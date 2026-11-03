import { test, expect } from '@playwright/test'
import {
  Miniflare,
  convertV4MiniflareOptions,
  Log,
  LogLevel,
  Response as RuntimeResponse,
} from 'miniflare'
import { resolve } from 'node:path'
import { rawHistory } from '../src/test/market-history-fixtures'
import { rawMarket } from '../src/test/market-fixtures'
import { MARKET_HISTORY_DAYS, type HistoryDays, type Currency } from '../shared/market'
import { parseMarketHistory } from '../shared/market-validation'

for (const scenario of [
  'success',
  'missing-secret',
  'not-released',
  'invalid',
  'rate-limit',
  'timeout',
] as const) {
  test(`historical compiled Pages worker with intercepted Demo upstream: ${scenario}`, async () => {
    let calls = 0
    const runtime = new Miniflare(
      convertV4MiniflareOptions({
        workers: [
          {
            name: 'pages',
            modules: true,
            scriptPath: resolve('.wrangler/build/index.js'),
            compatibilityDate: '2026-10-26',
            bindings: {
              MARKET_SNAPSHOT_ENABLED: 'true',
              MARKET_HISTORY_ENABLED: scenario === 'not-released' ? 'false' : 'true',
              ...(scenario === 'missing-secret' ? {} : { COINGECKO_DEMO_API_KEY: 'synthetic-key' }),
            },
            outboundService: async (request) => {
              calls++
              const url = new URL(request.url)
              expect(url.origin).toBe('https://api.coingecko.com')
              expect(request.headers.get('x-cg-demo-api-key')).toBe('synthetic-key')
              for (const name of ['Cookie', 'Authorization', 'Cf-Access-Jwt-Assertion'])
                expect(request.headers.has(name)).toBe(false)
              if (scenario === 'timeout') await new Promise((resolve) => setTimeout(resolve, 9000))
              if (scenario === 'rate-limit') return new RuntimeResponse('private', { status: 429 })
              if (scenario === 'invalid') return RuntimeResponse.json({ prices: [] })
              if (url.pathname.endsWith('/bitcoin'))
                return RuntimeResponse.json(rawMarket(Date.now()))
              expect(url.pathname).toBe('/api/v3/coins/bitcoin/market_chart')
              expect(url.searchParams.has('interval')).toBe(false)
              return RuntimeResponse.json(
                rawHistory(
                  Date.now(),
                  Number(url.searchParams.get('days')) as HistoryDays,
                  url.searchParams.get('vs_currency') as Currency,
                ),
              )
            },
          },
        ],
        log: new Log(LogLevel.NONE),
      }),
    )
    try {
      const response = await runtime.dispatchFetch(
        'https://dashboard.test/api/market/history?currency=eur&days=30',
        {
          headers: {
            Cookie: 'private-cookie',
            Authorization: 'private-auth',
            'Cf-Access-Jwt-Assertion': 'private-access',
          },
        },
      )
      expect(response.headers.get('Cache-Control')).toBe('no-store')
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
      if (scenario === 'success') {
        expect(response.status).toBe(200)
        const first = parseMarketHistory(await response.json(), 'eur', 30)
        const hit = await runtime.dispatchFetch(
          'https://dashboard.test/api/market/history?days=30&currency=eur',
        )
        expect(await hit.json()).toEqual(first)
        expect(calls).toBe(1)
        for (const currency of ['eur', 'usd'] as const)
          for (const days of MARKET_HISTORY_DAYS) {
            const result = await runtime.dispatchFetch(
              `https://dashboard.test/api/market/history?currency=${currency}&days=${days}`,
            )
            expect(result.status).toBe(200)
            expect(parseMarketHistory(await result.json(), currency, days).data.days).toBe(days)
          }
        expect(calls).toBe(10)
        expect(
          (await runtime.dispatchFetch('https://dashboard.test/api/market/snapshot')).status,
        ).toBe(200)
        expect(calls).toBe(11)
      } else {
        const code =
          scenario === 'missing-secret'
            ? 'MARKET_NOT_CONFIGURED'
            : scenario === 'not-released'
              ? 'MARKET_NOT_RELEASED'
              : scenario === 'rate-limit'
                ? 'UPSTREAM_RATE_LIMIT'
                : scenario === 'timeout'
                  ? 'UPSTREAM_TIMEOUT'
                  : 'UPSTREAM_INVALID_RESPONSE'
        expect(response.status).toBe(
          scenario === 'rate-limit'
            ? 429
            : scenario === 'timeout'
              ? 504
              : scenario === 'missing-secret' || scenario === 'not-released'
                ? 503
                : 502,
        )
        expect(await response.json()).toEqual({
          error: { code, ...(scenario === 'rate-limit' ? { retryAfterSeconds: 600 } : {}) },
        })
        if (scenario === 'rate-limit') {
          expect(
            (await runtime.dispatchFetch('https://dashboard.test/api/market/snapshot')).status,
          ).toBe(429)
          expect(
            (
              await runtime.dispatchFetch(
                'https://dashboard.test/api/market/history?currency=usd&days=7',
              )
            ).status,
          ).toBe(429)
        }
        expect(calls).toBe(scenario === 'missing-secret' || scenario === 'not-released' ? 0 : 1)
      }
      expect(
        (
          await runtime.dispatchFetch(
            'https://dashboard.test/api/market/history?currency=eur&days=30&days=7',
          )
        ).status,
      ).toBe(400)
    } finally {
      await runtime.dispose()
    }
  })
}
