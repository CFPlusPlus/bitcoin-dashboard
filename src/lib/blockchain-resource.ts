import type { UseQueryResult } from '@tanstack/react-query'
import type { BitcoinResources, BitcoinResponse } from '../../shared/bitcoin'
import { bitcoinPolicy } from './bitcoin-policy'

export function resourceState(
  query: Pick<
    UseQueryResult<BitcoinResponse<unknown>, Error>,
    'data' | 'isError' | 'isStale' | 'isPending' | 'isFetching'
  >,
  resource: keyof BitcoinResources = 'height',
  now = Date.now(),
) {
  if (query.data) {
    const old = now - Date.parse(query.data.updatedAt) >= bitcoinPolicy(resource).warnAfterMs
    if (resource === 'difficulty-adjustment') {
      if (old) return 'Veraltet'
      if (query.isError) return 'Abruffehler'
    } else if (query.isError || query.isStale || old) return 'Veraltet'
    return query.isFetching ? 'Aktualisierung' : 'Abruf vorhanden'
  }
  return query.isPending ? 'Lädt' : 'Fehlend'
}
