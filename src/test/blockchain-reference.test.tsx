import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { FeeHistogram } from '@/components/blockchain/fee-histogram'
import Blockchain from '@/pages/blockchain'
import { block, envelope } from './bitcoin-fixtures'
import type { BitcoinResources } from '../../shared/bitcoin'

const histogram = [
  { feeRate: 0.1, virtualSizeBytes: 1_000_000 },
  { feeRate: 2, virtualSizeBytes: 3_000_000 },
]
const clients: QueryClient[] = []
const resources: BitcoinResources = {
  height: { height: 900000 },
  blocks: [block, { ...block, hash: 'b'.repeat(64), height: 899999 }],
  'latest-block': block,
  fees: { fastest: 2, halfHour: 1.5, hour: 1, economy: 0.5, minimum: 0.1 },
  mempool: {
    transactionCount: 100,
    totalFeeSats: 1000,
    virtualSizeBytes: 4_000_000,
    feeHistogram: histogram,
  },
}

function setupPage(ui: ReactNode = <Blockchain />, failMempool = false) {
  const client = new QueryClient()
  client.setQueryDefaults(['bitcoin'], { retry: false })
  clients.push(client)
  const fetcher = vi.fn((url: string) =>
    Promise.resolve(
      failMempool && url.endsWith('mempool')
        ? new Response('', { status: 403 })
        : Response.json(envelope(resources[url.split('/').at(-1) as keyof BitcoinResources])),
    ),
  )
  vi.stubGlobal('fetch', fetcher)
  return {
    client,
    fetcher,
    ...render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>),
  }
}
afterEach(() => {
  clients.splice(0).forEach((client) => client.clear())
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('histogram inspection', () => {
  it('previews hover without changing the pinned pressed state and restores on leave', async () => {
    render(<FeeHistogram entries={histogram} mempoolSize={4_000_000} />)
    const user = userEvent.setup()
    const first = screen.getByRole('button', { name: '0–<1 sat/vB: 1.000.000 vB' })
    const other = screen.getByRole('button', { name: '2–<4 sat/vB: 3.000.000 vB' })
    await user.click(first)
    await user.hover(other)
    expect(first).toHaveAttribute('aria-pressed', 'true')
    expect(other).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('status')).toHaveTextContent('Vorschau')
    expect(screen.getByRole('status')).toHaveTextContent('Fixiert bleibt: 0–<1')
    await user.unhover(other)
    expect(screen.getByRole('status')).toHaveTextContent('Fixierter Bereich')
    expect(screen.getByRole('status')).toHaveTextContent('1.000.000 vB')
  })
  it('supports arrows, Home/End, Enter, Space and Escape', async () => {
    render(<FeeHistogram entries={histogram} mempoolSize={4_000_000} />)
    const user = userEvent.setup()
    const bars = within(screen.getByRole('group')).getAllByRole('button')
    act(() => bars[0].focus())
    await user.keyboard('{ArrowRight}{Enter}')
    expect(bars[1]).toHaveFocus()
    expect(bars[1]).toHaveAttribute('aria-pressed', 'true')
    await user.keyboard('{End} ')
    expect(bars.at(-1)).toHaveAttribute('aria-pressed', 'true')
    await user.keyboard('{Home}')
    expect(bars[0]).toHaveFocus()
    expect(bars.at(-1)).toHaveAttribute('aria-pressed', 'true')
    await user.keyboard('{Escape}')
    expect(screen.getByRole('status')).toHaveTextContent('Gesamtes Histogramm')
    expect(bars.every((bar) => bar.getAttribute('aria-pressed') === 'false')).toBe(true)
  })
  it('preserves a category through refreshed values and clears it when categories disappear', async () => {
    const view = render(<FeeHistogram entries={histogram} mempoolSize={4_000_000} />)
    const user = userEvent.setup()
    await user.selectOptions(screen.getByRole('combobox'), 'fee-2')
    view.rerender(<FeeHistogram entries={[{ feeRate: 3, virtualSizeBytes: 7 }]} mempoolSize={7} />)
    expect(screen.getByRole('combobox')).toHaveValue('fee-2')
    expect(screen.getByRole('status')).toHaveTextContent('7 vB')
    view.rerender(<FeeHistogram entries={[]} mempoolSize={0} />)
    expect(screen.getByRole('combobox')).toHaveValue('')
    expect(screen.getByText(/fixierte Bereich ist nicht mehr verfügbar/)).toBeInTheDocument()
    view.rerender(<FeeHistogram entries={histogram} mempoolSize={4_000_000} />)
    expect(screen.getByRole('combobox')).toHaveValue('')
  })
  it('uses histogram totals for shares and exposes divergent mempool totals', async () => {
    render(<FeeHistogram entries={histogram} mempoolSize={8_000_000} />)
    await userEvent.selectOptions(screen.getByRole('combobox'), 'fee-0')
    expect(screen.getByRole('status')).toHaveTextContent('25 % des Histogrammvolumens')
    expect(screen.getByText(/API liefert unterschiedliche Summen/)).toHaveTextContent(
      'Histogramm: 4.000.000 vB · Mempool: 8.000.000 vB',
    )
  })
  it('distinguishes absent histogram volume from the mempool size', () => {
    render(<FeeHistogram entries={[]} mempoolSize={1_000_000} />)
    expect(screen.queryByRole('group')).not.toBeInTheDocument()
    expect(screen.getByText('Kein Histogrammvolumen verfügbar.')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeDisabled()
    expect(screen.getByText(/Histogramm: 0 vB · Mempool/)).toBeInTheDocument()
  })
})

describe('Blockchain reference data and block selection', () => {
  it('shares four resource requests and derives actual weight utilization', async () => {
    const { fetcher } = setupPage()
    await screen.findByRole('button', { name: 'Block 900.000 auswählen' })
    expect(fetcher).toHaveBeenCalledTimes(4)
    expect(screen.getByRole('img', { name: /3.999.999 von maximal 4.000.000/ })).toBeInTheDocument()
    expect(screen.getByText('100 %')).toBeInTheDocument()
    expect(screen.getByText('3.999.999 WU')).toBeInTheDocument()
  })
  it('keeps distinct resource timestamps and derives weight from WU, independently of bytes', async () => {
    const { client } = setupPage()
    await screen.findByRole('combobox')
    const heightTime = '2026-10-30T09:59:12Z'
    const blocksTime = '2026-10-30T09:58:11Z'
    await act(async () => {
      client.setQueryData(['bitcoin', 'height'], {
        ...envelope({ height: 900001 }),
        updatedAt: heightTime,
      })
      client.setQueryData(['bitcoin', 'blocks'], {
        ...envelope([{ ...block, sizeBytes: 1000000, weightUnits: 3000000 }]),
        updatedAt: blocksTime,
      })
    })
    expect(await screen.findByText('75 %')).toBeInTheDocument()
    expect(document.querySelector('[aria-label="Datenstatus height"] time')).toHaveAttribute(
      'dateTime',
      heightTime,
    )
    expect(document.querySelector('[aria-label="Datenstatus blocks"] time')).toHaveAttribute(
      'dateTime',
      blocksTime,
    )
    expect(screen.getByRole('img', { name: /3.000.000 von maximal 4.000.000/ })).toBeInTheDocument()
  })
  it('selects blocks by keyboard and row without navigating, and preserves hash on refresh', async () => {
    const { client } = setupPage()
    const button = await screen.findByRole('button', { name: 'Block 899.999 auswählen' })
    act(() => button.focus())
    await userEvent.keyboard('{Enter}')
    expect(button).toHaveAttribute('aria-pressed', 'true')
    const detail = screen.getByRole('region', { name: 'Block 899.999' })
    expect(detail).toHaveTextContent('b'.repeat(64))
    expect(within(detail).getByRole('link')).toHaveAttribute(
      'href',
      `https://mempool.space/block/${'b'.repeat(64)}`,
    )
    await act(async () =>
      client.setQueryData(
        ['bitcoin', 'blocks'],
        envelope([{ ...block, hash: 'c'.repeat(64), height: 900001 }, ...resources.blocks]),
      ),
    )
    expect(screen.getByRole('button', { name: 'Block 899.999 auswählen' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await userEvent.click(
      (await screen.findByRole('button', { name: 'Block 900.001 auswählen' })).closest('tr')!,
    )
    expect(screen.getByRole('region', { name: 'Block 900.001' })).toBeInTheDocument()
  })
  it('falls back visibly if a selected block leaves the list and handles an empty dataset', async () => {
    const { client } = setupPage()
    await userEvent.click(await screen.findByRole('button', { name: 'Block 899.999 auswählen' }))
    await act(async () => client.setQueryData(['bitcoin', 'blocks'], envelope([block])))
    expect(await screen.findByRole('region', { name: 'Block 900.000' })).toBeInTheDocument()
    expect(screen.getByText(/ausgewählte Block ist nicht mehr in der Liste/)).toBeInTheDocument()
    await act(async () => client.setQueryData(['bitcoin', 'blocks'], envelope([])))
    await waitFor(() =>
      expect(screen.queryByRole('region', { name: /^Block / })).not.toBeInTheDocument(),
    )
    expect(screen.getAllByText('Keine Blockdaten verfügbar.')).toHaveLength(2)
  })
  it('retains a successful mempool and timestamp after an access refresh error, and retries', async () => {
    const { client, fetcher } = setupPage()
    await screen.findByRole('combobox')
    const before = client.getQueryData(['bitcoin', 'mempool'])
    fetcher.mockImplementation((url: string) =>
      Promise.resolve(
        url.endsWith('mempool')
          ? new Response('', { status: 403 })
          : Response.json(envelope(resources[url.split('/').at(-1) as keyof BitcoinResources])),
      ),
    )
    await act(async () => {
      await client.invalidateQueries({ queryKey: ['bitcoin', 'mempool'] })
    })
    expect(await screen.findByRole('alert')).toHaveTextContent('Zugriff verweigert')
    expect(client.getQueryData(['bitcoin', 'mempool'])).toEqual(before)
    expect(screen.getByText(/Veraltete Daten/)).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Block 900.000 auswählen' })).toBeInTheDocument()
    fetcher.mockImplementation((url: string) =>
      Promise.resolve(
        Response.json(envelope(resources[url.split('/').at(-1) as keyof BitcoinResources])),
      ),
    )
    await userEvent.click(screen.getByRole('button', { name: 'Erneut versuchen' }))
    await screen.findByRole('combobox')
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
  })
  it('keeps fees and blocks usable when the first mempool fetch fails', async () => {
    setupPage(undefined, true)
    expect(await screen.findByRole('alert')).toHaveTextContent('Zugriff verweigert')
    expect(screen.getByText('Keine Mempool-Daten verfügbar.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Block 900.000 auswählen' })).toBeInTheDocument()
    expect(screen.getByText('1,5 sat/vB')).toBeInTheDocument()
  })
  it('shows loading placeholders without a successful timestamp', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => {})),
    )
    const client = new QueryClient()
    clients.push(client)
    render(
      <QueryClientProvider client={client}>
        <Blockchain />
      </QueryClientProvider>,
    )
    expect(screen.getByText('Mempool-Analyse wird geladen …')).toBeInTheDocument()
    expect(screen.queryByText(/· Abruf/)).not.toBeInTheDocument()
    expect(screen.getAllByText(/Daten werden geladen/)).toHaveLength(5)
  })
})
