// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  fetchBitcoin,
  parseBlock,
  parseBlocks,
  parseFees,
  parseHeight,
  parseMempool,
} from '../../functions/lib/mempool'
import { rawBlock, rawFees, rawMempool, block } from './bitcoin-fixtures'

afterEach(() => vi.restoreAllMocks())

describe('mempool adapters', () => {
  it('normalizes blocks and preserves explicit units', () => {
    expect(parseBlock({ ...rawBlock, unexpected: true })).toEqual(block)
    expect(parseHeight('900000\n')).toEqual({ height: 900000 })
    expect(parseBlocks([rawBlock])).toEqual([block])
    expect(parseFees(rawFees)).toEqual({
      fastest: 2,
      halfHour: 1.5,
      hour: 1,
      economy: 0.5,
      minimum: 0.1,
    })
    expect(parseMempool(rawMempool)).toEqual({
      transactionCount: 123,
      virtualSizeBytes: 456789,
      totalFeeSats: 9876,
      feeHistogram: [
        { feeRate: 0.1, virtualSizeBytes: 1234 },
        { feeRate: 0, virtualSizeBytes: 50 },
      ],
    })
  })
  it.each(['', '1.2', '-1', '1e6', 'Infinity', '9007199254740992', '<html>login</html>'])(
    'rejects invalid height %s',
    (value) => expect(() => parseHeight(value)).toThrow(),
  )
  it.each([
    null,
    {},
    { ...rawBlock, id: 'bad' },
    { ...rawBlock, height: '900000' },
    { ...rawBlock, tx_count: -1 },
    { ...rawBlock, size: 4_000_001 },
    { ...rawBlock, weight: NaN },
    { ...rawBlock, timestamp: Infinity },
  ])('rejects malformed blocks', (value) => expect(() => parseBlock(value)).toThrow())
  it.each([
    [],
    {},
    [rawBlock, rawBlock],
    [rawBlock, { ...rawBlock, id: 'b'.repeat(64), height: 899998 }],
  ])('rejects invalid lists', (value) => expect(() => parseBlocks(value)).toThrow())
  it.each([{}, { ...rawFees, fastestFee: '2' }, { ...rawFees, minimumFee: -1 }])(
    'rejects invalid fees',
    (value) => expect(() => parseFees(value)).toThrow(),
  )
  it.each([
    {},
    { ...rawMempool, count: 1.5 },
    { ...rawMempool, fee_histogram: [[1]] },
    { ...rawMempool, fee_histogram: [[-1, 4]] },
  ])('rejects invalid mempool statistics', (value) => expect(() => parseMempool(value)).toThrow())
  it('accepts an empty mempool and zero fees', () => {
    expect(
      parseMempool({ count: 0, vsize: 0, total_fee: 0, fee_histogram: [] }).transactionCount,
    ).toBe(0)
  })
  it.each([
    ['height', '/blocks/tip/height', '900000'],
    ['latest-block', '/blocks', [rawBlock]],
    ['blocks', '/blocks', [rawBlock]],
    ['fees', '/v1/fees/recommended', rawFees],
    ['mempool', '/mempool', rawMempool],
  ] as const)('fetches %s only from the fixed public upstream', async (resource, path, raw) => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(typeof raw === 'string' ? raw : JSON.stringify(raw)))
    const result = await fetchBitcoin(resource, fetcher)
    expect(fetcher).toHaveBeenCalledWith(
      `https://mempool.space/api${path}`,
      expect.objectContaining({
        redirect: 'manual',
        cache: 'no-store',
        signal: expect.any(AbortSignal),
      }),
    )
    expect(result.source).toBe('mempool.space')
    expect(Number.isFinite(Date.parse(result.updatedAt))).toBe(true)
    if (resource === 'latest-block') expect(result.data).toEqual(block)
  })
  it.each([302, 429, 500, 503])('does not convert HTTP %s into successful data', async (status) => {
    await expect(
      fetchBitcoin('fees', vi.fn<typeof fetch>().mockResolvedValue(new Response('{}', { status }))),
    ).rejects.toThrow()
  })
  it('rejects malformed JSON and network failures', async () => {
    await expect(
      fetchBitcoin('fees', vi.fn<typeof fetch>().mockResolvedValue(new Response('<html>'))),
    ).rejects.toThrow()
    await expect(
      fetchBitcoin('fees', vi.fn<typeof fetch>().mockRejectedValue(new Error('offline'))),
    ).rejects.toThrow('offline')
  })
})
