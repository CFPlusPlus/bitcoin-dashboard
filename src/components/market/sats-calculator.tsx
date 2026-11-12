import { useState } from 'react'
import { Card, CardTitle } from '@/components/ui/card'
import { useMarketClock, useMarketSnapshot } from '@/lib/market'
import { marketAge } from '@/lib/market-policy'
import { formatTime } from '@/lib/bitcoin'
import { calculateSats, type CalculatorUnit } from '@/lib/sats-calculator'
import { MARKET_PROVIDER } from '../../../shared/market'

const units: CalculatorUnit[] = ['BTC', 'sats', 'EUR', 'USD']
export function SatsCalculator() {
  const [input, setInput] = useState('100')
  const [unit, setUnit] = useState<CalculatorUnit>('EUR')
  const query = useMarketSnapshot()
  const now = useMarketClock()
  const snapshot = query.data
  const age = snapshot ? marketAge(snapshot, now) : undefined
  const old = snapshot && (age?.retrievalOld || age?.sourceOld || query.isError)
  const result = calculateSats(input, unit, snapshot)
  const money = (value: number, currency: string) =>
    new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency,
      maximumFractionDigits: 8,
    }).format(value)
  return (
    <Card className="sats-calculator col-span-12 xl:col-span-4">
      <section aria-labelledby="sats-calculator-title">
        <CardTitle id="sats-calculator-title">Sats-Rechner</CardTitle>
        <p className="market-note">Bitcoin, Satoshis und Fiat direkt umrechnen.</p>
        <div className="calculator-inputs">
          <label htmlFor="sats-amount">Betrag</label>
          <input
            id="sats-amount"
            type="text"
            inputMode={unit === 'sats' ? 'numeric' : 'decimal'}
            autoComplete="off"
            spellCheck={false}
            value={input}
            maxLength={160}
            aria-invalid={!!result.error}
            aria-describedby="calculator-hint calculator-status"
            onChange={(event) => setInput(event.target.value)}
          />
          <label htmlFor="sats-unit">Eingabeeinheit</label>
          <select
            id="sats-unit"
            value={unit}
            onChange={(event) => setUnit(event.target.value as CalculatorUnit)}
          >
            {units.map((value) => (
              <option key={value} value={value}>
                {value === 'sats' ? 'Satoshis (sats)' : value}
              </option>
            ))}
          </select>
        </div>
        <p id="calculator-hint" className="market-note">
          Dezimal: 0,01 · Tausender: 1.000. Beim Einheitenwechsel bleibt die Eingabe erhalten.
        </p>
        <p
          id="calculator-status"
          className={result.error ? 'market-warning' : 'market-note'}
          role="status"
        >
          {result.error ??
            (!input.trim()
              ? 'Betrag eingeben.'
              : result.roundedToSats
                ? 'BTC auf 8 Stellen und Sats auf ganze Einheiten gerundet.'
                : '1 BTC = 100.000.000 Sats')}
        </p>
        <dl className="calculator-results" aria-live="polite" aria-atomic="true">
          {units
            .filter((value) => value !== unit)
            .map((value) => (
              <div key={value}>
                <dt>{value}</dt>
                <dd data-unit={value}>
                  {result.values?.[value] ?? (result.values ? 'Nicht verfügbar' : '—')}
                </dd>
              </div>
            ))}
        </dl>
        <footer className="market-footer">
          {snapshot ? (
            <>
              {old && (
                <p className="market-warning">
                  Veralteter Kurs · Letzter erfolgreicher Snapshot wird verwendet.
                </p>
              )}
              <p className="market-note">
                Verwendeter Kurs · 1 BTC = {money(snapshot.data.quotes.eur.price, 'EUR')} /{' '}
                {money(snapshot.data.quotes.usd.price, 'USD')}
              </p>
              <p className="market-note">
                Kursstand:{' '}
                <time dateTime={snapshot.sourceUpdatedAt}>
                  {formatTime(snapshot.sourceUpdatedAt)}
                </time>{' '}
                · Abruf: <time dateTime={snapshot.updatedAt}>{formatTime(snapshot.updatedAt)}</time>
              </p>
            </>
          ) : (
            <p className="market-note">
              {query.isPending ? 'Kurse werden geladen.' : 'Fiat-Kurse nicht verfügbar.'} BTC ↔ Sats
              funktioniert ohne Kurs.
            </p>
          )}
          <p className="market-note">
            Referenzkurse ·{' '}
            <a href={MARKET_PROVIDER.attributionUrl} target="_blank" rel="noreferrer">
              CoinGecko-Kursquelle
            </a>
          </p>
        </footer>
      </section>
    </Card>
  )
}
