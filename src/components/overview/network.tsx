import { Card, CardTitle } from '@/components/ui/card'
import { DataStatus } from '@/components/bitcoin-data'
import { formatNumber as n, formatTime, useBitcoin } from '@/lib/bitcoin'
import { halvingAt } from '@/lib/overview'
import { useHashrate } from '@/lib/hashrate'
import { useMarketClock } from '@/lib/market'
import { HASHRATE_POLICY, toExahashes } from '../../../shared/hashrate'

export function HalvingCard() {
  const query = useBitcoin('height')
  const cycle = query.data ? halvingAt(query.data.data.height) : undefined
  return (
    <Card className="overview-halving">
      <CardTitle>Halving-Fortschritt</CardTitle>
      <p className="overview-network-value">
        {cycle ? n(cycle.progressPercent, 2) : '—'} <span>%</span>
      </p>
      {cycle && (
        <progress
          max={100}
          value={cycle.progressPercent}
          aria-label="Fortschritt im Halving-Zyklus"
        />
      )}
      <dl className="overview-facts">
        {[
          ['Aktuelle Blockhöhe', cycle ? n(cycle.height) : '—'],
          ['Nächstes Halving bei Block', cycle ? n(cycle.nextHeight) : '—'],
          ['Verbleibende Blöcke', cycle ? n(cycle.remaining) : '—'],
          ['Blocksubvention', cycle ? `${n(cycle.subsidySats / 1e8, 8)} BTC` : '—'],
        ].map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <p className="market-note">
        Zyklus: 210.000 Blöcke. Der nächste Halving-Termin hängt von der Blockproduktion ab.
      </p>
      <DataStatus query={query} />
    </Card>
  )
}
export function HashrateCard() {
  const query = useHashrate()
  const now = useMarketClock()
  const old =
    query.data &&
    (query.isError || now - Date.parse(query.data.updatedAt) >= HASHRATE_POLICY.warnMs)
  return (
    <Card className="overview-hashrate">
      <CardTitle>Netzwerk-Hashrate</CardTitle>
      <p className="overview-network-value">
        {query.data ? n(toExahashes(query.data.data.hashesPerSecond), 2) : '—'} <span>EH/s</span>
      </p>
      <p className="market-note">Schätzung über 1.008 Blöcke · ungefähr 1 Woche</p>
      <p className="market-state" role="status">
        {query.fetchStatus === 'paused'
          ? 'Offline · Abruf pausiert'
          : old
            ? 'Veraltet · Letzter erfolgreicher Wert'
            : query.data
              ? 'Schätzwert verfügbar'
              : query.isPending
                ? 'Hashrate wird geladen …'
                : 'Keine Hashrate verfügbar'}
      </p>
      {query.isError && (
        <p className="market-warning" role="alert">
          {query.error.message}
        </p>
      )}
      <footer className="market-footer">
        <p className="market-note">
          Quelle:{' '}
          <a href="https://mempool.space/mining" target="_blank" rel="noreferrer">
            mempool.space
          </a>{' '}
          · Abruf alle 15 Min.
        </p>
        {query.data && (
          <p className="market-note">
            Letzter Abruf:{' '}
            <time dateTime={query.data.updatedAt}>{formatTime(query.data.updatedAt)}</time>. Kein
            separater Messzeitpunkt vom Anbieter.
          </p>
        )}
      </footer>
    </Card>
  )
}
