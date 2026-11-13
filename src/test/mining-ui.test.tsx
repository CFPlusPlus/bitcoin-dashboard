import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react'
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
import { MiningFundamentals } from '@/components/mining/fundamentals'
import { ThemeProvider } from '@/components/theme-provider'
import { bitcoinOptions } from '@/lib/bitcoin'
import { HASHRATE_POLICY } from '../../shared/hashrate'
import { block, difficulty, envelope } from './bitcoin-fixtures'
import { hashrateFixture } from './kraken-fixtures'
import { marketSnapshot } from './market-fixtures'
import { marketHistory } from './market-history-fixtures'

vi.mock('@/components/market/history-chart', () => ({ default: () => <div>Testchart</div> }))

const clients: QueryClient[] = []
function setup(client = new QueryClient(), app = false) {
  clients.push(client)
  return {
    client,
    ...render(
      <QueryClientProvider client={client}>
        <ThemeProvider>
          <MemoryRouter>{app ? <App /> : <MiningFundamentals />}</MemoryRouter>
        </ThemeProvider>
      </QueryClientProvider>,
    ),
  }
}
function fixture(path: string) {
  if (path.endsWith('/hashrate')) return hashrateFixture()
  if (path.endsWith('/blocks')) return envelope([block])
  if (path.endsWith('/height')) return envelope({ height: 900000 })
  if (path.endsWith('/difficulty-adjustment')) return envelope(difficulty)
  if (path.endsWith('/snapshot')) return marketSnapshot()
  if (path.includes('/history?')) return marketHistory()
  if (path.endsWith('/fees'))
    return envelope({ fastest: 2, halfHour: 1, hour: 1, economy: 0.5, minimum: 0.1 })
  return envelope({
    transactionCount: 123,
    virtualSizeBytes: 456789,
    totalFeeSats: 9876,
    feeHistogram: [],
  })
}
function mockFetch() {
  const fetcher = vi.fn((path: string) => Promise.resolve(Response.json(fixture(path))))
  vi.stubGlobal('fetch', fetcher)
  return fetcher
}
function card(name: string) {
  return within(screen.getByRole('region', { name }))
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

describe('mining fundamentals integration', () => {
  it('shows five KPIs and both analyses from one block response, with honest methodology', async () => {
    const fetcher = mockFetch()
    setup()
    await screen.findByText('Schätzwert verfügbar')
    expect(card('Aktuelle Difficulty').getByText('123,46')).toBeInTheDocument()
    expect(card('Bitcoin-Angebot · Modell').getByText('19.875.003')).toBeInTheDocument()
    expect(card('Angebotsinflation · Schätzung').getByText('0,826')).toBeInTheDocument()
    expect(card('Nächstes Halving').getByText('150.000')).toBeInTheDocument()
    expect(screen.getByText('1.050,00')).toBeInTheDocument()
    const halving = card('Halving-Analyse')
    expect(halving.getByText('900.000')).toBeInTheDocument()
    expect(halving.getByText('5 · nach 4 Halvings')).toBeInTheDocument()
    expect(halving.getByText('840.000')).toBeInTheDocument()
    expect(halving.getByText('1.050.000')).toBeInTheDocument()
    expect(halving.getByText('3,125 BTC')).toBeInTheDocument()
    expect(halving.getByText('1,5625 BTC')).toBeInTheDocument()
    expect(
      halving.getByRole('progressbar', { name: 'Fortschritt im Halving-Zyklus' }),
    ).toHaveAttribute('value', String((60000 / 210000) * 100))
    const supply = card('Bitcoin-Angebotsanalyse')
    expect(supply.getByText('1.124.996,8519 BTC')).toBeInTheDocument()
    expect(supply.getByText('20.999.999,9769 BTC')).toBeInTheDocument()
    expect(supply.getByText('164.250 BTC / Jahr')).toBeInTheDocument()
    expect(supply.getByText('0,826 % p. a.')).toBeInTheDocument()
    expect(supply.getByText(/50 nicht ausgebbarer Genesis-BTC/)).toBeInTheDocument()
    expect(supply.getByText(/52.560 zukünftige Blöcke/)).toBeInTheDocument()
    expect(screen.getAllByText('Platzhalter · Noch nicht verbunden')).toHaveLength(2)
    expect(fetcher.mock.calls.map(([path]) => path).sort()).toEqual([
      '/api/bitcoin/blocks',
      '/api/mining/hashrate',
    ])
  })

  it('starts with empty KPIs and no fabricated progress, then recovers independently of hashrate', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => {})),
    )
    const { client } = setup()
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    expect(card('Aktuelle Difficulty').getByText('—')).toBeInTheDocument()
    await act(async () => {
      client.setQueryData(['bitcoin', 'blocks'], envelope([block]))
    })
    expect(await screen.findAllByRole('progressbar')).toHaveLength(2)
    expect(card('Aktuelle Difficulty').getByText('123,46')).toBeInTheDocument()
    expect(screen.getByText('Hashrate wird geladen …')).toBeInTheDocument()
  })

  it('retains a coherent snapshot, values and timestamp after invalid data and supports keyboard retry', async () => {
    const fetcher = mockFetch()
    const { client } = setup()
    await screen.findByText('Schätzwert verfügbar')
    const saved = client.getQueryData(['bitcoin', 'blocks'])
    fetcher.mockImplementation((path: string) =>
      Promise.resolve(
        Response.json(
          path.endsWith('/blocks') ? envelope([{ ...block, difficulty: 0 }]) : fixture(path),
        ),
      ),
    )
    await act(async () => {
      await client.invalidateQueries({ queryKey: ['bitcoin', 'blocks'] })
    })
    expect(await screen.findByRole('alert')).toHaveTextContent('Ungültige API-Antwort')
    expect(screen.getByText(/Veraltete Daten · letzter erfolgreicher Abruf/)).toBeInTheDocument()
    expect(client.getQueryData(['bitcoin', 'blocks'])).toEqual(saved)
    expect(card('Bitcoin-Angebot · Modell').getByText('19.875.003')).toBeInTheDocument()
    fetcher.mockImplementation((path: string) => Promise.resolve(Response.json(fixture(path))))
    screen.getByRole('button', { name: 'Erneut versuchen' }).focus()
    await userEvent.keyboard('{Enter}')
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
  })

  it('isolates first block and hashrate errors and keeps deterministic missing values empty', async () => {
    const fetcher = vi.fn((path: string) =>
      Promise.resolve(
        Response.json(path.endsWith('/blocks') ? { invalid: true } : hashrateFixture()),
      ),
    )
    vi.stubGlobal('fetch', fetcher)
    setup()
    expect(await screen.findByRole('alert')).toHaveTextContent('Ungültige API-Antwort')
    expect(await screen.findByText('1.050,00')).toBeInTheDocument()
    expect(card('Aktuelle Difficulty').getByText('—')).toBeInTheDocument()
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })

  it('keeps block-derived analyses available when hashrate fails independently', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((path: string) =>
        Promise.resolve(
          Response.json(path.endsWith('/hashrate') ? { invalid: true } : fixture(path)),
        ),
      ),
    )
    setup()
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Hashrate konnte nicht geladen werden. Ungültige Antwort oder Verbindungsfehler; Anmeldung und Netzwerk prüfen.',
    )
    expect(await card('Aktuelle Difficulty').findByText('123,46')).toBeInTheDocument()
    expect(card('Bitcoin-Angebotsanalyse').getByText('164.250 BTC / Jahr')).toBeInTheDocument()
    expect(screen.getAllByRole('progressbar')).toHaveLength(2)
  })

  it('warns by retrieval age even when fresh Query data was seeded; clocks never fetch', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-13T09:00:00Z'))
    const client = new QueryClient()
    client.setQueryData(['bitcoin', 'blocks'], {
      ...envelope([block]),
      updatedAt: new Date(Date.now() - 59000).toISOString(),
    })
    client.setQueryData(
      ['mining', 'hashrate'],
      hashrateFixture(Date.now() - HASHRATE_POLICY.warnMs - 1),
    )
    const fetcher = vi.fn(() => new Promise(() => {}))
    vi.stubGlobal('fetch', fetcher)
    setup(client)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30000)
    })
    expect(screen.getAllByText('Veraltet')).toHaveLength(5)
    expect(screen.getByText('Veraltet · Letzter erfolgreicher Wert')).toBeInTheDocument()
    expect(fetcher.mock.calls).toHaveLength(1) // A stale hashrate mounts; block query is still fresh.
  })

  it('shows offline with no data, reuses last values offline and recovers on reconnect', async () => {
    onlineManager.setOnline(false)
    const fetcher = mockFetch()
    const { client } = setup()
    expect(await screen.findAllByText(/Offline · Abruf pausiert/)).toHaveLength(2)
    expect(fetcher).not.toHaveBeenCalled()
    await act(async () => onlineManager.setOnline(true))
    await screen.findByText('Schätzwert verfügbar')
    await act(async () => {
      onlineManager.setOnline(false)
      await client.invalidateQueries({ queryKey: ['bitcoin', 'blocks'] })
      await client.invalidateQueries({ queryKey: ['mining', 'hashrate'] })
    })
    await waitFor(() => expect(screen.getAllByText(/Offline · Abruf pausiert/)).toHaveLength(2))
    expect(card('Aktuelle Difficulty').getByText('123,46')).toBeInTheDocument()
    await act(async () => onlineManager.setOnline(true))
    await waitFor(() =>
      expect(screen.queryByText(/Offline · Abruf pausiert/)).not.toBeInTheDocument(),
    )
  })

  it('updates every derived metric together at a halving boundary', async () => {
    mockFetch()
    const { client } = setup()
    await screen.findByText('Schätzwert verfügbar')
    await act(async () => {
      client.setQueryData(['bitcoin', 'blocks'], envelope([{ ...block, height: 1050000 }]))
    })
    expect(await card('Nächstes Halving').findByText('210.000')).toBeInTheDocument()
    expect(card('Halving-Analyse').getByText('1.260.000')).toBeInTheDocument()
    expect(card('Halving-Analyse').getByRole('progressbar')).toHaveAttribute('value', '0')
    expect(card('Bitcoin-Angebotsanalyse').getByText('82.125 BTC / Jahr')).toBeInTheDocument()
    expect(card('Bitcoin-Angebot · Modell').getByText('20.343.752')).toBeInTheDocument()
  })

  it('keeps the broad existing block API contract but handles an unsupported model height locally', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((path: string) =>
        Promise.resolve(
          Response.json(
            path.endsWith('/blocks')
              ? envelope([{ ...block, height: Number.MAX_SAFE_INTEGER }])
              : hashrateFixture(),
          ),
        ),
      ),
    )
    setup()
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Blockhöhe außerhalb des unterstützten Mainnet-Bereichs',
    )
    expect(card('Aktuelle Difficulty').getByText('123,46')).toBeInTheDocument()
    expect(card('Nächstes Halving').getByText('—')).toBeInTheDocument()
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })

  it('shares hashrate and block caches on overview → mining → overview without duplicate requests', async () => {
    const fetcher = mockFetch()
    setup(undefined, true)
    await screen.findByText('Schätzwert verfügbar')
    await screen.findByText('2.345')
    await userEvent.click(screen.getByRole('link', { name: 'Netzwerk & Mining' }))
    await screen.findByRole('region', { name: 'Halving-Analyse' })
    await screen.findByLabelText(/Erwartete Difficulty-Anpassung: -3,7/)
    expect(fetcher.mock.calls.filter(([path]) => path.endsWith('/blocks'))).toHaveLength(1)
    expect(fetcher.mock.calls.filter(([path]) => path.endsWith('/hashrate'))).toHaveLength(1)
    expect(fetcher.mock.calls.filter(([path]) => path.endsWith('/height'))).toHaveLength(1)
    await userEvent.click(screen.getByRole('link', { name: 'Übersicht' }))
    await screen.findByRole('heading', { name: 'Halving-Fortschritt' })
    expect(fetcher.mock.calls.filter(([path]) => path.endsWith('/blocks'))).toHaveLength(1)
    expect(fetcher.mock.calls.filter(([path]) => path.endsWith('/hashrate'))).toHaveLength(1)
  })

  it('keeps the existing blocks polling interval, pauses in background, and resumes when visible', async () => {
    vi.useFakeTimers()
    focusManager.setFocused(true)
    const fetcher = mockFetch()
    setup()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1)
    })
    expect(fetcher.mock.calls.filter(([path]) => path.endsWith('/blocks'))).toHaveLength(1)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60000)
    })
    expect(fetcher.mock.calls.filter(([path]) => path.endsWith('/blocks'))).toHaveLength(2)
    act(() => focusManager.setFocused(false))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(120000)
    })
    expect(fetcher.mock.calls.filter(([path]) => path.endsWith('/blocks'))).toHaveLength(2)
    await act(async () => {
      focusManager.setFocused(true)
      await vi.advanceTimersByTimeAsync(1)
    })
    expect(fetcher.mock.calls.filter(([path]) => path.endsWith('/blocks'))).toHaveLength(3)
    expect(bitcoinOptions('blocks').refetchIntervalInBackground).toBe(false)
  })
})
