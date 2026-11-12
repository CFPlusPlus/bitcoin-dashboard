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
  advance(250)
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
    advance(250)
    expect(service.getSnapshot().pairs['BTC/EUR'].quote).toBeNull()
    socket().message(krakenAck('BTC/EUR'))
    socket().message(krakenTicker('BTC/EUR', 72000, 'snapshot'))
    advance(250)
    expect(service.getSnapshot().pairs['BTC/EUR'].status).toBe('live')
    expect(service.getSnapshot().pairs['BTC/USD'].status).toBe('subscribing')
    const unsubscribe = service.subscribe(() => {})
    expect(MockWebSocket.instances).toHaveLength(1)
    unsubscribe()
    expect(socket().closeCount).toBe(0)
  })
  it('tracks every valid received price, throttles rendering, handles up/down/unchanged and expires highlights', () => {
    connected()
    const notify = vi.fn()
    const unsubscribe = service.subscribe(notify)
    socket().message(krakenTicker('BTC/EUR', 72010))
    socket().message(krakenTicker('BTC/EUR', 72005))
    expect(notify).not.toHaveBeenCalled()
    advance(250)
    expect(service.getSnapshot().pairs['BTC/EUR'].quote).toMatchObject({
      price: 72005,
      direction: -1,
      delta: -5,
      change24h: 1.25,
    })
    expect(notify).toHaveBeenCalledOnce()
    socket().message(krakenTicker('BTC/EUR', 72006))
    advance(250)
    expect(service.getSnapshot().pairs['BTC/EUR'].quote?.direction).toBe(1)
    advance(1500)
    expect(service.getSnapshot().pairs['BTC/EUR'].quote?.direction).toBe(0)
    socket().message(krakenTicker('BTC/EUR', 72006))
    advance(250)
    expect(service.getSnapshot().pairs['BTC/EUR'].quote?.direction).toBe(0)
    unsubscribe()
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
    advance(19750)
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
    advance(250)
    expect(service.getSnapshot().status).toBe('live')
    expect(service.getSnapshot().pairs['BTC/EUR'].quote?.direction).toBe(0)
  })
  it('does not accept reordered provider timestamps, marks old snapshots stale and handles subscription failures', () => {
    connected()
    socket().message(krakenTicker('BTC/EUR', 1, 'update', Date.now() - 1000))
    advance(250)
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
    expect(vi.getTimerCount()).toBeLessThanOrEqual(3)
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
    advance(250)
    expect(service.getSnapshot().status).toBe('stale')
    for (const pair of KRAKEN_SYMBOLS) socket().message(krakenTicker(pair))
    advance(250)
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
      advance(250)
    })
    act(() => {
      socket().message(krakenTicker('BTC/EUR', 72010))
      advance(250)
    })
    expect(screen.getByText(/↑ Gestiegen/)).toBeInTheDocument()
    act(() => {
      socket().message(krakenTicker('BTC/EUR', 72009))
      advance(250)
    })
    expect(screen.getByText(/↓ Gefallen/)).toBeInTheDocument()
    view.unmount()
    expect(socket().closeCount).toBe(1)
    expect(vi.getTimerCount()).toBe(0)
    stop = () => {}
  })
})
