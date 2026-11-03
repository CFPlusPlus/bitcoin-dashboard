// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMarketHandler } from '../../functions/api/market/[resource]'
import { fetchMarketHistory, coinGeckoHistoryUrl } from '../../functions/lib/coingecko'
import {
  HISTORY_LIMITS,
  HISTORY_TTL_MS,
  MARKET_HISTORY_DAYS,
  type HistoryDays,
  type Currency,
} from '../../shared/market'
import { rawHistory } from './market-history-fixtures'

let onRequest = createMarketHandler()
function context(
  search = '?currency=eur&days=30',
  env: {
    COINGECKO_DEMO_API_KEY?: string
    MARKET_HISTORY_ENABLED?: string
    MARKET_SNAPSHOT_ENABLED?: string
  } = {
    COINGECKO_DEMO_API_KEY: 'synthetic-key',
    MARKET_HISTORY_ENABLED: 'true',
    MARKET_SNAPSHOT_ENABLED: 'true',
  },
  method = 'GET',
  resource = 'history',
): Parameters<typeof onRequest>[0] {
  return {
    request: new Request(`https://dashboard.test/api/market/${resource}${search}`, {
      method,
      headers: {
        Cookie: 'private-cookie',
        Authorization: 'private-auth',
        'Cf-Access-Jwt-Assertion': 'private-access',
      },
    }),
    params: { resource },
    env: { ...env, ASSETS: { fetch: vi.fn<typeof fetch>() } },
    functionPath: `/api/market/${resource}`,
    waitUntil: vi.fn(),
    passThroughOnException: vi.fn(),
    next: vi.fn(async () => new Response()),
    data: {},
  }
}
const fetcher = () =>
  vi.fn().mockImplementation((input: string) => {
    const url = new URL(input)
    return Promise.resolve(
      Response.json(
        rawHistory(
          Date.now(),
          Number(url.searchParams.get('days')) as HistoryDays,
          url.searchParams.get('vs_currency') as Currency,
        ),
      ),
    )
  })
