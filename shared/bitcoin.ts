export interface Block {
  hash: string
  height: number
  timestamp: number // Unix seconds, as reported by the miner
  transactionCount: number
  sizeBytes: number
  weightUnits: number
}

export interface Fees {
  fastest: number
  halfHour: number
  hour: number
  economy: number
  minimum: number
}

export interface Mempool {
  transactionCount: number
  virtualSizeBytes: number
  totalFeeSats: number
  feeHistogram: { feeRate: number; virtualSizeBytes: number }[]
}

export interface DifficultyAdjustment {
  estimatedChangePercent: number // Signed forecast, -75 to +300; not market performance
  remainingBlocks: number // 1..2016, including the next retarget block
  progressPercent: number // Provider's height modulo 2016, expressed in percent
  nextRetargetHeight: number
  estimatedRetargetAt: string // ISO UTC, converted from provider Unix milliseconds
}

export interface BitcoinResources {
  height: { height: number }
  'latest-block': Block
  blocks: Block[]
  fees: Fees
  mempool: Mempool
  'difficulty-adjustment': DifficultyAdjustment
}

export interface BitcoinResponse<T> {
  data: T
  source: 'mempool.space'
  updatedAt: string // Successful retrieval, not block creation time
}
