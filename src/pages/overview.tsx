import { MetricCard, PageHeading, PlaceholderCard, PriceChart } from '@/components/dashboard'
import { FeeMetric, HeightMetric, LiveBlocksTable, MempoolCard } from '@/components/bitcoin-data'

export default function Overview() {
  return <><PageHeading title="Übersicht" description="Markt und Bitcoin-Netzwerk auf einen Blick." live /><div className="dashboard-grid">
    {[['Bitcoin-Kurs', 'USD'], ['Marktkapitalisierung', 'USD'], ['Handelsvolumen · 24 h', 'USD']].map(([label, unit]) => <MetricCard key={label} label={label} unit={unit} />)}
    <HeightMetric /><MetricCard label="Hashrate" unit="EH/s" /><FeeMetric />
    <PriceChart /><div className="col-span-12 grid gap-4 md:grid-cols-2 xl:col-span-4 xl:grid-cols-1"><MempoolCard className="" /><PlaceholderCard title="Halving-Fortschritt" description="Fortschritt und verbleibende Blöcke bis zum nächsten Halving." /></div>
    <LiveBlocksTable />
  </div></>
}
