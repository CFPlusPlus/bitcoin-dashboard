import { StrictMode } from 'react'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Market from '@/pages/market'
import { MarketHistory } from '@/components/market/history'
import HistoryChart from '@/components/market/history-chart'
import { ThemeContext, type Theme } from '@/lib/theme'
import { historyOptions, marketOptions, marketRetryAt } from '@/lib/market'
import {
  HISTORY_TTL_MS,
  MARKET_HISTORY_DAYS,
  type Currency,
  type HistoryDays,
} from '../../shared/market'
import { marketSnapshot, MARKET_TEST_NOW } from './market-fixtures'
import { marketHistory } from './market-history-fixtures'

const echarts = vi.hoisted(() => ({ init: vi.fn(), getInstanceByDom: vi.fn(), use: vi.fn() }))
vi.mock('echarts/core', () => echarts)
const clients: QueryClient[] = []
let charts: {
  setOption: ReturnType<typeof vi.fn>
  dispose: ReturnType<typeof vi.fn>
  resize: ReturnType<typeof vi.fn>
}[]
let observers: { disconnect: ReturnType<typeof vi.fn>; callback: ResizeObserverCallback }[]
function client() {
  const value = new QueryClient()
  clients.push(value)
  return value
}
function wrap(
  children: React.ReactNode,
  value: QueryClient,
  theme: Theme = 'dark',
  strict = false,
) {
  const content = (
    <QueryClientProvider client={value}>
      <ThemeContext.Provider value={{ theme, toggleTheme: () => {} }}>
        {children}
      </ThemeContext.Provider>
    </QueryClientProvider>
  )
  return strict ? <StrictMode>{content}</StrictMode> : content
}
function api(input: string) {
  const url = new URL(input, 'https://dashboard.test')
  return Promise.resolve(
    Response.json(
      url.pathname.endsWith('snapshot')
        ? marketSnapshot(Date.now())
        : marketHistory(
            Date.now(),
            Number(url.searchParams.get('days')) as HistoryDays,
            url.searchParams.get('currency') as Currency,
          ),
    ),
  )
}
beforeEach(() => {
  charts = []
  observers = []
  echarts.init.mockImplementation(() => {
    const chart = { setOption: vi.fn(), resize: vi.fn(), dispose: vi.fn() }
    charts.push(chart)
    return chart
  })
  vi.stubGlobal(
    'ResizeObserver',
    class {
      disconnect = vi.fn()
      observe = vi.fn()
      constructor(readonly callback: ResizeObserverCallback) {
        observers.push(this)
      }
    },
  )
})
afterEach(() => {
  cleanup()
  clients.splice(0).forEach((value) => value.clear())
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
  vi.useRealTimers()
})

