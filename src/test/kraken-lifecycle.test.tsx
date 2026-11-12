import { StrictMode } from 'react'
import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { KrakenService } from '@/lib/kraken'
import { KRAKEN_SUBSCRIBE, KRAKEN_SYMBOLS, KRAKEN_URL } from '@/lib/kraken-protocol'
import { LivePrices } from '@/components/overview/live-prices'
import { MockWebSocket, krakenAck, krakenTicker } from './kraken-fixtures'

let service: KrakenService
let stop: () => void
const socket = () => MockWebSocket.instances.at(-1)!
const advance = (ms: number) => vi.advanceTimersByTime(ms)
function connected() {
  advance(0)
  socket().open()
  for (const pair of KRAKEN_SYMBOLS) {
    socket().message(krakenAck(pair))
    socket().message(krakenTicker(pair, pair === 'BTC/EUR' ? 72000 : 80000, 'snapshot'))
  }
}
beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-11-12T10:00:00Z'))
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible')
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true)
  service = new KrakenService(
    (url) => new MockWebSocket(url) as unknown as WebSocket,
    () => 0.5,
  )
  stop = service.subscribe(() => {})
})
afterEach(() => {
  cleanup()
  stop()
  vi.restoreAllMocks()
  vi.useRealTimers()
})
describe('Kraken service lifecycle', () => {
  it('shares exactly one v2 socket, subscribes both trade-triggered pairs and waits for confirmed data', () => {
    advance(0)
    expect(MockWebSocket.instances).toHaveLength(1)
    expect(socket().url).toBe(KRAKEN_URL)
    socket().open()
    expect(JSON.parse(socket().sent[0])).toEqual(KRAKEN_SUBSCRIBE)
    expect(service.getSnapshot().status).toBe('subscribing')
    socket().message(krakenTicker('BTC/EUR'))
    advance(1000)
    expect(service.getSnapshot().pairs['BTC/EUR'].quote).toBeNull()
    socket().message(krakenAck('BTC/EUR'))
    socket().message(krakenTicker('BTC/EUR', 72000, 'snapshot'))
    advance(1000)
    expect(service.getSnapshot().pairs['BTC/EUR'].status).toBe('live')
    expect(service.getSnapshot().pairs['BTC/USD'].status).toBe('subscribing')
    const unsubscribe = service.subscribe(() => {})
    expect(MockWebSocket.instances).toHaveLength(1)
    unsubscribe()
    expect(socket().closeCount).toBe(0)
  })
  it('processes ticks immediately and displays the latest valid price on fixed one-second boundaries against the displayed baseline', () => {
    connected()
    const notify = vi.fn()
    const unsubscribe = service.subscribe(notify)
    socket().message(krakenTicker('BTC/EUR', 72010))
    advance(400)
    socket().message(krakenTicker('BTC/EUR', 72005))
    socket().message(krakenTicker('BTC/EUR', -1))
    expect(service.getLatestQuote('BTC/EUR')).toMatchObject({
      price: 72005,
      receivedAt: Date.now(),
    })
    expect(service.getSnapshot().pairs['BTC/EUR'].quote?.price).toBe(72000)
    expect(notify).not.toHaveBeenCalled()
    advance(599)
    expect(service.getSnapshot().pairs['BTC/EUR'].quote?.price).toBe(72000)
    advance(1)
    expect(service.getSnapshot().pairs['BTC/EUR'].quote).toMatchObject({
      price: 72005,
      direction: 1,
      delta: 5,
      change24h: 1.25,
    })
    expect(notify).toHaveBeenCalledOnce()
    socket().message(krakenTicker('BTC/EUR', 72001))
    advance(1000)
    expect(service.getSnapshot().pairs['BTC/EUR'].quote?.direction).toBe(-1)
    advance(300)
    expect(service.getSnapshot().pairs['BTC/EUR'].quote?.direction).toBe(-1)
    // The small indicator persists; no feedback timeout publishes a second visual change.
    expect(notify).toHaveBeenCalledTimes(2)
    socket().message(krakenTicker('BTC/EUR', 72001))
    advance(700)
    expect(service.getSnapshot().pairs['BTC/EUR'].quote?.direction).toBe(0)
    unsubscribe()
  })
  it('does not publish on empty display frames or heartbeats and never renews reception timestamps', () => {
    connected()
    const notify = vi.fn()
    const unsubscribe = service.subscribe(notify)
    const initial = service.getSnapshot()
    socket().message({ channel: 'heartbeat' })
    advance(5000)
    expect(service.getSnapshot()).toBe(initial)
    expect(notify).not.toHaveBeenCalled()
    expect(service.getLatestQuote('BTC/EUR')?.receivedAt).toBe(Date.parse('2026-11-12T10:00:00Z'))
    unsubscribe()
  })
  it('handles independently timed pair snapshots and never lets status messages flush buffered prices early', () => {
    advance(0)
    socket().open()
    socket().message(krakenAck('BTC/EUR'))
    socket().message(krakenTicker('BTC/EUR', 72000, 'snapshot'))
    expect(service.getSnapshot().pairs['BTC/EUR'].quote?.price).toBe(72000)
    advance(400)
    socket().message(krakenAck('BTC/USD'))
    socket().message(krakenTicker('BTC/USD', 80000, 'snapshot'))
    for (const pair of KRAKEN_SYMBOLS) socket().message(krakenTicker(pair, 81000))
    socket().message({
      channel: 'status',
      type: 'update',
      data: [{ api_version: 'v2', system: 'maintenance' }],
    })
    expect(service.getSnapshot().status).toBe('stale')
    expect(service.getSnapshot().pairs['BTC/EUR'].quote?.price).toBe(72000)
    advance(600)
    expect(service.getSnapshot().pairs['BTC/EUR'].quote?.price).toBe(81000)
    expect(service.getSnapshot().pairs['BTC/USD'].quote?.price).toBe(80000)
    advance(400)
    expect(service.getSnapshot().pairs['BTC/USD'].quote?.price).toBe(81000)
    expect(service.getSnapshot().pairs['BTC/USD'].quote?.direction).toBe(0)
  })
  it('shows errors immediately without leaking a pending value and discards that value on reconnect', () => {
    connected()
    socket().message(krakenTicker('BTC/EUR', 1))
    socket().onerror?.call(socket() as unknown as WebSocket, new Event('error'))
    expect(service.getSnapshot().status).toBe('error')
    expect(service.getSnapshot().pairs['BTC/EUR'].quote?.price).toBe(72000)
    advance(5000)
    socket().open()
    socket().message(krakenAck('BTC/EUR'))
    socket().message(krakenTicker('BTC/EUR', 90000, 'snapshot'))
    expect(service.getSnapshot().pairs['BTC/EUR'].quote).toMatchObject({
      price: 90000,
      direction: 0,
      previousPrice: null,
    })
    advance(1000)
    expect(service.getSnapshot().pairs['BTC/EUR'].quote?.direction).toBe(0)
  })
  it('does not animate a rounded zero change or a replacement snapshot', () => {
    connected()
    socket().message(krakenTicker('BTC/EUR', 72000.001))
    advance(1000)
    expect(service.getSnapshot().pairs['BTC/EUR'].quote?.direction).toBe(0)
    socket().message(krakenTicker('BTC/EUR', 90000, 'snapshot'))
    advance(1000)
    expect(service.getSnapshot().pairs['BTC/EUR'].quote).toMatchObject({
      price: 90000,
      direction: 0,
      previousPrice: null,
    })
  })
  it('uses the same decimal rounding as Intl at half-cent boundaries', () => {
    connected()
    socket().message(krakenTicker('BTC/EUR', 1.005, 'snapshot'))
    advance(1000)
    socket().message(krakenTicker('BTC/EUR', 1.004))
    advance(1000)
    expect(service.getSnapshot().pairs['BTC/EUR'].quote).toMatchObject({
      direction: -1,
      delta: -0.01,
    })
  })
  it('resumes a short hidden tab on a neutral baseline without rendering hidden ticks or changing their reception time', () => {
    connected()
    const visibility = vi.spyOn(document, 'visibilityState', 'get')
    visibility.mockReturnValue('hidden')
    document.dispatchEvent(new Event('visibilitychange'))
    advance(100)
    socket().message(krakenTicker('BTC/EUR', 73000))
    const receivedAt = Date.now()
    advance(900)
    expect(service.getSnapshot().pairs['BTC/EUR'].quote?.price).toBe(72000)
    visibility.mockReturnValue('visible')
    document.dispatchEvent(new Event('visibilitychange'))
    expect(service.getSnapshot().pairs['BTC/EUR'].quote?.price).toBe(72000)
    advance(1000)
    expect(service.getSnapshot().pairs['BTC/EUR'].quote).toMatchObject({
      price: 73000,
      direction: 0,
      receivedAt,
    })
    expect(MockWebSocket.instances).toHaveLength(1)
  })
  it('keeps heartbeats distinct from independent stale ticker data and does not reconnect for an absent trade', () => {
    connected()
    for (let i = 0; i < 13; i++) {
      socket().message({ channel: 'heartbeat' })
      socket().message(krakenTicker('BTC/USD', 80000 + i))
      advance(5000)
    }
    expect(service.getSnapshot().pairs['BTC/EUR'].status).toBe('stale')
    expect(service.getSnapshot().pairs['BTC/USD'].status).toBe('live')
    expect(service.getSnapshot().status).toBe('stale')
    expect(MockWebSocket.instances).toHaveLength(1)
  })
  it('ignores malformed activity, times out a silent connection and caps exponential reconnect backoff with jitter', () => {
    connected()
    socket().message('invalid')
    advance(20000)
    expect(service.getSnapshot().status).toBe('reconnecting')
    advance(4999)
    expect(MockWebSocket.instances).toHaveLength(1)
    advance(1)
    expect(MockWebSocket.instances).toHaveLength(2)
    socket().drop()
    advance(9999)
    expect(MockWebSocket.instances).toHaveLength(2)
    advance(1)
    expect(MockWebSocket.instances).toHaveLength(3)
    // Five more failures, no resetting on socket open.
    for (const delay of [20000, 40000, 50000, 50000]) {
      socket().drop()
      const count = MockWebSocket.instances.length
      advance(delay - 1)
      expect(MockWebSocket.instances).toHaveLength(count)
      advance(1)
      expect(MockWebSocket.instances).toHaveLength(count + 1)
    }
  })
  it('ignores late old-socket messages and resubscribes fully without comparing across connection gaps', () => {
    connected()
    const old = socket()
    const late = old.onmessage!
    old.drop()
    advance(5000)
    socket().open()
    expect(JSON.parse(socket().sent[0])).toEqual(KRAKEN_SUBSCRIBE)
    late.call(
      old as unknown as WebSocket,
      new MessageEvent('message', { data: JSON.stringify(krakenTicker('BTC/EUR', 1)) }),
    )
    expect(service.getSnapshot().pairs['BTC/EUR'].quote?.price).toBe(72000)
    expect(service.getSnapshot().pairs['BTC/EUR'].status).toBe('subscribing')
    for (const pair of KRAKEN_SYMBOLS) {
      socket().message(krakenAck(pair))
      socket().message(krakenTicker(pair, 90000, 'snapshot'))
    }
    advance(1000)
    expect(service.getSnapshot().status).toBe('live')
    expect(service.getSnapshot().pairs['BTC/EUR'].quote?.direction).toBe(0)
  })
  it('does not accept reordered provider timestamps, marks old snapshots stale and handles subscription failures', () => {
    connected()
    socket().message(krakenTicker('BTC/EUR', 1, 'update', Date.now() - 1000))
    advance(1000)
    expect(service.getSnapshot().pairs['BTC/EUR'].quote?.price).toBe(72000)
    socket().message({
      method: 'subscribe',
      req_id: 1,
      success: false,
      error: 'private',
      result: { symbol: 'BTC/EUR' },
    })
    expect(service.getSnapshot().pairs['BTC/EUR'].status).toBe('error')
    expect(service.getSnapshot().pairs['BTC/USD'].status).toBe('live')
    advance(15000)
    expect(service.getSnapshot().status).toBe('reconnecting')
  })
  it('pauses offline, resumes online, tolerates short tab switches and closes after 30 seconds hidden', () => {
    connected()
    const visibility = vi.spyOn(document, 'visibilityState', 'get')
    visibility.mockReturnValue('hidden')
    document.dispatchEvent(new Event('visibilitychange'))
    advance(1000)
    visibility.mockReturnValue('visible')
    document.dispatchEvent(new Event('visibilitychange'))
    expect(MockWebSocket.instances).toHaveLength(1)
    visibility.mockReturnValue('hidden')
    document.dispatchEvent(new Event('visibilitychange'))
    for (let i = 0; i < 6; i++) {
      socket().message({ channel: 'heartbeat' })
      advance(5000)
    }
    expect(socket().closeCount).toBe(1)
    expect(service.getSnapshot().paused).toBe(true)
    visibility.mockReturnValue('visible')
    document.dispatchEvent(new Event('visibilitychange'))
    expect(MockWebSocket.instances).toHaveLength(2)
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    window.dispatchEvent(new Event('offline'))
    expect(service.getSnapshot().offline).toBe(true)
    advance(120000)
    expect(MockWebSocket.instances).toHaveLength(2)
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true)
    window.dispatchEvent(new Event('online'))
    expect(MockWebSocket.instances).toHaveLength(3)
  })
  it('runs a simulated 6h lifecycle with bounded connections and timers, then removes all listeners and timers', () => {
    connected()
    const removeDocument = vi.spyOn(document, 'removeEventListener')
    const removeWindow = vi.spyOn(window, 'removeEventListener')
    for (let i = 0; i < 6 * 60 * 12; i++) {
      socket().message({ channel: 'heartbeat' })
      if (i % 3 === 0) socket().message(krakenTicker('BTC/EUR', 72000 + i))
      advance(5000)
    }
    expect(MockWebSocket.instances).toHaveLength(1)
    expect(vi.getTimerCount()).toBeLessThanOrEqual(5)
    stop()
    expect(vi.getTimerCount()).toBe(0)
    expect(socket().closeCount).toBe(1)
    expect(socket().onmessage).toBeNull()
    expect(removeDocument).toHaveBeenCalledWith('visibilitychange', expect.any(Function))
    for (const name of ['online', 'offline', 'pageshow'])
      expect(removeWindow).toHaveBeenCalledWith(name, expect.any(Function))
    stop = () => {}
  })
  it('uses the prescribed jitter and recovers from constructor errors without a spin loop', () => {
    stop()
    const create = vi.fn(() => {
      throw new Error('blocked')
    })
    service = new KrakenService(create, () => 0)
    stop = service.subscribe(() => {})
    advance(0)
    expect(create).toHaveBeenCalledOnce()
    expect(service.getSnapshot().status).toBe('error')
    advance(3999)
    expect(create).toHaveBeenCalledOnce()
    advance(1)
    expect(create).toHaveBeenCalledTimes(2)
  })
  it('marks old provider snapshots stale, handles engine maintenance and detects standby on pageshow', () => {
    advance(0)
    socket().open()
    for (const pair of KRAKEN_SYMBOLS) {
      socket().message(krakenAck(pair))
      socket().message(krakenTicker(pair, 72000, 'snapshot', Date.now() - 120_000))
    }
    advance(1000)
    expect(service.getSnapshot().status).toBe('stale')
    for (const pair of KRAKEN_SYMBOLS) socket().message(krakenTicker(pair))
    advance(1000)
    expect(service.getSnapshot().status).toBe('live')
    socket().message({
      channel: 'status',
      type: 'update',
      data: [{ api_version: 'v2', system: 'maintenance' }],
    })
    expect(service.getSnapshot().status).toBe('stale')
    vi.setSystemTime(Date.now() + 3_600_000)
    window.dispatchEvent(new Event('pageshow'))
    expect(service.getSnapshot().status).toBe('reconnecting')
    expect(socket().closeCount).toBe(1)
  })
  it('avoids duplicate connections in StrictMode, renders accessible directional changes and fully cleans up on unmount', () => {
    stop()
    MockWebSocket.instances = []
    const view = render(
      <StrictMode>
        <LivePrices />
      </StrictMode>,
    )
    act(() => advance(0))
    expect(MockWebSocket.instances).toHaveLength(1)
    act(() => {
      socket().open()
      for (const pair of KRAKEN_SYMBOLS) {
        socket().message(krakenAck(pair))
        socket().message(krakenTicker(pair, 72000, 'snapshot'))
      }
      advance(1000)
    })
    act(() => {
      socket().message(krakenTicker('BTC/EUR', 72010))
      advance(1000)
    })
    expect(screen.getByRole('img', { name: /Gestiegen um 10 EUR/ })).toBeInTheDocument()
    act(() => {
      socket().message(krakenTicker('BTC/EUR', 72009))
      advance(1000)
    })
    expect(screen.getByRole('img', { name: /Gefallen um 1 EUR/ })).toBeInTheDocument()
    // The 24-hour percentage belongs to Kraken, independently of the falling tick.
    expect(screen.getAllByText(/24 h · Kraken: \+1,25 %/)).toHaveLength(2)
    view.unmount()
    expect(socket().closeCount).toBe(1)
    expect(vi.getTimerCount()).toBe(0)
    stop = () => {}
  })
})