beforeEach(() => {
  onRequest = createMarketHandler()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('historical Pages route and safe provider requests', () => {
  for (const currency of ['eur', 'usd'] as const)
    it.each(MARKET_HISTORY_DAYS)(
      `serves ${currency}/%s with only validated parameters`,
      async (days) => {
        const upstream = fetcher()
        vi.stubGlobal('fetch', upstream)
        const response = await onRequest(context(`?currency=${currency}&days=${days}`))
        expect(response.status).toBe(200)
        expect(await response.json()).toMatchObject({
          data: { asset: 'BTC', currency, days },
          source: 'coingecko',
        })
        expect(upstream).toHaveBeenCalledExactlyOnceWith(
          coinGeckoHistoryUrl(currency, days),
          expect.objectContaining({
            method: 'GET',
            redirect: 'manual',
            cache: 'no-store',
            headers: { Accept: 'application/json', 'x-cg-demo-api-key': 'synthetic-key' },
          }),
        )
        expect(response.headers.get('Cache-Control')).toBe('no-store')
        expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
        expect(response.headers.has('Set-Cookie')).toBe(false)
      },
    )
  it.each([
    '',
    '?currency=gbp&days=30',
    '?currency=EUR&days=30',
    '?currency=eur&days=2',
    '?currency=eur&days=max',
    '?currency=eur&days=030',
    '?currency=eur&days=1e0',
    '?currency=eur&days=30&url=https://evil.test',
    '?currency=eur&currency=usd&days=30',
    '?currency=eur&days=30&days=30',
    '?days=30',
    '?currency=eur',
    '?currency=eur&days=',
    '?currency=eur&days=366',
  ])('rejects invalid parameters %s before provider access', async (search) => {
    const upstream = vi.fn()
    vi.stubGlobal('fetch', upstream)
    const response = await onRequest(context(search))
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: { code: 'INVALID_REQUEST' } })
    expect(upstream).not.toHaveBeenCalled()
  })
  it.each([
    [{ MARKET_HISTORY_ENABLED: 'true' }, 'MARKET_NOT_CONFIGURED'],
    [{ COINGECKO_DEMO_API_KEY: ' ', MARKET_HISTORY_ENABLED: 'true' }, 'MARKET_NOT_CONFIGURED'],
    [
      { COINGECKO_DEMO_API_KEY: 'synthetic-key', MARKET_SNAPSHOT_ENABLED: 'true' },
      'MARKET_NOT_RELEASED',
    ],
    [
      { COINGECKO_DEMO_API_KEY: 'synthetic-key', MARKET_HISTORY_ENABLED: 'false' },
      'MARKET_NOT_RELEASED',
    ],
  ])('requires its own explicit gate %s', async (env, code) => {
    const upstream = vi.fn()
    vi.stubGlobal('fetch', upstream)
    const response = await onRequest(context(undefined, env))
    expect(response.status).toBe(503)
    expect(await response.json()).toEqual({ error: { code } })
    expect(upstream).not.toHaveBeenCalled()
  })
  it('checks gate and secret before serving a warm cache; rejects other methods', async () => {
    const upstream = fetcher()
    vi.stubGlobal('fetch', upstream)
    await onRequest(context())
    expect(
      (await onRequest(context(undefined, { COINGECKO_DEMO_API_KEY: 'synthetic-key' }))).status,
    ).toBe(503)
    expect((await onRequest(context(undefined, {}))).status).toBe(503)
    const post = await onRequest(context(undefined, undefined, 'POST'))
    expect(post.status).toBe(405)
    expect(post.headers.get('Allow')).toBe('GET')
    expect(upstream).toHaveBeenCalledOnce()
  })
  it.each([
    [401, 'UPSTREAM_CONFIGURATION'],
    [403, 'UPSTREAM_CONFIGURATION'],
    [500, 'UPSTREAM_UNAVAILABLE'],
    [503, 'UPSTREAM_UNAVAILABLE'],
    [302, 'UPSTREAM_INVALID_RESPONSE'],
    [429, 'UPSTREAM_RATE_LIMIT'],
  ])('maps provider %s without exposing private error bodies', async (status, code) => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(new Response('private synthetic-key', { status: status as number })),
    )
    const response = await onRequest(context())
    expect(response.status).toBe(status === 429 ? 429 : 502)
    expect(await response.json()).toEqual({
      error: { code, ...(status === 429 ? { retryAfterSeconds: 600 } : {}) },
    })
    expect(response.headers.get('Retry-After')).toBe(status === 429 ? '600' : null)
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toMatch(/private|synthetic-key/)
  })
  it.each([
    'json',
    'html',
    'content-type',
    'length',
    'stream',
    'utf8',
    'empty',
    'negative',
    'timestamp',
  ])('rejects invalid provider body %s', async (kind) => {
    const headers = { 'Content-Type': 'application/json' }
    const raw = rawHistory(Date.now())
    if (kind === 'empty') raw.prices = []
    if (kind === 'negative') raw.prices[1][1] = -1
    if (kind === 'timestamp') raw.prices[1][0] = 1
    const response =
      kind === 'json'
        ? new Response('{', { headers })
        : kind === 'html'
          ? new Response('<html>login</html>')
          : kind === 'content-type'
            ? new Response('{}', { headers: { 'Content-Type': 'text/application/json-fake' } })
            : kind === 'length'
              ? new Response('x', {
                  headers: { ...headers, 'Content-Length': String(HISTORY_LIMITS.rawBytes + 1) },
                })
              : kind === 'stream'
                ? new Response('x'.repeat(HISTORY_LIMITS.rawBytes + 1), { headers })
                : kind === 'utf8'
                  ? new Response(new Uint8Array([0xc3, 0x28]), { headers })
                  : Response.json(raw)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response))
    const result = await onRequest(context())
    expect(result.status).toBe(502)
    expect(await result.json()).toEqual({ error: { code: 'UPSTREAM_INVALID_RESPONSE' } })
  })
  it('maps network errors without a provider retry', async () => {
    const upstream = vi.fn().mockRejectedValue(new Error('private'))
    vi.stubGlobal('fetch', upstream)
    const response = await onRequest(context())
    expect(await response.json()).toEqual({ error: { code: 'UPSTREAM_UNAVAILABLE' } })
    expect(upstream).toHaveBeenCalledOnce()
  })
  it.each(['headers', 'body'])(
    'times out during %s with no retries and cancellation',
    async (phase) => {
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
      const pending = onRequest(context())
      await Promise.resolve()
      await Promise.resolve()
      await Promise.resolve()
      timeout.abort()
      const response = await pending
      expect(response.status).toBe(504)
      expect(await response.json()).toEqual({ error: { code: 'UPSTREAM_TIMEOUT' } })
      if (phase === 'body') expect(cancel).toHaveBeenCalledOnce()
    },
  )
  it('validates typed arguments before constructing provider URLs', async () => {
    expect(() => coinGeckoHistoryUrl('gbp' as Currency, 30)).toThrow()
    expect(() => fetchMarketHistory('synthetic-key', 'eur', 366 as HistoryDays)).toThrow()
  })
})

