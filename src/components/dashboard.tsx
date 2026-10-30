import { lazy, Suspense } from 'react'
import { Database } from 'lucide-react'
import { Card, CardTitle } from '@/components/ui/card'
import { ErrorBoundary } from '@/components/error-boundary'
import { ComponentLoadError } from '@/lib/component-load-error'

const DemoChart = lazy(() =>
  import('@/components/demo-chart').catch((cause: unknown) => {
    throw new ComponentLoadError(cause)
  }),
)

export function PageHeading({
  title,
  description,
  live = false,
}: {
  title: string
  description: string
  live?: boolean
}) {
  return (
    <div className="page-heading">
      <div>
        <p className="page-eyebrow">
          Bitcoin Dashboard <span aria-hidden="true">/</span> {title}
        </p>
        <h1 tabIndex={-1} className="page-title">
          {title}
          <span className="heading-dot" aria-hidden="true">
            .
          </span>
        </h1>
        <p className="page-description">{description}</p>
      </div>
      <span className="page-source">
        {live ? 'Blockchain · mempool.space' : 'Vorschau · Keine Live-Daten'}
      </span>
    </div>
  )
}

export function MetricCard({ label, unit }: { label: string; unit: string }) {
  return (
    <Card className="col-span-6 md:col-span-4 xl:col-span-2">
      <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
      <p className="metric-value my-3" aria-label={`${label}: noch keine Daten`}>
        — <span className="text-xs font-normal text-muted-foreground">{unit}</span>
      </p>
      <p className="text-xs text-muted-foreground">Datenquelle folgt</p>
    </Card>
  )
}

export function PlaceholderCard({
  title,
  description,
  className = '',
}: {
  title: string
  description: string
  className?: string
}) {
  return (
    <Card className={className}>
      <CardTitle>{title}</CardTitle>
      <div className="flex min-h-32 flex-col items-center justify-center gap-3 py-6 text-center">
        <Database size={20} className="text-muted-foreground" />
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
        <span className="text-xs text-muted-foreground">Platzhalter · Noch nicht verbunden</span>
      </div>
    </Card>
  )
}

export function PriceChart() {
  return (
    <Card className="col-span-12 xl:col-span-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <CardTitle>BTC-Kursverlauf</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Chart-Vorschau · Index statt Kurswerten
          </p>
        </div>
        <span className="status-label">Synthetische Demo-Daten</span>
      </div>
      <ErrorBoundary scope="chart">
        <Suspense
          fallback={
            <div className="chart-placeholder" role="status">
              Chart wird geladen …
            </div>
          }
        >
          <DemoChart />
        </Suspense>
      </ErrorBoundary>
      <p className="mt-3 text-xs text-muted-foreground">
        Illustrativer Verlauf zur Darstellung des Diagramms. Keine realen Kurse, Zeiträume oder
        Live-Daten.
      </p>
    </Card>
  )
}

export function BlocksTable({ className = '' }: { className?: string }) {
  return (
    <Card className={className}>
      <CardTitle>Letzte Blöcke</CardTitle>
      <div className="mt-5 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="text-muted-foreground">
            <tr>
              {['Blockhöhe', 'Zeitpunkt', 'Transaktionen', 'Größe'].map((title) => (
                <th key={title} className="border-b border-border pr-5 pb-3 font-medium">
                  {title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={4} className="py-10 text-center text-muted-foreground">
                Blockdaten werden nach Anbindung der Datenquelle angezeigt.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  )
}
