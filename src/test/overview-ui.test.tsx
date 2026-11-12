import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '@/App'
import { ThemeProvider } from '@/components/theme-provider'
import { marketSnapshot } from './market-fixtures'
import { marketHistory } from './market-history-fixtures'
import { block, envelope } from './bitcoin-fixtures'
import { hashrateFixture } from './kraken-fixtures'
import { HashrateCard } from '@/components/overview/network'
import { HASHRATE_POLICY } from '../../shared/hashrate'

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
  vi.useRealTimers()
})
describe('dynamic overview integration', () => {
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
    expect(screen.getByText(/Zugriff verweigert/)).toBeInTheDocument()
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
    await screen.findByText('Marktkennzahlen verfügbar')
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
})
