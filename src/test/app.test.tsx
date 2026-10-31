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
    expect(document.title).toBe(`${title} · Bitcoin Dashboard`)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(
      screen.getByText(
        path === '/mining'
          ? 'Difficulty-Prognose · mempool.space'
          : path === '/' || path === '/blockchain'
            ? 'Blockchain · mempool.space'
            : 'Marktsnapshot · CoinGecko',
      ),
    ).toBeInTheDocument()
  })
  it('navigates between pages', async () => {
    renderApp()
    await userEvent.click(screen.getByRole('link', { name: 'Blockchain' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Blockchain' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Blockchain' })).toHaveFocus()
    expect(document.title).toBe('Blockchain · Bitcoin Dashboard')
  })
  it.each([
    ['/market/', 'Markt'],
    ['/MINING', 'Netzwerk & Mining'],
  ])('matches the router title for %s', (path, title) => {
    renderApp(path)
    expect(document.title).toBe(`${title} · Bitcoin Dashboard`)
    expect(screen.getByRole('link', { name: title })).toHaveAttribute('aria-current', 'page')
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
  it('leaves initial focus available for the skip link and preserves the full mining label', () => {
    renderApp('/mining')
    expect(screen.getByRole('heading', { level: 1 })).not.toHaveFocus()
    expect(screen.getByRole('link', { name: 'Zum Inhalt springen' })).toHaveAttribute(
      'href',
      '#main',
    )
    expect(screen.getByRole('main')).toHaveAttribute('tabindex', '-1')
    expect(screen.getByRole('link', { name: 'Netzwerk & Mining' })).toHaveTextContent(
      'Netzwerk & Mining',
    )
  })
  it('keeps theme and route usable when localStorage is unavailable', async () => {
    const read = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('disabled')
    })
    const write = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('disabled')
    })
    try {
      renderApp()
      await userEvent.click(screen.getByRole('button', { name: 'Light Mode aktivieren' }))
      expect(document.documentElement).not.toHaveClass('dark')
      await userEvent.click(screen.getByRole('link', { name: 'Netzwerk & Mining' }))
      expect(screen.getByRole('heading', { level: 1, name: 'Netzwerk & Mining' })).toHaveFocus()
      expect(screen.getByRole('button', { name: 'Dark Mode aktivieren' })).toBeInTheDocument()
    } finally {
      read.mockRestore()
      write.mockRestore()
    }
  })
})
