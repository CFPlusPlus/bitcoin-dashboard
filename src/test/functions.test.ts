// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { onRequestGet } from '../../functions/api/health'
import { onRequest } from '../../functions/api/[[path]]'

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
