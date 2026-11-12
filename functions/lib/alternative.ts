import { FEAR_GREED_PROVIDER, INDICATOR_LIMITS, type FearGreedResponse } from '../../shared/market'
import { marketObject, parseFearGreed, unixSeconds } from '../../shared/market-validation'
import { fetchProviderJson } from './provider-json'

export const FEAR_GREED_URL = 'https://api.alternative.me/fng/?limit=1&format=json'

export function normalizeFearGreed(value: unknown, now = Date.now()): FearGreedResponse {
  const raw = marketObject(value)
  if (
    marketObject(raw.metadata).error !== null ||
    !Array.isArray(raw.data) ||
    raw.data.length !== 1
  )
    throw new Error('Invalid index response')
  const entry = marketObject(raw.data[0])
  if (
    typeof entry.value !== 'string' ||
    !/^(0|[1-9]\d{0,2})$/.test(entry.value) ||
    typeof entry.timestamp !== 'string' ||
    !/^[1-9]\d{8,9}$/.test(entry.timestamp)
  )
    throw new Error('Invalid index strings')
  return parseFearGreed(
    {
      data: { value: Number(entry.value), classification: entry.value_classification },
      source: 'alternative.me',
      provider: FEAR_GREED_PROVIDER,
      updatedAt: new Date(now).toISOString(),
      sourceUpdatedAt: unixSeconds(Number(entry.timestamp), now),
    },
    now,
  )
}

export function fetchFearGreed(fetcher: typeof fetch = fetch) {
  return fetchProviderJson(
    FEAR_GREED_URL,
    { Accept: 'application/json' },
    normalizeFearGreed,
    INDICATOR_LIMITS.rawBytes,
    INDICATOR_LIMITS.responseBytes,
    fetcher,
  )
}
