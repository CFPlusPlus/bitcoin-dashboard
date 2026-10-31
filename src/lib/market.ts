import { useSyncExternalStore } from 'react'
import { queryOptions, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { MARKET_ERROR_STATUS, MARKET_LIMITS, type MarketErrorCode } from '../../shared/market'
import { marketObject, parseMarketSnapshot } from '../../shared/market-validation'
// Pure bounded stream utility; this module contains no adapter, URL or secret.
import { cancelBody, readBoundedText, UpstreamError } from '../../functions/lib/upstream'
import { marketPolicy } from './market-policy'

const messages: Partial<Record<MarketErrorCode, string>> = {
  MARKET_NOT_CONFIGURED: 'Marktdaten sind nicht konfiguriert. Das serverseitige Secret fehlt.',
  MARKET_NOT_RELEASED: 'Marktdaten sind noch nicht für den Betrieb freigegeben.',
  UPSTREAM_CONFIGURATION: 'Die Datenquelle hat den Abruf abgelehnt. Betreiberkonfiguration prüfen.',
  UPSTREAM_INVALID_RESPONSE: 'Ungültige Antwort der Datenquelle. Später erneut versuchen.',
  UPSTREAM_RATE_LIMIT:
    'Abruflimit der Datenquelle erreicht. Marktabrufe pausieren für mindestens 10 Minuten.',
  UPSTREAM_TIMEOUT: 'Zeitüberschreitung beim Marktdatenabruf.',
}

export class MarketRequestError extends Error {
  constructor(
    readonly code: MarketErrorCode | 'NETWORK' | 'ACCESS' | 'INVALID_RESPONSE',
    readonly transient = false,
  ) {
    super(
      code === 'ACCESS'
        ? 'Zugriff verweigert oder Anmeldung abgelaufen. Seite neu laden, um die Anmeldung zu prüfen.'
        : code === 'NETWORK'
          ? 'Verbindung fehlgeschlagen. Netzwerk prüfen oder Seite neu laden, um die Anmeldung zu erneuern.'
          : code === 'INVALID_RESPONSE'
            ? 'Ungültige API-Antwort. Anmeldung prüfen oder später erneut versuchen.'
            : (messages[code] ?? 'Marktdaten konnten nicht geladen werden.'),
    )
  }
}

// Shared by all market queries of one QueryClient; never reset on observer unmount or GC.
const states = new WeakMap<QueryClient, { retryAt: number; lastAttemptAt: number }>()
function state(client: QueryClient) {
  let value = states.get(client)
  if (!value) {
    value = { retryAt: 0, lastAttemptAt: 0 }
    states.set(client, value)
  }
  return value
}
export function marketRetryAt(client: QueryClient) {
  return state(client).retryAt
}
export function marketManualAt(client: QueryClient) {
  const value = state(client)
  return Math.max(
    value.retryAt,
    value.lastAttemptAt ? value.lastAttemptAt + marketPolicy.manualPauseMs : 0,
  )
}

async function snapshotRequest(client: QueryClient, signal: AbortSignal) {
  const budget = state(client)
  if (budget.retryAt > Date.now()) throw new MarketRequestError('UPSTREAM_RATE_LIMIT')
  budget.lastAttemptAt = Date.now()
  const requestSignal = AbortSignal.any([signal, AbortSignal.timeout(15_000)])
  try {
    const response = await fetch('/api/market/snapshot', {
      signal: requestSignal,
      credentials: 'same-origin',
      redirect: 'error',
      cache: 'no-store',
    })
    if (response.status === 401 || response.status === 403) {
      cancelBody(response)
      throw new MarketRequestError('ACCESS')
    }
    // Even a damaged 429 envelope must suppress further provider attempts.
    if (response.status === 429) {
      cancelBody(response)
      budget.retryAt = Date.now() + marketPolicy.cooldownMs
      throw new MarketRequestError('UPSTREAM_RATE_LIMIT')
    }
    if (!response.headers.get('content-type')?.toLowerCase().includes('application/json')) {
      cancelBody(response)
      throw new MarketRequestError('INVALID_RESPONSE')
    }
    const text = await readBoundedText(
      response,
      response.ok ? MARKET_LIMITS.snapshotBytes : MARKET_LIMITS.errorBytes,
      requestSignal,
    )
    let raw: unknown
    try {
      raw = JSON.parse(text)
    } catch {
      throw new MarketRequestError('INVALID_RESPONSE')
    }
    if (!response.ok) {
      let code: MarketErrorCode
      try {
        const error = marketObject(marketObject(raw).error)
        if (typeof error.code !== 'string' || !Object.hasOwn(MARKET_ERROR_STATUS, error.code))
          throw new Error('Invalid error')
        code = error.code as MarketErrorCode
        if (MARKET_ERROR_STATUS[code] !== response.status) throw new Error('Invalid error status')
      } catch {
        throw new MarketRequestError('INVALID_RESPONSE')
      }
      throw new MarketRequestError(
        code,
        code === 'UPSTREAM_TIMEOUT' || code === 'UPSTREAM_UNAVAILABLE',
      )
    }
    try {
      return parseMarketSnapshot(raw)
    } catch {
      throw new MarketRequestError('INVALID_RESPONSE')
    }
  } catch (error) {
    if (signal.aborted) throw error
    if (error instanceof MarketRequestError) throw error
    if (requestSignal.aborted) throw new MarketRequestError('UPSTREAM_TIMEOUT', true)
    if (error instanceof UpstreamError) throw new MarketRequestError('INVALID_RESPONSE')
    throw new MarketRequestError('NETWORK', true)
  }
}

export function marketOptions(client: QueryClient) {
  const allowed = () => marketRetryAt(client) <= Date.now()
  return queryOptions({
    queryKey: ['market', 'snapshot'],
    queryFn: ({ signal }) => snapshotRequest(client, signal),
    staleTime: marketPolicy.intervalMs,
    gcTime: marketPolicy.gcTimeMs,
    refetchInterval: () => Math.max(marketPolicy.intervalMs, marketRetryAt(client) - Date.now()),
    refetchIntervalInBackground: false,
    refetchOnMount: allowed,
    refetchOnWindowFocus: allowed,
    refetchOnReconnect: allowed,
    retryOnMount: allowed(),
    retry: (count, error) =>
      count < 1 && error instanceof MarketRequestError && error.transient && allowed(),
    retryDelay: () => 5_000 + Math.floor(Math.random() * 5_001),
  })
}

const subscribeVisibility = (notify: () => void) => {
  document.addEventListener('visibilitychange', notify)
  return () => document.removeEventListener('visibilitychange', notify)
}
const visible = () => document.visibilityState !== 'hidden'

export function useMarketSnapshot() {
  const client = useQueryClient()
  const isVisible = useSyncExternalStore(subscribeVisibility, visible)
  const query = useQuery({ ...marketOptions(client), enabled: isVisible })
  return {
    ...query,
    manualAt: marketManualAt(client),
    retryAt: marketRetryAt(client),
    refresh: () => {
      if (isVisible && marketManualAt(client) <= Date.now() && !query.isFetching)
        void query.refetch()
    },
  }
}
