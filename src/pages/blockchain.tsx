import { MetricCard, PageHeading } from '@/components/dashboard'
import { FeeDetails, FeeMetric, HeightMetric, LatestBlockMetrics, LiveBlocksTable, MempoolCard } from '@/components/bitcoin-data'

export default function Blockchain() {
  return <><PageHeading title="Blockchain" description="Blöcke, Transaktionen und die Nachfrage nach Blockspace." live /><div className="dashboard-grid">
    <HeightMetric /><FeeMetric /><MetricCard label="Ø Blockzeit" unit="Min." /><MetricCard label="Transaktionsdurchsatz" unit="TX/s" /><LatestBlockMetrics />
    <MempoolCard /><FeeDetails /><LiveBlocksTable />
  </div></>
}
