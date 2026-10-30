import { afterEach, describe, expect, it, vi } from 'vitest'
import { aggregateHistogram, histogramScale, scaleFees } from '@/lib/blockchain-analysis'
import { resourceState } from '@/lib/blockchain-resource'

const entry = (feeRate: number, virtualSizeBytes = 1) => ({ feeRate, virtualSizeBytes })
afterEach(() => vi.restoreAllMocks())

describe('resource freshness', () => {
  const query = {
    data: { data: {}, source: 'mempool.space' as const, updatedAt: '2026-10-30T10:00:00Z' },
    isPending: false,
    isFetching: false,
    isError: false,
    isStale: false,
  }
  it('checks the response timestamp as well as query cache freshness', () => {
    vi.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-10-30T10:01:01Z'))
    expect(resourceState(query)).toBe('Veraltet')
    expect(
      resourceState({ ...query, data: { ...query.data, updatedAt: '2026-10-30T10:01:00Z' } }),
    ).toBe('Abruf vorhanden')
  })
  it('retains stale classification on refresh errors', () => {
    vi.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-10-30T10:00:30Z'))
    expect(resourceState({ ...query, isError: true })).toBe('Veraltet')
    expect(resourceState({ ...query, isStale: true })).toBe('Veraltet')
    expect(resourceState({ ...query, isFetching: true })).toBe('Aktualisierung')
  })
  it('distinguishes initial loading and missing data', () => {
    expect(resourceState({ ...query, data: undefined, isPending: true })).toBe('Lädt')
    expect(resourceState({ ...query, data: undefined, isError: true })).toBe('Fehlend')
  })
})

describe('categorical fee histogram aggregation', () => {
  it('assigns every boundary exactly once, including zero, fractions and the open tail', () => {
    const rates = [
      0, 0.999999, 1, 1.999999, 2, 3.999999, 4, 7.999999, 8, 15.999999, 16, 31.999999, 32, 2.1e15,
    ]
    const result = aggregateHistogram(rates.map((rate) => entry(rate, 7)))
    expect(result.buckets.map((bucket) => bucket.virtualSizeBytes)).toEqual(Array(7).fill(14n))
    expect(result.total).toBe(98n)
    expect(result.buckets[6]).toMatchObject({ lower: 32, upper: null })
  })
  it('is independent of order and sums duplicate rates without counting volume twice', () => {
    const entries = [entry(2, 40), entry(0.5, 100), entry(2, 70), entry(32, 20)]
    const result = aggregateHistogram(entries)
    expect(result).toEqual(aggregateHistogram([...entries].reverse()))
    expect(result.total).toBe(230n)
    expect(result.buckets[2].virtualSizeBytes).toBe(110n)
    expect(result.buckets.reduce((sum, bucket) => sum + bucket.virtualSizeBytes, 0n)).toBe(
      result.total,
    )
  })
  it('preserves the exact sum beyond Number.MAX_SAFE_INTEGER', () => {
    const entries = Array.from({ length: 10_000 }, (_, i) => entry(i % 40, Number.MAX_SAFE_INTEGER))
    const result = aggregateHistogram(entries)
    expect(result.total).toBe(10_000n * BigInt(Number.MAX_SAFE_INTEGER))
    expect(result.buckets.reduce((sum, bucket) => sum + bucket.virtualSizeBytes, 0n)).toBe(
      result.total,
    )
  })
  it('keeps valid volume with an unusable rate explicitly unclassified', () => {
    const result = aggregateHistogram([
      entry(NaN, 20),
      entry(-1, 30),
      entry(Infinity, 40),
      entry(1, 10),
    ])
    expect(result.total).toBe(100n)
    expect(result.buckets.at(-1)).toMatchObject({ id: 'unclassified', virtualSizeBytes: 90n })
  })
  it('rejects invalid byte counts without corrupting valid volumes', () => {
    const result = aggregateHistogram([
      entry(1, -1),
      entry(1, 0.5),
      entry(1, NaN),
      entry(1, Infinity),
      entry(1, Number.MAX_SAFE_INTEGER + 1),
      entry(1, 13),
    ])
    expect(result.total).toBe(13n)
    expect(result.ignoredEntries).toBe(5)
  })
  it.each([{ entries: [] }, { entries: [entry(1, 0)] }, { entries: [entry(0, 0), entry(40, 0)] }])(
    'does not draw fabricated volume for %j',
    ({ entries }) => {
      expect(aggregateHistogram(entries)).toMatchObject({ total: 0n, buckets: [] })
    },
  )
  it('keeps stable category IDs through rate and volume updates', () => {
    expect(aggregateHistogram([entry(0.1)]).buckets.map((bucket) => bucket.id)).toEqual(
      aggregateHistogram([entry(1e12)]).buckets.map((bucket) => bucket.id),
    )
  })
  it.each([1n, 400_000n, 5_000_000n, BigInt(Number.MAX_SAFE_INTEGER) * 10_000n])(
    'scales %s bytes without clipping',
    (value) => {
      const scale = histogramScale(value)
      expect(scale.maximum).toBeGreaterThanOrEqual(Number(value) / 1e6)
      expect(scale.ticks.length).toBeGreaterThanOrEqual(2)
      expect(scale.ticks.length).toBeLessThanOrEqual(6)
      expect(scale.ticks.at(-1)).toBe(0)
      expect(scale.ticks.every(Number.isFinite)).toBe(true)
    },
  )
})

describe('fee recommendation scaling', () => {
  it('scales against the true maximum even when priority values are inverted', () => {
    const result = scaleFees({ fastest: 1, halfHour: 10, hour: 5, economy: 2, minimum: 0 })
    expect(result.map((fee) => fee.fraction)).toEqual([0.1, 1, 0.5, 0.2, 0])
  })
  it('gives identical rates identical bars', () => {
    expect(
      scaleFees({ fastest: 0.1, halfHour: 0.1, hour: 0.1, economy: 0.1, minimum: 0.1 }).map(
        (fee) => fee.fraction,
      ),
    ).toEqual([1, 1, 1, 1, 1])
  })
  it('handles zero recommendations without division by zero or visible minimum bars', () => {
    expect(
      scaleFees({ fastest: 0, halfHour: 0, hour: 0, economy: 0, minimum: 0 }).map(
        (fee) => fee.fraction,
      ),
    ).toEqual([0, 0, 0, 0, 0])
  })
})
