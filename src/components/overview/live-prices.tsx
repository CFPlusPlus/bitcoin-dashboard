import { Card } from '@/components/ui/card'
import { formatNumber, formatTime } from '@/lib/bitcoin'
import { useKraken, type LiveStatus } from '@/lib/kraken'
import { KRAKEN_SYMBOLS } from '@/lib/kraken-protocol'
import { SoftPrice } from './soft-price'

const labels: Record<LiveStatus, string> = {
  connecting: 'Verbindung wird aufgebaut',
  subscribing: 'Kurse werden abonniert',
  live: 'Live',
  reconnecting: 'Verbindung wird wiederhergestellt',
  stale: 'Veraltet · Kein aktueller Kurs',
  disconnected: 'Nicht verbunden',
  error: 'Verbindungs- oder Abonnementfehler · Neuer Versuch folgt',
}
export function LivePrices() {
  const state = useKraken()
  return (
    <Card className="overview-live" aria-labelledby="live-prices-title">
      <header className="overview-section-head">
        <div>
          <p className="page-eyebrow">Bitcoin · Spotmarkt</p>
          <h2 className="section-title" id="live-prices-title">
            Bitcoin-Live-Kurse
          </h2>
        </div>
        <p className="overview-connection" data-state={state.status} role="status">
          {state.offline
            ? 'Offline · Verbindung pausiert'
            : state.paused
              ? 'Im Hintergrund pausiert'
              : labels[state.status]}
        </p>
      </header>
      <div className="overview-quotes">
        {KRAKEN_SYMBOLS.map((pair) => {
          const { quote, status } = state.pairs[pair]
          const direction = status === 'live' ? (quote?.direction ?? 0) : 0
          const currency = pair.slice(4)
          return (
            <section className="overview-quote" key={pair} aria-label={`${pair} Live-Kurs`}>
              <div className="overview-section-head">
                <h3>{pair}</h3>
                <span className="metadata-text" data-pair-status={status}>
                  {labels[status]}
                </span>
              </div>
              <p className="overview-price">
                <SoftPrice quote={quote} active={status === 'live'} />
                <span className="overview-currency">{currency}</span>
              </p>
              <p className="overview-tick">
                <span
                  className="overview-tick-direction"
                  data-direction={direction}
                  role="img"
                  aria-label={
                    direction && quote
                      ? `${direction > 0 ? 'Gestiegen' : 'Gefallen'} um ${formatNumber(Math.abs(quote.delta), 2)} ${currency} zum vorher angezeigten Kurs`
                      : status === 'live' && quote?.previousPrice != null
                        ? 'Unverändert zum vorher angezeigten Kurs'
                        : 'Kein Kursvergleich'
                  }
                >
                  <span aria-hidden="true">{direction > 0 ? '↑' : direction < 0 ? '↓' : '−'}</span>
                </span>
                <span>Letzter Handelspreis · Kraken</span>
              </p>
              <p className="market-note">
                24 h · Kraken:{' '}
                {quote?.change24h == null
                  ? '—'
                  : `${quote.change24h > 0 ? '+' : ''}${formatNumber(quote.change24h, 2)} %`}
              </p>
              {quote && (
                <p className="market-note">
                  {quote.timestamp ? (
                    <>
                      Kurszeit:{' '}
                      <time dateTime={quote.timestamp}>{formatTime(quote.timestamp)}</time>
                    </>
                  ) : (
                    'Keine Kurszeit vom Anbieter'
                  )}
                  {' · '}Empfangen:{' '}
                  <time dateTime={new Date(quote.receivedAt).toISOString()}>
                    {formatTime(quote.receivedAt)}
                  </time>
                  {status !== 'live' &&
                    ` · Letzter gültiger Wert · Empfang vor ${Math.max(0, Math.floor((state.now - quote.receivedAt) / 1000))} s`}
                </p>
              )}
            </section>
          )
        })}
      </div>
      <footer className="market-footer">
        <p className="market-note">
          Quelle:{' '}
          <a href="https://www.kraken.com" target="_blank" rel="noreferrer">
            Kraken
          </a>{' '}
          · Börsenkurse, unabhängig vom aggregierten CoinGecko-Kursverlauf.
        </p>
        <details className="market-note">
          <summary>Direktverbindung und Datenschutz</summary>
          <p>
            Dein Browser verbindet sich direkt mit Kraken. Kraken erhält deine öffentliche
            IP-Adresse und übliche Verbindungsmetadaten. Es werden keine Cloudflare-Access-Tokens
            oder API-Secrets übertragen. Der Stream dient ausschließlich der öffentlichen
            Marktbeobachtung.
          </p>
        </details>
      </footer>
    </Card>
  )
}
