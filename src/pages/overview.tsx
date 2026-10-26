import { BlocksTable, MetricCard, PageHeading, PlaceholderCard, PriceChart } from '@/components/dashboard'

export default function Overview() {
  return <><PageHeading title="Übersicht" description="Markt und Bitcoin-Netzwerk auf einen Blick." /><div className="dashboard-grid">
    {[['Bitcoin-Kurs', 'USD'], ['Marktkapitalisierung', 'USD'], ['Handelsvolumen · 24 h', 'USD'], ['Blockhöhe', 'Blöcke'], ['Hashrate', 'EH/s'], ['Gebühren', 'sat/vB']].map(([label, unit]) => <MetricCard key={label} label={label} unit={unit} />)}
    <PriceChart /><div className="col-span-12 grid gap-4 md:grid-cols-2 xl:col-span-4 xl:grid-cols-1"><PlaceholderCard title="Netzwerkstatus" description="Blockzeit, Mempool und Netzwerkaktivität." /><PlaceholderCard title="Halving-Fortschritt" description="Fortschritt und verbleibende Blöcke bis zum nächsten Halving." /></div>
    <BlocksTable className="col-span-12" />
  </div></>
}
