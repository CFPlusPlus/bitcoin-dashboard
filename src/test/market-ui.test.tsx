import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  QueryClient,
  QueryClientProvider,
  focusManager,
  onlineManager,
} from '@tanstack/react-query'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MarketSnapshot } from '@/components/market/snapshot'
import { marketManualAt, marketOptions, marketRetryAt } from '@/lib/market'
import { marketPolicy } from '@/lib/market-policy'
import { marketSnapshot, MARKET_TEST_NOW } from './market-fixtures'

const clients: QueryClient[] = []
function client() {
  const value = new QueryClient()
  clients.push(value)
  return value
}
function mount(value = client()) {
  return {
    client: value,
    ...render(
      <QueryClientProvider client={value}>
        <MarketSnapshot />
      </QueryClientProvider>,
    ),
  }
}
afterEach(() => {
  clients.splice(0).forEach((value) => value.clear())
  focusManager.setFocused(undefined)
  onlineManager.setOnline(true)
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})
const response = () => Response.json(marketSnapshot())

describe('market display, state and keyboard', () => {
  it('has no invented values while loading and shares one request between consumers', async () => {
    const fetcher = vi.fn().mockImplementation(() => new Promise(() => {}))
    vi.stubGlobal('fetch', fetcher)
    const value = client()
    render(
      <QueryClientProvider client={value}>
        <MarketSnapshot />
        <MarketSnapshot />
      </QueryClientProvider>,
    )
    expect(screen.getAllByRole('status')[0]).toHaveTextContent('Marktdaten werden geladen')
    expect(screen.getAllByLabelText('Bitcoin-Kurs: —')).toHaveLength(2)
    expect(fetcher).toHaveBeenCalledOnce()
    await value.cancelQueries()
  })
  it('switches every fiat metric, changes and ATH date by keyboard without another request', async () => {
    const fetcher = vi.fn().mockImplementation(response)
    vi.stubGlobal('fetch', fetcher)
    mount()
    expect(await screen.findByLabelText(/Bitcoin-Kurs: 80\.000,00/)).toBeInTheDocument()
    expect(screen.getByText('+2,5 %')).toBeInTheDocument()
    const select = screen.getByRole('combobox', { name: 'Währung' })
    select.focus()
    await userEvent.selectOptions(select, 'eur')
    expect(select).toHaveFocus()
    expect(screen.getByLabelText(/Bitcoin-Kurs: 72\.000,00/)).toBeInTheDocument()
    expect(
      screen.getByLabelText(/Marktkapitalisierung: 1\.440\.000\.000\.000,00/),
    ).toBeInTheDocument()
    expect(screen.getByLabelText(/Handelsvolumen · 24 h: 27\.000\.000\.000,00/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Allzeithoch \(ATH\): 90\.000,00/)).toBeInTheDocument()
    expect(screen.getByText('+1,25 %')).toBeInTheDocument()
    expect(screen.getByText('-2 %')).toBeInTheDocument()
    expect(screen.getByText('+4 %')).toBeInTheDocument()
    expect(screen.getByText('-20 %')).toBeInTheDocument()
    expect(document.querySelector('time[datetime="2026-02-01T12:00:00.000Z"]')).not.toBeNull()
    expect(fetcher).toHaveBeenCalledOnce()
    expect(screen.getByRole('link', { name: 'Powered by CoinGecko' })).toHaveAttribute(
      'href',
      'https://www.coingecko.com/en/api/',
    )
  })
  it('shows missing optional values explicitly and warns on a positive ATH distance', async () => {
    const saved = marketSnapshot()
    saved.data.quotes.usd.marketCap = null
    saved.data.quotes.usd.changePercent.d7 = null
    saved.data.quotes.usd.ath = { price: 40_000, at: '2026-01-01T12:00:00.000Z' }
    saved.data.quotes.usd.distanceFromAthPercent = 100
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(saved)))
    mount()
    expect(await screen.findByText('Nicht verfügbar')).toBeInTheDocument()
    expect(screen.getByText('nicht verfügbar')).toBeInTheDocument()
    expect(screen.getByText(/Providerstand ist inkonsistent/)).toBeInTheDocument()
  })
  it.each([
    [503, 'MARKET_NOT_CONFIGURED', 'serverseitige Secret fehlt'],
    [503, 'MARKET_NOT_RELEASED', 'noch nicht für den Betrieb freigegeben'],
    [502, 'UPSTREAM_CONFIGURATION', 'Betreiberkonfiguration prüfen'],
    [502, 'UPSTREAM_INVALID_RESPONSE', 'Ungültige Antwort der Datenquelle'],
  ])('keeps first failure empty for %s/%s', async (status, code, message) => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(Response.json({ error: { code } }, { status: status as number })),
    )
    mount()
    expect(await screen.findByRole('alert')).toHaveTextContent(message)
    expect(screen.getByLabelText('Bitcoin-Kurs: —')).toBeInTheDocument()
    expect(document.querySelector('time')).toBeNull()
  })
  it('retains values and original timestamps on failure, with independent retrieval/source age warnings', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(MARKET_TEST_NOW)
    const value = client()
    const saved = marketSnapshot(MARKET_TEST_NOW - 20 * 60_000)
    value.setQueryData(['market', 'snapshot'], saved, { updatedAt: MARKET_TEST_NOW - 20 * 60_000 })
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          Response.json({ error: { code: 'UPSTREAM_INVALID_RESPONSE' } }, { status: 502 }),
        ),
    )
    mount(value)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100)
    })
    expect(screen.getByRole('alert')).toHaveTextContent(
      'letzte erfolgreiche Snapshot bleibt sichtbar',
    )
    expect(screen.getByRole('status')).toHaveTextContent('Veraltet')
    expect(screen.getByText(/Letzter erfolgreicher Abruf ist mindestens/)).toBeInTheDocument()
    expect(screen.getByText(/Marktquellstand ist mindestens/)).toBeInTheDocument()
    expect(document.querySelector(`time[datetime="${saved.updatedAt}"]`)).not.toBeNull()
    expect(value.getQueryData(['market', 'snapshot'])).toEqual(saved)
  })
  it('allows keyboard recovery after the manual pause and disables repeated manual requests', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(MARKET_TEST_NOW)
    const fetcher = vi.fn().mockResolvedValueOnce(Response.json({})).mockImplementation(response)
    vi.stubGlobal('fetch', fetcher)
    mount()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100)
    })
    const button = screen.getByRole('button', { name: 'Aktualisieren' })
    expect(button).toBeDisabled()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000)
    })
    expect(button).toBeEnabled()
    button.focus()
    vi.useRealTimers()
    await userEvent.keyboard('{Enter}')
    await screen.findByLabelText(/Bitcoin-Kurs: 80\.000,00/)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByLabelText(/Bitcoin-Kurs: 80\.000,00/)).toBeInTheDocument()
    expect(fetcher).toHaveBeenCalledTimes(2)
    expect(button).toBeDisabled()
  })
})

