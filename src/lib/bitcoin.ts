import { queryOptions, useQuery } from '@tanstack/react-query'
import type { BitcoinResources, BitcoinResponse } from '../../shared/bitcoin'
import { parseBitcoinResponse } from '../../shared/bitcoin-validation'

export const dashboardNavigation = { reload: () => window.location.reload() }

class ApiError extends Error {
  constructor(public status: number) {
    super(
      status === 401 || status === 403
        ? 'Zugriff verweigert. Bitte erneut anmelden.'
        : 'Daten konnten nicht geladen werden.',
    )
  }
}

export function bitcoinOptions<K extends keyof BitcoinResources>(resource: K) {
  return queryOptions({
    queryKey: ['bitcoin', resource],
    queryFn: async ({ signal }): Promise<BitcoinResponse<BitcoinResources[K]>> => {
      let response: Response
      try {
        response = await fetch(`/api/bitcoin/${resource}`, {
          signal: AbortSignal.any([signal, AbortSignal.timeout(15_000)]),
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
      if (!response.ok) throw new ApiError(response.status)
      if (!response.headers.get('content-type')?.includes('application/json'))
        throw new Error('Keine API-Antwort. Bitte Anmeldung prüfen.')
      try {
        return parseBitcoinResponse(resource, await response.json())
      } catch {
        throw new Error('Ungültige API-Antwort. Bitte später erneut versuchen.')
      }
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

export const formatNumber = (value: number, digits = 0) =>
  value.toLocaleString('de-DE', { maximumFractionDigits: digits })
export const formatTime = (value: string | number) => new Date(value).toLocaleString('de-DE')
