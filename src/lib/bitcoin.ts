import { queryOptions, useQuery } from '@tanstack/react-query'
import type { BitcoinResources, BitcoinResponse } from '../../shared/bitcoin'

class ApiError extends Error {
  constructor(public status: number) {
    super(status === 401 || status === 403 ? 'Zugriff verweigert. Bitte erneut anmelden.' : 'Daten konnten nicht geladen werden.')
  }
}

export function bitcoinOptions<K extends keyof BitcoinResources>(resource: K) {
  return queryOptions({
    queryKey: ['bitcoin', resource],
    queryFn: async ({ signal }): Promise<BitcoinResponse<BitcoinResources[K]>> => {
      const response = await fetch(`/api/bitcoin/${resource}`, { signal: AbortSignal.any([signal, AbortSignal.timeout(15_000)]), credentials: 'same-origin', cache: 'no-store', redirect: 'error' })
      if (!response.ok) throw new ApiError(response.status)
      if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('Keine API-Antwort. Bitte Anmeldung prüfen.')
      const result = await response.json() as BitcoinResponse<BitcoinResources[K]>
      if (result.source !== 'mempool.space' || !Number.isFinite(Date.parse(result.updatedAt)) || result.data == null) throw new Error('Ungültige API-Antwort.')
      return result
    },
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: (count, error) => count < 1 && !(error instanceof ApiError && error.status < 500),
  })
}

export function useBitcoin<K extends keyof BitcoinResources>(resource: K) {
  return useQuery(bitcoinOptions(resource))
}

export const formatNumber = (value: number, digits = 0) => value.toLocaleString('de-DE', { maximumFractionDigits: digits })
export const formatTime = (value: string | number) => new Date(value).toLocaleString('de-DE')
