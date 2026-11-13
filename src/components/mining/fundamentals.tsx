import type { ReactNode } from 'react'
import { Card, CardTitle } from '@/components/ui/card'
import { ResourceBadge, ResourceStatus } from '@/components/blockchain/resource-status'
import { HashrateCard } from '@/components/overview/network'
import { PlaceholderCard } from '@/components/dashboard'
import { formatNumber as n, useBitcoin } from '@/lib/bitcoin'
import { useMarketClock } from '@/lib/market'
import {
  bitcoinSupplyAt,
  HALVING_INTERVAL,
  MAX_BLOCK_HEIGHT,
  MAX_SUBSIDY_SUPPLY_SATS,
  MODEL_YEAR_BLOCKS,
  satsToBtc,
} from '../../../shared/bitcoin-supply'

function Value({ value, unit }: { value: string | undefined; unit: string }) {
  return (
    <p className="mining-value">
      <span className="mining-value-number">{value ?? '—'}</span>{' '}
      <span className="mining-unit">{unit}</span>
    </p>
  )
}

function Metric({
  title,
  value,
  unit,
  note,
  status,
}: {
  title: string
  value: string | undefined
  unit: string
  note: string
  status: ReactNode
}) {
  return (
    <Card className="mining-kpi" aria-label={title}>
      <CardTitle>{title}</CardTitle>
      <Value value={value} unit={unit} />
      <p className="mining-note">{note}</p>
      <div className="mining-kpi-source mining-note">
        {status}
        <p>
          <a href="#mining-snapshot">Datenstand · Block-Snapshot</a>
        </p>
      </div>
    </Card>
  )
}

function Facts({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="mining-facts">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  )
}

function Progress({ label, value }: { label: string; value: number | undefined }) {
  return (
    <div className="mining-progress">
      <div className="mining-progress-label">
        <span>{label}</span>
        <strong>{value === undefined ? '—' : `${n(value, 2)} %`}</strong>
      </div>
      <div className="mining-progress-track">
        {value !== undefined && <progress aria-label={label} max={100} value={value} />}
      </div>
    </div>
  )
}

