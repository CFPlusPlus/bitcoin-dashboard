import { number } from './bitcoin-number'
import {
  MARKET_LIMITS,
  MARKET_PROVIDER,
  type MarketQuote,
  type MarketSnapshotResponse,
} from './market'

export function marketObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid object')
  return value as Record<string, unknown>
}

export function marketPrice(value: unknown): number {
  const result = number(value, false)
  if (result <= 0) throw new Error('Invalid price')
  return result
}

export function marketPercent(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < -100 || value > 1_000_000)
    throw new Error('Invalid percentage')
  return value
}

export function marketTime(value: unknown, upperMs: number): string {
  if (typeof value !== 'string') throw new Error('Invalid timestamp')
  const ms = Date.parse(value)
  if (
    !Number.isFinite(ms) ||
    ms < MARKET_LIMITS.genesisMs ||
    ms > upperMs ||
    new Date(ms).toISOString() !== value
  )
    throw new Error('Invalid timestamp')
  return value
}

const optional = (value: unknown, parse: (value: unknown) => number) =>
  value === null ? null : parse(value)

function quote(value: unknown, sourceMs: number): MarketQuote {
  const raw = marketObject(value)
  const change = marketObject(raw.changePercent)
  const price = marketPrice(raw.price)
  const athRaw = raw.ath === null ? null : marketObject(raw.ath)
  const ath =
    athRaw === null
      ? null
      : {
          price: marketPrice(athRaw.price),
          at: marketTime(athRaw.at, sourceMs + MARKET_LIMITS.futureMs),
        }
  const expected = ath ? 100 * (price / ath.price - 1) : null
  const distance = raw.distanceFromAthPercent
  if (
    expected === null
      ? distance !== null
      : typeof distance !== 'number' ||
        !Number.isFinite(distance) ||
        !Number.isFinite(expected) ||
        Math.abs(distance - expected) > 1e-9 * Math.max(1, Math.abs(expected))
  )
    throw new Error('Invalid ATH distance')
  return {
    price,
    marketCap: optional(raw.marketCap, (v) => number(v, false)),
    volume24h: optional(raw.volume24h, (v) => number(v, false)),
    changePercent: {
      h24: optional(change.h24, marketPercent),
      d7: optional(change.d7, marketPercent),
      d30: optional(change.d30, marketPercent),
    },
    ath,
    distanceFromAthPercent: expected,
  }
}

// Construct a small fresh object: extra fields never enter the query cache.
export function parseMarketSnapshot(value: unknown, now = Date.now()): MarketSnapshotResponse {
  const raw = marketObject(value)
  const provider = marketObject(raw.provider)
  if (
    raw.source !== 'coingecko' ||
    provider.assetId !== MARKET_PROVIDER.assetId ||
    provider.market !== MARKET_PROVIDER.market ||
    provider.attributionUrl !== MARKET_PROVIDER.attributionUrl
  )
    throw new Error('Invalid provider')
  const updatedAt = marketTime(raw.updatedAt, now + MARKET_LIMITS.futureMs)
  const sourceUpdatedAt = marketTime(
    raw.sourceUpdatedAt,
    Math.min(now, Date.parse(updatedAt)) + MARKET_LIMITS.futureMs,
  )
  const data = marketObject(raw.data)
  if (data.asset !== 'BTC') throw new Error('Invalid asset')
  const quotes = marketObject(data.quotes)
  return {
    data: {
      asset: 'BTC',
      quotes: {
        usd: quote(quotes.usd, Math.min(now, Date.parse(sourceUpdatedAt))),
        eur: quote(quotes.eur, Math.min(now, Date.parse(sourceUpdatedAt))),
      },
    },
    source: 'coingecko',
    provider: MARKET_PROVIDER,
    updatedAt,
    sourceUpdatedAt,
  }
}
