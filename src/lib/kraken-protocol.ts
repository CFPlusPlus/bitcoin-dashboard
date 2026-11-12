export const KRAKEN_URL = 'wss://ws.kraken.com/v2'
export const KRAKEN_SYMBOLS = ['BTC/EUR', 'BTC/USD'] as const
export type KrakenSymbol = (typeof KRAKEN_SYMBOLS)[number]
export const KRAKEN_SUBSCRIBE = {
  method: 'subscribe',
  params: { channel: 'ticker', symbol: KRAKEN_SYMBOLS, event_trigger: 'trades', snapshot: true },
  req_id: 1,
} as const

export type KrakenTick = {
  symbol: KrakenSymbol
  price: number
  timestamp: string | null
  change24h: number | null
}
type Message =
  | { kind: 'heartbeat' }
  | { kind: 'status'; online: boolean }
  | { kind: 'subscribed'; symbol: KrakenSymbol }
  | { kind: 'error'; symbol?: KrakenSymbol }
  | { kind: 'snapshot' | 'update'; ticks: KrakenTick[] }

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid object')
  return value as Record<string, unknown>
}
function symbol(value: unknown): KrakenSymbol {
  if (value !== 'BTC/EUR' && value !== 'BTC/USD') throw new Error('Invalid symbol')
  return value
}
function finite(value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error('Invalid number')
  return value
}
export function krakenTimestamp(value: unknown, now = Date.now()) {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)
  )
    throw new Error('Invalid timestamp')
  const ms = Date.parse(value)
  const [year, month, day] = value.slice(0, 10).split('-').map(Number)
  const calendar = new Date(Date.UTC(year, month - 1, day))
  if (
    !Number.isFinite(ms) ||
    ms < Date.parse('2009-01-03T00:00:00Z') ||
    ms > now + 300_000 ||
    calendar.getUTCMonth() !== month - 1 ||
    calendar.getUTCDate() !== day ||
    Number(value.slice(11, 13)) > 23 ||
    Number(value.slice(14, 16)) > 59 ||
    Number(value.slice(17, 19)) > 59
  )
    throw new Error('Invalid timestamp')
  return new Date(ms).toISOString()
}

// Unknown or malformed messages never count as connection activity or become prices.
export function parseKrakenMessage(raw: unknown, now = Date.now()): Message | null {
  try {
    if (typeof raw !== 'string' || raw.length > 32_768) return null
    const value = object(JSON.parse(raw))
    if (value.channel === 'heartbeat' && Object.keys(value).length === 1)
      return { kind: 'heartbeat' }
    if (
      value.channel === 'status' &&
      value.type === 'update' &&
      Array.isArray(value.data) &&
      value.data.length === 1
    ) {
      const status = object(value.data[0])
      if (
        status.api_version !== 'v2' ||
        typeof status.system !== 'string' ||
        !['online', 'maintenance', 'cancel_only', 'post_only'].includes(status.system)
      )
        return null
      return { kind: 'status', online: status.system === 'online' }
    }
    if (value.method === 'subscribe' && value.req_id === 1) {
      if (value.success === false && typeof value.error === 'string') {
        let pair: KrakenSymbol | undefined
        try {
          pair = symbol(object(value.result).symbol)
        } catch {
          /* Generic subscription error. */
        }
        return { kind: 'error', symbol: pair }
      }
      const result = object(value.result)
      if (
        value.success !== true ||
        result.channel !== 'ticker' ||
        result.snapshot !== true ||
        (result.event_trigger !== undefined && result.event_trigger !== 'trades')
      )
        return null
      krakenTimestamp(value.time_in, now)
      krakenTimestamp(value.time_out, now)
      return { kind: 'subscribed', symbol: symbol(result.symbol) }
    }
    if (
      value.channel !== 'ticker' ||
      (value.type !== 'snapshot' && value.type !== 'update') ||
      !Array.isArray(value.data) ||
      value.data.length < 1 ||
      value.data.length > 2
    )
      return null
    const ticks = value.data.map((entry): KrakenTick => {
      const tick = object(entry)
      const price = finite(tick.last)
      if (price <= 0) throw new Error('Invalid last trade')
      return {
        symbol: symbol(tick.symbol),
        price,
        timestamp: tick.timestamp === undefined ? null : krakenTimestamp(tick.timestamp, now),
        change24h: tick.change_pct === undefined ? null : finite(tick.change_pct),
      }
    })
    if (new Set(ticks.map((tick) => tick.symbol)).size !== ticks.length) return null
    return { kind: value.type, ticks }
  } catch {
    return null
  }
}
