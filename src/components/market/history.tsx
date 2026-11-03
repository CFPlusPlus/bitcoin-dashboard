import { lazy, Suspense, useState } from 'react'
import { Card, CardTitle } from '@/components/ui/card'
import { ErrorBoundary } from '@/components/error-boundary'
import { ComponentLoadError } from '@/lib/component-load-error'
import { useMarketClock, useMarketHistory } from '@/lib/market'
import { formatTime } from '@/lib/bitcoin'
import {
  HISTORY_TTL_MS,
  MARKET_PROVIDER,
  type Currency,
  type HistoryDays,
} from '../../../shared/market'

const HistoryChart = lazy(() =>
  import('./history-chart').catch((cause: unknown) => {
    throw new ComponentLoadError(cause)
  }),
)
const ranges = [
  [1, '24 h'],
  [7, '7 T'],
  [30, '30 T'],
  [90, '90 T'],
  [365, '1 J'],
] as const

export function MarketHistory({ currency }: { currency: Currency }) {
  const [days, setDays] = useState<HistoryDays>(30)
  const query = useMarketHistory(currency, days)
  const now = useMarketClock()
  const history = query.data
  const old =
    history && (query.isError || now - Date.parse(history.updatedAt) >= HISTORY_TTL_MS[days] * 2)
  const last = history?.data.points.at(-1)
  return (
    <Card className="market-history col-span-12 xl:col-span-8">
      <header className="market-history-head">
        <div>
          <CardTitle>BTC-Kursverlauf</CardTitle>
          <p className="market-note">
            Bitcoin · {currency.toUpperCase()} · Aggregierter Referenzkurs
          </p>
        </div>
        <div className="market-ranges" role="group" aria-label="Zeitraum für Kursverlauf">
          {ranges.map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={days === value}
              onClick={() => setDays(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </header>
      <p className="market-state" role="status">
        {history
          ? old
            ? 'Veraltet · Letzter erfolgreicher Kursverlauf'
            : query.isFetching
              ? 'Kursverlauf wird aktualisiert …'
              : 'Historischer Kursverlauf verfügbar'
          : query.isPending
            ? 'Historische Kursdaten werden geladen …'
            : 'Historische Kursdaten nicht verfügbar'}
      </p>
      {query.isError && (
        <p className="market-warning" role="alert">
          Historische Kursdaten konnten nicht geladen werden. {query.error.message}
          {history && ' Der letzte gültige Kursverlauf bleibt sichtbar.'}
        </p>
      )}
      {query.fetchStatus === 'paused' && <p className="market-note">Offline · Abruf pausiert.</p>}
      {history ? (
        <ErrorBoundary scope="chart" key={`${currency}:${days}`}>
          <Suspense
            fallback={
              <div className="chart-placeholder" role="status">
                Chart wird geladen …
              </div>
            }
          >
            <HistoryChart history={history} />
          </Suspense>
        </ErrorBoundary>
      ) : (
        <div className="chart-placeholder" aria-busy={query.isPending}>
          {query.isPending ? 'Kursverlauf wird geladen …' : 'Kein Kursverlauf verfügbar.'}
        </div>
      )}
      <footer className="market-footer">
        <p className="market-note">
          Quelle:{' '}
          <a href={MARKET_PROVIDER.attributionUrl} target="_blank" rel="noreferrer">
            CoinGecko
          </a>
          {' · '}Auflösung automatisch durch CoinGecko · {history?.data.points.length ?? '—'}{' '}
          Messpunkte
        </p>
        {history && (
          <p className="market-note">
            Letzter erfolgreicher Abruf:{' '}
            <time dateTime={history.updatedAt}>{formatTime(history.updatedAt)}</time>
            {last && (
              <>
                {' '}
                · Letzter Messpunkt:{' '}
                <time dateTime={new Date(last.timestamp).toISOString()}>
                  {formatTime(last.timestamp)}
                </time>
              </>
            )}
          </p>
        )}
        <div className="market-controls">
          <button
            type="button"
            onClick={query.refresh}
            disabled={query.isFetching || query.manualAt > now}
          >
            Kursverlauf aktualisieren
          </button>
        </div>
        {query.manualAt > now && (
          <p className="market-note">Manueller Abruf ab {formatTime(query.manualAt)} möglich.</p>
        )}
      </footer>
    </Card>
  )
}
