import type { BitcoinResources, BitcoinResponse, Block, Fees, Mempool } from './bitcoin'
import {
  MAX_BLOCK_SIZE,
  MAX_BLOCK_TIMESTAMP,
  MAX_FEE_RATE,
  MAX_HISTOGRAM_ENTRIES,
} from './bitcoin-limits'
import { number } from './bitcoin-number'
import { parseDifficultyAdjustment } from './difficulty-adjustment'

// Pure normalized-contract validation, shared without importing any server adapter.
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid object')
  return value as Record<string, unknown>
}

function height(value: unknown) {
  return { height: number(object(value).height) }
}

function block(value: unknown): Block {
  const data = object(value)
  if (typeof data.hash !== 'string' || !/^[a-f0-9]{64}$/.test(data.hash))
    throw new Error('Invalid hash')
  return {
    hash: data.hash,
    height: number(data.height),
    timestamp: number(data.timestamp, true, MAX_BLOCK_TIMESTAMP),
    transactionCount: number(data.transactionCount),
    sizeBytes: number(data.sizeBytes, true, MAX_BLOCK_SIZE),
    weightUnits: number(data.weightUnits, true, MAX_BLOCK_SIZE),
  }
}

function blocks(value: unknown): Block[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > 10)
    throw new Error('Invalid blocks')
  const result = value.map(block)
  if (
    new Set(result.map((entry) => entry.hash)).size !== result.length ||
    result.some((entry, i) => i > 0 && entry.height !== result[i - 1].height - 1)
  )
    throw new Error('Invalid block order')
  return result
}

function fees(value: unknown): Fees {
  const data = object(value)
  return {
    fastest: number(data.fastest, false, MAX_FEE_RATE),
    halfHour: number(data.halfHour, false, MAX_FEE_RATE),
    hour: number(data.hour, false, MAX_FEE_RATE),
    economy: number(data.economy, false, MAX_FEE_RATE),
    minimum: number(data.minimum, false, MAX_FEE_RATE),
  }
}

function mempool(value: unknown): Mempool {
  const data = object(value)
  if (!Array.isArray(data.feeHistogram) || data.feeHistogram.length > MAX_HISTOGRAM_ENTRIES)
    throw new Error('Invalid histogram')
  return {
    transactionCount: number(data.transactionCount),
    virtualSizeBytes: number(data.virtualSizeBytes),
    totalFeeSats: number(data.totalFeeSats),
    feeHistogram: data.feeHistogram.map((value) => {
      const entry = object(value)
      return {
        feeRate: number(entry.feeRate, false, MAX_FEE_RATE),
        virtualSizeBytes: number(entry.virtualSizeBytes),
      }
    }),
  }
}

const validators: { [K in keyof BitcoinResources]: (value: unknown) => BitcoinResources[K] } = {
  height,
  'latest-block': block,
  blocks,
  fees,
  mempool,
  'difficulty-adjustment': parseDifficultyAdjustment,
}

export function parseBitcoinResponse<K extends keyof BitcoinResources>(
  resource: K,
  value: unknown,
): BitcoinResponse<BitcoinResources[K]> {
  const response = object(value)
  if (
    response.source !== 'mempool.space' ||
    typeof response.updatedAt !== 'string' ||
    !Number.isFinite(Date.parse(response.updatedAt))
  )
    throw new Error('Invalid metadata')
  return {
    source: response.source,
    updatedAt: response.updatedAt,
    data: validators[resource](response.data),
  }
}
