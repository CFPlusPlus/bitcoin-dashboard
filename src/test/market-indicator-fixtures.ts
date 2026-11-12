import {
  FEAR_GREED_PROVIDER,
  MARKET_PROVIDER,
  type MarketDominanceResponse,
  type FearGreedResponse,
} from '../../shared/market'

// Synthetic fixtures only; no captured live payloads or application fallback values.
export function rawDominance(now = Date.now()) {
  return {
    data: {
      market_cap_percentage: { btc: 57.9539332566265 },
      updated_at: Math.floor((now - 60_000) / 1000),
    },
  }
}
export function rawFearGreed(now = Date.now()) {
  return {
    data: [
      {
        value: '28',
        value_classification: 'Fear',
        timestamp: String(Math.floor((now - 60 * 60_000) / 1000)),
      },
    ],
    metadata: { error: null },
  }
}
export function dominance(now = Date.now()): MarketDominanceResponse {
  return {
    data: { btcPercent: 57.9539332566265, method: 'provider_market_cap_percentage' },
    source: 'coingecko',
    provider: MARKET_PROVIDER,
    updatedAt: new Date(now).toISOString(),
    sourceUpdatedAt: new Date(now - 60_000).toISOString(),
  }
}
export function fearGreed(now = Date.now()): FearGreedResponse {
  return {
    data: { value: 28, classification: 'Fear' },
    source: 'alternative.me',
    provider: FEAR_GREED_PROVIDER,
    updatedAt: new Date(now).toISOString(),
    sourceUpdatedAt: new Date(now - 60 * 60_000).toISOString(),
  }
}
