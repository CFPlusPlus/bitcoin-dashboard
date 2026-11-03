import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, expect, it, vi } from 'vitest'
import { MarketHistory } from '@/components/market/history'
import { marketHistory } from './market-history-fixtures'
import { dashboardNavigation } from '@/lib/bitcoin'

vi.mock('@/components/market/history-chart', () => {
  throw new Error('private chunk URL / token=secret')
})
afterEach(() => vi.restoreAllMocks())
it('contains a failed history chart import without losing the rest of the market card', async () => {
  const value = new QueryClient()
  value.setQueryData(['market', 'history', 'eur', 30], marketHistory(Date.now(), 30, 'eur'))
  const reload = vi.spyOn(dashboardNavigation, 'reload').mockImplementation(() => {})
  const view = render(
    <QueryClientProvider client={value}>
      <MarketHistory currency="eur" />
    </QueryClientProvider>,
  )
  const alert = await screen.findByRole('alert')
  expect(alert).toHaveTextContent('Anwendungskomponente konnte nicht geladen werden')
  expect(alert).not.toHaveTextContent(/private chunk|token=secret/)
  expect(screen.getByRole('group', { name: 'Zeitraum für Kursverlauf' })).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Seite neu laden' }))
  expect(reload).toHaveBeenCalledOnce()
  view.unmount()
  value.clear()
})
