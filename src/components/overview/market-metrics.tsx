import { Card, CardTitle } from '@/components/ui/card'
import { useMarketClock, useMarketSnapshot } from '@/lib/market'
import { marketAge } from '@/lib/market-policy'
import { formatTime } from '@/lib/bitcoin'
import { MARKET_PROVIDER, type Currency } from '../../../shared/market'

export function OverviewMarketMetrics({ currency }: { currency: Currency }) {
  const query = useMarketSnapshot()
  const now = useMarketClock()
  const snapshot = query.data
  const quote = snapshot?.data.quotes[currency]
  const age = snapshot ? marketAge(snapshot, now) : undefined
  return (
    <section className="overview-market" aria-label="Aggregierte Marktkennzahlen">
      <div className="overview-market-values">
        {(
          [
            ['Marktkapitalisierung', quote?.marketCap],
            ['Handelsvolumen · 24 h', quote?.volume24h],
          ] as const
        ).map(([label, value]) => (
          <Card key={label}>
            <CardTitle>{label}</CardTitle>
            <p
              className="overview-network-value"
              title={
                value == null
                  ? undefined
                  : new Intl.NumberFormat('de-DE', { style: 'currency', currency }).format(value)
              }
            >
              {value == null
                ? '—'
                : new Intl.NumberFormat('de-DE', {
                    notation: 'compact',
                    maximumFractionDigits: 2,
                  }).format(value)}{' '}
              <span>{currency.toUpperCase()}</span>
            </p>
            <p className="market-note">
              {snapshot && value == null ? 'Nicht verfügbar' : 'Bitcoin · Aggregierter Markt'}
            </p>
          </Card>
        ))}
      </div>
      <div className="overview-market-status market-footer">
        <p className="market-note" role="status">
          {query.fetchStatus === 'paused'
            ? 'Offline · Marktabruf pausiert'
            : age?.retrievalOld || age?.sourceOld || (query.isError && snapshot)
              ? 'Veraltete Marktkennzahlen · Letzter erfolgreicher Snapshot'
              : snapshot
                ? 'Marktkennzahlen verfügbar'
                : query.isPending
                  ? 'Marktkennzahlen werden geladen …'
                  : 'Keine Marktkennzahlen verfügbar'}
        </p>
        {query.isError && (
          <p className="market-warning" role="alert">
            {query.error.message}
          </p>
        )}
        <p className="market-note">
          <a href={MARKET_PROVIDER.attributionUrl} target="_blank" rel="noreferrer">
            Powered by CoinGecko
          </a>{' '}
          · Aktualisierung alle 5 Min.
        </p>
        {snapshot && (
          <p className="market-note">
            Marktquellstand:{' '}
            <time dateTime={snapshot.sourceUpdatedAt}>{formatTime(snapshot.sourceUpdatedAt)}</time>{' '}
            · Abruf: <time dateTime={snapshot.updatedAt}>{formatTime(snapshot.updatedAt)}</time>
          </p>
        )}
      </div>
    </section>
  )
}
