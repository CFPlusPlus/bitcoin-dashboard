import { useState } from 'react'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MarketIndicatorCard } from '@/components/market/indicator'
import { SatsCalculator } from '@/components/market/sats-calculator'
import { MarketSnapshot } from '@/components/market/snapshot'
import { ErrorBoundary } from '@/components/error-boundary'
import { indicatorOptions, marketOptions, marketRetryAt } from '@/lib/market'
import {
  INDICATOR_POLICY,
  FEAR_GREED_LABELS,
  type Currency,
  type FearGreedClassification,
  type MarketIndicator,
} from '../../shared/market'
import { dominance, fearGreed } from './market-indicator-fixtures'
import { marketSnapshot, MARKET_TEST_NOW } from './market-fixtures'

const clients: QueryClient[] = []
function client() {
  const value = new QueryClient()
  clients.push(value)
  return value
}
function mount(children: React.ReactNode, value = client()) {
  return {
    client: value,
    ...render(<QueryClientProvider client={value}>{children}</QueryClientProvider>),
  }
}
afterEach(() => {
  cleanup()
  clients.splice(0).forEach((value) => value.clear())
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})
function SnapshotAndCalculator() {
  const [currency, setCurrency] = useState<Currency>('usd')
  return (
    <>
      <MarketSnapshot currency={currency} onCurrencyChange={setCurrency} />
      <SatsCalculator />
    </>
  )
}
describe('calculator snapshot reuse and interaction', () => {
  it('shares exactly one snapshot, changes input and unit, and ignores the page fiat selection', async () => {
    const fetcher = vi
      .fn()
      .mockImplementation(() => Promise.resolve(Response.json(marketSnapshot())))
    vi.stubGlobal('fetch', fetcher)
    mount(<SnapshotAndCalculator />)
    const calculator = screen.getByRole('region', { name: 'Sats-Rechner' })
    expect(await within(calculator).findByText('0,00138889')).toBeInTheDocument()
    const input = screen.getByRole('textbox', { name: 'Betrag' })
    await userEvent.clear(input)
    await userEvent.type(input, '72.000')
    expect(within(calculator).getByText('100.000.000')).toBeInTheDocument()
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Währung' }), 'eur')
    expect(input).toHaveValue('72.000')
    expect(screen.getByRole('combobox', { name: 'Eingabeeinheit' })).toHaveValue('EUR')
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Eingabeeinheit' }), 'sats')
    await userEvent.clear(input)
    await userEvent.type(input, '1')
    expect(within(calculator).getByText('0,00000001')).toBeInTheDocument()
    await userEvent.clear(input)
    expect(within(calculator).getByRole('status')).toHaveTextContent('Betrag eingeben')
    fireEvent.change(input, { target: { value: '-1' } })
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(within(calculator).getByRole('status')).toHaveTextContent('nicht negativen Betrag')
    expect(fetcher).toHaveBeenCalledOnce()
  })
  it('keeps BTC/sats available when the snapshot is disabled', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          Response.json({ error: { code: 'MARKET_NOT_RELEASED' } }, { status: 503 }),
        ),
    )
    mount(<SatsCalculator />)
    expect(await screen.findByText(/Fiat-Kurse nicht verfügbar/)).toBeInTheDocument()
    expect(screen.getAllByText('Nicht verfügbar')).toHaveLength(3)
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Eingabeeinheit' }), 'BTC')
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '0,00000001' } })
    expect(screen.getByText('1', { selector: 'dd' })).toBeInTheDocument()
    expect(screen.getAllByText('Nicht verfügbar')).toHaveLength(2)
  })
  it('shows the source/retrieval dates and explicitly uses retained stale rates', async () => {
    const saved = marketSnapshot(Date.now() - 20 * 60_000)
    const value = client()
    value.setQueryData(['market', 'snapshot'], saved, { updatedAt: Date.now() - 20 * 60_000 })
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          Response.json({ error: { code: 'UPSTREAM_INVALID_RESPONSE' } }, { status: 502 }),
        ),
    )
    mount(<SatsCalculator />, value)
    expect(await screen.findByText(/Veralteter Kurs/)).toBeInTheDocument()
    expect(screen.getByText('138.889')).toBeInTheDocument()
    expect(document.querySelector(`time[datetime="${saved.sourceUpdatedAt}"]`)).not.toBeNull()
    expect(document.querySelector(`time[datetime="${saved.updatedAt}"]`)).not.toBeNull()
  })
})
describe('indicator display and failure isolation', () => {
  it('contains a card rendering failure with a local h2, preserved grid and retry', async () => {
    let broken = true
    function FragileCard() {
      if (broken) throw new Error('private card details')
      return <p>Indikator wieder verfügbar</p>
    }
    vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <>
        <h1>Markt</h1>
        <p>Andere Marktdaten</p>
        <ErrorBoundary scope="card" className="col-span-12 md:col-span-6">
          <FragileCard />
        </ErrorBoundary>
      </>,
    )
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Dieser Bereich')
    expect(screen.getByRole('alert')).toHaveClass('col-span-12', 'md:col-span-6')
    expect(screen.getByRole('alert')).not.toHaveTextContent('private card details')
    expect(screen.getByText('Andere Marktdaten')).toBeInTheDocument()
    broken = false
    await userEvent.click(screen.getByRole('button', { name: 'Erneut versuchen' }))
    expect(screen.getByText('Indikator wieder verfügbar')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
  it.each(Object.entries(FEAR_GREED_LABELS))(
    'shows API category %s in German beside attribution',
    async (classification, label) => {
      const value = client()
      const saved = fearGreed()
      saved.data.classification = classification as FearGreedClassification
      value.setQueryData(['market', 'fear-greed'], saved)
      mount(<MarketIndicatorCard resource="fear-greed" />, value)
      expect(screen.getByText(label, { selector: '.indicator-description' })).toBeInTheDocument()
      expect(screen.getByRole('meter')).toHaveAttribute('value', '28')
      expect(screen.getByRole('link', { name: 'Alternative.me' })).toHaveAttribute(
        'href',
        saved.provider.attributionUrl,
      )
      expect(screen.getByText(/Veröffentlicht:/)).toBeInTheDocument()
      expect(screen.getByText(/Letzter erfolgreicher Abruf:/)).toBeInTheDocument()
    },
  )
  it('loads resources independently and keeps CoinGecko and calculator usable after an Alternative.me error', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockImplementation((path: string) =>
          Promise.resolve(
            path.endsWith('fear-greed')
              ? Response.json({ error: { code: 'UPSTREAM_INVALID_RESPONSE' } }, { status: 502 })
              : Response.json(path.endsWith('dominance') ? dominance() : marketSnapshot()),
          ),
        ),
    )
    mount(
      <>
        <SnapshotAndCalculator />
        <MarketIndicatorCard resource="dominance" />
        <MarketIndicatorCard resource="fear-greed" />
      </>,
    )
    expect(await screen.findByLabelText('BTC-Dominanz: 57,95 %')).toBeInTheDocument()
    expect(await screen.findByRole('alert')).toHaveTextContent('Ungültige Antwort')
    expect(screen.getByLabelText(/Bitcoin-Kurs: 80\.000/)).toBeInTheDocument()
    expect(screen.getByText('0,00138889')).toBeInTheDocument()
    expect(screen.getByLabelText('Fear & Greed: nicht verfügbar')).toHaveTextContent('—')
    expect(screen.getByRole('link', { name: 'Alternative.me' })).toBeInTheDocument()
  })
  it.each(['dominance', 'fear-greed'] as MarketIndicator[])(
    'retains stale %s values and dates after refresh errors',
    async (resource) => {
      const value = client()
      const saved =
        resource === 'dominance'
          ? dominance(Date.now() - 3 * 86_400_000)
          : fearGreed(Date.now() - 3 * 86_400_000)
      value.setQueryData(['market', resource], saved, { updatedAt: Date.now() - 3 * 86_400_000 })
      vi.stubGlobal(
        'fetch',
        vi
          .fn()
          .mockResolvedValue(
            Response.json({ error: { code: 'UPSTREAM_TIMEOUT' } }, { status: 504 }),
          ),
      )
      mount(<MarketIndicatorCard resource={resource} />, value)
      expect(await screen.findByRole('alert')).toHaveTextContent(
        'letzte gültige Wert bleibt sichtbar',
      )
      expect(screen.getByRole('status')).toHaveTextContent('Veraltet')
      expect(screen.getByRole('meter')).toBeInTheDocument()
      expect(document.querySelector(`time[datetime="${saved.updatedAt}"]`)).not.toBeNull()
    },
  )
  it('does not poll indicators and refreshes on reopening after freshness expires', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(MARKET_TEST_NOW)
    const fetcher = vi
      .fn()
      .mockImplementation(() => Promise.resolve(Response.json(fearGreed(Date.now()))))
    vi.stubGlobal('fetch', fetcher)
    const value = client()
    const view = mount(<MarketIndicatorCard resource="fear-greed" />, value)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100)
    })
    expect(fetcher).toHaveBeenCalledOnce()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(12 * 60 * 60_000)
    })
    expect(fetcher).toHaveBeenCalledOnce()
    expect(screen.getByRole('status')).toHaveTextContent('Veraltet')
    view.unmount()
    mount(<MarketIndicatorCard resource="fear-greed" />, value)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100)
    })
    expect(fetcher).toHaveBeenCalledTimes(2)
  })
})
describe('indicator browser contracts, freshness and budgets', () => {
  it.each(['dominance', 'fear-greed'] as MarketIndicator[])(
    'validates %s before accepting data into the query cache',
    async (resource) => {
      const value = client()
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ data: { value: 999 } })))
      await expect(value.fetchQuery(indicatorOptions(value, resource))).rejects.toMatchObject({
        code: 'INVALID_RESPONSE',
      })
      expect(value.getQueryData(['market', resource])).toBeUndefined()
    },
  )
  it.each(['dominance', 'fear-greed'] as MarketIndicator[])(
    'uses original server retrieval for %s freshness',
    async (resource) => {
      vi.useFakeTimers()
      vi.setSystemTime(MARKET_TEST_NOW)
      const ttl = INDICATOR_POLICY[resource].ttlMs
      const fixture = resource === 'dominance' ? dominance : fearGreed
      const fetcher = vi
        .fn()
        .mockImplementation(() => Promise.resolve(Response.json(fixture(Date.now() - ttl + 1000))))
      vi.stubGlobal('fetch', fetcher)
      const value = client()
      await value.fetchQuery(indicatorOptions(value, resource))
      await vi.advanceTimersByTimeAsync(999)
      await value.fetchQuery(indicatorOptions(value, resource))
      expect(fetcher).toHaveBeenCalledOnce()
      await vi.advanceTimersByTimeAsync(1)
      await value.fetchQuery(indicatorOptions(value, resource))
      expect(fetcher).toHaveBeenCalledTimes(2)
    },
  )
  it('keeps browser cooldowns independent by provider and shares CoinGecko cooldown across keys', async () => {
    const value = client()
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(new Response('broken 429', { status: 429 }))
      .mockImplementation(() => Promise.resolve(Response.json(marketSnapshot())))
    vi.stubGlobal('fetch', fetcher)
    await expect(value.fetchQuery(indicatorOptions(value, 'fear-greed'))).rejects.toMatchObject({
      code: 'UPSTREAM_RATE_LIMIT',
    })
    expect(marketRetryAt(value)).toBe(0)
    expect(marketRetryAt(value, 'alternative.me')).toBeGreaterThan(Date.now())
    await value.fetchQuery(marketOptions(value))
    fetcher.mockResolvedValueOnce(new Response('broken 429', { status: 429 }))
    await expect(value.fetchQuery(indicatorOptions(value, 'dominance'))).rejects.toMatchObject({
      code: 'UPSTREAM_RATE_LIMIT',
    })
    await expect(value.fetchQuery({ ...marketOptions(value), staleTime: 0 })).rejects.toMatchObject(
      { code: 'UPSTREAM_RATE_LIMIT' },
    )
    expect(fetcher).toHaveBeenCalledTimes(3)
  })
})
