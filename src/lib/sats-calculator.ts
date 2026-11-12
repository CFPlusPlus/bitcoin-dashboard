import type { MarketSnapshotResponse } from '../../shared/market'

export type CalculatorUnit = 'BTC' | 'sats' | 'EUR' | 'USD'
type Fraction = { n: bigint; d: bigint }
const SATS = 100_000_000n
const MAX_SATS = 10n ** 30n

function decimal(value: string): Fraction {
  const [whole, fraction = ''] = value.split('.')
  return { n: BigInt((whole || '0') + fraction), d: 10n ** BigInt(fraction.length) }
}

// Convert the validated snapshot number's canonical decimal (including exponent notation).
function price(value: number): Fraction {
  const [mantissa, exponent = '0'] = String(value).split('e')
  const result = decimal(mantissa)
  const shift = Number(exponent)
  return shift >= 0
    ? { n: result.n * 10n ** BigInt(shift), d: result.d }
    : { n: result.n, d: result.d * 10n ** BigInt(-shift) }
}

export function parseCalculatorInput(input: string): Fraction | null {
  let text = input.trim()
  if (!text) return null
  if (text.length > 160) throw new Error('Der Betrag ist zu groß.')
  // Pasted German thousands groups may use normal or nonbreaking spaces.
  if (/[\s\u00a0\u202f]/.test(text)) {
    if (!/^\d{1,3}(?:[ \u00a0\u202f]\d{3})+(?:,\d*)?$/.test(text))
      throw new Error('Bitte einen gültigen Betrag eingeben.')
    text = text.replace(/[ \u00a0\u202f]/g, '')
  }
  if (/^[1-9]\d{0,2}(?:\.\d{3})+(?:,\d*)?$/.test(text)) text = text.replaceAll('.', '')
  else if (text.includes('.') && text.includes(','))
    throw new Error('Bitte deutsche Tausender- und Dezimaltrennzeichen verwenden.')
  text = text.replace(',', '.')
  if (!/^\d*(?:\.\d*)?$/.test(text) || !/\d/.test(text))
    throw new Error('Bitte einen gültigen, nicht negativen Betrag eingeben.')
  if (text.replace('.', '').length > 60 || (text.split('.')[1]?.length ?? 0) > 30)
    throw new Error('Maximal 60 Ziffern und 30 Nachkommastellen eingeben.')
  return decimal(text)
}

function rounded(n: bigint, d: bigint) {
  return (2n * n + d) / (2n * d)
}

function fixed(value: Fraction, digits: number, trim = false) {
  const scale = 10n ** BigInt(digits)
  const result = rounded(value.n * scale, value.d)
  const whole = new Intl.NumberFormat('de-DE').format(result / scale)
  if (!digits) return whole
  let fraction = (result % scale).toString().padStart(digits, '0')
  if (trim) fraction = fraction.replace(/0+$/, '')
  if (result === 0n && value.n > 0n) return `< 0,${'0'.repeat(digits - 1)}1`
  return fraction ? `${whole},${fraction}` : whole
}

export type CalculatorResult = {
  values: Record<CalculatorUnit, string | null> | null
  error: string | null
  roundedToSats: boolean
}

export function calculateSats(
  input: string,
  unit: CalculatorUnit,
  snapshot?: MarketSnapshotResponse,
): CalculatorResult {
  try {
    const amount = parseCalculatorInput(input)
    if (!amount) return { values: null, error: null, roundedToSats: false }
    if (unit === 'sats' && amount.n % amount.d !== 0n)
      throw new Error('Satoshis bitte als ganze Zahl eingeben.')
    const rates = snapshot
      ? { EUR: price(snapshot.data.quotes.eur.price), USD: price(snapshot.data.quotes.usd.price) }
      : null
    if ((unit === 'EUR' || unit === 'USD') && !rates)
      return {
        values: {
          BTC: null,
          sats: null,
          EUR: unit === 'EUR' ? fixed(amount, 2) : null,
          USD: unit === 'USD' ? fixed(amount, 2) : null,
        },
        error: null,
        roundedToSats: false,
      }
    const btc: Fraction =
      unit === 'BTC'
        ? amount
        : unit === 'sats'
          ? { n: amount.n, d: amount.d * SATS }
          : { n: amount.n * rates![unit].d, d: amount.d * rates![unit].n }
    if (btc.n * SATS > MAX_SATS * btc.d)
      throw new Error('Der Betrag darf höchstens 10³⁰ Sats entsprechen.')
    const fiat = (rate: Fraction) => fixed({ n: btc.n * rate.n, d: btc.d * rate.d }, 2)
    return {
      values: {
        BTC: fixed(btc, 8, true),
        sats: fixed({ n: btc.n * SATS, d: btc.d }, 0),
        EUR: rates ? fiat(rates.EUR) : null,
        USD: rates ? fiat(rates.USD) : null,
      },
      error: null,
      roundedToSats: (btc.n * SATS) % btc.d !== 0n,
    }
  } catch (error) {
    return {
      values: null,
      error: error instanceof Error ? error.message : 'Ungültiger Betrag.',
      roundedToSats: false,
    }
  }
}
