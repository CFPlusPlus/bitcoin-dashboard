import {
  HISTORY_TTL_MS,
  type Currency,
  type HistoryDays,
  type MarketHistoryResponse,
} from '../../shared/market'
import { fetchMarketHistory, fetchMarketSnapshot } from './coingecko'
import { UpstreamError } from './upstream'

// Best effort within one isolate ONLY. Access does not support the shared Cache API.
// At most ten public datasets/promises; no keys, requests, cookies or auth data are cached.
export function createMarketService() {
  const entries = new Map<string, { data: MarketHistoryResponse; expiresAt: number }>()
  const pending = new Map<string, Promise<MarketHistoryResponse>>()
  let retryAt = 0
  async function guarded<T>(load: () => Promise<T>) {
    if (retryAt > Date.now()) throw new UpstreamError('rate_limit', 429)
    try {
      return await load()
    } catch (error) {
      if (error instanceof UpstreamError && error.category === 'rate_limit')
        retryAt = Date.now() + 600_000
      throw error
    }
  }
  return {
    snapshot: (key: string) => guarded(() => fetchMarketSnapshot(key)),
    history(key: string, currency: Currency, days: HistoryDays) {
      const id = `${currency}:${days}`
      const cached = entries.get(id)
      if (cached && cached.expiresAt > Date.now()) return Promise.resolve(cached.data)
      entries.delete(id)
      const inflight = pending.get(id)
      if (inflight) return inflight
      const request = guarded(() => fetchMarketHistory(key, currency, days))
        .then((data) => {
          entries.set(id, { data, expiresAt: Date.now() + HISTORY_TTL_MS[days] })
          return data
        })
        .finally(() => pending.delete(id))
      pending.set(id, request)
      return request
    },
  }
}
