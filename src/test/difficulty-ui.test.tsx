import type { ReactNode } from 'react'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  QueryClient,
  QueryClientProvider,
  focusManager,
  onlineManager,
} from '@tanstack/react-query'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Mining from '@/pages/mining'
import { DifficultyAdjustment } from '@/components/mining/difficulty-adjustment'
import { bitcoinOptions } from '@/lib/bitcoin'
import { bitcoinPolicy } from '@/lib/bitcoin-policy'
import { resourceState } from '@/lib/blockchain-resource'
import { difficulty, envelope } from './bitcoin-fixtures'

const clients: QueryClient[] = []
const key = ['bitcoin', 'difficulty-adjustment']
function setup(
  ui: ReactNode = <DifficultyAdjustment />,
  saved?: ReturnType<typeof envelope<typeof difficulty>>,
) {
  const client = new QueryClient()
  clients.push(client)
  if (saved) client.setQueryData(key, saved)
  const view = render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
  return { client, ...view }
}
afterEach(() => {
  clients.splice(0).forEach((client) => client.clear())
  focusManager.setFocused(undefined)
  onlineManager.setOnline(true)
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('difficulty states and keyboard interaction', () => {
  it('loads without synthetic forecast, date or epoch values', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => {})),
    )
    setup(<Mining />)
    expect(screen.getByRole('status')).toHaveTextContent('Daten werden geladen')
    expect(screen.getByLabelText('Erwartete Difficulty-Anpassung: —')).toBeInTheDocument()
    expect(screen.getAllByText('Datenquelle folgt')).toHaveLength(5)
    expect(document.querySelector('time')).toBeNull()
  })
  it.each([-3.7, 0, 3.7])('displays signed %s with neutral data color', async (change) => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          Response.json(envelope({ ...difficulty, estimatedChangePercent: change })),
        ),
    )
    setup()
    const value = await screen.findByLabelText(
      `Erwartete Difficulty-Anpassung: ${change > 0 ? '+' : ''}${change.toLocaleString('de-DE')} %`,
    )
    expect(value).toHaveClass('difficulty-value')
    expect(value).not.toHaveClass('text-positive', 'text-negative')
    expect(screen.getByText('1.762')).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'value',
      String(difficulty.progressPercent),
    )
    expect(screen.getByText(/Kein separater Quellzeitstempel/)).toBeInTheDocument()
  })
  it('keeps first failure empty and supports a keyboard retry with a valid recovery', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ data: null }))
      .mockResolvedValueOnce(Response.json(envelope(difficulty)))
    vi.stubGlobal('fetch', fetcher)
    setup()
    expect(await screen.findByRole('alert')).toHaveTextContent('Ungültige API-Antwort')
    expect(screen.getByLabelText('Erwartete Difficulty-Anpassung: —')).toBeInTheDocument()
    const retry = screen.getByRole('button', { name: 'Erneut versuchen' })
    retry.focus()
    await userEvent.keyboard('{Enter}')
    expect(await screen.findByText('1.762')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(fetcher).toHaveBeenCalledTimes(2)
  })
  it('preserves last success and retrieval timestamp on refresh failure', async () => {
    const saved = envelope(difficulty)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ invalid: true })))
    const { client } = setup(undefined, saved)
    await act(async () => {
      await client.invalidateQueries({ queryKey: key })
    })
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Letzter erfolgreicher Datenstand bleibt sichtbar',
    )
    expect(screen.getByText('Abruffehler')).toBeInTheDocument()
    expect(screen.getByText('1.762')).toBeInTheDocument()
    expect(client.getQueryData(key)).toEqual(saved)
    expect(document.querySelector(`time[datetime="${saved.updatedAt}"]`)).not.toBeNull()
  })
  it('warns from retrieval age even with a fresh query cache and no request', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-31T14:30:00Z'))
    const saved = { ...envelope(difficulty), updatedAt: '2026-10-31T14:10:30.000Z' }
    const fetcher = vi.fn()
    vi.stubGlobal('fetch', fetcher)
    setup(undefined, saved)
    expect(screen.queryByText('Veraltet')).not.toBeInTheDocument()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000)
    })
    expect(screen.getByText('Veraltet')).toBeInTheDocument()
    expect(screen.getByText(/Veraltete Daten/)).toBeInTheDocument()
    expect(fetcher).not.toHaveBeenCalled()
  })
  it('shows offline pause and leaves reconnect to Query', () => {
    onlineManager.setOnline(false)
    vi.stubGlobal('fetch', vi.fn())
    setup()
    expect(screen.getByText(/Offline · Abruf pausiert/)).toBeInTheDocument()
  })
})

