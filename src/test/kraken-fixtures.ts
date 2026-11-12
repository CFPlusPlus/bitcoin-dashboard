import type { KrakenSymbol } from '@/lib/kraken-protocol'

// Controlled sockets only. Never opens a real connection.
export class MockWebSocket {
  static instances: MockWebSocket[] = []
  readyState = 0
  sent: string[] = []
  onopen: WebSocket['onopen'] = null
  onmessage: WebSocket['onmessage'] = null
  onerror: WebSocket['onerror'] = null
  onclose: WebSocket['onclose'] = null
  closeCount = 0
  constructor(readonly url: string) {
    MockWebSocket.instances.push(this)
  }
  send(data: string) {
    this.sent.push(data)
  }
  close() {
    this.readyState = 3
    this.closeCount++
  }
  open() {
    this.readyState = 1
    this.onopen?.call(this as unknown as WebSocket, new Event('open'))
  }
  message(value: unknown) {
    this.onmessage?.call(
      this as unknown as WebSocket,
      new MessageEvent('message', { data: JSON.stringify(value) }),
    )
  }
  drop() {
    this.readyState = 3
    this.onclose?.call(this as unknown as WebSocket, new CloseEvent('close'))
  }
}
export const krakenAck = (symbol: KrakenSymbol, now = Date.now()) => ({
  method: 'subscribe',
  req_id: 1,
  success: true,
  result: { channel: 'ticker', symbol, snapshot: true },
  time_in: new Date(now).toISOString(),
  time_out: new Date(now).toISOString(),
})
export const krakenTicker = (
  symbol: KrakenSymbol,
  last = 72_000,
  type = 'update',
  now = Date.now(),
) => ({
  channel: 'ticker',
  type,
  data: [{ symbol, last, change_pct: 1.25, timestamp: new Date(now).toISOString() }],
})
export const hashrateFixture = (now = Date.now()) => ({
  data: { hashesPerSecond: 1.05e21, estimationBlocks: 1008, unit: 'H/s' },
  source: 'mempool.space',
  updatedAt: new Date(now).toISOString(),
})
