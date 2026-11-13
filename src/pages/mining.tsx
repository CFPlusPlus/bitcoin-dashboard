import { PageHeading } from '@/components/dashboard'
import { DifficultyAdjustment } from '@/components/mining/difficulty-adjustment'
import { MiningFundamentals } from '@/components/mining/fundamentals'
import { ErrorBoundary } from '@/components/error-boundary'
import '@/styles/mining.css'

export default function Mining() {
  return (
    <>
      <PageHeading
        title="Netzwerk & Mining"
        description="Rechenleistung, Mining und das Bitcoin-Angebot."
        sourceLabel="Netzwerk · mempool.space · Subventionsmodell"
      />
      <DifficultyAdjustment />
      <ErrorBoundary scope="card">
        <MiningFundamentals />
      </ErrorBoundary>
    </>
  )
}
