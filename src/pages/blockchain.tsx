import { BlocksTable, MetricCard, PageHeading, PlaceholderCard } from '@/components/dashboard'

export default function Blockchain() {
  return <><PageHeading title="Blockchain" description="Blöcke, Transaktionen und die Nachfrage nach Blockspace." /><div className="dashboard-grid">
    {[['Blockhöhe', 'Blöcke'], ['Gebühren', 'sat/vB'], ['Ø Blockzeit', 'Min.'], ['Transaktionsdurchsatz', 'TX/s'], ['Blockgröße', 'MB'], ['Blockgewicht', 'MWU']].map(([label, unit]) => <MetricCard key={label} label={label} unit={unit} />)}
    <PlaceholderCard className="col-span-12" title="Mempool" description="Ausstehende Transaktionen und Gebührenverteilung werden hier dargestellt." /><BlocksTable className="col-span-12" />
  </div></>
}
