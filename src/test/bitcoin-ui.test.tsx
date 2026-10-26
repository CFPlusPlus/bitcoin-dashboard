import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider, focusManager } from '@tanstack/react-query'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { FeeMetric, HeightMetric, LiveBlocksTable, MempoolCard } from '@/components/bitcoin-data'
import Blockchain from '@/pages/blockchain'
import { bitcoinOptions, dashboardNavigation } from '@/lib/bitcoin'
import { block, envelope } from './bitcoin-fixtures'
import type { ReactNode } from 'react'

const clients: QueryClient[] = []
function setup(ui: ReactNode) {
  const client = new QueryClient()
  client.setQueryDefaults(['bitcoin'], { retry: false })
  clients.push(client)
  const view = render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
  return { client, ...view }
}
afterEach(() => {
  vi.restoreAllMocks()
  clients.splice(0).forEach(client => client.clear())
  focusManager.setFocused(undefined)
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('live Bitcoin UI', () => {
  it.each([401, 403, 'redirect', 'network', 'html'])('offers a full page reload for %s failures without asserting session expiry', async failure => {
    const reload = vi.spyOn(dashboardNavigation, 'reload').mockImplementation(() => {})
    const fetcher = vi.fn(() => typeof failure === 'number'
      ? Promise.resolve(new Response('', { status: failure }))
      : failure === 'html' ? Promise.resolve(new Response('<html>Login</html>', { headers: { 'Content-Type': 'text/html' } }))
        : Promise.reject(new TypeError('Failed to fetch')))
    vi.stubGlobal('fetch', fetcher)
    setup(<HeightMetric />)
    const alert = await screen.findByRole('alert', {}, { timeout: 3000 })
    expect(alert).toHaveTextContent(typeof failure === 'number' ? 'Zugriff verweigert' : failure === 'html' ? 'Anmeldung prüfen' : 'Verbindung fehlgeschlagen')
    expect(alert).not.toHaveTextContent(/Sitzung.*abgelaufen/)
    expect(fetcher).toHaveBeenCalledWith('/api/bitcoin/height', expect.objectContaining({ redirect: 'error', credentials: 'same-origin' }))
    const calls = fetcher.mock.calls.length
    await userEvent.click(screen.getByRole('button', { name: 'Neu anmelden / Seite neu laden' }))
    expect(reload).toHaveBeenCalledOnce()
    expect(fetcher).toHaveBeenCalledTimes(calls)
  })
  it('reloads the current document through the browser location API', () => {
    const reload = vi.fn()
    vi.stubGlobal('window', { location: { reload } })
    try {
      dashboardNavigation.reload()
      expect(reload).toHaveBeenCalledOnce()
    } finally {
      vi.unstubAllGlobals()
    }
  })
  it('keeps valid data and the success timestamp after invalid normalized data', async () => {
    const saved = envelope({ height: 900000 })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(saved)))
    const { client } = setup(<HeightMetric />)
    await screen.findByText('900.000')
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(Response.json(envelope({})))))
    await act(async () => { await client.invalidateQueries({ queryKey: ['bitcoin', 'height'] }) })
    expect(await screen.findByRole('alert')).toHaveTextContent('Ungültige API-Antwort')
    expect(client.getQueryData(['bitcoin', 'height'])).toEqual(saved)
    expect(screen.getByText('900.000')).toBeInTheDocument()
    expect(document.querySelector('time')).toHaveAttribute('dateTime', saved.updatedAt)
  })
  it('shows loading without fabricated values', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))
    setup(<HeightMetric />)
    expect(screen.getByRole('status')).toHaveTextContent('Daten werden geladen')
    expect(screen.getByText('—')).toBeInTheDocument()
    expect(screen.queryByText(/Zuletzt erfolgreich/)).not.toBeInTheDocument()
  })
  it('renders real response values, source and successful retrieval time', async () => {
    const response = envelope({ height: 900000 })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(response)))
    setup(<HeightMetric />)
    expect(await screen.findByText('900.000')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'mempool.space' })).toHaveAttribute('href', 'https://mempool.space')
    expect(document.querySelector('time')).toHaveAttribute('dateTime', response.updatedAt)
  })
  it('offers retry on access errors and recovers', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(new Response('', { status: 403 })).mockResolvedValue(Response.json(envelope({ height: 900001 })))
    vi.stubGlobal('fetch', fetcher)
    setup(<HeightMetric />)
    expect(await screen.findByRole('alert')).toHaveTextContent('Zugriff verweigert')
    expect(screen.queryByText(/Zuletzt erfolgreich/)).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Erneut versuchen' }))
    expect(await screen.findByText('900.001')).toBeInTheDocument()
  })
  it('keeps the last success and its timestamp when a refresh fails', async () => {
    const saved = envelope({ height: 900000 })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(saved)))
    const { client } = setup(<HeightMetric />)
    await screen.findByText('900.000')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 403 })))
    await act(async () => { await client.invalidateQueries({ queryKey: ['bitcoin', 'height'] }) })
    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('900.000')).toBeInTheDocument()
    expect(screen.getByText(/Veraltete Daten/)).toBeInTheDocument()
    expect(document.querySelector('time')).toHaveAttribute('dateTime', saved.updatedAt)
  })
  it('renders block rows and accepts an empty mempool', async () => {
    vi.stubGlobal('fetch', vi.fn((url: string) => Promise.resolve(Response.json(envelope(url.endsWith('blocks') ? [block] : { transactionCount: 0, virtualSizeBytes: 0, totalFeeSats: 0, feeHistogram: [] })))))
    setup(<><LiveBlocksTable /><MempoolCard /></>)
    expect(await screen.findByRole('link', { name: '900.000' })).toHaveAttribute('href', `https://mempool.space/block/${block.hash}`)
    expect(screen.getByText('2.345')).toBeInTheDocument()
    expect(await screen.findByText('0')).toBeInTheDocument()
    expect(screen.getByText('1,5 MB')).toBeInTheDocument()
  })
  it('shares fee and block queries across Blockchain components', async () => {
    const fetcher = vi.fn((url: string) => Promise.resolve(Response.json(envelope(url.endsWith('blocks') ? [block] : url.endsWith('fees') ? { fastest: 2, halfHour: 1.5, hour: 1, economy: 0.5, minimum: 0.1 } : url.endsWith('height') ? { height: 900000 } : { transactionCount: 0, virtualSizeBytes: 0, totalFeeSats: 0, feeHistogram: [] }))))
    vi.stubGlobal('fetch', fetcher)
    setup(<Blockchain />)
    await screen.findByText('1,5 sat/vB')
    expect(fetcher).toHaveBeenCalledTimes(4)
    expect(screen.getByText('4')).toBeInTheDocument()
  })
  it('rejects HTML login responses and malformed envelopes', async () => {
    const client = new QueryClient()
    clients.push(client)
    for (const response of [new Response('<html>Login</html>', { headers: { 'Content-Type': 'text/html' } }), Response.json({ data: {}, source: 'other', updatedAt: 'invalid' })]) {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response))
      await expect(client.fetchQuery({ ...bitcoinOptions('fees'), retry: false })).rejects.toThrow()
    }
  })
  it('pauses polling in background and refreshes stale data on focus', async () => {
    vi.useFakeTimers()
    const fetcher = vi.fn(() => Promise.resolve(Response.json(envelope({ fastest: 0, halfHour: 0, hour: 0, economy: 0, minimum: 0 }))))
    vi.stubGlobal('fetch', fetcher)
    const { unmount } = setup(<FeeMetric />)
    await act(async () => { await vi.advanceTimersByTimeAsync(50) })
    expect(fetcher).toHaveBeenCalledTimes(1)
    act(() => focusManager.setFocused(false))
    await act(async () => { await vi.advanceTimersByTimeAsync(180_000) })
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(screen.getByText(/Veraltete Daten/)).toBeInTheDocument()
    act(() => focusManager.setFocused(true))
    await act(async () => { await vi.advanceTimersByTimeAsync(50) })
    expect(fetcher).toHaveBeenCalledTimes(2)
    await act(async () => { await vi.advanceTimersByTimeAsync(60_000) })
    expect(fetcher).toHaveBeenCalledTimes(3)
    unmount()
    await act(async () => { await vi.advanceTimersByTimeAsync(120_000) })
    expect(fetcher).toHaveBeenCalledTimes(3)
  })
})
