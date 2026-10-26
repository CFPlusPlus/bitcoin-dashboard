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

export interface BitcoinResources {
  height: { height: number }
  'latest-block': Block
  blocks: Block[]
  fees: Fees
  mempool: Mempool
}

export interface BitcoinResponse<T> {
  data: T
  source: 'mempool.space'
  updatedAt: string // Successful retrieval, not block creation time
}
