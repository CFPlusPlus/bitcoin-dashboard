export const HASHRATE_POLICY = {
  ttlMs: 15 * 60_000,
  warnMs: 30 * 60_000,
  cooldownMs: 10 * 60_000,
  rawBytes: 128 * 1024,
  responseBytes: 4096,
} as const
export const HASHRATE_ERRORS = {
  INVALID_REQUEST: 400,
  METHOD_NOT_ALLOWED: 405,
  HASHRATE_NOT_RELEASED: 503,
  UPSTREAM_RATE_LIMIT: 429,
  UPSTREAM_TIMEOUT: 504,
  UPSTREAM_INVALID_RESPONSE: 502,
  UPSTREAM_UNAVAILABLE: 502,
} as const
export type HashrateError = keyof typeof HASHRATE_ERRORS
export type HashrateResponse = {
  data: { hashesPerSecond: number; estimationBlocks: 1008; unit: 'H/s' }
  source: 'mempool.space'
  updatedAt: string // Retrieval time; provider supplies no timestamp for currentHashrate.
}
export function hashrateValue(value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0 || value > 1e30)
    throw new Error('Invalid hashrate')
  return value
}
export function parseHashrate(value: unknown, now = Date.now()): HashrateResponse {
  if (!value || typeof value !== 'object') throw new Error('Invalid hashrate response')
  const response = value as HashrateResponse
  const date = Date.parse(response.updatedAt)
  if (
    response.source !== 'mempool.space' ||
    typeof response.updatedAt !== 'string' ||
    !Number.isFinite(date) ||
    new Date(date).toISOString() !== response.updatedAt ||
    date < Date.parse('2009-01-03T00:00:00Z') ||
    date > now + 300_000 ||
    response.data?.estimationBlocks !== 1008 ||
    response.data.unit !== 'H/s'
  )
    throw new Error('Invalid hashrate metadata')
  return {
    data: {
      hashesPerSecond: hashrateValue(response.data.hashesPerSecond),
      estimationBlocks: 1008,
      unit: 'H/s',
    },
    source: 'mempool.space',
    updatedAt: response.updatedAt,
  }
}
export const toExahashes = (hashesPerSecond: number) => hashrateValue(hashesPerSecond) / 1e18
