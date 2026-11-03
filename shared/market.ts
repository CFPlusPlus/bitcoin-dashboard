export type Currency = 'usd' | 'eur'

export const MARKET_HISTORY_DAYS = [1, 7, 30, 90, 365] as const
export type HistoryDays = (typeof MARKET_HISTORY_DAYS)[number]

// Application freshness targets, not a promise about the provider's update cadence.
export const HISTORY_TTL_MS: Record<HistoryDays, number> = {
  1: 5 * 60_000,
  7: 10 * 60_000,
  30: 15 * 60_000,
  90: 30 * 60_000,
  365: 60 * 60_000,
}

export const HISTORY_LIMITS = {
  rawBytes: 1024 * 1024,
  responseBytes: 256 * 1024,
  maxPoints: 3000,
  dayMs: 86_400_000,
} as const

export type MarketHistoryResponse = {
  data: {
    asset: 'BTC'
    currency: Currency
    days: HistoryDays
    points: { timestamp: number; price: number }[]
  }
  source: 'coingecko'
  provider: typeof MARKET_PROVIDER
  updatedAt: string
}

export const MARKET_PROVIDER = {
  assetId: 'bitcoin',
  market: 'aggregated',
  attributionUrl: 'https://www.coingecko.com/en/api/',
} as const

export const MARKET_LIMITS = {
  rawBytes: 256 * 1024,
  snapshotBytes: 16 * 1024,
  errorBytes: 4 * 1024,
  futureMs: 5 * 60_000,
  genesisMs: Date.parse('2009-01-03T18:15:05.000Z'),
} as const

export type MarketQuote = {
  price: number
  marketCap: number | null
  volume24h: number | null
  changePercent: { h24: number | null; d7: number | null; d30: number | null }
  ath: { price: number; at: string } | null
  distanceFromAthPercent: number | null
}

export type MarketSnapshotResponse = {
  data: { asset: 'BTC'; quotes: Record<Currency, MarketQuote> }
  source: 'coingecko'
  provider: typeof MARKET_PROVIDER
  updatedAt: string
  sourceUpdatedAt: string
}

export const MARKET_ERROR_STATUS = {
  INVALID_REQUEST: 400,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  MARKET_NOT_CONFIGURED: 503,
  MARKET_NOT_RELEASED: 503,
  UPSTREAM_RATE_LIMIT: 429,
  UPSTREAM_TIMEOUT: 504,
  UPSTREAM_UNAVAILABLE: 502,
  UPSTREAM_CONFIGURATION: 502,
  UPSTREAM_INVALID_RESPONSE: 502,
} as const
export type MarketErrorCode = keyof typeof MARKET_ERROR_STATUS
