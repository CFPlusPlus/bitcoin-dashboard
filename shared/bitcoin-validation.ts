import type { BitcoinResources, BitcoinResponse, Block, Fees, Mempool } from './bitcoin'

// Pure normalized-contract validation, shared without importing any server adapter.
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid object')
  return value as Record<string, unknown>
}

function number(value: unknown, integer = true, maximum = Number.MAX_SAFE_INTEGER): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > maximum || (integer && !Number.isSafeInteger(value))) throw new Error('Invalid number')
  return value
}

function height(value: unknown) {
  return { height: number(object(value).height) }
}

function block(value: unknown): Block {
  const data = object(value)
  if (typeof data.hash !== 'string' || !/^[a-f0-9]{64}$/.test(data.hash)) throw new Error('Invalid hash')
  return { hash: data.hash, height: number(data.height), timestamp: number(data.timestamp, true, 8_640_000_000_000), transactionCount: number(data.transactionCount), sizeBytes: number(data.sizeBytes, true, 4_000_000), weightUnits: number(data.weightUnits, true, 4_000_000) }
}

function blocks(value: unknown): Block[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > 10) throw new Error('Invalid blocks')
  const result = value.map(block)
  if (new Set(result.map(entry => entry.hash)).size !== result.length || result.some((entry, i) => i > 0 && entry.height !== result[i - 1].height - 1)) throw new Error('Invalid block order')
  return result
}

function fees(value: unknown): Fees {
  const data = object(value)
  return { fastest: number(data.fastest, false), halfHour: number(data.halfHour, false), hour: number(data.hour, false), economy: number(data.economy, false), minimum: number(data.minimum, false) }
}

function mempool(value: unknown): Mempool {
  const data = object(value)
  if (!Array.isArray(data.feeHistogram)) throw new Error('Invalid histogram')
  return {
    transactionCount: number(data.transactionCount), virtualSizeBytes: number(data.virtualSizeBytes), totalFeeSats: number(data.totalFeeSats),
    feeHistogram: data.feeHistogram.map(value => {
      const entry = object(value)
      return { feeRate: number(entry.feeRate, false), virtualSizeBytes: number(entry.virtualSizeBytes) }
    }),
  }
}

const validators: { [K in keyof BitcoinResources]: (value: unknown) => BitcoinResources[K] } = { height, 'latest-block': block, blocks, fees, mempool }

export function parseBitcoinResponse<K extends keyof BitcoinResources>(resource: K, value: unknown): BitcoinResponse<BitcoinResources[K]> {
  const response = object(value)
  if (response.source !== 'mempool.space' || typeof response.updatedAt !== 'string' || !Number.isFinite(Date.parse(response.updatedAt))) throw new Error('Invalid metadata')
  return { source: response.source, updatedAt: response.updatedAt, data: validators[resource](response.data) }
}
