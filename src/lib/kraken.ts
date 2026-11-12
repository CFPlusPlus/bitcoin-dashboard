import { useSyncExternalStore } from 'react'
import {
  KRAKEN_SUBSCRIBE,
  KRAKEN_SYMBOLS,
  KRAKEN_URL,
  parseKrakenMessage,
  type KrakenSymbol,
  type KrakenTick,
} from './kraken-protocol'

export const KRAKEN_POLICY = {
  uiMs: 1_000,
  staleMs: 60_000,
  activityMs: 20_000,
  handshakeMs: 15_000,
  backgroundMs: 30_000,
} as const
export type LiveStatus =
  'connecting' | 'subscribing' | 'live' | 'reconnecting' | 'stale' | 'disconnected' | 'error'
type ReceivedQuote = KrakenTick & {
  receivedAt: number
  generation: number
  baseline: number
}
export type LiveQuote = ReceivedQuote & {
  direction: -1 | 0 | 1
  delta: number
  previousPrice: number | null
}
export type LiveState = {
  status: LiveStatus
  pairs: Record<KrakenSymbol, { status: LiveStatus; quote: LiveQuote | null }>
  offline: boolean
  paused: boolean
  now: number
}
const initial: LiveState = {
  status: 'disconnected',
  pairs: {
    'BTC/EUR': { status: 'disconnected', quote: null },
    'BTC/USD': { status: 'disconnected', quote: null },
  },
  offline: false,
  paused: false,
  now: 0,
}
type Timer = ReturnType<typeof setTimeout>
// Intl's decimal rounding matches the rendered price, including half-cent boundaries.
const displayedPrice = new Intl.NumberFormat('en-US', {
  useGrouping: false,
  maximumFractionDigits: 2,
})

// One service per browser module; consumers share one socket and one immutable snapshot.
export class KrakenService {
  private listeners = new Set<() => void>()
  private socket: WebSocket | null = null
  private generation = 0
  private quotes: Partial<Record<KrakenSymbol, ReceivedQuote>> = {}
  private displayed: Partial<Record<KrakenSymbol, LiveQuote>> = {}
  private presented: Partial<Record<KrakenSymbol, ReceivedQuote>> = {}
  private displayTimers: Partial<Record<KrakenSymbol, ReturnType<typeof setInterval>>> = {}
  private acknowledged = new Set<KrakenSymbol>()
  private failures = new Set<KrakenSymbol>()
  private stage: LiveStatus = 'disconnected'
  private snapshot = initial
  private attempt = 0
  private startedAt = 0
  private activityAt = 0
  private onlineSince = 0
  private systemOnline = true
  private paused = false
  private offline = false
  private retryTimer?: Timer
  private backgroundTimer?: Timer
  private watchTimer?: ReturnType<typeof setInterval>

