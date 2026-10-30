import type { Mempool } from '../../../shared/bitcoin'
import { formatNumber as n } from '@/lib/bitcoin'
import { FeeHistogram } from './fee-histogram'
import { ResourceBadge, ResourceStatus, type ResourceQuery } from './resource-status'

export function MempoolAnalysis({ query }: { query: ResourceQuery<Mempool> }) {
  const data = query.data?.data
  return (
    <section className="mempool-analysis" aria-labelledby="mempool-title">
      <div className="analysis-section-head">
        <div>
          <p className="analysis-eyebrow">01 / Nachfrage nach Blockspace</p>
          <h2 id="mempool-title" className="section-title">
            Unbestätigter Blockspace
          </h2>
        </div>
        <ResourceBadge query={query} />
      </div>
      <div className="mempool-lead">
        <div>
          <p className="metric-value-large">
            {data ? n(data.virtualSizeBytes / 1e6, 2) : '—'} <small>MvB</small>
          </p>
          <p className="analysis-meta">Virtuelle Größe im Mempool</p>
        </div>
        <dl className="mempool-facts">
          <div>
            <dt>Transaktionen</dt>
            <dd>{data ? n(data.transactionCount) : '—'}</dd>
          </div>
          <div>
            <dt>Gesamtgebühren · sat</dt>
            <dd>{data ? n(data.totalFeeSats) : '—'}</dd>
          </div>
        </dl>
      </div>
      {data ? (
        <FeeHistogram entries={data.feeHistogram} mempoolSize={data.virtualSizeBytes} />
      ) : (
        <div className="histogram-empty">
          <p>
            {query.isPending ? 'Mempool-Analyse wird geladen …' : 'Keine Mempool-Daten verfügbar.'}
          </p>
          <p>Ohne erfolgreichen Abruf werden keine Werte gezeichnet.</p>
        </div>
      )}
      <ResourceStatus query={query} resource="mempool" />
    </section>
  )
}
