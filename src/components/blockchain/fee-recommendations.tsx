import type { Fees } from '../../../shared/bitcoin'
import { formatNumber as n } from '@/lib/bitcoin'
import { feeLabels, scaleFees } from '@/lib/blockchain-analysis'
import { ResourceStatus, type ResourceQuery } from './resource-status'

export function FeeRecommendations({ query }: { query: ResourceQuery<Fees> }) {
  const rows = query.data
    ? scaleFees(query.data.data)
    : feeLabels.map((row) => ({ ...row, value: undefined, fraction: 0 }))
  return (
    <section className="analysis-fees" aria-labelledby="fees-title">
      <p className="analysis-eyebrow">03 / Bestätigungspriorität</p>
      <h2 className="section-title" id="fees-title">
        Gebührenempfehlungen
      </h2>
      <dl className="fee-list">
        {rows.map((fee, index) => (
          <div className="fee-row" key={fee.key}>
            <dt>
              <span className="fee-index" aria-hidden="true">
                0{index + 1}
              </span>
              {fee.label}
            </dt>
            <dd>{fee.value === undefined ? '—' : n(fee.value, 3)} sat/vB</dd>
            <span
              className="fee-bar"
              style={{ width: `${fee.fraction * 100}%` }}
              aria-hidden="true"
            />
          </div>
        ))}
      </dl>
      <p className="analysis-meta fee-note">
        Schätzungen, keine garantierten Bestätigungszeiten. Empfehlungen und Histogramm werden
        unabhängig abgerufen.
      </p>
      <ResourceStatus query={query} resource="fees" />
    </section>
  )
}
