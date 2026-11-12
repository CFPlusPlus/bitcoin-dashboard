import { describe, expect, it } from 'vitest'
import { parseKrakenMessage } from '@/lib/kraken-protocol'
import { krakenAck, krakenTicker } from './kraken-fixtures'

const parse = (value: unknown) => parseKrakenMessage(JSON.stringify(value))
describe('strict Kraken WebSocket v2 contracts', () => {
  it.each(['BTC/EUR', 'BTC/USD'] as const)(
    'accepts validated acknowledgements, snapshots and last-trade updates for %s',
    (symbol) => {
      expect(parse(krakenAck(symbol))).toEqual({ kind: 'subscribed', symbol })
      expect(parse(krakenTicker(symbol, 80_000, 'snapshot'))).toMatchObject({
        kind: 'snapshot',
        ticks: [{ symbol, price: 80000, change24h: 1.25 }],
      })
      expect(parse(krakenTicker(symbol))).toMatchObject({ kind: 'update' })
    },
  )
  it('handles heartbeats, status, generic and pair subscription errors without exposing provider text', () => {
    expect(parse({ channel: 'heartbeat' })).toEqual({ kind: 'heartbeat' })
    expect(
      parse({ channel: 'status', type: 'update', data: [{ api_version: 'v2', system: 'online' }] }),
    ).toEqual({ kind: 'status', online: true })
    expect(
      parse({ method: 'subscribe', req_id: 1, success: false, error: 'private provider message' }),
    ).toEqual({ kind: 'error', symbol: undefined })
    expect(
      parse({
        method: 'subscribe',
        req_id: 1,
        success: false,
        error: 'private',
        result: { symbol: 'BTC/EUR' },
      }),
    ).toEqual({ kind: 'error', symbol: 'BTC/EUR' })
  })
  it.each([0, -1, '80000', null, {}, Infinity, NaN])('rejects invalid last price %s', (last) =>
    expect(parse(krakenTicker('BTC/EUR', last as number))).toBeNull(),
  )
  it.each([
    {},
    [],
    { channel: 'heartbeat', data: 'fake' },
    { channel: 'status', type: 'update', data: [{ api_version: 'v2', system: ['online'] }] },
    { channel: 'ticker', type: 'update', data: [] },
    { ...krakenAck('BTC/EUR'), success: undefined },
    { ...krakenAck('BTC/EUR'), req_id: 9 },
    { ...krakenAck('BTC/EUR'), result: { channel: 'ticker', symbol: 'XBT/EUR', snapshot: true } },
    { ...krakenAck('BTC/EUR'), time_out: 'invalid' },
    { channel: 'ticker', type: 'update', data: [{ symbol: 'ETH/USD', last: 100 }] },
    { channel: 'ticker', type: 'update', data: [{ symbol: 'BTC/USD', bid: 100, ask: 101 }] },
    {
      channel: 'ticker',
      type: 'update',
      data: [{ symbol: 'BTC/USD', last: 100, timestamp: '2026-02-30T10:00:00Z' }],
    },
    {
      channel: 'ticker',
      type: 'update',
      data: [{ symbol: 'BTC/USD', last: 100, timestamp: '2099-01-01T10:00:00Z' }],
    },
    {
      channel: 'ticker',
      type: 'update',
      data: [{ symbol: 'BTC/USD', last: 100, timestamp: '2026-01-01T24:00:00Z' }],
    },
  ])('ignores unknown or invalid structures %#', (value) => expect(parse(value)).toBeNull())
  it('accepts missing provider times honestly, keeps finite provider 24h values and rejects malformed optional fields', () => {
    expect(
      parse({ channel: 'ticker', type: 'update', data: [{ symbol: 'BTC/USD', last: 100 }] }),
    ).toMatchObject({ ticks: [{ timestamp: null, change24h: null }] })
    expect(
      parse({
        channel: 'ticker',
        type: 'update',
        data: [{ symbol: 'BTC/USD', last: 100, change_pct: '2.5' }],
      }),
    ).toBeNull()
    expect(parseKrakenMessage('{bad')).toBeNull()
    expect(parseKrakenMessage(' '.repeat(32769))).toBeNull()
  })
})