describe('market page with real historical response contract', () => {
  it('starts at 30 days, shares fiat with snapshot, switches all ranges by keyboard and reuses cached selections', async () => {
    const fetcher = vi.fn(api)
    vi.stubGlobal('fetch', fetcher)
    render(wrap(<Market />, client()))
    expect(
      await screen.findByRole('img', { name: /Bitcoin-Kursverlauf in USD · 30 Tage/ }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '30 T' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByLabelText(/Bitcoin-Kurs: 80\.000,00/)).toBeInTheDocument()
    expect(screen.queryByText('Synthetische Demo-Daten')).not.toBeInTheDocument()
    for (const [days, label] of [
      [1, '24 h'],
      [7, '7 T'],
      [90, '90 T'],
      [365, '1 J'],
    ] as const) {
      const button = screen.getByRole('button', { name: label })
      button.focus()
      await userEvent.keyboard('{Enter}')
      expect(
        await screen.findByRole('img', {
          name: `Bitcoin-Kursverlauf in USD · ${days} ${days === 1 ? 'Tag' : 'Tage'}`,
        }),
      ).toBeInTheDocument()
      expect(button).toHaveFocus()
      expect(button).toHaveAttribute('aria-pressed', 'true')
    }
    await userEvent.click(screen.getByRole('button', { name: '30 T' }))
    await screen.findByRole('img', { name: /USD · 30 Tage/ })
    expect(fetcher).toHaveBeenCalledTimes(6)
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Währung' }), 'eur')
    expect(await screen.findByRole('img', { name: /EUR · 30 Tage/ })).toBeInTheDocument()
    expect(screen.getByLabelText(/Bitcoin-Kurs: 72\.000,00/)).toBeInTheDocument()
    expect(screen.getAllByRole('combobox')).toHaveLength(1)
    expect(fetcher.mock.calls.filter(([url]) => url === '/api/market/snapshot')).toHaveLength(1)
    expect(fetcher.mock.calls).toContainEqual([
      '/api/market/history?currency=eur&days=30',
      expect.objectContaining({ credentials: 'same-origin', redirect: 'error', cache: 'no-store' }),
    ])
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Währung' }), 'usd')
    await screen.findByRole('img', { name: /USD · 30 Tage/ })
    expect(fetcher).toHaveBeenCalledTimes(7)
  })
  it('shows a loading region without invented values and hides old context on range/fiat switches', async () => {
    const fetcher = vi.fn(api)
    vi.stubGlobal('fetch', fetcher)
    render(wrap(<Market />, client()))
    await screen.findByRole('img', { name: /USD · 30 Tage/ })
    fetcher.mockImplementation(() => new Promise(() => {}))
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Währung' }), 'eur')
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getByText('Historische Kursdaten werden geladen …')).toBeInTheDocument()
    expect(screen.getByLabelText(/Bitcoin-Kurs: 72\.000,00/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: '7 T' }))
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(charts.every((chart) => chart.dispose.mock.calls.length === 1)).toBe(true)
  })
  it('shows first error without a chart, respects the manual pause and recovers', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(MARKET_TEST_NOW)
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({ error: { code: 'UPSTREAM_INVALID_RESPONSE' } }, { status: 502 }),
      )
      .mockImplementation(api)
    vi.stubGlobal('fetch', fetcher)
    render(wrap(<MarketHistory currency="eur" />, client()))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100)
    })
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Historische Kursdaten konnten nicht geladen werden',
    )
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    const button = screen.getByRole('button', { name: 'Kursverlauf aktualisieren' })
    expect(button).toBeDisabled()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000)
    })
    expect(button).toBeEnabled()
    fireEvent.click(button)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100)
    })
    expect(screen.getByRole('img', { name: /EUR · 30 Tage/ })).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(fetcher).toHaveBeenCalledTimes(2)
  })
  it('retains the last matching dataset and original times after a failed refresh', async () => {
    const value = client()
    const saved = marketHistory(Date.now() - 40 * 60_000, 30, 'eur')
    value.setQueryData(['market', 'history', 'eur', 30], saved, {
      updatedAt: Date.parse(saved.updatedAt),
    })
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          Response.json({ error: { code: 'UPSTREAM_INVALID_RESPONSE' } }, { status: 502 }),
        ),
    )
    render(wrap(<MarketHistory currency="eur" />, value))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'letzte gültige Kursverlauf bleibt sichtbar',
    )
    expect(screen.getByText('Veraltet · Letzter erfolgreicher Kursverlauf')).toBeInTheDocument()
    expect(await screen.findByRole('img', { name: /EUR · 30 Tage/ })).toBeInTheDocument()
    expect(document.querySelector(`time[datetime="${saved.updatedAt}"]`)).not.toBeNull()
    expect(value.getQueryData(['market', 'history', 'eur', 30])).toEqual(saved)
  })
})

describe('historical chart options and lifecycle', () => {
  it.each(MARKET_HISTORY_DAYS)(
    'uses exact time-price pairs, scaled currency axis and German tooltips over %s days',
    (days) => {
      const history = marketHistory(MARKET_TEST_NOW, days, 'eur')
      const value = client()
      const view = render(wrap(<HistoryChart history={history} />, value, 'dark', true))
      const chart = charts.at(-1)!
      const option = chart.setOption.mock.calls.at(-1)![0]
      expect(option.xAxis.type).toBe('time')
      expect(option.yAxis.scale).toBe(true)
      expect(option.yAxis.min).toBeUndefined()
      expect(option.series[0].smooth).toBe(false)
      expect(option.series[0].data).toEqual(
        history.data.points.map(({ timestamp, price }) => [timestamp, price]),
      )
      expect(option.yAxis.axisLabel.formatter(72000)).toContain('€')
      const point = history.data.points[0]
      expect(option.tooltip.formatter([{ value: [point.timestamp, point.price] }])).toContain(
        'BTC: 72.000,00',
      )
      expect(option.tooltip.formatter([{ value: [point.timestamp, point.price] }])).toContain('€')
      expect(option.tooltip.formatter([])).toBe('')
      expect(option.xAxis.axisLabel.formatter(point.timestamp)).toBeTruthy()
      const count = charts.length
      view.rerender(wrap(<HistoryChart history={history} />, value, 'light', true))
      expect(charts).toHaveLength(count)
      expect(chart.setOption).toHaveBeenCalledTimes(2)
      view.rerender(
        wrap(
          <HistoryChart history={marketHistory(MARKET_TEST_NOW + 1000, days, 'eur')} />,
          value,
          'light',
          true,
        ),
      )
      expect(charts).toHaveLength(count)
      expect(chart.setOption).toHaveBeenCalledTimes(3)
      view.unmount()
      expect(charts.every((item) => item.dispose.mock.calls.length === 1)).toBe(true)
      expect(observers.every((item) => item.disconnect.mock.calls.length === 1)).toBe(true)
    },
  )
})

