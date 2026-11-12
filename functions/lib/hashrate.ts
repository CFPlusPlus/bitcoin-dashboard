import { HASHRATE_POLICY, hashrateValue, type HashrateResponse } from '../../shared/hashrate'
import { fetchProviderJson } from './provider-json'
import { UpstreamError } from './upstream'

export const HASHRATE_URL = 'https://mempool.space/api/v1/mining/hashrate/1m'
export function fetchHashrate(fetcher: typeof fetch = fetch): Promise<HashrateResponse> {
  return fetchProviderJson(
    HASHRATE_URL,
    { Accept: 'application/json' },
    (value) => {
      if (!value || typeof value !== 'object' || Array.isArray(value))
        throw new Error('Invalid response')
      const raw = value as Record<string, unknown>
      return {
        data: {
          hashesPerSecond: hashrateValue(raw.currentHashrate),
          estimationBlocks: 1008 as const,
          unit: 'H/s' as const,
        },
        source: 'mempool.space' as const,
        updatedAt: new Date().toISOString(),
      }
    },
    HASHRATE_POLICY.rawBytes,
    HASHRATE_POLICY.responseBytes,
    fetcher,
  )
}

// One bounded public value/promise per isolate. Never caches credentials or failure bodies.
export function createHashrateService() {
  let cached: HashrateResponse | undefined
  let pending: Promise<HashrateResponse> | undefined
  let retryAt = 0
  return () => {
    if (retryAt > Date.now()) return Promise.reject(new UpstreamError('rate_limit', 429))
    if (cached && Date.now() - Date.parse(cached.updatedAt) < HASHRATE_POLICY.ttlMs)
      return Promise.resolve(cached)
    if (pending) return pending
    pending = fetchHashrate()
      .then((data) => {
        cached = data
        return data
      })
      .catch((error: unknown) => {
        if (error instanceof UpstreamError && error.category === 'rate_limit')
          retryAt = Date.now() + HASHRATE_POLICY.cooldownMs
        throw error
      })
      .finally(() => {
        pending = undefined
      })
    return pending
  }
}
