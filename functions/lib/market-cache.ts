import {
  HISTORY_TTL_MS,
  INDICATOR_POLICY,
  type Currency,
  type HistoryDays,
  type MarketHistoryResponse,
  type MarketDominanceResponse,
  type FearGreedResponse,
} from '../../shared/market'
import { fetchMarketHistory, fetchMarketSnapshot, fetchMarketDominance } from './coingecko'
import { fetchFearGreed } from './alternative'
import { UpstreamError } from './upstream'

// Best effort within one isolate ONLY. Access does not support the shared Cache API.
// At most twelve public datasets/promises; no keys, requests, cookies or auth data are cached.
function cachedResource<T>(ttlMs: number) {
  let entry: { data: T; expiresAt: number } | undefined
  let pending: Promise<T> | undefined
  return (load: () => Promise<T>) => {
    if (entry && entry.expiresAt > Date.now()) return Promise.resolve(entry.data)
    entry = undefined
    if (pending) return pending
    pending = load()
      .then((data) => {
        entry = { data, expiresAt: Date.now() + ttlMs }
        return data
      })
      .finally(() => {
        pending = undefined
      })
    return pending
  }
}

export function createMarketService() {
  const entries = new Map<string, { data: MarketHistoryResponse; expiresAt: number }>()
  const pending = new Map<string, Promise<MarketHistoryResponse>>()
  let retryAt = 0
  let alternativeRetryAt = 0
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
  const dominance = cachedResource<MarketDominanceResponse>(INDICATOR_POLICY.dominance.ttlMs)
  const fearGreed = cachedResource<FearGreedResponse>(INDICATOR_POLICY['fear-greed'].ttlMs)
  const loadFearGreed = async () => {
    if (alternativeRetryAt > Date.now()) throw new UpstreamError('rate_limit', 429)
    try {
      return await fetchFearGreed()
    } catch (error) {
      if (error instanceof UpstreamError && error.category === 'rate_limit')
        alternativeRetryAt = Date.now() + 600_000
      throw error
    }
  }
  return {
    dominance(key: string) {
      return dominance(() => guarded(() => fetchMarketDominance(key)))
    },
    fearGreed: () => fearGreed(loadFearGreed),
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