describe('resource freshness and automatic traffic', () => {
  it.each([401, 403, 429, 502, 504, 'html', 'json', 'data', 'network'])(
    'preserves the difficulty snapshot and bounds attempts after %s',
    async (failure) => {
      const client = new QueryClient()
      clients.push(client)
      const saved = envelope(difficulty)
      client.setQueryData(key, saved)
      const fetcher = vi.fn().mockImplementation(() => {
        if (failure === 'network') return Promise.reject(new TypeError('offline'))
        if (typeof failure === 'number')
          return Promise.resolve(new Response('', { status: failure }))
        if (failure === 'html') return Promise.resolve(new Response('<html>Login</html>'))
        if (failure === 'json')
          return Promise.resolve(
            new Response('{', { headers: { 'Content-Type': 'application/json' } }),
          )
        return Promise.resolve(
          Response.json(envelope({ ...difficulty, estimatedChangePercent: null })),
        )
      })
      vi.stubGlobal('fetch', fetcher)
      await expect(
        client.fetchQuery({
          ...bitcoinOptions('difficulty-adjustment'),
          staleTime: 0,
          retryDelay: 0,
        }),
      ).rejects.toThrow()
      expect(fetcher).toHaveBeenCalledTimes(
        failure === 'network' || (typeof failure === 'number' && failure >= 500) ? 2 : 1,
      )
      expect(client.getQueryData(key)).toEqual(saved)
    },
  )
  it('classifies a browser body deadline as a bounded transport failure', async () => {
    let deadline: AbortController
    vi.spyOn(AbortSignal, 'timeout').mockImplementation(() => {
      deadline = new AbortController()
      return deadline.signal
    })
    const fetcher = vi.fn().mockImplementation(
      async () =>
        new Response(
          new ReadableStream({
            pull(controller) {
              deadline.abort(new DOMException('private timeout reason', 'TimeoutError'))
              controller.error(deadline.signal.reason)
            },
          }),
          { headers: { 'Content-Type': 'application/json' } },
        ),
    )
    vi.stubGlobal('fetch', fetcher)
    const client = new QueryClient()
    clients.push(client)
    await expect(
      client.fetchQuery({ ...bitcoinOptions('difficulty-adjustment'), retryDelay: 0 }),
    ).rejects.toThrow('Verbindung fehlgeschlagen')
    expect(fetcher).toHaveBeenCalledTimes(2)
    expect(client.getQueryData(key)).toBeUndefined()
  })
  it('retains 60s on all existing resources and separates query staleness from the 20min warning', () => {
    for (const resource of ['height', 'latest-block', 'blocks', 'fees', 'mempool'] as const) {
      expect(bitcoinPolicy(resource)).toEqual({
        intervalMs: 60_000,
        warnAfterMs: 60_000,
        gcTimeMs: 600_000,
      })
      expect(bitcoinOptions(resource).staleTime).toBe(60_000)
    }
    expect(bitcoinOptions('difficulty-adjustment').staleTime).toBe(600_000)
    const query = {
      data: {
        ...envelope(difficulty),
        updatedAt: new Date(Date.now() - 11 * 60_000).toISOString(),
      },
      isError: false,
      isStale: true,
      isPending: false,
      isFetching: false,
    }
    expect(resourceState(query, 'difficulty-adjustment')).toBe('Abruf vorhanden')
    expect(resourceState(query)).toBe('Veraltet')
  })
  it('polls visible tabs at 10min, pauses hidden tabs, refreshes once on return and reconnect', async () => {
    vi.useFakeTimers()
    focusManager.setFocused(true)
    const fetcher = vi
      .fn()
      .mockImplementation(() => Promise.resolve(Response.json(envelope(difficulty))))
    vi.stubGlobal('fetch', fetcher)
    setup()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10)
    })
    expect(fetcher).toHaveBeenCalledTimes(1)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000)
    })
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(screen.queryByText('Veraltet')).not.toBeInTheDocument()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(540_000)
    })
    expect(fetcher).toHaveBeenCalledTimes(2)
    await act(async () => {
      focusManager.setFocused(false)
      await vi.advanceTimersByTimeAsync(1_800_000)
    })
    expect(fetcher).toHaveBeenCalledTimes(2)
    await act(async () => {
      focusManager.setFocused(true)
      await vi.advanceTimersByTimeAsync(10)
    })
    expect(fetcher).toHaveBeenCalledTimes(3)
    await act(async () => {
      onlineManager.setOnline(false)
      await vi.advanceTimersByTimeAsync(600_000)
    })
    expect(fetcher).toHaveBeenCalledTimes(3)
    await act(async () => {
      onlineManager.setOnline(true)
      await vi.advanceTimersByTimeAsync(10)
    })
    expect(fetcher).toHaveBeenCalledTimes(4)
  })
  it('does not retry 429 or refetch on focus, reconnect or remount during the 10min pause', async () => {
    vi.useFakeTimers()
    const fetcher = vi
      .fn()
      .mockImplementation(() => Promise.resolve(new Response('', { status: 429 })))
    vi.stubGlobal('fetch', fetcher)
    const { client, unmount } = setup()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10)
    })
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: 'Erneut versuchen' })).toBeDisabled()
    await act(async () => {
      focusManager.setFocused(false)
      onlineManager.setOnline(false)
      await vi.advanceTimersByTimeAsync(300_000)
      focusManager.setFocused(true)
      onlineManager.setOnline(true)
      await vi.advanceTimersByTimeAsync(10)
    })
    unmount()
    render(
      <QueryClientProvider client={client}>
        <DifficultyAdjustment />
      </QueryClientProvider>,
    )
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10)
    })
    expect(fetcher).toHaveBeenCalledTimes(1)
    // Polling resumes at the next regular interval, never in a tight retry loop.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(600_000)
    })
    expect(fetcher).toHaveBeenCalledTimes(2)
  })
  it('retains a 15s browser deadline and aborts an unmounted request', async () => {
    const timeout = vi.spyOn(AbortSignal, 'timeout')
    let signal: AbortSignal | undefined
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((_url, init: RequestInit) => {
        signal = init.signal as AbortSignal
        return new Promise((_resolve, reject) =>
          signal!.addEventListener('abort', () => reject(signal!.reason)),
        )
      }),
    )
    const { unmount } = setup()
    expect(timeout).toHaveBeenCalledWith(15_000)
    unmount()
    expect(signal?.aborted).toBe(true)
  })
  it('uses actual document visibility changes to suspend polling and resumes stale data', async () => {
    vi.useFakeTimers()
    let visibility: DocumentVisibilityState = 'visible'
    vi.spyOn(document, 'visibilityState', 'get').mockImplementation(() => visibility)
    const fetcher = vi
      .fn()
      .mockImplementation(() => Promise.resolve(Response.json(envelope(difficulty))))
    vi.stubGlobal('fetch', fetcher)
    setup()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10)
    })
    await act(async () => {
      visibility = 'hidden'
      window.dispatchEvent(new Event('visibilitychange'))
      document.dispatchEvent(new Event('visibilitychange'))
      await vi.advanceTimersByTimeAsync(1_800_000)
    })
    expect(fetcher).toHaveBeenCalledTimes(1)
    await act(async () => {
      visibility = 'visible'
      window.dispatchEvent(new Event('visibilitychange'))
      document.dispatchEvent(new Event('visibilitychange'))
      await vi.advanceTimersByTimeAsync(10)
    })
    expect(fetcher).toHaveBeenCalledTimes(2)
  })
})
