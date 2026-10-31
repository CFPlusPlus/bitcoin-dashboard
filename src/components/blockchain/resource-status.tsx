import type { UseQueryResult } from '@tanstack/react-query'
import type { BitcoinResources, BitcoinResponse } from '../../../shared/bitcoin'
import { bitcoinRetryAt, dashboardNavigation, formatTime } from '@/lib/bitcoin'
import { resourceState } from '@/lib/blockchain-resource'

export type ResourceQuery<T> = UseQueryResult<BitcoinResponse<T>, Error>

export function ResourceBadge({
  query,
  resourceKey = 'height',
  now,
}: {
  query: ResourceQuery<unknown>
  resourceKey?: keyof BitcoinResources
  now?: number
}) {
  const state = resourceState(query, resourceKey, now)
  return (
    <span className="resource-badge" data-state={state}>
      {state === 'Abruf vorhanden' ? 'Abruf' : state}
    </span>
  )
}

export function ResourceStatus({
  query,
  resource,
  resourceKey = 'height',
  now,
}: {
  query: ResourceQuery<unknown>
  resource: string
  resourceKey?: keyof BitcoinResources
  now?: number
}) {
  const retryAt = bitcoinRetryAt(query.error)
  const coolingDown = retryAt > (now ?? Infinity)
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
      {query.data && resourceState(query, resourceKey, now) === 'Veraltet' && (
        <p className="resource-warning">
          Veraltete Daten · letzter erfolgreicher Abruf bleibt sichtbar.
        </p>
      )}
      {query.isFetching && !query.isPending && <p role="status">Aktualisierung läuft …</p>}
      {query.fetchStatus === 'paused' && (
        <p role="status">Offline · Abruf pausiert bis zur Wiederverbindung.</p>
      )}
      {query.isError && (
        <div className="resource-error" role="alert">
          <p>{query.error.message}</p>
          {query.data && <p>Letzter erfolgreicher Datenstand bleibt sichtbar.</p>}
          {coolingDown && (
            <p>
              Erneuter Abruf frühestens{' '}
              <time dateTime={new Date(retryAt).toISOString()}>{formatTime(retryAt)}</time>.
            </p>
          )}
          <div className="resource-actions">
            <button
              type="button"
              disabled={query.isFetching || coolingDown}
              onClick={() => void query.refetch()}
            >
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
