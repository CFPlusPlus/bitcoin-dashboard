import { useEffect, useState } from 'react'
import { useMarketSnapshot } from '@/lib/market'
import { marketAge } from '@/lib/market-policy'
import { formatNumber, formatTime } from '@/lib/bitcoin'
import { MARKET_PROVIDER, type Currency } from '../../../shared/market'
import '@/styles/market.css'

function useVisibleClock() {
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined
    const visibility = () => {
      clearInterval(timer)
      setNow(Date.now())
      if (document.visibilityState !== 'hidden')
        timer = setInterval(() => setNow(Date.now()), 30_000)
    }
    visibility()
    document.addEventListener('visibilitychange', visibility)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', visibility)
    }
  }, [])
  return now
}

export function MarketSnapshot() {
  const [currency, setCurrency] = useState<Currency>('usd')
  const query = useMarketSnapshot()
  const now = useVisibleClock()
  const snapshot = query.data
  const quote = snapshot?.data.quotes[currency]
  const age = snapshot ? marketAge(snapshot, now) : undefined
  const old = age?.retrievalOld || age?.sourceOld
  const money = (value: number | null | undefined) =>
    value == null
      ? '—'
      : new Intl.NumberFormat('de-DE', {
          style: 'currency',
          currency: currency.toUpperCase(),
          maximumFractionDigits: 2,
        }).format(value)
  const displayMoney = (value: number | null | undefined) =>
    value == null
      ? '—'
      : new Intl.NumberFormat('de-DE', {
          style: 'currency',
          currency: currency.toUpperCase(),
          notation: value >= 1_000_000 ? 'compact' : 'standard',
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        }).format(value)
  const percent = (value: number | null | undefined) =>
    value == null ? 'nicht verfügbar' : `${value > 0 ? '+' : ''}${formatNumber(value, 2)} %`
  const pauseSeconds = Math.max(0, Math.ceil((query.manualAt - now) / 1000))
  return (
    <section className="market-snapshot" aria-labelledby="market-snapshot-title">
      <header className="market-snapshot-head">
        <div>
          <p className="market-note">Bitcoin · Aggregierter Referenzkurs</p>
          <h2 className="section-title" id="market-snapshot-title">
            Marktsnapshot
          </h2>
        </div>
        <div className="market-controls">
          <label>
            Währung{' '}
            <select
              value={currency}
              onChange={(event) => setCurrency(event.target.value as Currency)}
            >
              <option value="usd">USD</option>
              <option value="eur">EUR</option>
            </select>
          </label>
          <button
            type="button"
            onClick={query.refresh}
            disabled={query.isFetching || pauseSeconds > 0}
          >
            {query.isFetching ? 'Aktualisierung läuft …' : 'Aktualisieren'}
          </button>
        </div>
      </header>
      <p className="market-state" role="status">
        {snapshot
          ? old
            ? 'Veraltet · Letzter erfolgreicher Snapshot'
            : query.isError
              ? 'Abruffehler · Letzter erfolgreicher Snapshot'
              : 'Snapshot verfügbar'
          : query.isPending
            ? 'Marktdaten werden geladen …'
            : 'Marktdaten nicht verfügbar'}
      </p>
      {query.isError && (
        <p className="market-warning" role="alert">
          {query.error.message} {snapshot && 'Der letzte erfolgreiche Snapshot bleibt sichtbar.'}
        </p>
      )}
      {query.fetchStatus === 'paused' && <p className="market-note">Offline · Abruf pausiert.</p>}
      {age?.retrievalOld && (
        <p className="market-warning">Letzter erfolgreicher Abruf ist mindestens 10 Minuten alt.</p>
      )}
      {age?.sourceOld && (
        <p className="market-warning">Marktquellstand ist mindestens 10 Minuten alt.</p>
      )}
      <dl className="market-kpis">
        {(
          [
            ['Bitcoin-Kurs', quote?.price],
            ['Marktkapitalisierung', quote?.marketCap],
            ['Handelsvolumen · 24 h', quote?.volume24h],
            ['Allzeithoch (ATH)', quote?.ath?.price],
          ] as const
        ).map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd title={money(value)} aria-label={`${label}: ${money(value)}`}>
              {displayMoney(value)}
            </dd>
            {snapshot && value == null && <p className="market-note">Nicht verfügbar</p>}
            {label === 'Allzeithoch (ATH)' && quote?.ath && (
              <p className="market-note">
                Provider-ATH am <time dateTime={quote.ath.at}>{formatTime(quote.ath.at)}</time>
              </p>
            )}
          </div>
        ))}
      </dl>
      <dl className="market-changes">
        {(
          [
            ['Änderung · 24 h', quote?.changePercent.h24],
            ['Änderung · 7 d', quote?.changePercent.d7],
            ['Änderung · 30 d', quote?.changePercent.d30],
            ['Abstand zum ATH', quote?.distanceFromAthPercent],
          ] as const
        ).map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{snapshot ? percent(value) : '—'}</dd>
          </div>
        ))}
      </dl>
      {quote && quote.distanceFromAthPercent !== null && quote.distanceFromAthPercent > 0 && (
        <p className="market-warning">
          Kurs liegt über dem gemeldeten ATH. Providerstand ist inkonsistent.
        </p>
      )}
      <footer className="market-footer">
        <p className="market-note">
          Quelle: CoinGecko ·{' '}
          <a href={MARKET_PROVIDER.attributionUrl} target="_blank" rel="noreferrer">
            Powered by CoinGecko
          </a>
        </p>
        {snapshot && (
          <p className="market-note">
            Letzter erfolgreicher Abruf:{' '}
            <time dateTime={snapshot.updatedAt}>{formatTime(snapshot.updatedAt)}</time> ·
            Marktquellstand:{' '}
            <time dateTime={snapshot.sourceUpdatedAt}>{formatTime(snapshot.sourceUpdatedAt)}</time>
          </p>
        )}
        <p className="market-note">
          Aktualisierung alle 5 Min. bei aktivem, sichtbarem Marktbereich · Alterswarnung ab 10 Min.
          {pauseSeconds > 0 && ` · Manueller Abruf in ${pauseSeconds} s möglich`}
        </p>
        {query.retryAt > now && (
          <p className="market-note">
            Marktabrufe frühestens ab {formatTime(query.retryAt)}. Bei wiederholter Sperre muss das
            Betreiberkonto geprüft werden.
          </p>
        )}
      </footer>
    </section>
  )
}
