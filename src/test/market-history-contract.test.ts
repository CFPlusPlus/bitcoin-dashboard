import { describe, expect, it } from 'vitest'
import { normalizeCoinGeckoHistory } from '../../functions/lib/coingecko'
import { parseMarketHistory } from '../../shared/market-validation'
import { HISTORY_LIMITS, MARKET_HISTORY_DAYS, MARKET_LIMITS } from '../../shared/market'
import { rawHistory, marketHistory } from './market-history-fixtures'
import { MARKET_TEST_NOW as now } from './market-fixtures'

describe('strict historical price contract', () => {
  it.each(MARKET_HISTORY_DAYS)(
    'preserves every provider timestamp and price over %s days',
    (days) => {
      const raw = rawHistory(now, days)
      const result = normalizeCoinGeckoHistory(
        { ...raw, privateField: 'discard' },
        'usd',
        days,
        now,
      )
      expect(result.data.points.map(({ timestamp, price }) => [timestamp, price])).toEqual(
        raw.prices,
      )
      expect(parseMarketHistory(result, 'usd', days, now)).toEqual(result)
      expect(JSON.stringify(result)).not.toMatch(/privateField|sourceUpdatedAt/)
    },
  )
  it.each([null, {}, [], { prices: [] }, { prices: [[now, 1]] }, { prices: [[now, 1, 2]] }])(
    'rejects malformed/empty/fragmented data %s',
    (raw) => {
      expect(() => normalizeCoinGeckoHistory(raw, 'eur', 30, now)).toThrow()
    },
  )
  it.each([0, -1, NaN, Infinity, -Infinity, '70000', null, Number.MAX_SAFE_INTEGER + 1])(
    'rejects invalid price %s',
    (bad) => {
      const raw = rawHistory()
      const prices: unknown[][] = raw.prices
      prices[1][1] = bad
      expect(() => normalizeCoinGeckoHistory(raw, 'usd', 30, now)).toThrow()
    },
  )
  it.each([
    NaN,
    Infinity,
    '1790000000000',
    null,
    1,
    now + MARKET_LIMITS.futureMs + 1,
    now - 40 * 86_400_000,
    now - 1.5,
  ])('rejects invalid timestamp %s', (bad) => {
    const raw = rawHistory()
    const prices: unknown[][] = raw.prices
    prices[1][0] = bad
    expect(() => normalizeCoinGeckoHistory(raw, 'usd', 30, now)).toThrow()
  })
  it.each(['duplicate', 'unsorted', 'oversized', 'truncated', 'old'] as const)(
    'rejects %s rather than silently fixing it',
    (kind) => {
      const raw = rawHistory()
      if (kind === 'duplicate') raw.prices[1][0] = raw.prices[0][0]
      if (kind === 'unsorted') raw.prices.reverse()
      if (kind === 'oversized')
        raw.prices = Array.from({ length: HISTORY_LIMITS.maxPoints + 1 }, () => [now, 1])
      if (kind === 'truncated') raw.prices.splice(0, 20)
      if (kind === 'old') raw.prices = raw.prices.map(([time, price]) => [time - 86_400_000, price])
      expect(() => normalizeCoinGeckoHistory(raw, 'usd', 30, now)).toThrow()
    },
  )
  it('checks context and provider in the browser, anchored to original retrieval on cache hits', () => {
    const saved = marketHistory(now)
    expect(() => parseMarketHistory(saved, 'eur', 30, now)).toThrow()
    expect(() => parseMarketHistory(saved, 'usd', 7, now)).toThrow()
    expect(() => parseMarketHistory({ ...saved, provider: {} }, 'usd', 30, now)).toThrow()
    expect(() =>
      parseMarketHistory(
        { ...saved, updatedAt: new Date(now + 600_000).toISOString() },
        'usd',
        30,
        now,
      ),
    ).toThrow()
    expect(parseMarketHistory(saved, 'usd', 30, now + 86_400_000)).toEqual(saved)
  })
  it('allows UTC daily alignment and a final current-price point without inventing resolution', () => {
    const raw = rawHistory(now, 365)
    raw.prices = raw.prices.map(([time, price]) => [
      Math.floor(time / 86_400_000) * 86_400_000,
      price,
    ])
    raw.prices.push([now, 80000])
    expect(normalizeCoinGeckoHistory(raw, 'usd', 365, now).data.points).toHaveLength(
      raw.prices.length,
    )
  })
})
