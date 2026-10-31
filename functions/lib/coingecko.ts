import {
  MARKET_LIMITS,
  MARKET_PROVIDER,
  type Currency,
  type MarketQuote,
  type MarketSnapshotResponse,
} from '../../shared/market'
import {
  marketObject,
  marketPercent,
  marketPrice,
  marketTime,
  parseMarketSnapshot,
} from '../../shared/market-validation'
import { number } from '../../shared/bitcoin-number'
import { cancelBody, readBoundedText, UpstreamError } from './upstream'

// Fixed Demo host, asset and flags. No request-derived URL, currency, or credentials.
export const COINGECKO_SNAPSHOT_URL =
  'https://api.coingecko.com/api/v3/coins/bitcoin?localization=false&tickers=false&market_data=true&sparkline=false'

export function normalizeCoinGecko(value: unknown, now = Date.now()): MarketSnapshotResponse {
  const raw = marketObject(value)
  if (raw.id !== 'bitcoin' || raw.symbol !== 'btc') throw new Error('Invalid asset')
  const market = marketObject(raw.market_data)
  const sourceUpdatedAt = marketTime(market.last_updated, now + MARKET_LIMITS.futureMs)
  const field = (name: string, currency: Currency): unknown => {
    const values = market[name]
    return values == null ? null : (marketObject(values)[currency] ?? null)
  }
  const optional = (name: string, currency: Currency, parse: (v: unknown) => number) => {
    const value = field(name, currency)
    return value === null ? null : parse(value)
  }
  const quote = (currency: Currency): MarketQuote => {
    const price = marketPrice(field('current_price', currency))
    // Validate each supplied half even when its counterpart is missing.
    const athPrice = optional('ath', currency, marketPrice)
    const date = field('ath_date', currency)
    const athAt =
      date === null
        ? null
        : marketTime(date, Math.min(now, Date.parse(sourceUpdatedAt)) + MARKET_LIMITS.futureMs)
    const ath = athPrice !== null && athAt !== null ? { price: athPrice, at: athAt } : null
    return {
      price,
      marketCap: optional('market_cap', currency, (v) => number(v, false)),
      volume24h: optional('total_volume', currency, (v) => number(v, false)),
      changePercent: {
        h24: optional('price_change_percentage_24h_in_currency', currency, marketPercent),
        d7: optional('price_change_percentage_7d_in_currency', currency, marketPercent),
        d30: optional('price_change_percentage_30d_in_currency', currency, marketPercent),
      },
      ath,
      distanceFromAthPercent: ath ? 100 * (price / ath.price - 1) : null,
    }
  }
  return parseMarketSnapshot(
    {
      data: { asset: 'BTC', quotes: { usd: quote('usd'), eur: quote('eur') } },
      source: 'coingecko',
      provider: MARKET_PROVIDER,
      updatedAt: new Date(now).toISOString(),
      sourceUpdatedAt,
    },
    now,
  )
}

export async function fetchMarketSnapshot(key: string, fetcher: typeof fetch = fetch) {
  const timeout = AbortSignal.timeout(8_000)
  const controller = new AbortController()
  const signal = AbortSignal.any([timeout, controller.signal])
  let status: number | undefined
  try {
    const response = await fetcher(COINGECKO_SNAPSHOT_URL, {
      method: 'GET',
      headers: { Accept: 'application/json', 'x-cg-demo-api-key': key },
      signal,
      redirect: 'manual',
      cache: 'no-store',
    })
    status = response.status
    if (!response.ok) {
      cancelBody(response)
      throw new UpstreamError(status === 429 ? 'rate_limit' : 'http', status)
    }
    if (!response.headers.get('content-type')?.toLowerCase().includes('application/json')) {
      cancelBody(response)
      throw new UpstreamError('invalid_data', status)
    }
    const text = await readBoundedText(response, MARKET_LIMITS.rawBytes, signal)
    try {
      const snapshot = normalizeCoinGecko(JSON.parse(text))
      if (
        new TextEncoder().encode(JSON.stringify(snapshot)).byteLength > MARKET_LIMITS.snapshotBytes
      )
        throw new Error('Oversized normalized snapshot')
      return snapshot
    } catch {
      throw new UpstreamError('invalid_data', status)
    }
  } catch (error) {
    const timedOut = timeout.aborted || (error instanceof Error && error.name === 'TimeoutError')
    controller.abort()
    if (timedOut) throw new UpstreamError('timeout', status)
    if (error instanceof UpstreamError) throw error
    throw new UpstreamError('network', status)
  }
}
