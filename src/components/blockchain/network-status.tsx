import type { Block } from '../../../shared/bitcoin'
import { formatNumber as n, formatTime } from '@/lib/bitcoin'
import { ResourceStatus, type ResourceQuery } from './resource-status'

export function NetworkStatus({
  height,
  blocks,
}: {
  height: ResourceQuery<{ height: number }>
  blocks: ResourceQuery<Block[]>
}) {
  const block = blocks.data?.data[0]
  const utilization = block ? (block.weightUnits / 4_000_000) * 100 : undefined
  return (
    <aside className="network-rail" aria-labelledby="network-title">
      <div className="analysis-section-head">
        <h2 id="network-title" className="analysis-eyebrow">
          02 / Netzwerkstand
        </h2>
      </div>
      <p className="network-height">{height.data ? n(height.data.data.height) : '—'}</p>
      <p className="analysis-meta">Blockhöhe · letzter Abruf</p>
      <ResourceStatus query={height} resource="height" />
      <div className="network-block">
        <div className="analysis-section-head">
          <h3>Letzter Block</h3>
          <span className="analysis-meta">{block ? n(block.height) : '—'}</span>
        </div>
        {block && (
          <p className="analysis-meta block-mined-time">
            Blockzeit{' '}
            <time dateTime={new Date(block.timestamp * 1000).toISOString()}>
              {formatTime(block.timestamp * 1000)}
            </time>
          </p>
        )}
        <dl className="network-pair">
          <div>
            <dt>Blockgröße</dt>
            <dd>
              {block ? n(block.sizeBytes / 1e6, 2) : '—'} <small>MB</small>
            </dd>
          </div>
          <div>
            <dt>Blockgewicht</dt>
            <dd>
              {block ? n(block.weightUnits / 1e6, 2) : '—'} <small>MWU</small>
            </dd>
          </div>
        </dl>
        <div className="weight-heading">
          <span>Gewichtsauslastung</span>
          <strong>{utilization === undefined ? '—' : `${n(utilization, 2)} %`}</strong>
        </div>
        <div
          className="weight-track"
          role="img"
          aria-label={
            block
              ? `Blockgewicht ${n(block.weightUnits)} von maximal 4.000.000 WU`
              : 'Blockgewicht nicht verfügbar'
          }
        >
          <span style={{ width: `${utilization ?? 0}%` }} />
        </div>
        <p className="analysis-meta">Maximal 4 MWU pro Block</p>
        <ResourceStatus query={blocks} resource="blocks" />
        {!blocks.isPending && !block && (
          <p className="analysis-meta">Keine Blockdaten verfügbar.</p>
        )}
      </div>
      <dl className="network-unconnected">
        <div>
          <dt>Ø Blockzeit</dt>
          <dd>
            — <span>nicht angebunden</span>
          </dd>
        </div>
        <div>
          <dt>Transaktionsdurchsatz</dt>
          <dd>
            — <span>nicht angebunden</span>
          </dd>
        </div>
      </dl>
    </aside>
  )
}
