// Synthetic fixtures used only in tests; never imported by runtime code.
export const rawBlock = {
  id: 'a'.repeat(64),
  height: 900000,
  timestamp: 1740000000,
  tx_count: 2345,
  size: 1500000,
  weight: 3999999,
}
export const rawFees = {
  fastestFee: 2,
  halfHourFee: 1.5,
  hourFee: 1,
  economyFee: 0.5,
  minimumFee: 0.1,
}
export const rawMempool = {
  count: 123,
  vsize: 456789,
  total_fee: 9876,
  fee_histogram: [
    [0.1, 1234],
    [0, 50],
  ],
}
export const block = {
  hash: rawBlock.id,
  height: rawBlock.height,
  timestamp: rawBlock.timestamp,
  transactionCount: rawBlock.tx_count,
  sizeBytes: rawBlock.size,
  weightUnits: rawBlock.weight,
}
export const envelope = <T>(data: T) => ({
  data,
  source: 'mempool.space' as const,
  updatedAt: new Date().toISOString(),
})
