import { useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import type { Mempool } from '../../../shared/bitcoin'
import { formatNumber as n } from '@/lib/bitcoin'
import {
  aggregateHistogram,
  exactNumber,
  histogramScale,
  mvb,
  share,
} from '@/lib/blockchain-analysis'

export function FeeHistogram({
  entries,
  mempoolSize,
}: {
  entries: Mempool['feeHistogram']
  mempoolSize: number
}) {
  const { buckets, total, ignoredEntries } = useMemo(() => aggregateHistogram(entries), [entries])
  const [selection, setSelection] = useState<{ id: string | null; notice: string }>({
    id: null,
    notice: '',
  })
  const [preview, setPreview] = useState<string | null>(null)
  const controls = useRef<(HTMLButtonElement | null)[]>([])
  const pinned = buckets.find((bucket) => bucket.id === selection.id)
  // Validate against each new dataset, so a removed selection cannot silently reappear later.
  if (selection.id !== null && !pinned) {
    setSelection({
      id: null,
      notice: 'Der fixierte Bereich ist nicht mehr verfügbar. Gesamtes Histogramm ausgewählt.',
    })
  }
  if (preview !== null && !buckets.some((bucket) => bucket.id === preview)) setPreview(null)
  const inspected = buckets.find((bucket) => bucket.id === preview) ?? pinned
  const inspectedBytes = inspected?.virtualSizeBytes ?? total
  const scale = histogramScale(
    buckets.reduce(
      (max, bucket) => (bucket.virtualSizeBytes > max ? bucket.virtualSizeBytes : max),
      0n,
    ),
  )
  const fix = (id: string | null) => {
    setSelection({ id, notice: '' })
    setPreview(null)
  }
  function keyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next: number | undefined
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % buckets.length
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp')
      next = (index - 1 + buckets.length) % buckets.length
    if (event.key === 'Home') next = 0
    if (event.key === 'End') next = buckets.length - 1
    if (next !== undefined) {
      event.preventDefault()
      controls.current[next]?.focus()
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      fix(null)
    }
  }
  return (
    <div
      className="histogram-analysis"
      onKeyDown={(event) => {
        if (event.key === 'Escape') fix(null)
      }}
    >
      <figure aria-labelledby="histogram-caption">
        <div className="histogram-caption">
          <span>Volumen · MvB</span>
          <span>Abruf · keine Zeitreihe</span>
        </div>
        {buckets.length > 0 ? (
          <div className="fee-histogram">
            <div className="histogram-y" aria-hidden="true">
              {scale.ticks.map((tick) => (
                <span key={tick}>{n(tick, 6)}</span>
              ))}
            </div>
            <div
              className="histogram-plot"
              role="group"
              aria-label="Gebührenbereiche im Histogramm"
              style={{ '--bucket-count': buckets.length } as CSSProperties}
            >
              <div className="histogram-grid" aria-hidden="true">
                {scale.ticks.map((tick) => (
                  <span key={tick} />
                ))}
              </div>
              {buckets.map((bucket, index) => (
                <button
                  className="histogram-bucket"
                  type="button"
                  key={bucket.id}
                  ref={(element) => {
                    controls.current[index] = element
                  }}
                  aria-label={`${bucket.label} sat/vB: ${exactNumber(bucket.virtualSizeBytes)} vB`}
                  aria-pressed={bucket.id === selection.id}
                  data-inspected={bucket.id === inspected?.id}
                  onPointerEnter={(event) => {
                    if (event.pointerType !== 'touch') setPreview(bucket.id)
                  }}
                  onPointerLeave={() => setPreview(null)}
                  onFocus={() => setPreview(bucket.id)}
                  onBlur={() => setPreview(null)}
                  onClick={() => fix(bucket.id)}
                  onKeyDown={(event) => keyDown(event, index)}
                >
                  <span className="histogram-column" aria-hidden="true">
                    <span
                      className="histogram-bar"
                      style={{ height: `${(mvb(bucket.virtualSizeBytes) / scale.maximum) * 100}%` }}
                    >
                      <span className="histogram-bar-value">
                        {bucket.virtualSizeBytes > 0n && mvb(bucket.virtualSizeBytes) < 0.01
                          ? '<0,01'
                          : n(mvb(bucket.virtualSizeBytes), 2)}
                      </span>
                    </span>
                  </span>
                  <span className="histogram-x" aria-hidden="true">
                    {bucket.shortLabel}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="histogram-empty">
            <p>Kein Histogrammvolumen verfügbar.</p>
            <p>Ein leeres Histogramm bedeutet nicht zwangsläufig einen leeren Mempool.</p>
          </div>
        )}
        <figcaption className="analysis-meta" id="histogram-caption">
          Gleich breite Kategorien · Gebührenbereiche in sat/vB
        </figcaption>
      </figure>
      <div className="histogram-inspection" aria-live="polite" aria-atomic="true" role="status">
        <div>
          <p className="analysis-eyebrow">
            {preview && inspected
              ? 'Vorschau'
              : pinned
                ? 'Fixierter Bereich'
                : 'Gesamtes Histogramm'}
          </p>
          <p className="inspection-range">
            <strong>{inspected?.label ?? 'Alle Bereiche'}</strong>
            {inspected && <small> sat/vB</small>}
            <span className="analysis-meta inspection-share">
              {n(share(inspectedBytes, total) * 100, 1)} % des Histogrammvolumens
            </span>
          </p>
          {preview && pinned && (
            <p className="analysis-meta">Fixiert bleibt: {pinned.label} sat/vB</p>
          )}
        </div>
        <div className="inspection-value">
          <p>
            <strong>{n(mvb(inspectedBytes), 6)}</strong>
            <small> MvB</small>
          </p>
          <p className="analysis-meta">{exactNumber(inspectedBytes)} vB</p>
        </div>
      </div>
      {selection.notice && (
        <p className="analysis-meta" role="status">
          {selection.notice}
        </p>
      )}
      {BigInt(mempoolSize) !== total && (
        <p className="analysis-meta histogram-coverage">
          Histogramm: {exactNumber(total)} vB · Mempool: {n(mempoolSize)} vB. Die API liefert
          unterschiedliche Summen; Anteile beziehen sich ausschließlich auf das Histogramm.
        </p>
      )}
      {ignoredEntries > 0 && (
        <p className="resource-warning">
          {n(ignoredEntries)} ungültige Volumenwerte nicht dargestellt.
        </p>
      )}
      <div className="histogram-controls">
        <label>
          <span>Gebührenbereich prüfen</span>
          <select
            value={pinned?.id ?? ''}
            disabled={!buckets.length}
            onChange={(event) => fix(event.target.value || null)}
          >
            <option value="">Gesamtes Histogramm</option>
            {buckets.map((bucket) => (
              <option key={bucket.id} value={bucket.id}>
                {bucket.label} sat/vB · {exactNumber(bucket.virtualSizeBytes)} vB
              </option>
            ))}
          </select>
        </label>
        <button type="button" onClick={() => fix(null)} disabled={!pinned}>
          Auswahl lösen
        </button>
      </div>
      <p className="analysis-meta histogram-help">
        Hover / ← → prüfen · Klick / Enter fixiert · Esc löst. Touch: Balken oder Auswahlfeld.
      </p>
    </div>
  )
}
