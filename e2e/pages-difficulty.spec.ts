import { test, expect } from '@playwright/test'
import {
  Miniflare,
  convertV4MiniflareOptions,
  Log,
  LogLevel,
  Response as RuntimeResponse,
} from 'miniflare'
import { resolve } from 'node:path'
import { difficulty, rawDifficulty } from '../src/test/bitcoin-fixtures'
import { parseBitcoinResponse } from '../shared/bitcoin-validation'

// Execute Wrangler's compiled Pages router in the same local workerd runtime.
// Every outbound request is intercepted at the runtime boundary, never the internet.
for (const scenario of ['success', 'invalid', 'rate-limit', 'oversized', 'timeout'] as const) {
  test(`DA-25 real Pages worker with deterministic upstream: ${scenario}`, async () => {
    const upstreamRequests: string[] = []
    const runtime = new Miniflare(
      convertV4MiniflareOptions({
        workers: [
          {
            name: 'pages',
            modules: true,
            scriptPath: resolve('.wrangler/build/index.js'),
            compatibilityDate: '2026-10-26',
            outboundService: async (request) => {
              upstreamRequests.push(request.url)
              if (
                request.url !== 'https://mempool.space/api/v1/difficulty-adjustment' ||
                request.method !== 'GET' ||
                request.headers.has('Cookie') ||
                request.headers.has('Authorization')
              )
                return new RuntimeResponse('Unexpected upstream request', { status: 418 })
              if (scenario === 'timeout') await new Promise((resolve) => setTimeout(resolve, 9000))
              if (scenario === 'rate-limit')
                return new RuntimeResponse('private', {
                  status: 429,
                  headers: { 'Retry-After': '9999999' },
                })
              if (scenario === 'oversized') return new RuntimeResponse('x'.repeat(4097))
              return RuntimeResponse.json(
                scenario === 'invalid' ? { difficultyChange: null } : rawDifficulty,
              )
            },
          },
        ],
        log: new Log(LogLevel.NONE),
      }),
    )
    try {
      const response = await runtime.dispatchFetch(
        'http://localhost/api/bitcoin/difficulty-adjustment',
        { headers: { Cookie: 'private-test', Authorization: 'private-test' } },
      )
      expect(response.status).toBe(
        scenario === 'success'
          ? 200
          : scenario === 'rate-limit'
            ? 429
            : scenario === 'timeout'
              ? 504
              : 502,
      )
      expect(response.headers.get('Content-Type')).toContain('application/json')
      expect(response.headers.get('Cache-Control')).toBe('no-store')
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
      expect(response.headers.get('X-Frame-Options')).toBe('DENY')
      expect(response.headers.get('Referrer-Policy')).toBe('no-referrer')
      expect(response.headers.has('Access-Control-Allow-Origin')).toBe(false)
      const body = await response.json()
      if (scenario === 'success')
        expect(parseBitcoinResponse('difficulty-adjustment', body).data).toEqual(difficulty)
      else
        expect(body).toEqual({
          error:
            scenario === 'rate-limit'
              ? 'UPSTREAM_RATE_LIMIT'
              : scenario === 'timeout'
                ? 'UPSTREAM_TIMEOUT'
                : 'UPSTREAM_UNAVAILABLE',
        })
      if (scenario === 'rate-limit') expect(response.headers.get('Retry-After')).toBe('600')
      const rejected = await runtime.dispatchFetch(
        'http://localhost/api/bitcoin/difficulty-adjustment',
        { method: 'POST' },
      )
      expect(rejected.status).toBe(405)
      expect(rejected.headers.get('Allow')).toBe('GET')
      expect(upstreamRequests).toEqual(['https://mempool.space/api/v1/difficulty-adjustment'])
    } finally {
      await runtime.dispose()
    }
  })
}
