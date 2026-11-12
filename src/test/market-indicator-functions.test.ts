// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMarketHandler } from '../../functions/api/market/[resource]'
import { COINGECKO_DOMINANCE_URL } from '../../functions/lib/coingecko'
import { FEAR_GREED_URL } from '../../functions/lib/alternative'
import { INDICATOR_LIMITS, INDICATOR_POLICY, type MarketIndicator } from '../../shared/market'
import { rawDominance, rawFearGreed } from './market-indicator-fixtures'
import { rawMarket } from './market-fixtures'

let handler = createMarketHandler()
const enabled = {
  COINGECKO_DEMO_API_KEY: 'synthetic-key',
  MARKET_DOMINANCE_ENABLED: 'true',
  MARKET_FEAR_GREED_ENABLED: 'true',
  MARKET_SNAPSHOT_ENABLED: 'true',
  MARKET_HISTORY_ENABLED: 'true',
}
function context(
  resource: string,
  env: Partial<typeof enabled> = enabled,
  method = 'GET',
  search = '',
): Parameters<typeof handler>[0] {
  return {
    request: new Request(`https://dashboard.test/api/market/${resource}${search}`, {
      method,
      headers: {
        Cookie: 'private-cookie',
        Authorization: 'private-auth',
        'Cf-Access-Jwt-Assertion': 'private-jwt',
      },
    }),
    params: { resource },
    functionPath: `/api/market/${resource}`,
    env: { ...env, ASSETS: { fetch: vi.fn<typeof fetch>() } },
    waitUntil: vi.fn(),
    passThroughOnException: vi.fn(),
    next: vi.fn(async () => new Response()),
    data: {},
  }
}
function upstream() {
  return vi
    .fn()
    .mockImplementation((url: string) =>
      Promise.resolve(
        Response.json(
          url === FEAR_GREED_URL
            ? rawFearGreed()
            : url === COINGECKO_DOMINANCE_URL
              ? rawDominance()
              : rawMarket(Date.now()),
        ),
      ),
    )
}
beforeEach(() => {
  handler = createMarketHandler()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

for (const resource of ['dominance', 'fear-greed'] as MarketIndicator[]) {
  describe(`${resource} safe Pages route`, () => {
    it('makes one fixed request, with only its own headers and security response headers', async () => {
      const fetcher = upstream()
      vi.stubGlobal('fetch', fetcher)
      const response = await handler(context(resource))
      expect(response.status).toBe(200)
      expect(fetcher).toHaveBeenCalledExactlyOnceWith(
        resource === 'dominance' ? COINGECKO_DOMINANCE_URL : FEAR_GREED_URL,
        expect.objectContaining({
          method: 'GET',
          cache: 'no-store',
          redirect: 'manual',
          headers:
            resource === 'dominance'
              ? { Accept: 'application/json', 'x-cg-demo-api-key': 'synthetic-key' }
              : { Accept: 'application/json' },
        }),
      )
      expect(response.headers.get('Cache-Control')).toBe('no-store')
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
      expect(response.headers.get('X-Frame-Options')).toBe('DENY')
      expect(response.headers.has('Access-Control-Allow-Origin')).toBe(false)
      expect(response.headers.has('Set-Cookie')).toBe(false)
    })
    it('blocks unapproved gates even with a warm cache, and rejects parameters and methods', async () => {
      const fetcher = upstream()
      vi.stubGlobal('fetch', fetcher)
      await handler(context(resource))
      const flag =
        resource === 'dominance' ? 'MARKET_DOMINANCE_ENABLED' : 'MARKET_FEAR_GREED_ENABLED'
      for (const value of [undefined, 'false', 'TRUE']) {
        const response = await handler(context(resource, { ...enabled, [flag]: value }))
        expect(response.status).toBe(503)
        expect(await response.json()).toEqual({ error: { code: 'MARKET_NOT_RELEASED' } })
      }
      expect(
        (await handler(context(resource, undefined, 'GET', '?url=https://evil.test'))).status,
      ).toBe(400)
      for (const method of ['POST', 'PUT', 'HEAD', 'OPTIONS']) {
        const response = await handler(context(resource, undefined, method))
        expect(response.status).toBe(405)
        expect(response.headers.get('Allow')).toBe('GET')
      }
      expect(fetcher).toHaveBeenCalledOnce()
    })
    it.each([
      [429, 'UPSTREAM_RATE_LIMIT'],
      [500, 'UPSTREAM_UNAVAILABLE'],
      [401, 'UPSTREAM_CONFIGURATION'],
      [302, 'UPSTREAM_INVALID_RESPONSE'],
    ])('maps provider status %s without disclosing diagnostics', async (status, code) => {
      const fetcher = vi
        .fn()
        .mockResolvedValue(new Response('private synthetic-key', { status: status as number }))
      vi.stubGlobal('fetch', fetcher)
      const response = await handler(context(resource))
      expect(response.status).toBe(status === 429 ? 429 : 502)
      expect(await response.json()).toEqual({
        error: { code, ...(status === 429 ? { retryAfterSeconds: 600 } : {}) },
      })
      expect(response.headers.get('Retry-After')).toBe(status === 429 ? '600' : null)
      expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toMatch(
        /private|synthetic|https/,
      )
      expect(fetcher).toHaveBeenCalledOnce()
    })
    it.each(['schema', 'json', 'html', 'bytes', 'stream', 'utf8'])(
      'rejects invalid transport or data: %s',
      async (kind) => {
        const response =
          kind === 'schema'
            ? Response.json({})
            : kind === 'html'
              ? new Response('<html>private</html>')
              : kind === 'bytes'
                ? new Response('{}', {
                    headers: {
                      'Content-Type': 'application/json',
                      'Content-Length': String(INDICATOR_LIMITS.rawBytes + 1),
                    },
                  })
                : kind === 'utf8'
                  ? new Response(new Uint8Array([0xff]), {
                      headers: { 'Content-Type': 'application/json' },
                    })
                  : new Response(
                      kind === 'stream' ? ' '.repeat(INDICATOR_LIMITS.rawBytes + 1) : '{',
                      { headers: { 'Content-Type': 'application/json' } },
                    )
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response))
        expect(await (await handler(context(resource))).json()).toEqual({
          error: { code: 'UPSTREAM_INVALID_RESPONSE' },
        })
      },
    )
    it('isolates network failures and does not cache them', async () => {
      const fetcher = upstream().mockRejectedValueOnce(new Error('private secret'))
      vi.stubGlobal('fetch', fetcher)
      expect((await handler(context(resource))).status).toBe(502)
      expect((await handler(context(resource))).status).toBe(200)
      expect(fetcher).toHaveBeenCalledTimes(2)
    })
    it.each(['headers', 'body'])('enforces the full request deadline during %s', async (phase) => {
      const timeout = new AbortController()
      vi.spyOn(AbortSignal, 'timeout').mockReturnValue(timeout.signal)
      const cancel = vi.fn()
      vi.stubGlobal(
        'fetch',
        vi.fn().mockImplementation((_url, init: RequestInit) =>
          phase === 'headers'
            ? new Promise((_resolve, reject) =>
                init.signal?.addEventListener('abort', () => reject(new Error('private'))),
              )
            : Promise.resolve(
                new Response(new ReadableStream({ pull: () => new Promise(() => {}), cancel }), {
                  headers: { 'Content-Type': 'application/json' },
                }),
              ),
        ),
      )
      const pending = handler(context(resource))
      await Promise.resolve()
      await Promise.resolve()
      await Promise.resolve()
      timeout.abort()
      const response = await pending
      expect(response.status).toBe(504)
      expect(await response.json()).toEqual({ error: { code: 'UPSTREAM_TIMEOUT' } })
      if (phase === 'body') expect(cancel).toHaveBeenCalledOnce()
    })
    it('coalesces concurrent loads, preserves original dates on hits and expires exactly at TTL', async () => {
      vi.useFakeTimers()
      const fetcher = upstream()
      vi.stubGlobal('fetch', fetcher)
      const responses = await Promise.all([handler(context(resource)), handler(context(resource))])
      const first = await responses[0].json()
      expect(await responses[1].json()).toEqual(first)
      await vi.advanceTimersByTimeAsync(INDICATOR_POLICY[resource].ttlMs - 1)
      expect(await (await handler(context(resource))).json()).toEqual(first)
      expect(fetcher).toHaveBeenCalledOnce()
      await vi.advanceTimersByTimeAsync(1)
      expect(await (await handler(context(resource))).json()).not.toEqual(first)
      expect(fetcher).toHaveBeenCalledTimes(2)
      handler = createMarketHandler()
      await handler(context(resource))
      expect(fetcher).toHaveBeenCalledTimes(3)
    })
  })
}
describe('configuration and provider isolation', () => {
  it('requires the CoinGecko secret for dominance but no secret for Alternative.me', async () => {
    const fetcher = upstream()
    vi.stubGlobal('fetch', fetcher)
    expect(
      await (await handler(context('dominance', { MARKET_DOMINANCE_ENABLED: 'true' }))).json(),
    ).toEqual({ error: { code: 'MARKET_NOT_CONFIGURED' } })
    expect(
      (await handler(context('fear-greed', { MARKET_FEAR_GREED_ENABLED: 'true' }))).status,
    ).toBe(200)
    expect(fetcher).toHaveBeenCalledOnce()
  })
  it('shares a CoinGecko cooldown across dominance, snapshot and history, independently of Alternative.me', async () => {
    vi.useFakeTimers()
    const fetcher = upstream().mockResolvedValueOnce(new Response('private', { status: 429 }))
    vi.stubGlobal('fetch', fetcher)
    expect((await handler(context('dominance'))).status).toBe(429)
    expect((await handler(context('snapshot'))).status).toBe(429)
    expect(
      (await handler(context('history', undefined, 'GET', '?currency=eur&days=30'))).status,
    ).toBe(429)
    expect((await handler(context('fear-greed'))).status).toBe(200)
    expect(fetcher).toHaveBeenCalledTimes(2)
    await vi.advanceTimersByTimeAsync(600_000)
    expect((await handler(context('dominance'))).status).toBe(200)
  })
  it('does not let an Alternative.me rate limit suppress CoinGecko, and keeps valid cache hits available', async () => {
    const fetcher = upstream()
    vi.stubGlobal('fetch', fetcher)
    await handler(context('dominance'))
    fetcher.mockResolvedValueOnce(new Response('private', { status: 429 }))
    expect((await handler(context('fear-greed'))).status).toBe(429)
    expect((await handler(context('fear-greed'))).status).toBe(429)
    expect((await handler(context('snapshot'))).status).toBe(200)
    expect((await handler(context('dominance'))).status).toBe(200)
    expect(fetcher).toHaveBeenCalledTimes(3)
  })
})
