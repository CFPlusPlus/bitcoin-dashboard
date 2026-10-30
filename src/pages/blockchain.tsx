import { PageHeading } from '@/components/dashboard'
import { MempoolAnalysis } from '@/components/blockchain/mempool-analysis'
import { NetworkStatus } from '@/components/blockchain/network-status'
import { FeeRecommendations } from '@/components/blockchain/fee-recommendations'
import { RecentBlocks } from '@/components/blockchain/recent-blocks'
import { useBitcoin } from '@/lib/bitcoin'
import '@/styles/blockchain.css'

export default function Blockchain() {
  // One observer per resource; network metrics and table share the same block response.
  const height = useBitcoin('height')
  const blocks = useBitcoin('blocks')
  const fees = useBitcoin('fees')
  const mempool = useBitcoin('mempool')
  return (
    <>
      <PageHeading
        title="Blockchain"
        description="Blöcke, Transaktionen und die Nachfrage nach Blockspace."
        live
      />
      <div className="blockchain-reference">
        <div className="analysis-stage">
          <MempoolAnalysis query={mempool} />
          <NetworkStatus height={height} blocks={blocks} />
        </div>
        <div className="analysis-lower">
          <FeeRecommendations query={fees} />
          <RecentBlocks query={blocks} />
        </div>
        <section className="analysis-method" aria-labelledby="method-title">
          <h2 id="method-title" className="section-title">
            Datenherkunft & Methodik
          </h2>
          <p>
            Quelle: mempool.space über die gleichnamigen Dashboard-Ressourcen. Jeder Bereich zeigt
            seinen eigenen erfolgreichen Abruf. Die Ressourcen bilden keinen synchronen Snapshot;
            automatische Abrufversuche erfolgen bei sichtbarer Seite etwa jede Minute.
          </p>
          <p>
            Histogramm: Untergrenzen inklusive, Obergrenzen exklusive. Gleich breite Kategorien mit
            unterschiedlich großen Gebührenintervallen; die Höhe zeigt Volumen, keine Dichte und
            keine Zeitreihe. 1 MvB = 1.000.000 vB. Blockgröße (MB) und Blockgewicht (MWU) bezeichnen
            verschiedene Größen.
          </p>
        </section>
      </div>
    </>
  )
}