describe('historical React Query cache and shared provider budget', () => {
  it('deduplicates observers, caches each dimension, expires at TTL and does not poll', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(MARKET_TEST_NOW)
    const value = client()
    const fetcher = vi.fn(api)
    vi.stubGlobal('fetch', fetcher)
    await Promise.all([
      value.fetchQuery(historyOptions(value, 'eur', 30)),
      value.fetchQuery(historyOptions(value, 'eur', 30)),
    ])
    await value.fetchQuery(historyOptions(value, 'eur', 30))
    expect(fetcher).toHaveBeenCalledOnce()
    await value.fetchQuery(historyOptions(value, 'usd', 30))
    await value.fetchQuery(historyOptions(value, 'eur', 7))
    expect(fetcher).toHaveBeenCalledTimes(3)
    expect(historyOptions(value, 'eur', 30).refetchInterval).toBe(false)
    await vi.advanceTimersByTimeAsync(HISTORY_TTL_MS[30])
    expect(fetcher).toHaveBeenCalledTimes(3)
    await value.fetchQuery(historyOptions(value, 'eur', 30))
    expect(fetcher).toHaveBeenCalledTimes(4)
  })
  it.each(['snapshot', 'history'])(
    'a %s 429 blocks both resources and other contexts through GC',
    async (resource) => {
      vi.useFakeTimers()
      vi.setSystemTime(MARKET_TEST_NOW)
      const value = client()
      const fetcher = vi.fn().mockResolvedValue(new Response('damaged 429', { status: 429 }))
      vi.stubGlobal('fetch', fetcher)
      const pending =
        resource === 'snapshot'
          ? value.fetchQuery(marketOptions(value))
          : value.fetchQuery(historyOptions(value, 'eur', 30))
      await expect(pending).rejects.toThrow('Abruflimit')
      value.removeQueries({ queryKey: ['market'] })
      await expect(value.fetchQuery(historyOptions(value, 'usd', 7))).rejects.toThrow('Abruflimit')
      await expect(value.fetchQuery(marketOptions(value))).rejects.toThrow('Abruflimit')
      expect(fetcher).toHaveBeenCalledOnce()
      expect(marketRetryAt(value)).toBe(MARKET_TEST_NOW + 600_000)
      await vi.advanceTimersByTimeAsync(600_000)
      fetcher.mockImplementation(api)
      await value.fetchQuery(historyOptions(value, 'eur', 30))
      expect(fetcher).toHaveBeenCalledTimes(2)
    },
  )
  it.each([401, 403])(
    'distinguishes Access %s from provider configuration errors without retry',
    async (status) => {
      const value = client()
      const fetcher = vi.fn().mockResolvedValue(new Response('<html>Access</html>', { status }))
      vi.stubGlobal('fetch', fetcher)
      await expect(value.fetchQuery(historyOptions(value, 'eur', 30))).rejects.toMatchObject({
        code: 'ACCESS',
      })
      expect(fetcher).toHaveBeenCalledOnce()
    },
  )
  it('rejects a wrong currency contract instead of relabelling it', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(Response.json(marketHistory(Date.now(), 30, 'usd'))),
    )
    await expect(client().fetchQuery(historyOptions(client(), 'eur', 30))).rejects.toMatchObject({
      code: 'INVALID_RESPONSE',
    })
  })
  it('retries only one transient failure and supports query abort', async () => {
    const value = client()
    const fetcher = vi.fn().mockRejectedValue(new TypeError('private'))
    vi.stubGlobal('fetch', fetcher)
    await expect(
      value.fetchQuery({ ...historyOptions(value, 'eur', 30), retryDelay: 0 }),
    ).rejects.toThrow('Verbindung')
    expect(fetcher).toHaveBeenCalledTimes(2)
    let signal: AbortSignal | undefined
    fetcher.mockImplementation((_url: string, init: RequestInit) => {
      signal = init.signal as AbortSignal
      return new Promise((_resolve, reject) =>
        signal?.addEventListener('abort', () => reject(new Error('cancelled'))),
      )
    })
    const pending = value.fetchQuery(historyOptions(value, 'usd', 7))
    const assertion = expect(pending).rejects.toThrow()
    await waitFor(() => expect(signal).toBeDefined())
    await value.cancelQueries({ queryKey: ['market', 'history'] })
    await assertion
    expect(signal?.aborted).toBe(true)
  })
})
