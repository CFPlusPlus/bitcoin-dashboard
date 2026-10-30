import type { UseQueryResult } from '@tanstack/react-query'
import type { BitcoinResponse } from '../../shared/bitcoin'

export function resourceState(
  query: Pick<
    UseQueryResult<BitcoinResponse<unknown>, Error>,
    'data' | 'isError' | 'isStale' | 'isPending' | 'isFetching'
  >,
) {
  if (query.data) {
    const old = Date.now() - Date.parse(query.data.updatedAt) > 60_000
    if (query.isError || query.isStale || old) return 'Veraltet'
    return query.isFetching ? 'Aktualisierung' : 'Abruf vorhanden'
  }
  return query.isPending ? 'Lädt' : 'Fehlend'
}
