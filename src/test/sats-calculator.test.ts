import { describe, expect, it } from 'vitest'
import { calculateSats, type CalculatorUnit } from '@/lib/sats-calculator'
import { marketSnapshot } from './market-fixtures'

const snapshot = marketSnapshot()
describe('exact rational sats calculator', () => {
  it.each([
    ['1', 'BTC', { sats: '100.000.000', EUR: '72.000,00', USD: '80.000,00' }],
    ['1', 'sats', { BTC: '0,00000001', EUR: '< 0,01', USD: '< 0,01' }],
    ['72.000', 'EUR', { BTC: '1', sats: '100.000.000', USD: '80.000,00' }],
    ['80.000', 'USD', { BTC: '1', sats: '100.000.000', EUR: '72.000,00' }],
    ['100', 'EUR', { BTC: '0,00138889', sats: '138.889', USD: '111,11' }],
    ['100', 'USD', { BTC: '0,00125', sats: '125.000', EUR: '90,00' }],
    ['0,00000001', 'BTC', { sats: '1' }],
    ['0.00000001', 'BTC', { sats: '1' }],
    [
      '9.007.199.254.740.993',
      'sats',
      { BTC: '90.071.992,54740993', sats: '9.007.199.254.740.993' },
    ],
    ['0,000000005', 'BTC', { BTC: '0,00000001', sats: '1' }],
    ['0,000000004999999999999999999999', 'BTC', { BTC: '< 0,00000001', sats: '0' }],
    ['0,0045', 'EUR', { USD: '0,01' }],
    ['1.234,56', 'EUR', { USD: '1.371,73' }],
    ['1\u202f234,56', 'EUR', { USD: '1.371,73' }],
    [' 1\u00a0234,56 ', 'EUR', { USD: '1.371,73' }],
    [',5', 'BTC', { sats: '50.000.000' }],
    ['1,', 'BTC', { sats: '100.000.000' }],
    ['0', 'BTC', { BTC: '0', sats: '0', EUR: '0,00', USD: '0,00' }],
  ] as [string, CalculatorUnit, Record<string, string>][])(
    'converts %s %s',
    (input, unit, expected) => {
      const result = calculateSats(input, unit, snapshot)
      expect(result.error).toBeNull()
      expect(result.values).toMatchObject(expected)
    },
  )
  it.each(['-1', '1e8', 'NaN', 'Infinity', '1,2,3', '1.23,45', '<script>', '1 2', '+1', '.', ','])(
    'rejects %s without throwing into React',
    (input) => {
      expect(calculateSats(input, 'BTC', snapshot).error).not.toBeNull()
    },
  )
  it('handles blank input and rejects fractional sats, excess precision and huge amounts', () => {
    expect(calculateSats(' ', 'BTC').values).toBeNull()
    expect(calculateSats('1,5', 'sats').error).toMatch(/ganze Zahl/)
    expect(calculateSats('1' + '0'.repeat(31), 'sats').error).toMatch(/10³⁰/)
    expect(calculateSats('0,' + '0'.repeat(31), 'BTC').error).toMatch(/Nachkommastellen/)
    expect(calculateSats('9'.repeat(161), 'EUR').error).toMatch(/groß/)
  })
  it('uses the full fiat ratio, never rounded sats, for fiat-to-fiat conversion', () => {
    const result = calculateSats('0,0045', 'EUR', snapshot)
    expect(result.values?.sats).toBe('6')
    expect(result.values?.USD).toBe('0,01')
  })
  it('works without rates and never substitutes fiat prices', () => {
    expect(calculateSats('1', 'BTC').values).toEqual({
      BTC: '1',
      sats: '100.000.000',
      EUR: null,
      USD: null,
    })
    expect(calculateSats('100', 'EUR').values).toEqual({
      BTC: null,
      sats: null,
      EUR: '100,00',
      USD: null,
    })
    expect(calculateSats('100', 'USD').values?.EUR).toBeNull()
  })
  it('uses supplied stale rates unchanged and handles canonical exponential prices', () => {
    const stale = marketSnapshot(Date.now() - 86_400_000)
    expect(calculateSats('100', 'EUR', stale).values).toEqual(
      calculateSats('100', 'EUR', snapshot).values,
    )
    stale.data.quotes.eur.price = 1e-7
    expect(calculateSats('0,0000001', 'EUR', stale).values?.BTC).toBe('1')
  })
})
