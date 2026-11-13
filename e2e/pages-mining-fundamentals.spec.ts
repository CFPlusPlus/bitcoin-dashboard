import { test, expect } from '@playwright/test'
import {
  Miniflare,
  convertV4MiniflareOptions,
  Log,
  LogLevel,
  Response as RuntimeResponse,
} from 'miniflare'
import { resolve } from 'node:path'
import { rawBlock, block } from '../src/test/bitcoin-fixtures'
import { parseBitcoinResponse } from '../shared/bitcoin-validation'

for (const scenario of ['success', 'invalid-difficulty', 'oversized'] as const) {
  test(`compiled block Function supplies mining fundamentals: ${scenario}`, async () => {
    const calls: string[] = []
    const runtime = new Miniflare(
      convertV4MiniflareOptions({
        workers: [
          {
            name: 'pages',
            modules: true,
            scriptPath: resolve('.wrangler/build/index.js'),
            compatibilityDate: '2026-10-26',
            outboundService: async (request) => {
              calls.push(request.url)
              expect(request.url).toBe('https://mempool.space/api/blocks')
              expect(request.headers.has('Cookie')).toBe(false)
              expect(request.headers.has('Authorization')).toBe(false)
              if (scenario === 'oversized') return new RuntimeResponse('x'.repeat(64 * 1024 + 1))
              return RuntimeResponse.json([
                {
                  ...rawBlock,
                  difficulty: scenario === 'invalid-difficulty' ? 0 : rawBlock.difficulty,
                },
              ])
            },
          },
        ],
        log: new Log(LogLevel.NONE),
      }),
    )
    try {
      const response = await runtime.dispatchFetch('http://localhost/api/bitcoin/blocks', {
        headers: { Cookie: 'synthetic-private-cookie', Authorization: 'synthetic-private-auth' },
      })
      expect(response.status).toBe(scenario === 'success' ? 200 : 502)
      expect(response.headers.get('Cache-Control')).toBe('no-store')
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
      expect(response.headers.get('X-Frame-Options')).toBe('DENY')
      expect(response.headers.get('Referrer-Policy')).toBe('no-referrer')
      expect(response.headers.has('Access-Control-Allow-Origin')).toBe(false)
      const body = await response.json()
      if (scenario === 'success') expect(parseBitcoinResponse('blocks', body).data).toEqual([block])
      else expect(body).toEqual({ error: 'UPSTREAM_UNAVAILABLE' })
      expect(calls).toEqual(['https://mempool.space/api/blocks'])
    } finally {
      await runtime.dispose()
    }
  })
}
