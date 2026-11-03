import { normalizeCoinGeckoHistory } from '../../functions/lib/coingecko'
import type { Currency, HistoryDays } from '../../shared/market'
import { MARKET_TEST_NOW } from './market-fixtures'

// Synthetic, deterministic network fixtures; never displayed as a live-data fallback.
export function rawHistory(
  now = MARKET_TEST_NOW,
  days: HistoryDays = 30,
  currency: Currency = 'usd',
) {
  const step = days === 1 ? 5 * 60_000 : days === 365 ? 86_400_000 : 60 * 60_000
  const count = (days * 86_400_000) / step
  return {
    prices: Array.from({ length: count + 1 }, (_, index) => [
      now - days * 86_400_000 + index * step,
      (currency === 'eur' ? 72_000 : 80_000) + Math.sin(index / 5) * 300 + index,
    ]),
  }
}

export function marketHistory(
  now = MARKET_TEST_NOW,
  days: HistoryDays = 30,
  currency: Currency = 'usd',
) {
  return normalizeCoinGeckoHistory(rawHistory(now, days, currency), currency, days, now)
}
