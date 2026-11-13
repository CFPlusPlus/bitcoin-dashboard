import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  QueryClient,
  QueryClientProvider,
  focusManager,
  onlineManager,
} from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '@/App'
import { ThemeProvider } from '@/components/theme-provider'
import { marketSnapshot } from './market-fixtures'
import { marketHistory } from './market-history-fixtures'
import { block, envelope } from './bitcoin-fixtures'
import { hashrateFixture } from './kraken-fixtures'
import { HalvingCard, HashrateCard, OverviewChainMetric } from '@/components/overview/network'
import { MempoolCard } from '@/components/bitcoin-data'
import { HASHRATE_POLICY } from '../../shared/hashrate'
import { hashrateOptions } from '@/lib/hashrate'

vi.mock('@/components/market/history-chart', () => ({
  default: ({ history }: { history: ReturnType<typeof marketHistory> }) => (
    <div role="img" aria-label={`History ${history.data.currency} ${history.data.days}`}>
      {history.data.points[0].price}
    </div>
  ),
}))
const clients: QueryClient[] = []
function wrap(children: React.ReactNode) {
  const client = new QueryClient()
  clients.push(client)
  return {
    client,
    ...render(
      <QueryClientProvider client={client}>
        <ThemeProvider>
          <MemoryRouter>{children}</MemoryRouter>
        </ThemeProvider>
      </QueryClientProvider>,
    ),
  }
}
function fixture(path: string) {
  const url = new URL(path, 'https://dashboard.test')
  if (url.pathname.endsWith('snapshot')) return marketSnapshot()
  if (url.pathname.endsWith('history'))
    return marketHistory(
      Date.now(),
      Number(url.searchParams.get('days')) as 30,
      url.searchParams.get('currency') as 'eur',
    )
  if (url.pathname.endsWith('hashrate')) return hashrateFixture()
  if (url.pathname.endsWith('height')) return envelope({ height: 900000 })
  if (url.pathname.endsWith('blocks')) return envelope([block])
  if (url.pathname.endsWith('fees'))
    return envelope({ fastest: 2, halfHour: 1.5, hour: 1, economy: 0.5, minimum: 0.1 })
  return envelope({
    transactionCount: 123,
    virtualSizeBytes: 456789,
    totalFeeSats: 9876,
    feeHistogram: [],
  })
}
afterEach(() => {
  cleanup()
  clients.splice(0).forEach((client) => client.clear())
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  focusManager.setFocused(undefined)
  onlineManager.setOnline(true)
  vi.useRealTimers()
})
describe('dynamic overview integration', () => {
  it('labels initially paused overview chain queries offline while retaining the shared default presentation', async () => {
    onlineManager.setOnline(false)
    vi.stubGlobal(
      'fetch',
      vi.fn((path: string) => Promise.resolve(Response.json(fixture(path)))),
    )
    wrap(
      <>
        <OverviewChainMetric kind="height" />
        <HalvingCard />
        <MempoolCard showOffline />
        <MempoolCard />
      </>,
    )
    expect(screen.getAllByText('Offline · Abruf pausiert')).toHaveLength(3)
    expect(screen.getAllByText('Daten werden geladen …')).toHaveLength(1)
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    await act(async () => onlineManager.setOnline(true))
    await screen.findByRole('progressbar')
    await waitFor(() =>
      expect(screen.queryByText('Offline · Abruf pausiert')).not.toBeInTheDocument(),
    )
  })
  it('reuses snapshot, block height and chart caches across overview and market navigation; switches fiat and periods without duplicate requests', async () => {
    const fetcher = vi.fn((path: string) => Promise.resolve(Response.json(fixture(path))))
    vi.stubGlobal('fetch', fetcher)
    wrap(<App />)
    await screen.findByRole('img', { name: 'History eur 30' })
    await screen.findByText('Schätzwert verfügbar')
    expect(fetcher.mock.calls.filter(([url]) => url.endsWith('/height'))).toHaveLength(1)
    expect(fetcher.mock.calls.filter(([url]) => url.endsWith('/snapshot'))).toHaveLength(1)
    expect(screen.queryByText('Synthetische Demo-Daten')).not.toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toHaveAttribute('value', String((60000 / 210000) * 100))
    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'Marktkennzahlen & Chart' }),
      'usd',
    )
    await screen.findByRole('img', { name: 'History usd 30' })
    await userEvent.click(screen.getByRole('button', { name: '7 T' }))
    await screen.findByRole('img', { name: 'History usd 7' })
    await userEvent.click(screen.getByRole('link', { name: 'Markt' }))
    await screen.findByRole('img', { name: 'History usd 30' })
    expect(fetcher.mock.calls.filter(([url]) => url.endsWith('/snapshot'))).toHaveLength(1)
    expect(fetcher.mock.calls.filter(([url]) => url.includes('/history'))).toHaveLength(3)
  })
  it('keeps chain data and history available when snapshot and hash resources fail', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((path: string) =>
        Promise.resolve(
          path.endsWith('/snapshot')
            ? new Response('', { status: 403 })
            : path.endsWith('/hashrate')
              ? Response.json({ error: { code: 'HASHRATE_NOT_RELEASED' } }, { status: 503 })
              : Response.json(fixture(path)),
        ),
      ),
    )
    wrap(<App />)
    await screen.findByRole('img', { name: 'History eur 30' })
    await screen.findByText('Hashrate ist noch nicht für den Betrieb freigegeben.')
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '900.000' })).toBeInTheDocument()
    expect(screen.getAllByText(/Zugriff verweigert/)[0]).toBeInTheDocument()
  })
  it('retains valid hashrate on invalid browser data and labels it stale', async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json(hashrateFixture()))
    vi.stubGlobal('fetch', fetcher)
    const { client } = wrap(<HashrateCard />)
    await screen.findByText('Schätzwert verfügbar')
    fetcher.mockResolvedValue(
      Response.json({
        ...hashrateFixture(),
        data: { hashesPerSecond: 1, unit: 'EH/s', estimationBlocks: 144 },
      }),
    )
    await act(() => client.invalidateQueries({ queryKey: ['mining', 'hashrate'] }))
    await screen.findByText('Veraltet · Letzter erfolgreicher Wert')
    expect(screen.getByText(/1\.050/)).toBeInTheDocument()
  })
  it('isolates a failed historical resource from market, hash and chain metrics', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((path: string) =>
        Promise.resolve(
          path.includes('/history')
            ? Response.json({ error: { code: 'MARKET_NOT_RELEASED' } }, { status: 503 })
            : Response.json(fixture(path)),
        ),
      ),
    )
    wrap(<App />)
    await screen.findByText('Schätzwert verfügbar')
    await screen.findAllByText('Marktkennzahlen verfügbar')
    await screen.findByText('Historische Kursdaten nicht verfügbar')
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '900.000' })).toBeInTheDocument()
  })
  it('enforces a 429 cooldown on remount without disabling other providers', async () => {
    const fetcher = vi
      .fn()
      .mockImplementation(() => Promise.resolve(new Response('', { status: 429 })))
    vi.stubGlobal('fetch', fetcher)
    const { client, unmount } = wrap(<HashrateCard />)
    await screen.findByRole('alert')
    unmount()
    render(
      <QueryClientProvider client={client}>
        <HashrateCard />
      </QueryClientProvider>,
    )
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Hashrate-Abruflimit'))
    expect(fetcher).toHaveBeenCalledOnce()
  })
  it('does not rejuvenate old server cache data', async () => {
    const old = hashrateFixture(Date.now() - HASHRATE_POLICY.warnMs - 1000)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(old)))
    wrap(<HashrateCard />)
    await screen.findByText('Veraltet · Letzter erfolgreicher Wert')
  })
  it.each(['not-released', 'network'])(
    'recovers from %s on the next scheduled query without a reload or aggressive retries',
    async (scenario) => {
      vi.useFakeTimers()
      focusManager.setFocused(true)
      const fetcher = vi.fn()
      if (scenario === 'not-released')
        fetcher.mockResolvedValueOnce(
          Response.json({ error: { code: 'HASHRATE_NOT_RELEASED' } }, { status: 503 }),
        )
      else fetcher.mockRejectedValueOnce(new TypeError('private provider details'))
      fetcher.mockImplementation(() => Promise.resolve(Response.json(hashrateFixture())))
      vi.stubGlobal('fetch', fetcher)
      const { client } = wrap(<HashrateCard />)
      await act(() => vi.advanceTimersByTimeAsync(100))
      expect(screen.getByRole('alert')).toHaveTextContent(
        scenario === 'not-released'
          ? 'noch nicht für den Betrieb freigegeben'
          : 'Verbindungsfehler',
      )
      expect(screen.queryByText(/1\.050,00/)).not.toBeInTheDocument()
      await act(() => vi.advanceTimersByTimeAsync(HASHRATE_POLICY.ttlMs - 200))
      expect(fetcher).toHaveBeenCalledOnce()
      await act(() => vi.advanceTimersByTimeAsync(200))
      expect(fetcher).toHaveBeenCalledTimes(2)
      expect(screen.getByText('Schätzwert verfügbar')).toBeInTheDocument()
      expect(screen.getByText(/1\.050,00/)).toBeInTheDocument()
      expect(screen.getByText(/Schätzung über 1.008 Blöcke/)).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'mempool.space' })).toBeInTheDocument()
      expect(screen.getByText(/Letzter Abruf:/).querySelector('time')).toHaveAttribute(
        'datetime',
        client.getQueryData(hashrateOptions(client).queryKey)?.updatedAt,
      )
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    },
  )
  it('shares concurrent consumers, ignores rerenders and pauses polling in the background', async () => {
    vi.useFakeTimers()
    focusManager.setFocused(true)
    const fetcher = vi
      .fn()
      .mockImplementation(() => Promise.resolve(Response.json(hashrateFixture())))
    vi.stubGlobal('fetch', fetcher)
    const { client, rerender, unmount } = wrap(
      <>
        <HashrateCard />
        <HashrateCard />
      </>,
    )
    await act(() => vi.advanceTimersByTimeAsync(100))
    expect(fetcher).toHaveBeenCalledOnce()
    rerender(
      <QueryClientProvider client={client}>
        <HashrateCard />
        <HashrateCard />
      </QueryClientProvider>,
    )
    await act(() => vi.advanceTimersByTimeAsync(HASHRATE_POLICY.ttlMs))
    expect(fetcher).toHaveBeenCalledTimes(2)
    act(() => focusManager.setFocused(false))
    await act(() => vi.advanceTimersByTimeAsync(2 * HASHRATE_POLICY.ttlMs))
    expect(fetcher).toHaveBeenCalledTimes(2)
    await act(async () => {
      focusManager.setFocused(true)
      await vi.advanceTimersByTimeAsync(100)
    })
    expect(fetcher).toHaveBeenCalledTimes(3)
    unmount()
    await act(() => vi.advanceTimersByTimeAsync(HASHRATE_POLICY.ttlMs))
    expect(fetcher).toHaveBeenCalledTimes(3)
  })
  it('allows a successful browser query after its rate-limit cooldown expires', async () => {
    vi.useFakeTimers()
    const client = new QueryClient()
    clients.push(client)
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(new Response('', { status: 429 }))
      .mockImplementation(() => Promise.resolve(Response.json(hashrateFixture())))
    vi.stubGlobal('fetch', fetcher)
    await expect(client.fetchQuery(hashrateOptions(client))).rejects.toThrow('Abruflimit')
    vi.advanceTimersByTime(HASHRATE_POLICY.cooldownMs - 1)
    await expect(client.fetchQuery(hashrateOptions(client))).rejects.toThrow('Abruflimit')
    expect(fetcher).toHaveBeenCalledOnce()
    vi.advanceTimersByTime(1)
    await expect(client.fetchQuery(hashrateOptions(client))).resolves.toEqual(hashrateFixture())
    expect(fetcher).toHaveBeenCalledTimes(2)
  })
})
