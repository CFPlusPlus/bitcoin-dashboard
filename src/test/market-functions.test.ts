// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import { onRequest } from '../../functions/api/market/[resource]'
import { COINGECKO_SNAPSHOT_URL, fetchMarketSnapshot } from '../../functions/lib/coingecko'
import { MARKET_LIMITS } from '../../shared/market'
import { parseMarketSnapshot } from '../../shared/market-validation'
import { rawMarket } from './market-fixtures'

function context(
  env = { COINGECKO_DEMO_API_KEY: 'synthetic-key', MARKET_SNAPSHOT_ENABLED: 'true' },
  path = 'snapshot',
  method = 'GET',
  search = '',
): Parameters<typeof onRequest>[0] {
  return {
    request: new Request(`https://dashboard.test/api/market/${path}${search}`, {
      method,
      headers: {
        Cookie: 'private-cookie',
        Authorization: 'private-auth',
        'Cf-Access-Jwt-Assertion': 'private-access',
      },
    }),
    params: { resource: path },
    functionPath: `/api/market/${path}`,
    env: { ...env, ASSETS: { fetch: vi.fn<typeof fetch>() } },
    waitUntil: vi.fn(),
    passThroughOnException: vi.fn(),
    next: vi.fn(async () => new Response()),
    data: {},
  }
}
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('market Pages route and bounded Demo adapter', () => {
  it('performs exactly one fixed Demo GET for both currencies without forwarding browser credentials', async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json(rawMarket(Date.now())))
    vi.stubGlobal('fetch', fetcher)
    const response = await onRequest(context())
    expect(response.status).toBe(200)
    const snapshot = parseMarketSnapshot(await response.json())
    expect(snapshot.data.quotes.eur.price).toBe(72_000)
    expect(fetcher).toHaveBeenCalledExactlyOnceWith(
      COINGECKO_SNAPSHOT_URL,
      expect.objectContaining({
        headers: { Accept: 'application/json', 'x-cg-demo-api-key': 'synthetic-key' },
        redirect: 'manual',
        cache: 'no-store',
        method: 'GET',
      }),
    )
    for (const [name, value] of Object.entries({
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'no-referrer',
    }))
      expect(response.headers.get(name)).toBe(value)
    expect(response.headers.has('Access-Control-Allow-Origin')).toBe(false)
  })
  it.each([
    [{ COINGECKO_DEMO_API_KEY: '', MARKET_SNAPSHOT_ENABLED: 'true' }, 'MARKET_NOT_CONFIGURED'],
    [{ COINGECKO_DEMO_API_KEY: ' ', MARKET_SNAPSHOT_ENABLED: 'true' }, 'MARKET_NOT_CONFIGURED'],
    [
      { COINGECKO_DEMO_API_KEY: 'synthetic-key', MARKET_SNAPSHOT_ENABLED: '' },
      'MARKET_NOT_RELEASED',
    ],
    [
      { COINGECKO_DEMO_API_KEY: 'synthetic-key', MARKET_SNAPSHOT_ENABLED: 'false' },
      'MARKET_NOT_RELEASED',
    ],
  ])('blocks provider use for configuration %s', async (env, code) => {
    const fetcher = vi.fn()
    vi.stubGlobal('fetch', fetcher)
    const response = await onRequest(context(env))
    expect(response.status).toBe(503)
    expect(await response.json()).toEqual({ error: { code } })
    expect(fetcher).not.toHaveBeenCalled()
  })
  it.each(['?currency=eur', '?url=https://evil.test', '?x=1&x=2', '?x=', '?' + 'x'.repeat(129)])(
    'rejects snapshot parameters before upstream: %s',
    async (search) => {
      const fetcher = vi.fn()
      vi.stubGlobal('fetch', fetcher)
      const response = await onRequest(context(undefined, 'snapshot', 'GET', search))
      expect(response.status).toBe(400)
      expect(await response.json()).toEqual({ error: { code: 'INVALID_REQUEST' } })
      expect(fetcher).not.toHaveBeenCalled()
    },
  )
  it('returns 404 for history and 405 with Allow for non-GET', async () => {
    expect((await onRequest(context(undefined, 'history'))).status).toBe(404)
    const response = await onRequest(context(undefined, 'snapshot', 'POST'))
    expect(response.status).toBe(405)
    expect(response.headers.get('Allow')).toBe('GET')
  })
  it.each([
    [401, 502, 'UPSTREAM_CONFIGURATION'],
    [403, 502, 'UPSTREAM_CONFIGURATION'],
    [400, 502, 'UPSTREAM_CONFIGURATION'],
    [429, 429, 'UPSTREAM_RATE_LIMIT'],
    [500, 502, 'UPSTREAM_UNAVAILABLE'],
    [503, 502, 'UPSTREAM_UNAVAILABLE'],
    [302, 502, 'UPSTREAM_INVALID_RESPONSE'],
  ])('maps provider %s safely with one attempt', async (status, expectedStatus, code) => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    const fetcher = vi.fn().mockResolvedValue(
      new Response('private-key and provider body', {
        status: status as number,
        headers: {
          'Retry-After': '99999999',
          'Set-Cookie': 'private-cookie',
          Location: 'https://evil.test',
        },
      }),
    )
    vi.stubGlobal('fetch', fetcher)
    const response = await onRequest(context())
    expect(response.status).toBe(expectedStatus)
    expect(await response.json()).toEqual({
      error: { code, ...(status === 429 ? { retryAfterSeconds: 600 } : {}) },
    })
    expect(response.headers.get('Retry-After')).toBe(status === 429 ? '600' : null)
    expect(response.headers.has('Set-Cookie')).toBe(false)
    expect(JSON.stringify(log.mock.calls)).not.toMatch(/private|synthetic-key|https/)
    expect(fetcher).toHaveBeenCalledOnce()
  })
  it.each(['json', 'html', 'schema', 'length', 'stream', 'utf8'])(
    'rejects malformed/oversized response: %s',
    async (kind) => {
      vi.spyOn(console, 'error').mockImplementation(() => {})
      const headers = { 'Content-Type': 'application/json' }
      const response =
        kind === 'json'
          ? new Response('{', { headers })
          : kind === 'html'
            ? new Response('<html>login</html>')
            : kind === 'schema'
              ? Response.json({})
              : kind === 'length'
                ? new Response('x', {
                    headers: { ...headers, 'Content-Length': String(MARKET_LIMITS.rawBytes + 1) },
                  })
                : kind === 'utf8'
                  ? new Response(new Uint8Array([0xc3, 0x28]), { headers })
                  : new Response('x'.repeat(MARKET_LIMITS.rawBytes + 1), { headers })
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response))
      const result = await onRequest(context())
      expect(result.status).toBe(502)
      expect(await result.json()).toEqual({ error: { code: 'UPSTREAM_INVALID_RESPONSE' } })
    },
  )
  it('cancels an oversized chunked body and measures bytes rather than characters', async () => {
    const cancel = vi.fn()
    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('€'.repeat(MARKET_LIMITS.rawBytes / 2)))
      },
      cancel,
    })
    await expect(
      fetchMarketSnapshot(
        'synthetic-key',
        vi
          .fn()
          .mockResolvedValue(
            new Response(body, { headers: { 'Content-Type': 'application/json' } }),
          ),
      ),
    ).rejects.toMatchObject({ category: 'response_too_large' })
    expect(cancel).toHaveBeenCalledOnce()
  })
  it.each(['headers', 'body'])(
    'times out including %s and cancels the request without retry',
    async (phase) => {
      vi.useFakeTimers()
      const timeout = new AbortController()
      const spy = vi.spyOn(AbortSignal, 'timeout').mockReturnValue(timeout.signal)
      const cancel = vi.fn()
      const fetcher = vi.fn().mockImplementation((_url, init: RequestInit) =>
        phase === 'headers'
          ? new Promise((_resolve, reject) =>
              init.signal?.addEventListener('abort', () =>
                reject(new DOMException('private', 'AbortError')),
              ),
            )
          : Promise.resolve(
              new Response(new ReadableStream({ pull: () => new Promise(() => {}), cancel }), {
                headers: { 'Content-Type': 'application/json' },
              }),
            ),
      )
      const pending = fetchMarketSnapshot('synthetic-key', fetcher)
      const assertion = expect(pending).rejects.toMatchObject({ category: 'timeout' })
      await vi.advanceTimersByTimeAsync(8_000)
      timeout.abort()
      await assertion
      expect(spy).toHaveBeenCalledWith(8_000)
      expect(fetcher).toHaveBeenCalledOnce()
      if (phase === 'body') expect(cancel).toHaveBeenCalledOnce()
    },
  )
})
