import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '@/App'
import { ThemeProvider } from '@/components/theme-provider'
import { createQueryClient } from '@/lib/query-client'

vi.mock('@/components/demo-chart', () => ({ default: () => <div>Demo chart</div> }))
beforeEach(() =>
  vi.stubGlobal(
    'fetch',
    vi.fn(() => new Promise(() => {})),
  ),
)
afterEach(() => vi.unstubAllGlobals())
function renderApp(path = '/') {
  return render(
    <QueryClientProvider client={createQueryClient()}>
      <ThemeProvider>
        <MemoryRouter initialEntries={[path]}>
          <App />
        </MemoryRouter>
      </ThemeProvider>
    </QueryClientProvider>,
  )
}
describe('dashboard shell', () => {
  it.each([
    ['/', 'Übersicht'],
    ['/market', 'Markt'],
    ['/blockchain', 'Blockchain'],
    ['/mining', 'Netzwerk & Mining'],
  ])('renders route %s', (path, title) => {
    renderApp(path)
    expect(screen.getByRole('heading', { level: 1, name: title })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: title })).toHaveAttribute('aria-current', 'page')
    expect(
      screen.getByText(
        path === '/' || path === '/blockchain'
          ? 'Blockchain · mempool.space'
          : 'Vorschau · Keine Live-Daten',
      ),
    ).toBeInTheDocument()
  })
  it('navigates between pages', async () => {
    renderApp()
    await userEvent.click(screen.getByRole('link', { name: 'Blockchain' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Blockchain' })).toBeInTheDocument()
  })
  it('defaults to dark and persists a manually selected theme', async () => {
    const view = renderApp()
    expect(document.documentElement).toHaveClass('dark')
    await userEvent.click(screen.getByRole('button', { name: 'Light Mode aktivieren' }))
    expect(document.documentElement).not.toHaveClass('dark')
    expect(localStorage.getItem('theme')).toBe('light')
    view.unmount()
    renderApp()
    expect(screen.getByRole('button', { name: 'Dark Mode aktivieren' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Dark Mode aktivieren' }))
    expect(document.documentElement).toHaveClass('dark')
  })
  it('recovers from an unknown route', async () => {
    renderApp('/missing')
    expect(screen.getByRole('heading', { name: 'Seite nicht gefunden' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('link', { name: 'Zur Übersicht' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Übersicht' })).toBeInTheDocument()
  })
  it('labels synthetic data and the remaining placeholder metrics', () => {
    renderApp()
    expect(screen.getByText('Synthetische Demo-Daten')).toBeInTheDocument()
    expect(screen.getAllByText('Datenquelle folgt')).toHaveLength(4)
  })
})
