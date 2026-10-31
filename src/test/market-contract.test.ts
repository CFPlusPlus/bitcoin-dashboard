import { describe, expect, it } from 'vitest'
import { normalizeCoinGecko } from '../../functions/lib/coingecko'
import { parseMarketSnapshot } from '../../shared/market-validation'
import { marketAge, marketPolicy } from '@/lib/market-policy'
import { MARKET_TEST_NOW as now, marketSnapshot, rawMarket } from './market-fixtures'

const normalize = (raw: unknown) => normalizeCoinGecko(raw, now)

describe('market normalization and browser contract', () => {
  it('maps both currencies, fiat percentages, distinct ATH dates, and source/retrieval times', () => {
    const result = normalize({ ...rawMarket(), privateField: 'discard' })
    expect(result).toEqual(marketSnapshot(now))
    expect(parseMarketSnapshot(result, now)).toEqual(result)
    expect(JSON.stringify(result)).not.toContain('privateField')
  })
  it('normalizes absent optionals explicitly without inventing quotes or FX', () => {
    const raw = rawMarket()
    const result = normalize({
      ...raw,
      market_data: {
        current_price: raw.market_data.current_price,
        last_updated: raw.market_data.last_updated,
      },
    })
    expect(result.data.quotes.usd).toEqual({
      price: 80_000,
      marketCap: null,
      volume24h: null,
      changePercent: { h24: null, d7: null, d30: null },
      ath: null,
      distanceFromAthPercent: null,
    })
    expect(() =>
      normalize({ ...raw, market_data: { ...raw.market_data, current_price: { usd: 80_000 } } }),
    ).toThrow()
    expect(() =>
      parseMarketSnapshot(
        { ...result, data: { asset: 'BTC', quotes: { usd: result.data.quotes.usd } } },
        now,
      ),
    ).toThrow()
  })
  it.each([0, 0.01, Number.MAX_SAFE_INTEGER])(
    'accepts nonnegative fractional fiat amounts %s',
    (amount) => {
      const raw = rawMarket()
      raw.market_data.market_cap.usd = amount
      raw.market_data.total_volume.eur = amount
      expect(normalize(raw).data.quotes.usd.marketCap).toBe(amount)
    },
  )
  it.each([0, -1, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, '80000', null])(
    'rejects invalid core price %s',
    (price) => {
      const raw = rawMarket()
      expect(() =>
        normalize({
          ...raw,
          market_data: { ...raw.market_data, current_price: { usd: price, eur: 72_000 } },
        }),
      ).toThrow()
    },
  )
  it.each([-101, 1_000_001, Infinity, NaN, '2.5', false])(
    'rejects supplied invalid optionals %s',
    (bad) => {
      const raw = rawMarket()
      expect(() =>
        normalize({
          ...raw,
          market_data: { ...raw.market_data, price_change_percentage_7d_in_currency: { usd: bad } },
        }),
      ).toThrow()
      const snapshot = marketSnapshot(now)
      expect(() =>
        parseMarketSnapshot(
          {
            ...snapshot,
            data: {
              ...snapshot.data,
              quotes: {
                ...snapshot.data.quotes,
                usd: {
                  ...snapshot.data.quotes.usd,
                  changePercent: { h24: bad, d7: null, d30: null },
                },
              },
            },
          },
          now,
        ),
      ).toThrow()
    },
  )
  it.each([-100, 0, 1_000_000])('accepts percent boundary %s without ratio conversion', (value) => {
    const raw = rawMarket()
    raw.market_data.price_change_percentage_24h_in_currency.usd = value
    expect(normalize(raw).data.quotes.usd.changePercent.h24).toBe(value)
  })
  it('nulls incomplete ATH pairs but rejects malformed supplied halves', () => {
    const raw = rawMarket()
    expect(
      normalize({ ...raw, market_data: { ...raw.market_data, ath_date: null } }).data.quotes.usd
        .ath,
    ).toBeNull()
    expect(() =>
      normalize({
        ...raw,
        market_data: { ...raw.market_data, ath: { usd: '100000' }, ath_date: null },
      }),
    ).toThrow()
    expect(() =>
      normalize({
        ...raw,
        market_data: { ...raw.market_data, ath: null, ath_date: { usd: 'bad' } },
      }),
    ).toThrow()
  })
  it.each([80_000, 100_000, 110_000])(
    'keeps signed ATH distance for price %s and validates it in browser',
    (price) => {
      const raw = rawMarket()
      raw.market_data.current_price.usd = price
      const result = normalize(raw)
      expect(result.data.quotes.usd.distanceFromAthPercent).toBeCloseTo(100 * (price / 100_000 - 1))
      result.data.quotes.usd.distanceFromAthPercent = 42
      expect(() => parseMarketSnapshot(result, now)).toThrow()
    },
  )
  it.each([
    'not-a-date',
    '2026-10-31',
    '2008-01-01T00:00:00.000Z',
    '2026-02-30T00:00:00.000Z',
    '2026-10-31T10:05:00.001Z',
  ])('rejects invalid source timestamp %s', (value) => {
    const raw = rawMarket()
    raw.market_data.last_updated = value
    expect(() => normalize(raw)).toThrow()
    expect(() =>
      parseMarketSnapshot({ ...marketSnapshot(now), sourceUpdatedAt: value }, now),
    ).toThrow()
  })
  it('checks metadata, asset, missing normalized properties, source/retrieval ordering and future ATH', () => {
    const result = marketSnapshot(now)
    expect(() => parseMarketSnapshot({ ...result, source: 'other' }, now)).toThrow()
    expect(() =>
      parseMarketSnapshot(
        { ...result, provider: { ...result.provider, attributionUrl: 'https://evil.test' } },
        now,
      ),
    ).toThrow()
    expect(() =>
      parseMarketSnapshot({ ...result, updatedAt: '2009-01-03T18:15:05.000Z' }, now),
    ).toThrow()
    expect(() =>
      parseMarketSnapshot({ ...result, updatedAt: '2026-10-31T10:05:00.001Z' }, now),
    ).toThrow()
    expect(() => normalize({ ...rawMarket(), id: 'ethereum' })).toThrow()
    expect(() => normalize({ ...rawMarket(), symbol: 'BTC' })).toThrow()
    const raw = rawMarket()
    raw.market_data.ath_date.usd = new Date(now + 300_001).toISOString()
    expect(() => normalize(raw)).toThrow()
    expect(() =>
      parseMarketSnapshot(
        {
          ...result,
          data: {
            asset: 'BTC',
            quotes: {
              ...result.data.quotes,
              usd: { ...result.data.quotes.usd, marketCap: undefined },
            },
          },
        },
        now,
      ),
    ).toThrow()
  })
  it('distinguishes query stale, retrieval age, source age and the exact warning threshold', () => {
    const result = marketSnapshot(now)
    expect(marketAge(result, now + marketPolicy.intervalMs)).toEqual({
      retrievalOld: false,
      sourceOld: false,
    })
    expect(marketAge(result, now + 570_000)).toEqual({ retrievalOld: false, sourceOld: true })
    expect(marketAge(result, now + 600_000)).toEqual({ retrievalOld: true, sourceOld: true })
  })
})
