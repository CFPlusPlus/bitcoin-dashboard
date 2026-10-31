export type Currency = 'usd' | 'eur'

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
