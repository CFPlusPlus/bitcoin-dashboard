import type { Block, Fees, Mempool, BitcoinResources, BitcoinResponse } from '../../shared/bitcoin'
import {
  MAX_BLOCK_SIZE,
  MAX_BLOCK_TIMESTAMP,
  MAX_FEE_RATE,
  MAX_HISTOGRAM_ENTRIES,
} from '../../shared/bitcoin-limits'
import { number } from '../../shared/bitcoin-number'
import { cancelBody, readBoundedText, UpstreamError } from './upstream'

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid object')
  return value as Record<string, unknown>
}

export function parseHeight(value: unknown): { height: number } {
  if (typeof value !== 'string' || !/^\d+$/.test(value.trim())) throw new Error('Invalid height')
  return { height: number(Number(value.trim())) }
}

export function parseBlock(value: unknown): Block {
  const block = object(value)
  if (typeof block.id !== 'string' || !/^[a-f0-9]{64}$/.test(block.id))
    throw new Error('Invalid block hash')
  const timestamp = number(block.timestamp, true, MAX_BLOCK_TIMESTAMP)
  const sizeBytes = number(block.size, true, MAX_BLOCK_SIZE)
  const weightUnits = number(block.weight, true, MAX_BLOCK_SIZE)
  return {
    hash: block.id,
    height: number(block.height),
    timestamp,
    transactionCount: number(block.tx_count),
    sizeBytes,
    weightUnits,
  }
}

export function parseBlocks(value: unknown): Block[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > 10)
    throw new Error('Invalid blocks')
  const blocks = value.map(parseBlock)
  if (
    new Set(blocks.map((block) => block.hash)).size !== blocks.length ||
    blocks.some((block, i) => i > 0 && block.height !== blocks[i - 1].height - 1)
  )
    throw new Error('Invalid block order')
  return blocks
}

export function parseFees(value: unknown): Fees {
  const fees = object(value)
  return {
    fastest: number(fees.fastestFee, false, MAX_FEE_RATE),
    halfHour: number(fees.halfHourFee, false, MAX_FEE_RATE),
    hour: number(fees.hourFee, false, MAX_FEE_RATE),
    economy: number(fees.economyFee, false, MAX_FEE_RATE),
    minimum: number(fees.minimumFee, false, MAX_FEE_RATE),
  }
}

export function parseMempool(value: unknown): Mempool {
  const mempool = object(value)
  if (!Array.isArray(mempool.fee_histogram) || mempool.fee_histogram.length > MAX_HISTOGRAM_ENTRIES)
    throw new Error('Invalid histogram')
  const feeHistogram = mempool.fee_histogram.map((entry) => {
    if (!Array.isArray(entry) || entry.length !== 2) throw new Error('Invalid histogram entry')
    return {
      feeRate: number(entry[0], false, MAX_FEE_RATE),
      virtualSizeBytes: number(entry[1]),
    }
  })
  return {
    transactionCount: number(mempool.count),
    virtualSizeBytes: number(mempool.vsize),
    totalFeeSats: number(mempool.total_fee),
    feeHistogram,
  }
}

export const resources = ['height', 'latest-block', 'blocks', 'fees', 'mempool'] as const
export type Resource = keyof BitcoinResources

// Limits apply to bytes actually delivered by the response stream.
export const responseByteLimits: Record<Resource, number> = {
  height: 128,
  'latest-block': 64 * 1024,
  blocks: 64 * 1024,
  fees: 4 * 1024,
  mempool: 1024 * 1024,
}

export async function fetchBitcoin<K extends Resource>(
  resource: K,
  fetcher: typeof fetch = fetch,
): Promise<BitcoinResponse<BitcoinResources[K]>> {
  const paths: Record<Resource, string> = {
    height: '/blocks/tip/height',
    'latest-block': '/blocks',
    blocks: '/blocks',
    fees: '/v1/fees/recommended',
    mempool: '/mempool',
  }
  const timeout = AbortSignal.timeout(8_000)
  const controller = new AbortController()
  const signal = AbortSignal.any([timeout, controller.signal])
  let providerStatus: number | undefined
  try {
    const response = await fetcher(`https://mempool.space/api${paths[resource]}`, {
      headers: { Accept: resource === 'height' ? 'text/plain' : 'application/json' },
      signal,
      redirect: 'manual',
      cache: 'no-store',
    })
    providerStatus = response.status
    if (!response.ok) {
      cancelBody(response)
      throw new UpstreamError(response.status === 429 ? 'rate_limit' : 'http', response.status)
    }
    const text = await readBoundedText(response, responseByteLimits[resource], signal)
    try {
      const raw: unknown = resource === 'height' ? text : JSON.parse(text)
      const parsers = {
        height: parseHeight,
        'latest-block': (value: unknown) => parseBlocks(value)[0],
        blocks: parseBlocks,
        fees: parseFees,
        mempool: parseMempool,
      }
      const data = parsers[resource](raw) as BitcoinResources[K]
      return { data, source: 'mempool.space', updatedAt: new Date().toISOString() }
    } catch {
      throw new UpstreamError('invalid_data', providerStatus)
    }
  } catch (error) {
    // Workers may reject fetch with AbortError rather than the timeout reason.
    const timedOut = timeout.aborted || (error instanceof Error && error.name === 'TimeoutError')
    controller.abort()
    if (timedOut) throw new UpstreamError('timeout', providerStatus)
    if (error instanceof UpstreamError) throw error
    throw new UpstreamError('network', providerStatus)
  }
}
