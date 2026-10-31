import { MARKET_PROVIDER, type MarketSnapshotResponse } from '../../shared/market'

// Deliberately synthetic contract fixtures, never imported by application code.
export const MARKET_TEST_NOW = Date.parse('2026-10-31T10:00:00.000Z')
export function rawMarket(now = MARKET_TEST_NOW) {
  return {
    id: 'bitcoin',
    symbol: 'btc',
    market_data: {
      current_price: { usd: 80_000, eur: 72_000 },
      market_cap: { usd: 1_600_000_000_000, eur: 1_440_000_000_000 },
      total_volume: { usd: 30_000_000_000, eur: 27_000_000_000 },
      price_change_percentage_24h_in_currency: { usd: 2.5, eur: 1.25 },
      price_change_percentage_7d_in_currency: { usd: -3, eur: -2 },
      price_change_percentage_30d_in_currency: { usd: 0, eur: 4 },
      ath: { usd: 100_000, eur: 90_000 },
      ath_date: { usd: '2026-01-01T12:00:00.000Z', eur: '2026-02-01T12:00:00.000Z' },
      last_updated: new Date(now - 30_000).toISOString(),
    },
  }
}

export function marketSnapshot(now = Date.now()): MarketSnapshotResponse {
  const base = {
    price: 80_000,
    marketCap: 1_600_000_000_000,
    volume24h: 30_000_000_000,
    changePercent: { h24: 2.5, d7: -3, d30: 0 },
    ath: { price: 100_000, at: '2026-01-01T12:00:00.000Z' },
    distanceFromAthPercent: 100 * (0.8 - 1),
  }
  return {
    data: {
      asset: 'BTC',
      quotes: {
        usd: base,
        eur: {
          ...base,
          price: 72_000,
          marketCap: 1_440_000_000_000,
          volume24h: 27_000_000_000,
          changePercent: { h24: 1.25, d7: -2, d30: 4 },
          ath: { price: 90_000, at: '2026-02-01T12:00:00.000Z' },
        },
      },
    },
    source: 'coingecko',
    provider: MARKET_PROVIDER,
    updatedAt: new Date(now).toISOString(),
    sourceUpdatedAt: new Date(now - 30_000).toISOString(),
  }
}
