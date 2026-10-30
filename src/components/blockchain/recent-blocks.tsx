import { useState } from 'react'
import type { Block } from '../../../shared/bitcoin'
import { formatNumber as n, formatTime } from '@/lib/bitcoin'
import { ResourceStatus, type ResourceQuery } from './resource-status'

export function RecentBlocks({ query }: { query: ResourceQuery<Block[]> }) {
  const blocks = query.data?.data ?? []
  const [selection, setSelection] = useState<{ hash: string | null; notice: string }>({
    hash: null,
    notice: '',
  })
  const selected = blocks.find((block) => block.hash === selection.hash) ?? blocks[0]
  if (selection.hash && !blocks.some((block) => block.hash === selection.hash)) {
    setSelection({
      hash: null,
      notice:
        'Der ausgewählte Block ist nicht mehr in der Liste. Der jüngste verfügbare Block wird angezeigt.',
    })
  }
  const choose = (block: Block) => setSelection({ hash: block.hash, notice: '' })
  return (
    <section className="analysis-blocks" aria-labelledby="blocks-title">
      <div className="analysis-section-head">
        <div>
          <p className="analysis-eyebrow">04 / Bestätigter Blockspace</p>
          <h2 id="blocks-title" className="section-title">
            Jüngste Blöcke
          </h2>
        </div>
        <span className="resource-badge">{n(blocks.length)} Blöcke</span>
      </div>
      <div
        className="blocks-table-wrap"
        role="region"
        aria-label="Jüngste Blöcke, bei Bedarf horizontal scrollbar"
        tabIndex={0}
      >
        <table className="blocks-table">
          <caption>Blockhöhe wählen für Details · Blockzeiten laut Miner · lokale Zeitzone</caption>
          <thead>
            <tr>
              {['Blockhöhe', 'Zeitpunkt', 'TX', 'MB', 'MWU'].map((label) => (
                <th scope="col" key={label}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {blocks.map((block) => (
              <tr
                key={block.hash}
                data-selected={block.hash === selected?.hash}
                onClick={() => choose(block)}
              >
                <td>
                  <button
                    type="button"
                    aria-label={`Block ${n(block.height)} auswählen`}
                    aria-pressed={block.hash === selected?.hash}
                    onClick={() => choose(block)}
                  >
                    {n(block.height)} <span aria-hidden="true">→</span>
                  </button>
                </td>
                <td>
                  <time dateTime={new Date(block.timestamp * 1000).toISOString()}>
                    {formatTime(block.timestamp * 1000)}
                  </time>
                </td>
                <td>{n(block.transactionCount)}</td>
                <td>{n(block.sizeBytes / 1e6, 2)}</td>
                <td>
                  {(block.weightUnits / 1e6).toLocaleString('de-DE', {
                    minimumFractionDigits: 3,
                    maximumFractionDigits: 3,
                  })}
                </td>
              </tr>
            ))}
            {!blocks.length && (
              <tr>
                <td colSpan={5}>
                  {query.isPending ? 'Blockdaten werden geladen …' : 'Keine Blockdaten verfügbar.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {selection.notice && (
        <p role="status" className="analysis-meta">
          {selection.notice}
        </p>
      )}
      {selected && (
        <div
          className="block-detail"
          role="region"
          aria-labelledby="block-detail-title"
          aria-live="polite"
          aria-atomic="true"
        >
          <div className="analysis-section-head">
            <h3 id="block-detail-title">Block {n(selected.height)}</h3>
            <a href={`https://mempool.space/block/${selected.hash}`}>Im Blockexplorer ↗</a>
          </div>
          <dl>
            <div>
              <dt>Exakte Größe</dt>
              <dd>{n(selected.sizeBytes)} Byte</dd>
            </div>
            <div>
              <dt>Exaktes Gewicht</dt>
              <dd>{n(selected.weightUnits)} WU</dd>
            </div>
            <div>
              <dt>Transaktionen</dt>
              <dd>{n(selected.transactionCount)}</dd>
            </div>
            <div>
              <dt>Blockzeitstempel</dt>
              <dd>
                <time dateTime={new Date(selected.timestamp * 1000).toISOString()}>
                  {formatTime(selected.timestamp * 1000)}
                </time>{' '}
                · Unix {selected.timestamp}
              </dd>
            </div>
          </dl>
          <p className="analysis-meta">Vollständiger Blockhash</p>
          <p className="technical-identifier">{selected.hash}</p>
        </div>
      )}
      <ResourceStatus query={query} resource="blocks" />
    </section>
  )
}
