// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchBitcoin, parseDifficulty, responseByteLimits } from '../../functions/lib/mempool'
import { parseBitcoinResponse } from '../../shared/bitcoin-validation'
import { parseDifficultyAdjustment } from '../../shared/difficulty-adjustment'
import { difficulty, envelope, rawDifficulty } from './bitcoin-fixtures'

afterEach(() => vi.restoreAllMocks())

describe('difficulty provider → shared browser contract', () => {
  it.each([-75, -3.7, 0, 4.2, 300])(
    'preserves signed %s percent without fraction conversion',
    (change) => {
      const normalized = parseDifficulty({ ...rawDifficulty, difficultyChange: change })
      expect(normalized).toEqual({ ...difficulty, estimatedChangePercent: change })
      expect(parseBitcoinResponse('difficulty-adjustment', envelope(normalized)).data).toEqual(
        normalized,
      )
      expect(normalized).not.toHaveProperty('previousTime')
      expect(normalized).not.toHaveProperty('currentDifficulty')
    },
  )
  it.each([
    'difficultyChange',
    'remainingBlocks',
    'progressPercent',
    'nextRetargetHeight',
    'estimatedRetargetDate',
  ])('rejects missing/null/non-numeric %s', (key) => {
    for (const value of [undefined, null, '1', NaN, Infinity, -Infinity, {}, []]) {
      expect(() => parseDifficulty({ ...rawDifficulty, [key]: value })).toThrow()
    }
  })
  it.each([
    { difficultyChange: -75.001 },
    { difficultyChange: 300.001 },
    { remainingBlocks: 0 },
    { remainingBlocks: 2017 },
    { remainingBlocks: 1.5 },
    { progressPercent: -1 },
    { progressPercent: 100 },
    { progressPercent: 50 },
    { nextRetargetHeight: 975745 },
    { nextRetargetHeight: 0 },
    { nextRetargetHeight: Number.MAX_SAFE_INTEGER + 1 },
    { estimatedRetargetDate: 1794556819 },
    { estimatedRetargetDate: 1794556819028.5 },
    { estimatedRetargetDate: 8_640_000_000_000_001 },
  ])('rejects invalid ranges, units and epoch consistency: %j', (change) => {
    expect(() => parseDifficulty({ ...rawDifficulty, ...change })).toThrow()
  })
  it.each([null, [], {}, 0])('rejects unavailable provider payload %s', (value) =>
    expect(() => parseDifficulty(value)).toThrow(),
  )
  it.each([
    'estimatedChangePercent',
    'remainingBlocks',
    'progressPercent',
    'nextRetargetHeight',
    'estimatedRetargetAt',
  ])('validates normalized field %s again in the browser', (key) => {
    for (const value of [null, undefined, false, NaN, Infinity])
      expect(() =>
        parseBitcoinResponse('difficulty-adjustment', envelope({ ...difficulty, [key]: value })),
      ).toThrow()
  })
  it.each(['2026-11-13', '2026-11-13T08:00:00+01:00', 'invalid', '1970-01-21T18:29:16.819Z'])(
    'rejects noncanonical or second-as-millisecond dates: %s',
    (estimatedRetargetAt) => {
      expect(() => parseDifficultyAdjustment({ ...difficulty, estimatedRetargetAt })).toThrow()
    },
  )
  it('converts provider milliseconds exactly and separates retrieval time from ETA', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-31T14:26:55Z'))
    try {
      const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json(rawDifficulty))
      const result = await fetchBitcoin('difficulty-adjustment', fetcher)
      expect(result.updatedAt).toBe('2026-10-31T14:26:55.000Z')
      expect(Date.parse(result.data.estimatedRetargetAt)).toBe(rawDifficulty.estimatedRetargetDate)
      expect(fetcher).toHaveBeenCalledExactlyOnceWith(
        'https://mempool.space/api/v1/difficulty-adjustment',
        expect.objectContaining({
          redirect: 'manual',
          cache: 'no-store',
          signal: expect.any(AbortSignal),
          headers: { Accept: 'application/json' },
        }),
      )
    } finally {
      vi.useRealTimers()
    }
  })
  it('accepts the last interval and resets atomically on a retarget, including a rollback', () => {
    const last = { ...rawDifficulty, remainingBlocks: 1, progressPercent: (2015 / 2016) * 100 }
    const next = {
      ...rawDifficulty,
      remainingBlocks: 2016,
      progressPercent: 0,
      nextRetargetHeight: 977760,
    }
    for (const raw of [last, next, last]) {
      const data = parseDifficulty(raw)
      expect(parseBitcoinResponse('difficulty-adjustment', envelope(data)).data).toEqual(data)
    }
  })
})

describe('bounded difficulty transport', () => {
  it('accepts exactly 4 KiB and rejects excess declared or streamed bytes', async () => {
    const limit = responseByteLimits['difficulty-adjustment']
    expect(limit).toBe(4096)
    const json = JSON.stringify(rawDifficulty).padEnd(limit, ' ')
    expect(
      (
        await fetchBitcoin(
          'difficulty-adjustment',
          vi.fn<typeof fetch>().mockResolvedValue(new Response(json)),
        )
      ).data,
    ).toEqual(difficulty)
    for (const response of [
      new Response(json + ' '),
      new Response('{}', { headers: { 'Content-Length': String(limit + 1) } }),
    ]) {
      await expect(
        fetchBitcoin('difficulty-adjustment', vi.fn<typeof fetch>().mockResolvedValue(response)),
      ).rejects.toMatchObject({ category: 'response_too_large' })
    }
  })
  it.each([302, 429, 500, 503])(
    'rejects provider HTTP %s without a server retry',
    async (status) => {
      const fetcher = vi
        .fn<typeof fetch>()
        .mockResolvedValue(new Response('private body', { status }))
      await expect(fetchBitcoin('difficulty-adjustment', fetcher)).rejects.toMatchObject({
        category: status === 429 ? 'rate_limit' : 'http',
        providerStatus: status,
      })
      expect(fetcher).toHaveBeenCalledOnce()
    },
  )
  it('enforces the 8s deadline during body streaming and cancels the reader', async () => {
    const controller = new AbortController()
    const timeout = vi.spyOn(AbortSignal, 'timeout').mockReturnValue(controller.signal)
    const cancel = vi.fn()
    const response = new Response(
      new ReadableStream({
        pull() {
          controller.abort(new DOMException('private', 'TimeoutError'))
        },
        cancel,
      }),
    )
    await expect(
      fetchBitcoin('difficulty-adjustment', vi.fn<typeof fetch>().mockResolvedValue(response)),
    ).rejects.toMatchObject({ category: 'timeout' })
    expect(timeout).toHaveBeenCalledWith(8000)
    expect(cancel).toHaveBeenCalledOnce()
    expect(response.body!.locked).toBe(false)
  })
})
