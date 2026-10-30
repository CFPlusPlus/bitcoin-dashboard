import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import { PriceChart } from '@/components/dashboard'
import { dashboardNavigation } from '@/lib/bitcoin'

vi.mock('@/components/demo-chart', () => {
  throw new Error('private chunk URL / token=secret')
})

afterEach(() => vi.restoreAllMocks())

it('contains a rejected real chart import and reloads instead of retrying a cached rejection', async () => {
  const reload = vi.spyOn(dashboardNavigation, 'reload').mockImplementation(() => {})
  render(
    <>
      <p>Andere Dashboard-Informationen</p>
      <PriceChart />
    </>,
  )
  const alert = await screen.findByRole('alert')
  expect(alert).toHaveTextContent('Anwendungskomponente konnte nicht geladen werden')
  expect(alert).not.toHaveTextContent(/private chunk|token=secret/)
  expect(screen.getByText('Andere Dashboard-Informationen')).toBeInTheDocument()
  expect(screen.getByText('Synthetische Demo-Daten')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Erneut versuchen' })).not.toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Seite neu laden' }))
  expect(reload).toHaveBeenCalledOnce()
})