export function MiningFundamentals() {
  // The overview and blockchain tables already use this validated snapshot/key.
  // Its latest block supplies BOTH difficulty and height: no separate tip request.
  const query = useBitcoin('blocks')
  const now = useMarketClock()
  const block = query.data?.data[0]
  const supply =
    block && block.height <= MAX_BLOCK_HEIGHT ? bitcoinSupplyAt(block.height) : undefined
  const btc = (value: bigint) => `${n(satsToBtc(value), 8)} BTC`
  const inflation = supply ? n(supply.annualInflationPercent, 3) : undefined
  const snapshotStatus = <ResourceBadge query={query} resourceKey="blocks" now={now} />
  return (
    <div className="mining-fundamentals">
      <div className="mining-kpis" aria-label="Aktuelle Mining-Kennzahlen">
        <HashrateCard className="mining-kpi mining-hashrate" />
        <Metric
          status={snapshotStatus}
          title="Aktuelle Difficulty"
          value={block ? n(block.difficulty / 1e12, 2) : undefined}
          unit="T"
          note="Netzwerkschwierigkeit · 1 T = 10¹² · mempool.space"
        />
        <Metric
          status={snapshotStatus}
          title="Bitcoin-Angebot · Modell"
          value={supply ? n(satsToBtc(supply.issuedSats)) : undefined}
          unit="BTC"
          note="Subventionsmodell inkl. Genesis · auf ganze BTC gerundet"
        />
        <Metric
          status={snapshotStatus}
          title="Angebotsinflation · Schätzung"
          value={inflation}
          unit="% p. a."
          note="Nächste 365 Modelltage · Halving berücksichtigt"
        />
        <Metric
          status={snapshotStatus}
          title="Nächstes Halving"
          value={supply ? n(supply.remaining) : undefined}
          unit="Blöcke"
          note={supply ? `Bis Block ${n(supply.nextHeight)}` : 'Verbleibend im aktuellen Zyklus'}
        />
      </div>

      <section
        id="mining-snapshot"
        className="mining-snapshot"
        aria-label="Datenstand der Mining-Kennzahlen"
      >
        <div className="analysis-section-head">
          <p className="mining-note">
            Gemeinsamer Block-Snapshot{block && ` · Höhe ${n(block.height)}`} für Difficulty,
            Angebot, Inflation und Halving.
          </p>
          <ResourceBadge query={query} resourceKey="blocks" now={now} />
        </div>
        <ResourceStatus query={query} resource="Block-Snapshot" resourceKey="blocks" now={now} />
        {block && !supply && (
          <p className="resource-warning" role="alert">
            Blockhöhe außerhalb des unterstützten Mainnet-Bereichs. Angebots- und Halving-Modell
            sind für diesen Snapshot nicht verfügbar.
          </p>
        )}
        <p className="mining-note">
          Abruf alle 60 Sek. bei sichtbarem Tab · Alterswarnung ab 60 Sek. Der Abrufzeitpunkt ist
          kein Blockzeitpunkt. Die Hashrate verwendet ihren eigenen Datenstand.
        </p>
      </section>

      <div className="dashboard-grid mining-analysis">
        <PlaceholderCard
          className="col-span-12 lg:col-span-8"
          title="Hashrate & Difficulty"
          description="Geplant für Phase 2.13: historische Entwicklung der Rechenleistung und Mining-Schwierigkeit."
        />
        <PlaceholderCard
          className="col-span-12 lg:col-span-4"
          title="Mining-Pools"
          description="Geplant für Phase 2.13: Verteilung der gefundenen Blöcke auf Mining-Pools."
        />
        <Card
          className="mining-analysis-card col-span-12 lg:col-span-6"
          aria-labelledby="halving-title"
        >
          <CardTitle id="halving-title">Halving-Analyse</CardTitle>
          <Value value={supply ? n(supply.remaining) : undefined} unit="Blöcke verbleibend" />
          <Progress label="Fortschritt im Halving-Zyklus" value={supply?.progressPercent} />
          <Facts
            rows={[
              ['Aktuelle Blockhöhe', block ? n(block.height) : '—'],
              [
                'Aktueller Halving-Zyklus',
                supply ? `${n(supply.cycle + 1)} · nach ${n(supply.cycle)} Halvings` : '—',
              ],
              [
                'Letztes Halving bei Block',
                supply
                  ? supply.lastHeight === null
                    ? 'Noch keines · Genesis bei 0'
                    : n(supply.lastHeight)
                  : '—',
              ],
              ['Nächstes Halving bei Block', supply ? n(supply.nextHeight) : '—'],
              ['Verbleibende Blöcke', supply ? n(supply.remaining) : '—'],
              ['Aktuelle Blocksubvention', supply ? btc(BigInt(supply.subsidySats)) : '—'],
              ['Nächste Blocksubvention', supply ? btc(BigInt(supply.nextSubsidySats)) : '—'],
            ]}
          />
          <footer className="mining-analysis-footer mining-note">
            <p>
              Ein Zyklus umfasst {n(HALVING_INTERVAL)} Blockintervalle. Der nächste Block an der
              Grenze erhält bereits die halbierte Subvention. Kein festes Halving-Datum.
            </p>
            {supply && supply.subsidySats === 0 && (
              <p>
                Die Subvention ist bereits null. Weitere Intervallgrenzen ändern sie nicht mehr.
              </p>
            )}
            <p>Berechnet aus dem oben ausgewiesenen mempool.space-Block-Snapshot.</p>
          </footer>
        </Card>
        <Card
          className="mining-analysis-card col-span-12 lg:col-span-6"
          aria-labelledby="supply-title"
        >
          <CardTitle id="supply-title">Bitcoin-Angebotsanalyse</CardTitle>
          <Value value={supply ? n(satsToBtc(supply.issuedSats), 8) : undefined} unit="BTC" />
          <p className="mining-note">Rechnerisch ausgegeben gemäß Subventionsplan</p>
          <Progress label="Anteil am Subventionsmaximum" value={supply?.issuedPercent} />
          <Facts
            rows={[
              ['Noch nicht ausgegeben · Modell', supply ? btc(supply.remainingSats) : '—'],
              ['Theoretisches Subventionsmaximum', btc(MAX_SUBSIDY_SUPPLY_SATS)],
              ['Aktuelle Blocksubvention', supply ? btc(BigInt(supply.subsidySats)) : '—'],
              [
                'Jährliche Neuemission · Schätzung',
                supply ? `${btc(supply.annualIssuanceSats)} / Jahr` : '—',
              ],
              [
                'Jährliche Angebotsinflation · Schätzung',
                inflation === undefined ? '—' : `${inflation} % p. a.`,
              ],
            ]}
          />
          <footer className="mining-analysis-footer mining-note">
            <p>
              Modell inkl. 50 nicht ausgebbarer Genesis-BTC. Nicht vollständig beanspruchte
              Subventionen und verlorene BTC sind nicht abgezogen. Kein exakter zirkulierender
              Bestand. 21 Mio. BTC ist ein gerundeter Referenzwert.
            </p>
            <p>
              Jahresschätzung: 144 Blöcke pro Tag × 365 = {n(MODEL_YEAR_BLOCKS)} zukünftige Blöcke;
              Subventionen über alle betroffenen Halving-Intervalle, geteilt durch den heutigen
              Modellbestand. Keine Prognose der tatsächlichen Blockproduktion, Kaufkraft oder Kurse.
            </p>
            <p>Berechnet aus dem oben ausgewiesenen mempool.space-Block-Snapshot.</p>
          </footer>
        </Card>
      </div>
    </div>
  )
}