  constructor(
    private createSocket = (url: string) => new WebSocket(url),
    private random = Math.random,
  ) {}
  getSnapshot = () => this.snapshot
  // Reception is independent of the presentation clock; useful to inspect real data freshness.
  getLatestQuote = (pair: KrakenSymbol) => this.quotes[pair] ?? null
  getServerSnapshot = () => initial
  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    if (this.listeners.size === 1) this.start()
    return () => {
      this.listeners.delete(listener)
      if (!this.listeners.size) this.stop()
    }
  }
  private publish = () => {
    const now = Date.now()
    const pairs = {} as LiveState['pairs']
    for (const pair of KRAKEN_SYMBOLS) {
      const quote = this.quotes[pair] ?? null
      let status = this.stage
      if (this.socket?.readyState === 1 && !this.offline && !this.paused) {
        status = this.failures.has(pair)
          ? 'error'
          : !this.acknowledged.has(pair) || quote?.generation !== this.generation
            ? 'subscribing'
            : !this.systemOnline ||
                now -
                  (quote.timestamp
                    ? Math.min(Date.parse(quote.timestamp), quote.receivedAt)
                    : quote.receivedAt) >=
                  KRAKEN_POLICY.staleMs
              ? 'stale'
              : 'live'
      }
      pairs[pair] = {
        status,
        quote: this.displayed[pair] ?? null,
      }
      const visible = pairs[pair].quote
      if (visible && status !== 'live' && (visible.direction || visible.previousPrice != null))
        pairs[pair].quote = this.displayed[pair] = {
          ...visible,
          direction: 0,
          delta: 0,
          previousPrice: null,
        }
    }
    const statuses = KRAKEN_SYMBOLS.map((pair) => pairs[pair].status)
    const status = statuses.every((value) => value === 'live')
      ? 'live'
      : statuses.includes('error')
        ? 'error'
        : statuses.includes('stale')
          ? 'stale'
          : this.stage
    const changed = KRAKEN_SYMBOLS.some(
      (pair) =>
        pairs[pair].status !== this.snapshot.pairs[pair].status ||
        pairs[pair].quote !== this.snapshot.pairs[pair].quote,
    )
    const ageChanged =
      KRAKEN_SYMBOLS.some((pair) => pairs[pair].quote && pairs[pair].status !== 'live') &&
      Math.floor(now / 5_000) !== Math.floor(this.snapshot.now / 5_000)
    if (
      !changed &&
      !ageChanged &&
      status === this.snapshot.status &&
      this.offline === this.snapshot.offline &&
      this.paused === this.snapshot.paused
    )
      return
    this.snapshot = { status, pairs, now, offline: this.offline, paused: this.paused }
    this.listeners.forEach((listener) => listener())
  }
  private displayQuote(pair: KrakenSymbol) {
    if (
      !this.socket ||
      this.socket.readyState !== 1 ||
      this.offline ||
      this.paused ||
      this.failures.has(pair) ||
      document.visibilityState === 'hidden'
    )
      return
    const quote = this.quotes[pair]
    if (!quote || quote.generation !== this.generation || this.presented[pair] === quote) return
    const previous = this.displayed[pair]
    const continuous =
      previous?.generation === quote.generation && previous.baseline === quote.baseline
    // Compare the actual two-decimal prices on screen, not intervening unshown trades.
    const delta = continuous
      ? Number(
          (
            Number(displayedPrice.format(quote.price)) -
            Number(displayedPrice.format(previous.price))
          ).toFixed(2),
        )
      : 0
    this.presented[pair] = quote
    this.displayed[pair] = {
      ...quote,
      previousPrice: continuous ? previous.price : null,
      delta,
      direction: delta > 0 ? 1 : delta < 0 ? -1 : 0,
    }
    this.publish()
  }
  private retire() {
    const socket = this.socket
    this.socket = null
    this.acknowledged.clear()
    this.failures.clear()
    this.onlineSince = 0
    for (const pair of KRAKEN_SYMBOLS) {
      clearInterval(this.displayTimers[pair])
      delete this.displayTimers[pair]
      const quote = this.displayed[pair]
      if (quote) this.displayed[pair] = { ...quote, direction: 0, delta: 0, previousPrice: null }
    }
    if (socket) {
      socket.onopen = socket.onmessage = socket.onerror = socket.onclose = null
      if (socket.readyState < 2) socket.close(1000, 'Overview lifecycle')
    }
  }
  private reconnect(error = false) {
    this.retire()
    clearTimeout(this.retryTimer)
    this.retryTimer = undefined
    if (!this.listeners.size || this.offline || this.paused) return
    this.stage = error ? 'error' : 'reconnecting'
    this.publish()
    // Reset only after 30s of healthy data, never merely on TCP/open/heartbeat.
    // Jitter remains active at the cap, instead of converging to synchronized 60s retries.
    const base = Math.min(50_000, 5_000 * 2 ** Math.min(this.attempt++, 5))
    const delay = base * (0.8 + this.random() * 0.4)
    this.retryTimer = setTimeout(() => {
      this.retryTimer = undefined
      this.connect()
    }, delay)
  }
  private connect = () => {
    if (!this.listeners.size || this.socket || this.offline || this.paused) return
    this.stage = this.attempt ? 'reconnecting' : 'connecting'
    this.startedAt = this.activityAt = Date.now()
    this.systemOnline = true
    const generation = ++this.generation
    this.publish()
    let socket: WebSocket
    try {
      socket = this.createSocket(KRAKEN_URL)
    } catch {
      this.reconnect(true)
      return
    }
    this.socket = socket
    const current = () =>
      this.socket === socket && this.generation === generation && this.listeners.size > 0
    socket.onopen = () => {
      if (!current()) return
      this.stage = 'subscribing'
      this.publish()
      try {
        socket.send(JSON.stringify(KRAKEN_SUBSCRIBE))
      } catch {
        this.reconnect(true)
      }
    }
    socket.onmessage = (event) => {
      if (!current()) return
      const message = parseKrakenMessage(event.data)
      if (!message) return
      this.activityAt = Date.now()
      if (message.kind === 'error') {
        // Preserve an independently healthy pair until the bounded handshake retry.
        for (const pair of message.symbol ? [message.symbol] : KRAKEN_SYMBOLS)
          this.failures.add(pair)
        this.stage = 'error'
        this.publish()
      } else if (message.kind === 'subscribed') {
        this.acknowledged.add(message.symbol)
        this.publish()
      } else if (message.kind === 'status') {
        this.systemOnline = message.online
        this.publish()
      } else if (message.kind === 'snapshot' || message.kind === 'update') {
        for (const tick of message.ticks) {
          if (!this.acknowledged.has(tick.symbol) || this.failures.has(tick.symbol)) continue
          const previous = this.quotes[tick.symbol]
          // Ignore provider-time regressions within a connection; never rejuvenate replayed data.
          if (
            previous?.generation === generation &&
            previous.timestamp &&
            tick.timestamp &&
            Date.parse(tick.timestamp) < Date.parse(previous.timestamp)
          )
            continue
          const reset =
            message.kind === 'snapshot' ||
            previous?.generation !== generation ||
            this.snapshot.pairs[tick.symbol].status !== 'live'
          this.quotes[tick.symbol] = {
            ...tick,
            receivedAt: Date.now(),
            generation,
            baseline: (previous?.baseline ?? 0) + (reset ? 1 : 0),
          }
          if (!this.displayTimers[tick.symbol]) {
            // Each pair starts its fixed cadence at its first confirmed value.
            this.displayQuote(tick.symbol)
            this.displayTimers[tick.symbol] = setInterval(
              () => this.displayQuote(tick.symbol),
              KRAKEN_POLICY.uiMs,
            )
          }
        }
        if (
          KRAKEN_SYMBOLS.every(
            (pair) => this.acknowledged.has(pair) && this.quotes[pair]?.generation === generation,
          )
        ) {
          this.stage = 'live'
          if (!this.onlineSince) this.onlineSince = Date.now()
        }
        // Status and freshness always use received data and are never presentation-throttled.
        this.publish()
      }
    }
    socket.onerror = () => {
      if (current()) this.reconnect(true)
    }
    socket.onclose = () => {
      if (current()) this.reconnect()
    }
  }
  private watch = () => {
    if (this.offline || this.paused) return
    const now = Date.now()
    if (
      this.socket &&
      (now - this.activityAt >= KRAKEN_POLICY.activityMs ||
        (now - this.startedAt >= KRAKEN_POLICY.handshakeMs &&
          (this.failures.size > 0 ||
            KRAKEN_SYMBOLS.some(
              (pair) =>
                !this.acknowledged.has(pair) || this.quotes[pair]?.generation !== this.generation,
            ))))
    ) {
      this.reconnect()
      return
    }
    if (this.onlineSince && now - this.onlineSince >= 30_000 && this.snapshot.status === 'live')
      this.attempt = 0
    this.publish()
  }
  private visibility = () => {
    clearTimeout(this.backgroundTimer)
    if (document.visibilityState === 'hidden') {
      this.backgroundTimer = setTimeout(() => {
        this.paused = true
        clearTimeout(this.retryTimer)
        this.retryTimer = undefined
        this.retire()
        this.stage = 'disconnected'
        this.publish()
      }, KRAKEN_POLICY.backgroundMs)
    } else {
      this.paused = false
      // Browser timers can be suspended while hidden. Resume from a neutral baseline.
      for (const pair of KRAKEN_SYMBOLS) {
        const quote = this.quotes[pair]
        if (quote) this.quotes[pair] = { ...quote, baseline: quote.baseline + 1 }
      }
      if (this.socket && Date.now() - this.activityAt >= KRAKEN_POLICY.activityMs) this.reconnect()
      else if (!this.socket && !this.retryTimer) this.connect()
      this.publish()
    }
  }
  private network = () => {
    this.offline = navigator.onLine === false
    if (this.offline) {
      clearTimeout(this.retryTimer)
      this.retryTimer = undefined
      this.retire()
      this.stage = 'disconnected'
      this.publish()
    } else if (!this.paused && !this.socket && !this.retryTimer) this.connect()
  }
  private start() {
    this.offline = navigator.onLine === false
    this.paused = document.visibilityState === 'hidden'
    document.addEventListener('visibilitychange', this.visibility)
    window.addEventListener('online', this.network)
    window.addEventListener('offline', this.network)
    window.addEventListener('pageshow', this.visibility)
    this.watchTimer = setInterval(this.watch, 5_000)
    // Deferral prevents a short-lived socket during React StrictMode effect replay.
    this.retryTimer = setTimeout(() => {
      this.retryTimer = undefined
      this.connect()
    }, 0)
    this.publish()
  }
  private stop() {
    clearTimeout(this.retryTimer)
    clearTimeout(this.backgroundTimer)
    clearInterval(this.watchTimer)
    this.retryTimer = this.backgroundTimer = undefined
    this.retire()
    this.stage = 'disconnected'
    this.attempt = 0
    document.removeEventListener('visibilitychange', this.visibility)
    window.removeEventListener('online', this.network)
    window.removeEventListener('offline', this.network)
    window.removeEventListener('pageshow', this.visibility)
    this.publish()
  }
}
const service = new KrakenService()
export const useKraken = () =>
  useSyncExternalStore(service.subscribe, service.getSnapshot, service.getServerSnapshot)
