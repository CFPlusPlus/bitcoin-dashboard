// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import { onRequest as bitcoin } from '../../functions/api/bitcoin/[resource]'
import { rawFees } from './bitcoin-fixtures'
import { onRequestGet } from '../../functions/api/health'
import { onRequest } from '../../functions/api/[[path]]'

afterEach(() => vi.unstubAllGlobals())
const context = (resource: string, method = 'GET') => ({ request: new Request(`https://dashboard.test/api/bitcoin/${resource}`, { method }), params: { resource } }) as Parameters<typeof bitcoin>[0]

describe('Bitcoin Pages route', () => {
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
  it.each([['Error', 502, 'UPSTREAM_UNAVAILABLE'], ['TimeoutError', 504, 'UPSTREAM_TIMEOUT']])('maps %s without leaking provider details', async (name, status, code) => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(Object.assign(new Error('private diagnostics'), { name })))
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
  it('returns a non-cacheable health response', async () => {
    const response = await onRequestGet({} as Parameters<typeof onRequestGet>[0])
    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(await response.json()).toEqual({ status: 'ok', service: 'bitcoin-dashboard' })
  })
  it('returns JSON 404 for unknown API routes instead of the SPA', async () => {
    const response = await onRequest({} as Parameters<typeof onRequest>[0])
    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ error: 'API endpoint not found' })
  })
})
