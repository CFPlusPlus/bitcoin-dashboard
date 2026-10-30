import type { UseQueryResult } from '@tanstack/react-query'
import type { BitcoinResponse } from '../../../shared/bitcoin'
import { dashboardNavigation, formatTime } from '@/lib/bitcoin'
import { resourceState } from '@/lib/blockchain-resource'

export type ResourceQuery<T> = UseQueryResult<BitcoinResponse<T>, Error>

export function ResourceBadge({ query }: { query: ResourceQuery<unknown> }) {
  const state = resourceState(query)
  return (
    <span className="resource-badge" data-state={state}>
      {state === 'Abruf vorhanden' ? 'Abruf' : state}
    </span>
  )
}

export function ResourceStatus({
  query,
  resource,
}: {
  query: ResourceQuery<unknown>
  resource: string
}) {
  return (
    <div className="resource-status" aria-label={`Datenstatus ${resource}`}>
      <p>
        <a href="https://mempool.space">mempool.space</a> · {resource}
        {query.data && (
          <>
            {' '}
            · Abruf <time dateTime={query.data.updatedAt}>{formatTime(query.data.updatedAt)}</time>
          </>
        )}
      </p>
      {query.isPending && <p role="status">Daten werden geladen …</p>}
      {query.data && resourceState(query) === 'Veraltet' && (
        <p className="resource-warning">
          Veraltete Daten · letzter erfolgreicher Abruf bleibt sichtbar.
        </p>
      )}
      {query.isFetching && !query.isPending && <p role="status">Aktualisierung läuft …</p>}
      {query.isError && (
        <div className="resource-error" role="alert">
          <p>{query.error.message}</p>
          <div className="resource-actions">
            <button type="button" disabled={query.isFetching} onClick={() => void query.refetch()}>
              Erneut versuchen
            </button>
            <button type="button" onClick={() => dashboardNavigation.reload()}>
              Neu anmelden / Seite neu laden
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
