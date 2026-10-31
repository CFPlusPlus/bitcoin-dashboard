import { useEffect, useState } from 'react'
import { formatNumber, formatTime, useBitcoin } from '@/lib/bitcoin'
import { ResourceBadge, ResourceStatus } from '@/components/blockchain/resource-status'
import { DIFFICULTY_EPOCH_BLOCKS } from '../../../shared/difficulty-adjustment'
import '@/styles/blockchain.css'
import '@/styles/mining.css'

// Refresh visible age/status even if requests fail or the browser is offline.
// This timer never fetches and is suspended while the document is hidden.
function useVisibleClock() {
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined
    const tick = () => setNow(Date.now())
    const visibility = () => {
      clearInterval(timer)
      tick()
      if (document.visibilityState !== 'hidden') timer = setInterval(tick, 30_000)
    }
    if (document.visibilityState !== 'hidden') timer = setInterval(tick, 30_000)
    document.addEventListener('visibilitychange', visibility)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', visibility)
    }
  }, [])
  return now
}

export function DifficultyAdjustment() {
  const query = useBitcoin('difficulty-adjustment')
  const now = useVisibleClock()
  const data = query.data?.data
  const change = data?.estimatedChangePercent
  const signed = change === undefined ? '—' : `${change > 0 ? '+' : ''}${formatNumber(change, 2)} %`
  const direction =
    change === undefined
      ? 'Prognose noch nicht verfügbar'
      : change > 0
        ? 'Höhere Mining-Schwierigkeit erwartet'
        : change < 0
          ? 'Niedrigere Mining-Schwierigkeit erwartet'
          : 'Unveränderte Mining-Schwierigkeit erwartet'
  const ageMinutes = query.data
    ? Math.max(0, Math.floor((now - Date.parse(query.data.updatedAt)) / 60_000))
    : 0

  return (
    <section className="difficulty-adjustment" aria-labelledby="difficulty-title">
      <header className="analysis-section-head">
        <div>
          <p className="analysis-eyebrow">Difficulty · Aktuelle Epoche</p>
          <h2 className="section-title" id="difficulty-title">
            Nächste Anpassung
          </h2>
        </div>
        <ResourceBadge query={query} resourceKey="difficulty-adjustment" now={now} />
      </header>
      <div className="difficulty-body">
        <div className="difficulty-forecast">
          <p className="difficulty-label">Erwartete Änderung · Prognose</p>
          <p className="difficulty-value" aria-label={`Erwartete Difficulty-Anpassung: ${signed}`}>
            {signed}
          </p>
          <p className="difficulty-direction">{direction}</p>
          <p className="difficulty-note">
            Schätzung von mempool.space. Die endgültige Anpassung steht erst am Epochenwechsel fest.
          </p>
        </div>
        <div className="difficulty-epoch">
          <dl className="difficulty-facts">
            <div>
              <dt>Verbleibende Blöcke</dt>
              <dd>{data ? formatNumber(data.remainingBlocks) : '—'}</dd>
            </div>
            <div>
              <dt>Nächste Retarget-Höhe</dt>
              <dd>{data ? formatNumber(data.nextRetargetHeight) : '—'}</dd>
            </div>
            <div className="difficulty-date">
              <dt>Geschätzter Zeitpunkt · Ortszeit</dt>
              <dd>
                {data ? (
                  <time dateTime={data.estimatedRetargetAt}>
                    {formatTime(data.estimatedRetargetAt)}
                  </time>
                ) : (
                  '—'
                )}
              </dd>
            </div>
          </dl>
          <div className="difficulty-progress-label">
            <span>Epochenfortschritt</span>
            <strong>{data ? `${formatNumber(data.progressPercent, 2)} %` : '—'}</strong>
          </div>
          {data ? (
            <progress aria-label="Epochenfortschritt" max={100} value={data.progressPercent} />
          ) : (
            <div className="difficulty-progress-empty" aria-hidden="true" />
          )}
          <p className="difficulty-note">
            {data
              ? `${formatNumber(DIFFICULTY_EPOCH_BLOCKS - data.remainingBlocks)} von ${formatNumber(DIFFICULTY_EPOCH_BLOCKS)} Blockintervallen`
              : 'Epochenkontext noch nicht verfügbar'}
          </p>
        </div>
      </div>
      {data && Date.parse(data.estimatedRetargetAt) <= now && (
        <p className="resource-warning">
          Geschätzter Zeitpunkt liegt bereits zurück. Epochenstand erneut abrufen.
        </p>
      )}
      <footer className="difficulty-footer">
        <ResourceStatus
          query={query}
          resource="Difficulty-Prognose"
          resourceKey="difficulty-adjustment"
          now={now}
        />
        <p className="difficulty-note">
          {query.data && <>Abrufalter: {formatNumber(ageMinutes)} Min. · </>}Aktualisierung alle 10
          Min. bei sichtbarem Tab · Alterswarnung ab 20 Min.
        </p>
        <p className="difficulty-note">
          Kein separater Quellzeitstempel verfügbar. Der geschätzte Retarget-Zeitpunkt ist kein
          Datenstand.
        </p>
      </footer>
    </section>
  )
}
