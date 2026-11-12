import { queryOptions, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import {
  HASHRATE_ERRORS,
  HASHRATE_POLICY,
  parseHashrate,
  type HashrateError,
} from '../../shared/hashrate'
import { cancelBody, readBoundedText } from '../../functions/lib/upstream'

const cooldowns = new WeakMap<QueryClient, number>()
class HashrateRequestError extends Error {}
const messages: Partial<Record<HashrateError, string>> = {
  HASHRATE_NOT_RELEASED: 'Hashrate ist noch nicht für den Betrieb freigegeben.',
  UPSTREAM_RATE_LIMIT: 'Hashrate-Abruflimit erreicht. Abrufe pausieren für 10 Minuten.',
  UPSTREAM_TIMEOUT: 'Zeitüberschreitung beim Hashrate-Abruf.',
}
export function hashrateOptions(client: QueryClient) {
  const allowed = () => (cooldowns.get(client) ?? 0) <= Date.now()
  return queryOptions({
    queryKey: ['mining', 'hashrate'],
    queryFn: async ({ signal }) => {
      if (!allowed()) throw new HashrateRequestError(messages.UPSTREAM_RATE_LIMIT)
      const requestSignal = AbortSignal.any([signal, AbortSignal.timeout(15_000)])
      try {
        const response = await fetch('/api/mining/hashrate', {
          signal: requestSignal,
          credentials: 'same-origin',
          cache: 'no-store',
          redirect: 'error',
        })
        if (response.status === 429) {
          cancelBody(response)
          cooldowns.set(client, Date.now() + HASHRATE_POLICY.cooldownMs)
          throw new HashrateRequestError(messages.UPSTREAM_RATE_LIMIT)
        }
        if (response.status === 401 || response.status === 403) {
          cancelBody(response)
          throw new HashrateRequestError('Zugriff verweigert. Bitte erneut anmelden.')
        }
        if (
          response.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !==
          'application/json'
        ) {
          cancelBody(response)
          throw new HashrateRequestError('Ungültige Hashrate-Antwort. Anmeldung prüfen.')
        }
        const raw: unknown = JSON.parse(
          await readBoundedText(response, HASHRATE_POLICY.responseBytes, requestSignal),
        )
        if (!response.ok) {
          const code = (raw as { error?: { code?: unknown } } | null)?.error?.code
          if (
            typeof code === 'string' &&
            Object.hasOwn(HASHRATE_ERRORS, code) &&
            HASHRATE_ERRORS[code as HashrateError] === response.status
          )
            throw new HashrateRequestError(
              messages[code as HashrateError] ?? 'Hashrate konnte nicht geladen werden.',
            )
          throw new HashrateRequestError('Ungültige Hashrate-Antwort.')
        }
        return parseHashrate(raw)
      } catch (error) {
        if (signal.aborted) throw error
        if (error instanceof HashrateRequestError) throw error
        throw new HashrateRequestError(
          requestSignal.aborted
            ? messages.UPSTREAM_TIMEOUT
            : 'Hashrate konnte nicht geladen werden. Ungültige Antwort oder Verbindungsfehler; Anmeldung und Netzwerk prüfen.',
        )
      }
    },
    staleTime: (query) =>
      Math.max(
        0,
        HASHRATE_POLICY.ttlMs -
          (query.state.dataUpdatedAt -
            Date.parse(query.state.data?.updatedAt ?? new Date().toISOString())),
      ),
    gcTime: 60 * 60_000,
    refetchInterval: () =>
      Math.max(HASHRATE_POLICY.ttlMs, (cooldowns.get(client) ?? 0) - Date.now()),
    refetchIntervalInBackground: false,
    refetchOnMount: allowed,
    refetchOnWindowFocus: allowed,
    refetchOnReconnect: allowed,
    retryOnMount: allowed(),
    retry: false,
  })
}
export function useHashrate() {
  const client = useQueryClient()
  return useQuery(hashrateOptions(client))
}
