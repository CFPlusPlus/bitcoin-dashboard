import { StrictMode } from 'react'
import { act, cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PriceChart } from '@/components/dashboard'
import { ThemeContext, type Theme } from '@/lib/theme'
import { demoSeries } from '@/lib/demo'

const echarts = vi.hoisted(() => ({ init: vi.fn(), getInstanceByDom: vi.fn(), use: vi.fn() }))
vi.mock('echarts/core', () => echarts)

const secret = 'private chart details / token=secret'
type Failure = 'init-before' | 'init-after' | 'setOption' | 'constructor' | 'observe' | null
let failure: Failure
let clients: QueryClient[]
let charts: ReturnType<typeof createChart>[]
let observers: Observer[]

function createChart() {
  return { setOption: vi.fn(), resize: vi.fn(), dispose: vi.fn() }
}

class Observer {
  observe = vi.fn(() => {
    if (failure === 'observe') throw new Error(secret)
  })
  disconnect = vi.fn()
  constructor(readonly callback: ResizeObserverCallback) {
    if (failure === 'constructor') throw new Error(secret)
    observers.push(this)
  }
  notify() {
    this.callback([], this as unknown as ResizeObserver)
  }
}

function view(client: QueryClient, theme: Theme = 'dark') {
  return (
    <StrictMode>
      <QueryClientProvider client={client}>
        <ThemeContext.Provider value={{ theme, toggleTheme: () => {} }}>
          <p>Andere Dashboard-Informationen</p>
          <PriceChart />
        </ThemeContext.Provider>
      </QueryClientProvider>
    </StrictMode>
  )
}

function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } })
  client.setQueryData(['demo', 'indexed-series'], { values: demoSeries, source: 'synthetic' })
  clients.push(client)
  return { ...render(view(client), { onCaughtError: vi.fn() }), client }
}

beforeEach(() => {
  failure = null
  charts = []
  observers = []
  clients = []
  const registered = new Map<HTMLElement, ReturnType<typeof createChart>>()
  echarts.init.mockImplementation((element: HTMLElement) => {
    if (failure === 'init-before') throw new Error(secret)
    const chart = createChart()
    charts.push(chart)
    registered.set(element, chart)
    chart.dispose.mockImplementation(() => {
      registered.delete(element)
    })
    if (failure === 'init-after') throw new Error(secret)
    if (failure === 'setOption')
      chart.setOption.mockImplementation(() => {
        throw new Error(secret)
      })
    return chart
  })
  echarts.getInstanceByDom.mockImplementation((element: HTMLElement) => registered.get(element))
  vi.stubGlobal('ResizeObserver', Observer)
})

afterEach(() => {
  cleanup()
  clients.forEach((client) => client.clear())
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

function expectReleased() {
  charts.forEach((chart) => expect(chart.dispose).toHaveBeenCalledOnce())
  observers.forEach((observer) => expect(observer.disconnect).toHaveBeenCalledOnce())
}

describe('real chart lifecycle inside the local boundary', () => {
  it.each<Exclude<Failure, null>>([
    'init-before',
    'init-after',
    'setOption',
    'constructor',
    'observe',
  ])(
    'releases acquired resources exactly once after %s fails and supports retry',
    async (stage) => {
      failure = stage
      const { unmount } = mount()
      const alert = await screen.findByRole('alert')
      expect(alert).toHaveTextContent('Das Diagramm konnte nicht angezeigt werden')
      expect(alert).not.toHaveTextContent(secret)
      expect(screen.getByText('Andere Dashboard-Informationen')).toBeInTheDocument()
      expect(echarts.init).toHaveBeenCalled()
      expect(charts).toHaveLength(stage === 'init-before' ? 0 : echarts.init.mock.calls.length)
      expect(observers).toHaveLength(stage === 'observe' ? charts.length : 0)
      expectReleased()

      failure = null
      await userEvent.click(screen.getByRole('button', { name: 'Erneut versuchen' }))
      await screen.findByRole('img', { name: /Demo-Chart/ })
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      expect(charts.at(-1)?.setOption).toHaveBeenCalledOnce()
      expect(observers.at(-1)?.observe).toHaveBeenCalledOnce()
      unmount()
      expectReleased()
    },
  )

  it('contains resize exceptions, releases resources, ignores queued callbacks and retries', async () => {
    const { unmount } = mount()
    await screen.findByRole('img', { name: /Demo-Chart/ })
    const chart = charts.at(-1)!
    const observer = observers.at(-1)!
    chart.resize.mockImplementation(() => {
      throw new Error(secret)
    })
    act(() => {
      expect(() => observer.notify()).not.toThrow()
      expect(() => observer.notify()).not.toThrow()
    })
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Das Diagramm konnte nicht angezeigt werden',
    )
    expect(screen.getByRole('alert')).not.toHaveTextContent(secret)
    expect(screen.getByText('Andere Dashboard-Informationen')).toBeInTheDocument()
    expect(chart.resize).toHaveBeenCalledOnce()
    expectReleased()

    await userEvent.click(screen.getByRole('button', { name: 'Erneut versuchen' }))
    await screen.findByRole('img', { name: /Demo-Chart/ })
    const recovered = charts.at(-1)!
    expect(recovered).not.toBe(chart)
    act(() => observers.at(-1)!.notify())
    expect(recovered.resize).toHaveBeenCalledOnce()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    act(() => observer.notify())
    expect(chart.resize).toHaveBeenCalledOnce()
    unmount()
    expectReleased()
  })

  it('cleans up on theme changes, StrictMode remounts and unmount', async () => {
    const { client, rerender, unmount } = mount()
    await screen.findByRole('img', { name: /Demo-Chart/ })
    const previous = charts.at(-1)!
    const previousObserver = observers.at(-1)!
    rerender(view(client, 'light'))
    expect(previous.dispose).toHaveBeenCalledOnce()
    expect(previousObserver.disconnect).toHaveBeenCalledOnce()
    act(() => previousObserver.notify())
    expect(previous.resize).not.toHaveBeenCalled()
    const current = charts.at(-1)!
    act(() => observers.at(-1)!.notify())
    expect(current.resize).toHaveBeenCalledOnce()
    unmount()
    act(() => observers.at(-1)!.notify())
    expect(current.resize).toHaveBeenCalledOnce()
    expectReleased()
  })
})
