import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchBitcoin, parseBlock } from '../../functions/lib/mempool'
import { parseBitcoinResponse } from '../../shared/bitcoin-validation'
import { block, envelope, rawBlock } from './bitcoin-fixtures'

afterEach(() => vi.restoreAllMocks())

describe('actual difficulty in the existing block contract', () => {
  it.each([1, 123_456_789_012_345.67, 2 ** 256])(
    'preserves difficulty %s without estimation',
    async (difficulty) => {
      const fetcher = vi
        .fn<typeof fetch>()
        .mockResolvedValue(Response.json([{ ...rawBlock, difficulty }]))
      const response = await fetchBitcoin('blocks', fetcher)
      expect(response.data[0]).toEqual({ ...block, difficulty })
      expect(parseBitcoinResponse('blocks', response).data).toEqual(response.data)
      expect(fetcher).toHaveBeenCalledExactlyOnceWith(
        'https://mempool.space/api/blocks',
        expect.objectContaining({
          redirect: 'manual',
          cache: 'no-store',
          signal: expect.any(AbortSignal),
        }),
      )
    },
  )

  it.each([undefined, null, 0, -1, 0.5, '123', NaN, Infinity, 2 ** 257])(
    'rejects invalid difficulty %s on both sides',
    (difficulty) => {
      expect(() => parseBlock({ ...rawBlock, difficulty })).toThrow()
      expect(() => parseBitcoinResponse('blocks', envelope([{ ...block, difficulty }]))).toThrow()
      expect(() =>
        parseBitcoinResponse('latest-block', envelope({ ...block, difficulty })),
      ).toThrow()
    },
  )

  it.each([-1, 0.1, Number.MAX_SAFE_INTEGER + 1])(
    'rejects invalid snapshot height %s on both sides',
    (height) => {
      expect(() => parseBlock({ ...rawBlock, height })).toThrow()
      expect(() => parseBitcoinResponse('blocks', envelope([{ ...block, height }]))).toThrow()
    },
  )
})
