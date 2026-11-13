// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createHashrateHandler } from '../../functions/api/mining/hashrate'
import { fetchHashrate, HASHRATE_URL } from '../../functions/lib/hashrate'
import { HASHRATE_POLICY, parseHashrate, toExahashes } from '../../shared/hashrate'

let handler = createHashrateHandler()
function context(
  flag: string | undefined = 'true',
  method = 'GET',
  search = '',
): Parameters<typeof handler>[0] {
  return {
    request: new Request(`https://dashboard.test/api/mining/hashrate${search}`, {
      method,
      headers: {
        Cookie: 'private',
        Authorization: 'private',
        'Cf-Access-Jwt-Assertion': 'private',
      },
    }),
    params: {},
    functionPath: '/api/mining/hashrate',
    env: { MINING_HASHRATE_ENABLED: flag, ASSETS: { fetch: vi.fn<typeof fetch>() } },
    data: {},
    waitUntil: vi.fn(),
    passThroughOnException: vi.fn(),
    next: vi.fn(async () => new Response()),
  }
}
beforeEach(() => {
  handler = createHashrateHandler()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})
describe('bounded hashrate resource', () => {
  it('requests only the fixed provider URL and normalizes 1008-block estimates in H/s; converts to EH/s exactly once', async () => {
    const fetcher = vi.fn().mockResolvedValue(
      Response.json({
        currentHashrate: 1.05e21,
        currentDifficulty: 1,
        hashrates: [],
        difficulty: [],
      }),
    )
    vi.stubGlobal('fetch', fetcher)
    const response = await handler(context())
    expect(response.status).toBe(200)
    const result = parseHashrate(await response.json())
    expect(result.data).toEqual({ hashesPerSecond: 1.05e21, estimationBlocks: 1008, unit: 'H/s' })
    expect(toExahashes(result.data.hashesPerSecond)).toBe(1050)
    expect(fetcher).toHaveBeenCalledExactlyOnceWith(
      HASHRATE_URL,
      expect.objectContaining({
        headers: { Accept: 'application/json' },
        redirect: 'manual',
        cache: 'no-store',
      }),
    )
    for (const [name, value] of [
      ['cache-control', 'no-store'],
      ['x-content-type-options', 'nosniff'],
      ['x-frame-options', 'DENY'],
      ['referrer-policy', 'no-referrer'],
    ])
      expect(response.headers.get(name)).toBe(value)
    expect(response.headers.has('access-control-allow-origin')).toBe(false)
    expect(response.headers.has('set-cookie')).toBe(false)
  })
  it.each([
    ['false', 'GET', '', 503],
    ['', 'GET', '', 503],
    ['true', 'POST', '', 405],
    ['true', 'GET', '?period=all', 400],
  ])('gates and bounds input %s %s %s', async (flag, method, search, status) => {
    const fetcher = vi.fn()
    vi.stubGlobal('fetch', fetcher)
    const response = await handler(context(String(flag), String(method), String(search)))
    expect(response.status).toBe(status)
    expect(fetcher).not.toHaveBeenCalled()
  })
  it('defaults to disabled and checks the gate before cached successes', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() => Promise.resolve(Response.json({ currentHashrate: 1e21 }))),
    )
    expect((await handler(context())).status).toBe(200)
    const ctx = context()
    delete ctx.env.MINING_HASHRATE_ENABLED
    expect((await handler(ctx)).status).toBe(503)
  })
  it('recovers from a not-released response as soon as the flag is enabled', async () => {
    const fetcher = vi
      .fn()
      .mockImplementation(() => Promise.resolve(Response.json({ currentHashrate: 1e21 })))
    vi.stubGlobal('fetch', fetcher)
    const disabled = await handler(context('false'))
    expect(await disabled.json()).toEqual({ error: { code: 'HASHRATE_NOT_RELEASED' } })
    expect(disabled.headers.get('Cache-Control')).toBe('no-store')
    expect(fetcher).not.toHaveBeenCalled()
    const enabled = await handler(context())
    expect(enabled.status).toBe(200)
    expect(parseHashrate(await enabled.json()).data.hashesPerSecond).toBe(1e21)
    expect(fetcher).toHaveBeenCalledOnce()
  })
  it.each([429, 500])(
    'recovers after provider HTTP %s without caching the error',
    async (status) => {
      vi.useFakeTimers()
      const fetcher = vi
        .fn()
        .mockResolvedValueOnce(new Response('private', { status }))
        .mockImplementation(() => Promise.resolve(Response.json({ currentHashrate: 1e21 })))
      vi.stubGlobal('fetch', fetcher)
      expect((await handler(context())).status).toBe(status === 429 ? 429 : 502)
      if (status === 429) {
        vi.advanceTimersByTime(HASHRATE_POLICY.cooldownMs - 1)
        expect((await handler(context())).status).toBe(429)
        expect(fetcher).toHaveBeenCalledOnce()
        vi.advanceTimersByTime(1)
      }
      const recovered = await handler(context())
      expect(recovered.status).toBe(200)
      const value = parseHashrate(await recovered.json())
      expect(await (await handler(context())).json()).toEqual(value)
      expect(fetcher).toHaveBeenCalledTimes(2)
    },
  )
  it('deduplicates concurrent requests, preserves retrieval time, expires cache and never caches an error as success', async () => {
    vi.useFakeTimers()
    const fetcher = vi
      .fn()
      .mockImplementation(() => Promise.resolve(Response.json({ currentHashrate: 1e21 })))
    vi.stubGlobal('fetch', fetcher)
    const responses = await Promise.all([handler(context()), handler(context())])
    const initial = await responses[0].json()
    expect(await responses[1].json()).toEqual(initial)
    expect(await (await handler(context())).json()).toEqual(initial)
    expect(fetcher).toHaveBeenCalledOnce()
    vi.advanceTimersByTime(HASHRATE_POLICY.ttlMs)
    expect((await handler(context())).status).toBe(200)
    expect(fetcher).toHaveBeenCalledTimes(2)
  })
  it.each([
    [429, 'UPSTREAM_RATE_LIMIT', 429],
    [500, 'UPSTREAM_UNAVAILABLE', 502],
    [302, 'UPSTREAM_INVALID_RESPONSE', 502],
    ['timeout', 'UPSTREAM_TIMEOUT', 504],
    ['invalid', 'UPSTREAM_INVALID_RESPONSE', 502],
    ['html', 'UPSTREAM_INVALID_RESPONSE', 502],
    ['oversize', 'UPSTREAM_INVALID_RESPONSE', 502],
    ['network', 'UPSTREAM_UNAVAILABLE', 502],
  ])('isolates %s failure with safe envelopes', async (scenario, code, status) => {
    const fetcher = vi.fn().mockImplementation(() => {
      if (scenario === 'timeout') return Promise.reject(new DOMException('private', 'TimeoutError'))
      if (scenario === 'network') return Promise.reject(new Error('private'))
      return Promise.resolve(
        typeof scenario === 'number'
          ? new Response('private', { status: scenario })
          : scenario === 'html'
            ? new Response('<html>private</html>', { headers: { 'content-type': 'text/html' } })
            : scenario === 'oversize'
              ? new Response(' '.repeat(HASHRATE_POLICY.rawBytes + 1), {
                  headers: { 'content-type': 'application/json' },
                })
              : Response.json({ currentHashrate: 0, private: 'secret' }),
      )
    })
    vi.stubGlobal('fetch', fetcher)
    const response = await handler(context())
    expect(response.status).toBe(status)
    expect(await response.json()).toEqual({ error: { code } })
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toMatch(
      /private|secret|Cookie|https/,
    )
    if (scenario === 429) {
      expect(response.headers.get('Retry-After')).toBe('600')
      expect((await handler(context())).status).toBe(429)
      expect(fetcher).toHaveBeenCalledOnce()
    }
  })
  it('applies its timeout to a stalled body', async () => {
    vi.useFakeTimers()
    vi.spyOn(AbortSignal, 'timeout').mockImplementation((ms) => {
      const controller = new AbortController()
      setTimeout(() => controller.abort(new DOMException('deadline', 'TimeoutError')), ms)
      return controller.signal
    })
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(new ReadableStream({ start() {} }), {
        headers: { 'content-type': 'application/json' },
      }),
    )
    const request = fetchHashrate(fetcher)
    const checked = expect(request).rejects.toMatchObject({ category: 'timeout' })
    await vi.advanceTimersByTimeAsync(8000)
    await checked
  })
  it.each([
    null,
    {},
    [],
    { currentHashrate: 0 },
    { currentHashrate: -1 },
    { currentHashrate: '1000' },
    { currentHashrate: null },
    { currentHashrate: 1e31 },
  ])('rejects missing or invalid provider data %#', async (raw) => {
    await expect(
      fetchHashrate(vi.fn().mockResolvedValue(Response.json(raw))),
    ).rejects.toMatchObject({ category: 'invalid_data' })
  })
  it('rejects JSON numeric overflow instead of returning a non-finite hashrate', async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response('{"currentHashrate":1e999}', {
        headers: { 'content-type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetcher)
    const response = await handler(context())
    expect(response.status).toBe(502)
    expect(await response.json()).toEqual({ error: { code: 'UPSTREAM_INVALID_RESPONSE' } })
  })
  it('validates browser metadata independently including method, unit, timestamp and numeric values', () => {
    const value = {
      data: { hashesPerSecond: 1e21, estimationBlocks: 1008, unit: 'H/s' },
      source: 'mempool.space',
      updatedAt: new Date().toISOString(),
    }
    expect(parseHashrate(value)).toEqual(value)
    for (const invalid of [
      { ...value, source: 'unknown' },
      { ...value, updatedAt: 'bad' },
      { ...value, updatedAt: '2099-01-01T00:00:00.000Z' },
      { ...value, data: { ...value.data, unit: 'EH/s' } },
      { ...value, data: { ...value.data, estimationBlocks: 144 } },
      { ...value, data: { ...value.data, hashesPerSecond: Infinity } },
      { ...value, data: { ...value.data, hashesPerSecond: -Infinity } },
      { ...value, data: { ...value.data, hashesPerSecond: NaN } },
    ])
      expect(() => parseHashrate(invalid)).toThrow()
  })
})
