import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { lazy, Suspense } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '@/App'
import { ErrorBoundary } from '@/components/error-boundary'
import { ThemeProvider } from '@/components/theme-provider'
import { HeightMetric } from '@/components/bitcoin-data'
import { dashboardNavigation } from '@/lib/bitcoin'
import { createQueryClient } from '@/lib/query-client'
import { envelope } from './bitcoin-fixtures'

const failures = vi.hoisted(() => ({ view: false, chart: false }))
const secret = 'private error details / token=secret'
vi.mock('@/pages/mining', () => ({
  default: () => {
    if (failures.view) throw new Error('private error details / token=secret')
    return <h1>Netzwerk & Mining</h1>
  },
}))
vi.mock('@/components/demo-chart', () => ({
  default: () => {
    if (failures.chart) throw new Error('private error details / token=secret')
    return <div>Demo chart</div>
  },
}))

function Broken(): never {
  throw new Error(secret)
}

function renderApp(path = '/mining') {
  return render(
    <ErrorBoundary scope="global">
      <QueryClientProvider client={createQueryClient()}>
        <ThemeProvider>
          <MemoryRouter initialEntries={[path]}>
            <App />
          </MemoryRouter>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>,
  )
}

beforeEach(() => {
  failures.view = false
  failures.chart = false
  vi.stubGlobal(
    'fetch',
    vi.fn(() => new Promise(() => {})),
  )
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('rendering error recovery', () => {
  it('passes healthy children through', () => {
    render(
      <ErrorBoundary scope="global">
        <p>Dashboard bereit</p>
      </ErrorBoundary>,
    )
    expect(screen.getByText('Dashboard bereit')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it.each(['light', 'dark'])(
    'shows a standalone global fallback in %s mode and reloads',
    async (theme) => {
      document.documentElement.classList.toggle('dark', theme === 'dark')
      const reload = vi.spyOn(dashboardNavigation, 'reload').mockImplementation(() => {})
      const onCaughtError = vi.fn()
      render(
        <ErrorBoundary scope="global">
          <Broken />
        </ErrorBoundary>,
        { onCaughtError },
      )
      expect(screen.getByRole('main')).toContainElement(screen.getByRole('alert'))
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
        'Das Dashboard konnte nicht angezeigt werden',
      )
      expect(screen.getByRole('alert')).not.toHaveTextContent(secret)
      expect(document.documentElement.classList.contains('dark')).toBe(theme === 'dark')
      expect(onCaughtError).toHaveBeenCalledOnce()
      await userEvent.click(screen.getByRole('button', { name: 'Seite neu laden' }))
      expect(reload).toHaveBeenCalledOnce()
    },
  )

  it('keeps navigation and theme controls available after a view error and retries successfully', async () => {
    failures.view = true
    renderApp()
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Diese Ansicht konnte nicht angezeigt werden',
    )
    expect(screen.getByRole('alert')).not.toHaveTextContent(secret)
    expect(screen.getByRole('navigation')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Light Mode aktivieren' }))
    failures.view = false
    await userEvent.click(screen.getByRole('button', { name: 'Erneut versuchen' }))
    expect(screen.getByRole('heading', { name: 'Netzwerk & Mining' })).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('resets the failed view on navigation, including returning to the same route', async () => {
    failures.view = true
    renderApp()
    await userEvent.click(screen.getByRole('link', { name: 'Blockchain' }))
    expect(screen.getByRole('heading', { name: 'Blockchain' })).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    failures.view = false
    await userEvent.click(screen.getByRole('link', { name: 'Netzwerk & Mining' }))
    expect(screen.getByRole('heading', { name: 'Netzwerk & Mining' })).toBeInTheDocument()
  })

  it('keeps persistent errors contained after retry', async () => {
    render(
      <ErrorBoundary scope="view">
        <Broken />
      </ErrorBoundary>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Erneut versuchen' }))
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Diese Ansicht konnte nicht angezeigt werden',
    )
    expect(screen.getByRole('alert')).not.toHaveTextContent(secret)
  })

  it('contains lazy chart rendering errors and remounts the chart on retry', async () => {
    failures.chart = true
    renderApp('/market')
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Das Diagramm konnte nicht angezeigt werden',
    )
    expect(screen.getByRole('heading', { name: 'Markt' })).toBeInTheDocument()
    expect(screen.getByText('Marktkapitalisierung')).toBeInTheDocument()
    failures.chart = false
    await userEvent.click(screen.getByRole('button', { name: 'Erneut versuchen' }))
    expect(await screen.findByText('Demo chart')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('preserves API error messages and refetch recovery inside a boundary', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(new Response('', { status: 403 }))
      .mockResolvedValue(Response.json(envelope({ height: 900001 })))
    vi.stubGlobal('fetch', fetcher)
    const client = createQueryClient()
    const view = render(
      <QueryClientProvider client={client}>
        <ErrorBoundary scope="view">
          <HeightMetric />
        </ErrorBoundary>
      </QueryClientProvider>,
    )
    expect(await screen.findByRole('alert')).toHaveTextContent('Zugriff verweigert')
    expect(
      screen.queryByText('Diese Ansicht konnte nicht angezeigt werden'),
    ).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Erneut versuchen' }))
    expect(await screen.findByText('900.001')).toBeInTheDocument()
    expect(fetcher).toHaveBeenCalledTimes(2)
    view.unmount()
    client.clear()
  })

  it('keeps Suspense loading until the lazy component resolves', async () => {
    let resolve!: (value: { default: () => React.JSX.Element }) => void
    const Lazy = lazy(
      () =>
        new Promise<{ default: () => React.JSX.Element }>((done) => {
          resolve = done
        }),
    )
    render(
      <ErrorBoundary scope="chart">
        <Suspense fallback={<p role="status">Chart wird geladen …</p>}>
          <Lazy />
        </Suspense>
      </ErrorBoundary>,
    )
    expect(screen.getByRole('status')).toHaveTextContent('Chart wird geladen')
    await act(async () => {
      resolve({ default: () => <p>Chart bereit</p> })
    })
    expect(await screen.findByText('Chart bereit')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
