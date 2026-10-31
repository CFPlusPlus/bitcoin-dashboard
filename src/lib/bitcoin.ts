import { queryOptions, useQuery, useQueryClient } from '@tanstack/react-query'
import type { BitcoinResources, BitcoinResponse } from '../../shared/bitcoin'
import { parseBitcoinResponse } from '../../shared/bitcoin-validation'
import { bitcoinPolicy } from './bitcoin-policy'
import { useState } from 'react'

export const dashboardNavigation = { reload: () => window.location.reload() }

class ApiError extends Error {
  readonly retryAt: number
  constructor(
    public status: number,
    cooldownMs = 0,
  ) {
    super(
      status === 401 || status === 403
        ? 'Zugriff verweigert. Bitte erneut anmelden.'
        : status === 429 && cooldownMs > 0
          ? 'Abruflimit der Datenquelle erreicht. Automatische Abrufe pausieren für 10 Minuten.'
          : 'Daten konnten nicht geladen werden.',
    )
    this.retryAt = cooldownMs > 0 ? Date.now() + cooldownMs : 0
  }
}

class InvalidApiResponseError extends Error {}

export function bitcoinRetryAt(error: Error | null): number {
  return error instanceof ApiError && error.status === 429 ? error.retryAt : 0
}

export function bitcoinOptions<K extends keyof BitcoinResources>(resource: K) {
  const policy = bitcoinPolicy(resource)
  const canRefetch = (error: Error | null) => bitcoinRetryAt(error) <= Date.now()
  return queryOptions({
    queryKey: ['bitcoin', resource],
    queryFn: async ({ signal }): Promise<BitcoinResponse<BitcoinResources[K]>> => {
      const requestSignal = AbortSignal.any([signal, AbortSignal.timeout(15_000)])
      let response: Response
      try {
        response = await fetch(`/api/bitcoin/${resource}`, {
          signal: requestSignal,
          credentials: 'same-origin',
          cache: 'no-store',
          redirect: 'error',
        })
      } catch (error) {
        if (signal.aborted) throw error
        // Browsers do not distinguish blocked redirects from network failures.
        throw new Error(
          'Verbindung fehlgeschlagen. Bitte Netzwerk prüfen oder die Seite neu laden, um gegebenenfalls die Anmeldung zu erneuern.',
          { cause: error },
        )
      }
      if (!response.ok)
        throw new ApiError(
          response.status,
          resource === 'difficulty-adjustment' && response.status === 429 ? policy.intervalMs : 0,
        )
      if (!response.headers.get('content-type')?.includes('application/json'))
        throw new InvalidApiResponseError('Keine API-Antwort. Bitte Anmeldung prüfen.')
      let raw: unknown
      try {
        raw = await response.json()
      } catch (error) {
        // Body transport failures and timeouts remain eligible for one retry.
        if (signal.aborted) throw error
        if (requestSignal.aborted || !(error instanceof SyntaxError))
          throw new Error('Verbindung fehlgeschlagen. Bitte später erneut versuchen.', {
            cause: error,
          })
        throw new InvalidApiResponseError('Ungültige API-Antwort. Bitte später erneut versuchen.')
      }
      try {
        return parseBitcoinResponse(resource, raw)
      } catch {
        throw new InvalidApiResponseError('Ungültige API-Antwort. Bitte später erneut versuchen.')
      }
    },
    staleTime: policy.intervalMs,
    gcTime: policy.gcTimeMs,
    refetchInterval: (query) =>
      Math.max(policy.intervalMs, bitcoinRetryAt(query.state.error) - Date.now()),
    refetchIntervalInBackground: false,
    refetchOnMount: (query) => canRefetch(query.state.error),
    refetchOnWindowFocus: (query) => canRefetch(query.state.error),
    refetchOnReconnect: (query) => canRefetch(query.state.error),
    retry: (count, error) =>
      count < 1 &&
      !(error instanceof InvalidApiResponseError) &&
      !(error instanceof ApiError && error.status < 500),
  })
}

export function useBitcoin<K extends keyof BitcoinResources>(resource: K) {
  const client = useQueryClient()
  const [mountedAt] = useState(Date.now)
  const options = bitcoinOptions(resource)
  // Query also has an initial-error remount path, independent of refetchOnMount.
  const error = client.getQueryState(options.queryKey)?.error ?? null
  return useQuery({ ...options, retryOnMount: bitcoinRetryAt(error) <= mountedAt })
}

export const formatNumber = (value: number, digits = 0) =>
  value.toLocaleString('de-DE', { maximumFractionDigits: digits })
export const formatTime = (value: string | number) => new Date(value).toLocaleString('de-DE')