describe('bounded isolate cache (no cross-isolate guarantee)', () => {
  it('deduplicates concurrent requests, caches normalized public data and separates both dimensions', async () => {
    const upstream = fetcher()
    vi.stubGlobal('fetch', upstream)
    const responses = await Promise.all([onRequest(context()), onRequest(context())])
    expect(await responses[0].json()).toEqual(await responses[1].json())
    await onRequest(context())
    expect(upstream).toHaveBeenCalledOnce()
    await onRequest(context('?currency=usd&days=30'))
    await onRequest(context('?days=7&currency=eur'))
    expect(upstream).toHaveBeenCalledTimes(3)
  })
  it.each(MARKET_HISTORY_DAYS)(
    'expires %s-day cache at the documented TTL without changing original retrieval time',
    async (days) => {
      vi.useFakeTimers()
      const upstream = fetcher()
      vi.stubGlobal('fetch', upstream)
      const search = `?currency=eur&days=${days}`
      const first = await (await onRequest(context(search))).json()
      await vi.advanceTimersByTimeAsync(HISTORY_TTL_MS[days] - 1)
      expect(await (await onRequest(context(search))).json()).toEqual(first)
      expect(upstream).toHaveBeenCalledOnce()
      await vi.advanceTimersByTimeAsync(1)
      expect(await (await onRequest(context(search))).json()).not.toEqual(first)
      expect(upstream).toHaveBeenCalledTimes(2)
    },
  )
  it('shares a provider cooldown with snapshot, keeps valid cached data and never caches failures', async () => {
    vi.useFakeTimers()
    const upstream = fetcher()
    vi.stubGlobal('fetch', upstream)
    await onRequest(context())
    upstream.mockResolvedValueOnce(new Response('private', { status: 429 }))
    expect((await onRequest(context('?currency=usd&days=7'))).status).toBe(429)
    expect((await onRequest(context())).status).toBe(200)
    expect((await onRequest(context('', undefined, 'GET', 'snapshot'))).status).toBe(429)
    expect((await onRequest(context('?currency=usd&days=90'))).status).toBe(429)
    expect(upstream).toHaveBeenCalledTimes(2)
    await vi.advanceTimersByTimeAsync(600_000)
    expect((await onRequest(context('?currency=usd&days=7'))).status).toBe(200)
    expect(upstream).toHaveBeenCalledTimes(3)
  })
  it('does not imply durable caching when a new isolate starts', async () => {
    const upstream = fetcher()
    vi.stubGlobal('fetch', upstream)
    await onRequest(context())
    onRequest = createMarketHandler()
    await onRequest(context())
    expect(upstream).toHaveBeenCalledTimes(2)
  })
})
