import type { UseQueryResult } from '@tanstack/react-query'
import type { BitcoinResponse } from '../../shared/bitcoin'
import { Card, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatNumber as n, formatTime, useBitcoin } from '@/lib/bitcoin'

export function DataStatus({ query }: { query: UseQueryResult<BitcoinResponse<unknown>, Error> }) {
  return <div className="mt-3 space-y-2 text-xs text-muted-foreground" aria-live="polite">
    <p>Quelle: <a href="https://mempool.space" className="underline">mempool.space</a></p>
    {query.data && <p>Zuletzt erfolgreich: <time dateTime={query.data.updatedAt}>{formatTime(query.data.updatedAt)}</time></p>}
    {query.isPending && <p role="status">Daten werden geladen …</p>}
    {query.data && (query.isError || query.isStale) && <p className="text-primary">Veraltete Daten · Aktualisierung ausstehend</p>}
    {query.isError && <div role="alert"><p>{query.error.message}</p><Button variant="outline" className="mt-2" disabled={query.isFetching} onClick={() => void query.refetch()}>Erneut versuchen</Button></div>}
    {query.isFetching && !query.isPending && <p role="status">Aktualisierung läuft …</p>}
  </div>
}

export function HeightMetric() {
  const query = useBitcoin('height')
  return <Card className="col-span-6 md:col-span-4 xl:col-span-2"><CardTitle>Blockhöhe</CardTitle><p className="my-3 text-3xl font-semibold tabular-nums">{query.data ? n(query.data.data.height) : '—'}</p><p className="text-xs text-muted-foreground">Blöcke</p><DataStatus query={query} /></Card>
}

export function FeeMetric() {
  const query = useBitcoin('fees')
  return <Card className="col-span-6 md:col-span-4 xl:col-span-2"><CardTitle>Gebühren</CardTitle><p className="my-3 text-3xl font-semibold tabular-nums">{query.data ? n(query.data.data.fastest, 3) : '—'}</p><p className="text-xs text-muted-foreground">sat/vB · Hohe Priorität</p><DataStatus query={query} /></Card>
}

export function FeeDetails() {
  const query = useBitcoin('fees')
  const fees = query.data?.data
  return <Card className="col-span-12 md:col-span-6"><CardTitle>Gebührenempfehlungen</CardTitle><dl className="mt-4 space-y-2 text-sm">{([
    ['Hohe Priorität', fees?.fastest], ['Etwa 30 Minuten', fees?.halfHour], ['Etwa 60 Minuten', fees?.hour], ['Sparsam', fees?.economy], ['Minimum', fees?.minimum],
  ] as const).map(([label, value]) => <div key={label} className="flex justify-between gap-4"><dt>{label}</dt><dd className="tabular-nums">{value === undefined ? '—' : n(value, 3)} sat/vB</dd></div>)}</dl><p className="mt-3 text-xs text-muted-foreground">Schätzungen, keine garantierten Bestätigungszeiten.</p><DataStatus query={query} /></Card>
}

export function MempoolCard({ className = 'col-span-12 md:col-span-6' }: { className?: string }) {
  const query = useBitcoin('mempool')
  const data = query.data?.data
  return <Card className={className}><CardTitle>Mempool</CardTitle><dl className="mt-4 space-y-3 text-sm"><div><dt className="text-muted-foreground">Ausstehende Transaktionen</dt><dd className="text-2xl tabular-nums">{data ? n(data.transactionCount) : '—'}</dd></div><div><dt className="text-muted-foreground">Virtuelle Größe</dt><dd>{data ? n(data.virtualSizeBytes / 1_000_000, 2) : '—'} MvB</dd></div><div><dt className="text-muted-foreground">Gesamte Gebühren</dt><dd>{data ? n(data.totalFeeSats) : '—'} sat</dd></div></dl><DataStatus query={query} /></Card>
}

export function LatestBlockMetrics() {
  // Reuse the table snapshot, avoiding a redundant upstream request and mixed block metrics.
  const query = useBitcoin('blocks')
  const block = query.data?.data[0]
  return <>{([['Blockgröße · letzter Block', block?.sizeBytes, 'MB'], ['Blockgewicht · letzter Block', block?.weightUnits, 'MWU']] as const).map(([label, value, unit]) => <Card key={label} className="col-span-6 md:col-span-4 xl:col-span-2"><CardTitle>{label}</CardTitle><p className="my-3 text-3xl font-semibold tabular-nums">{value === undefined ? '—' : n(value / 1_000_000, 2)}</p><p className="text-xs text-muted-foreground">{unit}{block && ` · Block ${n(block.height)}`}</p><DataStatus query={query} /></Card>)}</>
}

export function LiveBlocksTable({ className = 'col-span-12' }: { className?: string }) {
  const query = useBitcoin('blocks')
  return <Card className={className}><CardTitle>Letzte Blöcke</CardTitle><DataStatus query={query} /><div className="mt-5 overflow-x-auto"><table className="w-full text-left text-xs"><thead className="text-muted-foreground"><tr>{['Blockhöhe', 'Zeitpunkt', 'Transaktionen', 'Größe'].map(title => <th key={title} className="border-b border-border pb-3 pr-5 font-medium">{title}</th>)}</tr></thead><tbody>{query.data ? query.data.data.map(block => <tr key={block.hash} className="border-b border-border tabular-nums"><td className="py-3 pr-5"><a className="text-primary underline" href={`https://mempool.space/block/${block.hash}`}>{n(block.height)}</a></td><td className="whitespace-nowrap pr-5"><time dateTime={new Date(block.timestamp * 1000).toISOString()}>{formatTime(block.timestamp * 1000)}</time></td><td className="pr-5">{n(block.transactionCount)}</td><td>{n(block.sizeBytes / 1_000_000, 2)} MB</td></tr>) : <tr><td colSpan={4} className="py-10 text-center text-muted-foreground">{query.isPending ? 'Blockdaten werden geladen …' : 'Keine Blockdaten verfügbar.'}</td></tr>}</tbody></table></div></Card>
}
