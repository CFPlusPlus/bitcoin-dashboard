// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import { onRequest as bitcoin } from '../../functions/api/bitcoin/[resource]'
import { difficulty, rawDifficulty, rawFees } from './bitcoin-fixtures'
import { onRequest as health } from '../../functions/api/health'
import { onRequest } from '../../functions/api/[[path]]'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})
const context = (resource: string, method = 'GET'): Parameters<typeof bitcoin>[0] => ({
  request: new Request(`https://dashboard.test/api/bitcoin/${resource}`, { method }),
  params: { resource },
  functionPath: `/api/bitcoin/${resource}`,
  waitUntil: vi.fn(),
  passThroughOnException: vi.fn(),
  next: vi.fn(async () => new Response()),
  env: { ASSETS: { fetch: vi.fn<typeof fetch>() } },
  data: {},
})

describe('Bitcoin Pages route', () => {
  it('adds the difficulty contract with existing response security conventions', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(rawDifficulty)))
    const response = await bitcoin(context('difficulty-adjustment'))
    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(response.headers.has('Access-Control-Allow-Origin')).toBe(false)
    expect(await response.json()).toMatchObject({ data: difficulty, source: 'mempool.space' })
    expect((await bitcoin(context('difficulty-adjustment', 'POST'))).status).toBe(405)
  })
  it('exposes a safe 429 only for difficulty, without forwarding Retry-After or private diagnostics', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    const fetcher = vi.fn().mockImplementation(() =>
      Promise.resolve(
        new Response('private', {
          status: 429,
          headers: { 'Retry-After': '999999999', 'Set-Cookie': 'private' },
        }),
      ),
    )
    vi.stubGlobal('fetch', fetcher)
    const response = await bitcoin(context('difficulty-adjustment'))
    expect(response.status).toBe(429)
    expect(response.headers.get('Retry-After')).toBe('600')
    expect(response.headers.has('Set-Cookie')).toBe(false)
    expect(await response.json()).toEqual({ error: 'UPSTREAM_RATE_LIMIT' })
    expect(log).toHaveBeenCalledExactlyOnceWith({
      event: 'bitcoin_upstream_failure',
      resource: 'difficulty-adjustment',
      category: 'rate_limit',
      providerStatus: 429,
    })
    expect(fetcher).toHaveBeenCalledOnce()
  })
  it.each([
    [
      new Error('secret Cookie Authorization https://private.test/?token=secret'),
      'network',
      undefined,
      502,
    ],
    [new Response('secret provider body', { status: 429 }), 'rate_limit', 429, 502],
    [new Response('secret provider body', { status: 503 }), 'http', 503, 502],
    [Response.json({ secret: 'private invalid data' }), 'invalid_data', 200, 502],
    [new Response('x'.repeat(4097)), 'response_too_large', 200, 502],
    [new DOMException('private timeout', 'TimeoutError'), 'timeout', undefined, 504],
  ])(
    'logs only allowlisted metadata for %s',
    async (upstream, category, providerStatus, status) => {
      const log = vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.stubGlobal(
        'fetch',
        upstream instanceof Error
          ? vi.fn().mockRejectedValue(upstream)
          : vi.fn().mockResolvedValue(upstream),
      )
      const response = await bitcoin(context('fees'))
      expect(response.status).toBe(status)
      expect(response.headers.get('Cache-Control')).toBe('no-store')
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
      expect(response.headers.get('Referrer-Policy')).toBe('no-referrer')
      expect(response.headers.get('X-Frame-Options')).toBe('DENY')
      expect(response.headers.get('Content-Type')).toContain('application/json')
      expect(response.headers.has('Access-Control-Allow-Origin')).toBe(false)
      expect(await response.json()).toEqual({
        error: status === 504 ? 'UPSTREAM_TIMEOUT' : 'UPSTREAM_UNAVAILABLE',
      })
      expect(log).toHaveBeenCalledExactlyOnceWith({
        event: 'bitcoin_upstream_failure',
        resource: 'fees',
        category,
        ...(providerStatus === undefined ? {} : { providerStatus }),
      })
    },
  )
  it('returns validated data without shared caching or CORS', async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json(rawFees))
    vi.stubGlobal('fetch', fetcher)
    const response = await bitcoin(context('fees'))
    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(response.headers.has('Access-Control-Allow-Origin')).toBe(false)
    expect(await response.json()).toMatchObject({ data: { fastest: 2 }, source: 'mempool.space' })
    expect(fetcher.mock.calls[0][1].headers).not.toHaveProperty('Cookie')
  })
  it('rejects unknown resources and methods before calling upstream', async () => {
    const fetcher = vi.fn()
    vi.stubGlobal('fetch', fetcher)
    expect((await bitcoin(context('https://evil.test'))).status).toBe(404)
    const response = await bitcoin(context('fees', 'POST'))
    expect(response.status).toBe(405)
    expect(response.headers.get('Allow')).toBe('GET')
    expect(fetcher).not.toHaveBeenCalled()
  })
  it.each([
    ['Error', 502, 'UPSTREAM_UNAVAILABLE'],
    ['TimeoutError', 504, 'UPSTREAM_TIMEOUT'],
  ])('maps %s without leaking provider details', async (name, status, code) => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(Object.assign(new Error('private diagnostics'), { name })),
    )
    const response = await bitcoin(context('fees'))
    expect(response.status).toBe(status)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(await response.json()).toEqual({ error: code })
  })
  it('rejects invalid provider payloads', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ fastestFee: 1 })))
    expect((await bitcoin(context('fees'))).status).toBe(502)
  })
})

describe('Pages Functions', () => {
  it.each(['GET', 'POST', 'HEAD', 'OPTIONS', 'DELETE'])(
    'uses consistent JSON security headers for %s',
    async (method) => {
      const fetcher = vi.fn().mockImplementation(() => Promise.resolve(Response.json(rawFees)))
      vi.stubGlobal('fetch', fetcher)
      const log = vi.spyOn(console, 'error').mockImplementation(() => {})
      for (const response of [
        await bitcoin(context('fees', method)),
        await bitcoin(context('unknown', method)),
        await health(context('health', method)),
        await onRequest(context('unknown', method)),
      ]) {
        expect(response.headers.get('Cache-Control')).toBe('no-store')
        expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
        expect(response.headers.get('Referrer-Policy')).toBe('no-referrer')
        expect(response.headers.get('X-Frame-Options')).toBe('DENY')
        expect(response.headers.get('Content-Type')).toContain('application/json')
        expect(response.headers.has('Access-Control-Allow-Origin')).toBe(false)
        if (response.status === 405) expect(response.headers.get('Allow')).toBe('GET')
      }
      expect((await health(context('health', method))).status).toBe(method === 'GET' ? 200 : 405)
      expect(fetcher).toHaveBeenCalledTimes(method === 'GET' ? 1 : 0)
      expect(log).not.toHaveBeenCalled()
    },
  )
  it('returns a non-cacheable health response', async () => {
    const response = await health(context('health'))
    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(await response.json()).toEqual({ status: 'ok', service: 'bitcoin-dashboard' })
  })
  it('returns JSON 404 for unknown API routes instead of the SPA', async () => {
    const response = await onRequest(context('unknown'))
    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ error: 'API endpoint not found' })
  })
})