describe('market query budget and error contract', () => {
  it.each([
    [502, 'UPSTREAM_UNAVAILABLE', 2],
    [504, 'UPSTREAM_TIMEOUT', 2],
    [502, 'UPSTREAM_CONFIGURATION', 1],
    [502, 'UPSTREAM_INVALID_RESPONSE', 1],
    [503, 'MARKET_NOT_CONFIGURED', 1],
    [503, 'MARKET_NOT_RELEASED', 1],
    [401, 'UPSTREAM_UNAVAILABLE', 1],
    [403, 'UPSTREAM_UNAVAILABLE', 1],
    [502, 'unknown', 1],
    [503, 'UPSTREAM_UNAVAILABLE', 1],
  ])('makes only %s/%s eligible for bounded transient retries', async (status, code, attempts) => {
    const fetcher = vi
      .fn()
      .mockImplementation(() => Promise.resolve(Response.json({ error: { code } }, { status })))
    vi.stubGlobal('fetch', fetcher)
    const value = client()
    const saved = marketSnapshot()
    value.setQueryData(['market', 'snapshot'], saved)
    await expect(
      value.fetchQuery({ ...marketOptions(value), staleTime: 0, retryDelay: 0 }),
    ).rejects.toThrow()
    expect(fetcher).toHaveBeenCalledTimes(attempts)
    expect(value.getQueryData(['market', 'snapshot'])).toEqual(saved)
  })
  it('retries a network failure once after 5–10 seconds and never repeats unvalidated envelopes', async () => {
    const value = client()
    const delay = marketOptions(value).retryDelay
    expect(typeof delay).toBe('function')
    if (typeof delay === 'function') {
      for (let i = 0; i < 10; i++) {
        const ms = delay(0, new Error())
        expect(ms).toBeGreaterThanOrEqual(5000)
        expect(ms).toBeLessThanOrEqual(10000)
      }
    }
    const fetcher = vi.fn().mockRejectedValue(new TypeError('private failure'))
    vi.stubGlobal('fetch', fetcher)
    await expect(value.fetchQuery({ ...marketOptions(value), retryDelay: 0 })).rejects.toThrow(
      'Verbindung fehlgeschlagen',
    )
    expect(fetcher).toHaveBeenCalledTimes(2)
  })
  it('keeps one provider cooldown through GC/remount, manual attempts, focus and reconnect', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(MARKET_TEST_NOW)
    const value = client()
    const fetcher = vi.fn().mockResolvedValue(new Response('broken 429', { status: 429 }))
    vi.stubGlobal('fetch', fetcher)
    await expect(value.fetchQuery(marketOptions(value))).rejects.toThrow('Abruflimit')
    expect(marketRetryAt(value)).toBe(MARKET_TEST_NOW + 600_000)
    value.removeQueries({ queryKey: ['market'] })
    const options = marketOptions(value)
    expect(options.retryOnMount).toBe(false)
    await expect(
      value.fetchQuery({ ...options, queryKey: ['market', 'another-consumer'] }),
    ).rejects.toThrow('Abruflimit')
    const view = mount(value)
    await act(async () => {
      focusManager.setFocused(false)
      focusManager.setFocused(true)
      onlineManager.setOnline(false)
      onlineManager.setOnline(true)
      await vi.advanceTimersByTimeAsync(599_000)
    })
    expect(fetcher).toHaveBeenCalledOnce()
    expect(marketManualAt(value)).toBe(MARKET_TEST_NOW + 600_000)
    view.unmount()
    await vi.advanceTimersByTimeAsync(1001)
    fetcher.mockImplementation(response)
    await value.fetchQuery({ ...marketOptions(value), queryKey: ['market', 'after-pause'] })
    expect(fetcher).toHaveBeenCalledTimes(2)
  })
  it('polls every five minutes, pauses hidden/offline/inactive consumers and refetches once on return', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(MARKET_TEST_NOW)
    const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible')
    const fetcher = vi.fn().mockImplementation(response)
    vi.stubGlobal('fetch', fetcher)
    const view = mount()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300_100)
    })
    expect(fetcher).toHaveBeenCalledTimes(2)
    visibility.mockReturnValue('hidden')
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'))
      focusManager.setFocused(false)
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(600_000)
    })
    expect(fetcher).toHaveBeenCalledTimes(2)
    visibility.mockReturnValue('visible')
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'))
      focusManager.setFocused(true)
      await vi.advanceTimersByTimeAsync(100)
    })
    expect(fetcher).toHaveBeenCalledTimes(3)
    await act(async () => {
      onlineManager.setOnline(false)
      await vi.advanceTimersByTimeAsync(600_000)
    })
    expect(fetcher).toHaveBeenCalledTimes(3)
    await act(async () => {
      onlineManager.setOnline(true)
      await vi.advanceTimersByTimeAsync(100)
    })
    expect(fetcher).toHaveBeenCalledTimes(4)
    view.unmount()
    await vi.advanceTimersByTimeAsync(marketPolicy.gcTimeMs + 1)
    expect(fetcher).toHaveBeenCalledTimes(4)
  })
  it('does not request on an initially hidden mount', () => {
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
    const fetcher = vi.fn()
    vi.stubGlobal('fetch', fetcher)
    mount()
    expect(fetcher).not.toHaveBeenCalled()
  })
  it.each(['html', 'json', 'schema', 'oversized'])(
    'rejects browser response %s without automatic retry',
    async (kind) => {
      const fetcher = vi.fn().mockImplementation(() =>
        Promise.resolve(
          kind === 'html'
            ? new Response('<html>login</html>')
            : kind === 'json'
              ? new Response('{', { headers: { 'Content-Type': 'application/json' } })
              : kind === 'schema'
                ? Response.json({})
                : new Response('x'.repeat(16 * 1024 + 1), {
                    headers: { 'Content-Type': 'application/json' },
                  }),
        ),
      )
      vi.stubGlobal('fetch', fetcher)
      const value = client()
      await expect(value.fetchQuery({ ...marketOptions(value), retryDelay: 0 })).rejects.toThrow(
        'Ungültige API-Antwort',
      )
      expect(fetcher).toHaveBeenCalledOnce()
    },
  )
  it('passes query cancellation and the 15-second timeout through body reads', async () => {
    const timeout = vi.spyOn(AbortSignal, 'timeout')
    const cancel = vi.fn()
    let signal: AbortSignal | undefined
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((_url, init: RequestInit) => {
        signal = init.signal as AbortSignal
        return Promise.resolve(
          new Response(new ReadableStream({ pull: () => new Promise(() => {}), cancel }), {
            headers: { 'Content-Type': 'application/json' },
          }),
        )
      }),
    )
    const value = client()
    const pending = value.fetchQuery(marketOptions(value))
    const assertion = expect(pending).rejects.toThrow()
    await Promise.resolve()
    await Promise.resolve()
    await value.cancelQueries({ queryKey: ['market'] })
    await assertion
    expect(timeout).toHaveBeenCalledWith(15_000)
    expect(signal?.aborted).toBe(true)
    expect(cancel).toHaveBeenCalledOnce()
  })
  it('retries a browser body timeout only once and keeps the last valid snapshot', async () => {
    let deadline: AbortController
    vi.spyOn(AbortSignal, 'timeout').mockImplementation(() => {
      deadline = new AbortController()
      return deadline.signal
    })
    const fetcher = vi.fn().mockImplementation(() =>
      Promise.resolve(
        new Response(
          new ReadableStream({
            pull(controller) {
              deadline.abort(new DOMException('private timeout reason', 'TimeoutError'))
              controller.error(deadline.signal.reason)
            },
          }),
          { headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    )
    vi.stubGlobal('fetch', fetcher)
    const value = client()
    const saved = marketSnapshot()
    value.setQueryData(['market', 'snapshot'], saved)
    await expect(
      value.fetchQuery({ ...marketOptions(value), staleTime: 0, retryDelay: 0 }),
    ).rejects.toThrow('Zeitüberschreitung')
    expect(fetcher).toHaveBeenCalledTimes(2)
    expect(value.getQueryData(['market', 'snapshot'])).toEqual(saved)
  })
  it('bounds untrusted browser error bodies to 4 KiB without retrying', async () => {
    const fetcher = vi.fn().mockImplementation(() =>
      Promise.resolve(
        new Response('x'.repeat(4097), {
          status: 502,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    )
    vi.stubGlobal('fetch', fetcher)
    const value = client()
    await expect(value.fetchQuery({ ...marketOptions(value), retryDelay: 0 })).rejects.toThrow(
      'Ungültige API-Antwort',
    )
    expect(fetcher).toHaveBeenCalledOnce()
  })
})
