import { test, expect } from '@playwright/test'
import {
  Miniflare,
  convertV4MiniflareOptions,
  Log,
  LogLevel,
  Response as RuntimeResponse,
} from 'miniflare'
import { resolve } from 'node:path'
import { rawDominance, rawFearGreed } from '../src/test/market-indicator-fixtures'
import { parseMarketDominance, parseFearGreed } from '../shared/market-validation'

for (const released of [false, true]) {
  test(`compiled indicator Pages routes with intercepted upstream, released=${released}`, async () => {
    const calls: string[] = []
    const runtime = new Miniflare(
      convertV4MiniflareOptions({
        workers: [
          {
            name: 'pages',
            modules: true,
            scriptPath: resolve('.wrangler/build/index.js'),
            compatibilityDate: '2026-10-26',
            bindings: {
              COINGECKO_DEMO_API_KEY: 'synthetic-key',
              MARKET_DOMINANCE_ENABLED: String(released),
              MARKET_FEAR_GREED_ENABLED: String(released),
            },
            outboundService: async (request) => {
              calls.push(request.url)
              expect(request.method).toBe('GET')
              for (const name of ['Cookie', 'Authorization', 'Cf-Access-Jwt-Assertion'])
                expect(request.headers.has(name)).toBe(false)
              if (request.url === 'https://api.coingecko.com/api/v3/global') {
                expect(request.headers.get('x-cg-demo-api-key')).toBe('synthetic-key')
                return RuntimeResponse.json(rawDominance())
              }
              expect(request.url).toBe('https://api.alternative.me/fng/?limit=1&format=json')
              expect(request.headers.has('x-cg-demo-api-key')).toBe(false)
              return RuntimeResponse.json(rawFearGreed())
            },
          },
        ],
        log: new Log(LogLevel.NONE),
      }),
    )
    try {
      for (const resource of ['dominance', 'fear-greed'] as const) {
        const url = `https://dashboard.test/api/market/${resource}`
        const response = await runtime.dispatchFetch(url, {
          headers: {
            Cookie: 'private',
            Authorization: 'private',
            'Cf-Access-Jwt-Assertion': 'private',
          },
        })
        expect(response.status).toBe(released ? 200 : 503)
        expect(response.headers.get('Cache-Control')).toBe('no-store')
        expect(response.headers.has('Access-Control-Allow-Origin')).toBe(false)
        if (released) {
          const result =
            resource === 'dominance'
              ? parseMarketDominance(await response.json())
              : parseFearGreed(await response.json())
          expect(await (await runtime.dispatchFetch(url)).json()).toEqual(result)
        } else expect(await response.json()).toEqual({ error: { code: 'MARKET_NOT_RELEASED' } })
        expect((await runtime.dispatchFetch(url + '?url=https://evil.test')).status).toBe(400)
        const post = await runtime.dispatchFetch(url, { method: 'POST' })
        expect(post.status).toBe(405)
        expect(post.headers.get('Allow')).toBe('GET')
      }
      expect(calls).toHaveLength(released ? 2 : 0)
    } finally {
      await runtime.dispose()
    }
  })
}
