import { describe, expect, it } from 'vitest'
import {
  bitcoinSupplyAt,
  blockSubsidySats,
  halvingAt,
  HALVING_INTERVAL,
  issuedSupplySats,
  MAX_BLOCK_HEIGHT,
  MAX_SUBSIDY_SUPPLY_SATS,
  MODEL_YEAR_BLOCKS,
  satsToBtc,
} from '../../shared/bitcoin-supply'
import { halvingAt as overviewHalvingAt } from '@/lib/overview'

describe('mainnet monetary schedule (pure functions, inclusive tip height)', () => {
  it.each([
    [0, 5_000_000_000n, 5_000_000_000n],
    [1, 5_000_000_000n, 10_000_000_000n],
    [209_999, 5_000_000_000n, 1_050_000_000_000_000n],
    [210_000, 2_500_000_000n, 1_050_002_500_000_000n],
    [420_000, 1_250_000_000n, 1_575_001_250_000_000n],
    [840_000, 312_500_000n, 1_968_750_312_500_000n],
    [900_000, 312_500_000n, 1_987_500_312_500_000n],
    [1_050_000, 156_250_000n, 2_034_375_156_250_000n],
    [6_929_998, 1n, 2_099_999_997_689_999n],
    [6_929_999, 1n, 2_099_999_997_690_000n],
    [6_930_000, 0n, 2_099_999_997_690_000n],
    [64 * 210_000, 0n, 2_099_999_997_690_000n],
    [MAX_BLOCK_HEIGHT, 0n, 2_099_999_997_690_000n],
  ])('height %s has exact subsidy and cumulative satoshis', (height, subsidy, total) => {
    expect(blockSubsidySats(height)).toBe(subsidy)
    expect(issuedSupplySats(height)).toBe(total)
    expect(typeof issuedSupplySats(height)).toBe('bigint')
    if (height > 0) expect(issuedSupplySats(height) - issuedSupplySats(height - 1)).toBe(subsidy)
  })

  it('includes the unspendable genesis allocation once and uses the exact schedule maximum', () => {
    expect(issuedSupplySats(0)).toBe(50n * 100_000_000n)
    expect(issuedSupplySats(1) - issuedSupplySats(0)).toBe(50n * 100_000_000n)
    expect(MAX_SUBSIDY_SUPPLY_SATS).toBe(2_099_999_997_690_000n)
    expect(21_000_000n * 100_000_000n - MAX_SUBSIDY_SUPPLY_SATS).toBe(2_310_000n)
    expect(satsToBtc(1n)).toBe(0.00000001)
  })

  it.each([
    [29, 9n],
    [30, 4n],
    [31, 2n],
    [32, 1n],
    [33, 0n],
    [63, 0n],
    [64, 0n],
    [1000, 0n],
  ])('cycle %s truncates to integer satoshis, never wraps shifts', (cycle, sats) => {
    expect(blockSubsidySats(cycle * HALVING_INTERVAL)).toBe(sats)
  })

  it('keeps overview and mining on the identical halving function', () => {
    expect(overviewHalvingAt).toBe(halvingAt)
  })

  it.each([0, 1, 2, 4, 5, 29, 32, 33, 64])('resets cycle %s at its exact boundary', (cycle) => {
    const height = cycle * HALVING_INTERVAL
    const boundary = halvingAt(height)
    expect(boundary.cycle).toBe(cycle)
    expect(boundary.lastHeight).toBe(cycle === 0 ? null : height)
    expect(boundary.nextHeight).toBe(height + HALVING_INTERVAL)
    expect(boundary.remaining).toBe(HALVING_INTERVAL)
    expect(boundary.progressPercent).toBe(0)
    expect(boundary.subsidySats).toBe(Number(blockSubsidySats(height)))
    expect(boundary.nextSubsidySats).toBe(Number(blockSubsidySats(height + HALVING_INTERVAL)))
    if (height > 0) {
      const previous = halvingAt(height - 1)
      expect(previous.remaining).toBe(1)
      expect(previous.nextHeight).toBe(height)
      expect(previous.progressPercent).toBeCloseTo((209999 / 210000) * 100)
    }
  })

  it.each([-1, -0.5, 0.1, NaN, Infinity, -Infinity, MAX_BLOCK_HEIGHT + 1, Number.MAX_SAFE_INTEGER])(
    'rejects invalid height %s consistently',
    (height) => {
      for (const calculate of [blockSubsidySats, issuedSupplySats, halvingAt, bitcoinSupplyAt])
        expect(() => calculate(height)).toThrow('Invalid block height')
    },
  )

  it('conserves the maximum and matches every subsidy at sampled cycle boundaries', () => {
    for (let cycle = 0; cycle <= 64; cycle++) {
      for (const offset of [0, 1, 104999, 209999]) {
        const height = cycle * HALVING_INTERVAL + offset
        const supply = bitcoinSupplyAt(height)
        expect(supply.issuedSats + supply.remainingSats).toBe(MAX_SUBSIDY_SUPPLY_SATS)
        expect(supply.remainingSats >= 0n).toBe(true)
        expect(supply.issuedPercent).toBeGreaterThan(0)
        expect(supply.issuedPercent).toBeLessThanOrEqual(100)
        if (height > 0)
          expect(issuedSupplySats(height) - issuedSupplySats(height - 1)).toBe(
            blockSubsidySats(height),
          )
      }
    }
  })
})

describe('forward 365-day issuance and supply inflation model', () => {
  it('uses 144 blocks/day, 365 days and the already-issued schedule denominator', () => {
    const supply = bitcoinSupplyAt(900000)
    expect(MODEL_YEAR_BLOCKS).toBe(52560)
    expect(supply.annualIssuanceSats).toBe(16_425_000_000_000n)
    expect(supply.annualInflationPercent).toBeCloseTo((164250 / 19875003.125) * 100, 12)
    expect(bitcoinSupplyAt(0).annualIssuanceSats).toBe(52560n * 5_000_000_000n)
  })

  it.each([
    [997439, 52560n * 312_500_000n],
    [997440, 52559n * 312_500_000n + 156_250_000n],
    [1049990, 9n * 312_500_000n + 52551n * 156_250_000n],
    [1049999, 52560n * 156_250_000n],
    [1050000, 52560n * 156_250_000n],
    [6929998, 1n],
    [6929999, 0n],
    [6930000, 0n],
    [MAX_BLOCK_HEIGHT, 0n],
  ])('height %s accounts for both ends of the future window', (height, expected) => {
    const supply = bitcoinSupplyAt(height)
    expect(supply.annualIssuanceSats).toBe(expected)
    expect(supply.annualInflationPercent).toBe((Number(expected) / Number(supply.issuedSats)) * 100)
  })

  it.each([157441, 419999, 839999, 1000000, 1049990, 6_929_990])(
    'matches independent per-block integer division over the future year from %s',
    (height) => {
      let reference = 0n
      for (let next = height + 1; next <= height + 52560; next++) {
        const cycle = Math.floor(next / 210000)
        reference += cycle >= 64 ? 0n : 5_000_000_000n / 2n ** BigInt(cycle)
      }
      expect(bitcoinSupplyAt(height).annualIssuanceSats).toBe(reference)
    },
  )
})
