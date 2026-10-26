import { afterEach, describe, expect, it, vi } from 'vitest'
import { QueryClient } from '@tanstack/react-query'
import { bitcoinOptions } from '@/lib/bitcoin'
import { parseBitcoinResponse } from '../../shared/bitcoin-validation'
import { block, envelope } from './bitcoin-fixtures'
import type { BitcoinResources } from '../../shared/bitcoin'

afterEach(() => vi.unstubAllGlobals())

describe('normalized browser contract', () => {
  it.each<[keyof BitcoinResources, unknown]>([
    ['height', {}], ['height', { height: '900000' }], ['height', { height: -1 }],
    ['blocks', {}], ['blocks', []], ['blocks', [{}]], ['blocks', [block, block]],
    ['latest-block', { ...block, hash: 'bad' }], ['latest-block', { ...block, timestamp: 8_640_000_000_001 }],
    ['latest-block', { ...block, sizeBytes: 4_000_001 }], ['latest-block', { ...block, transactionCount: 1.5 }],
    ['fees', {}], ['fees', { fastest: 0, halfHour: 0, hour: 0, economy: 0, minimum: null }],
    ['mempool', {}], ['mempool', { transactionCount: 0, virtualSizeBytes: 0, totalFeeSats: 0, feeHistogram: [[1, 2]] }],
    ['mempool', { transactionCount: 0, virtualSizeBytes: 0, totalFeeSats: 0, feeHistogram: [{ feeRate: -1, virtualSizeBytes: 1 }] }],
  ])('rejects malformed %s data as a Query error', async (resource, data) => {
    const client = new QueryClient()
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(Response.json(envelope(data)))))
    try {
      await expect(client.fetchQuery({ ...bitcoinOptions(resource), retry: false })).rejects.toThrow('Ungültige API-Antwort')
      expect(client.getQueryState(['bitcoin', resource])?.status).toBe('error')
      expect(client.getQueryData(['bitcoin', resource])).toBeUndefined()
    } finally { client.clear() }
  })
  it.each<[keyof BitcoinResources, unknown]>([
    ['height', { height: 0 }], ['latest-block', block], ['blocks', [block]],
    ['fees', { fastest: 0, halfHour: 0, hour: 0, economy: 0, minimum: 0 }],
    ['mempool', { transactionCount: 0, virtualSizeBytes: 0, totalFeeSats: 0, feeHistogram: [] }],
  ])('accepts valid %s data including zero values', (resource, data) => {
    const response = envelope(data)
    expect(parseBitcoinResponse(resource, response)).toEqual(response)
  })
  it.each([null, [], {}, { data: {}, source: 'mempool.space', updatedAt: 123 }])('rejects malformed envelopes', value => {
    expect(() => parseBitcoinResponse('height', value)).toThrow()
  })
})
