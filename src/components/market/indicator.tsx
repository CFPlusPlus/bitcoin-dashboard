import { Card, CardTitle } from '@/components/ui/card'
import { useMarketClock, useMarketIndicator } from '@/lib/market'
import { formatNumber, formatTime } from '@/lib/bitcoin'
import { dashboardNavigation } from '@/lib/bitcoin'
import {
  FEAR_GREED_LABELS,
  FEAR_GREED_PROVIDER,
  INDICATOR_POLICY,
  MARKET_PROVIDER,
  type MarketIndicator,
} from '../../../shared/market'

export function MarketIndicatorCard({ resource }: { resource: MarketIndicator }) {
  const query = useMarketIndicator(resource)
  const now = useMarketClock()
  const response = query.data
  const policy = INDICATOR_POLICY[resource]
  const old =
    response &&
    (query.isError ||
      now - Date.parse(response.updatedAt) >= policy.warnMs ||
      now - Date.parse(response.sourceUpdatedAt) >= policy.sourceWarnMs)
  const dominance = response?.source === 'coingecko' ? response : undefined
  const sentiment = response?.source === 'alternative.me' ? response : undefined
  const title = resource === 'dominance' ? 'BTC-Dominanz' : 'Fear & Greed'
  const value = dominance?.data.btcPercent ?? sentiment?.data.value
  return (
    <Card className="market-indicator col-span-12 md:col-span-6">
      <section aria-labelledby={`${resource}-title`}>
        <header className="market-history-head">
          <CardTitle id={`${resource}-title`}>{title}</CardTitle>
          <span className="market-note">
            {resource === 'dominance' ? 'Globaler Marktanteil' : 'Marktstimmung · Tagesindex'}
          </span>
        </header>
        <p
          className="indicator-value"
          aria-label={`${title}: ${value === undefined ? 'nicht verfügbar' : resource === 'dominance' ? `${formatNumber(value, 2)} %` : `${value} von 100`}`}
        >
          {value === undefined ? '—' : resource === 'dominance' ? formatNumber(value, 2) : value}
          <span>{resource === 'dominance' ? ' %' : ' / 100'}</span>
        </p>
        <p className="indicator-description">
          {sentiment
            ? FEAR_GREED_LABELS[sentiment.data.classification]
            : resource === 'dominance'
              ? 'Anteil von Bitcoin am gesamten Kryptomarkt'
              : 'Klassifikation nicht verfügbar'}
        </p>
        {value !== undefined && (
          <>
            <meter
              min={0}
              max={100}
              value={value}
              aria-label={
                resource === 'dominance' ? 'Bitcoin-Marktanteil' : 'Position des Fear & Greed Index'
              }
            >
              {value} / 100
            </meter>
            {resource === 'fear-greed' && (
              <div className="indicator-scale market-note">
                <span>0 · Extreme Angst</span>
                <span>100 · Extreme Gier</span>
              </div>
            )}
          </>
        )}
        <p className="market-state" role="status">
          {response
            ? old
              ? 'Veraltet · Letzter erfolgreicher Wert'
              : query.isFetching
                ? 'Wert wird aktualisiert …'
                : 'Wert verfügbar'
            : query.isPending
              ? 'Indikator wird geladen …'
              : 'Indikator nicht verfügbar'}
        </p>
        {query.isError && (
          <p className="market-warning" role="alert">
            {query.error.message}
            {response && ' Der letzte gültige Wert bleibt sichtbar.'}
          </p>
        )}
        {query.fetchStatus === 'paused' && <p className="market-note">Offline · Abruf pausiert.</p>}
        <footer className="market-footer">
          <p className="market-note">
            Quelle:{' '}
            {resource === 'dominance' ? (
              <a
                href={MARKET_PROVIDER.attributionUrl}
                aria-label="CoinGecko: globale Marktdaten"
                target="_blank"
                rel="noreferrer"
              >
                Powered by CoinGecko
              </a>
            ) : (
              <a href={FEAR_GREED_PROVIDER.attributionUrl} target="_blank" rel="noreferrer">
                Alternative.me
              </a>
            )}
          </p>
          {response && (
            <>
              <p className="market-note">
                {resource === 'dominance' ? 'Marktquellstand' : 'Veröffentlicht'}:{' '}
                <time dateTime={response.sourceUpdatedAt}>
                  {formatTime(response.sourceUpdatedAt)}
                </time>
              </p>
              <p className="market-note">
                Letzter erfolgreicher Abruf:{' '}
                <time dateTime={response.updatedAt}>{formatTime(response.updatedAt)}</time>
              </p>
            </>
          )}
          <div className="market-controls">
            <button
              type="button"
              onClick={query.refresh}
              disabled={query.isFetching || query.manualAt > now}
            >
              {title} aktualisieren
            </button>
            {query.isError && (
              <button type="button" onClick={dashboardNavigation.reload}>
                Neu anmelden / Seite neu laden
              </button>
            )}
          </div>
          {query.manualAt > now && (
            <p className="market-note">Manueller Abruf ab {formatTime(query.manualAt)} möglich.</p>
          )}
        </footer>
      </section>
    </Card>
  )
}
