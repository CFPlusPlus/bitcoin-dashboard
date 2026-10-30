// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  parseBlock,
  parseBlocks,
  parseFees,
  parseHeight,
  parseMempool,
} from '../../functions/lib/mempool'
import { parseBitcoinResponse } from '../../shared/bitcoin-validation'
import { MAX_BLOCK_SIZE, MAX_BLOCK_TIMESTAMP, MAX_FEE_RATE } from '../../shared/bitcoin-limits'
import type { BitcoinResources } from '../../shared/bitcoin'
import { block, envelope, rawBlock, rawFees, rawMempool } from './bitcoin-fixtures'

type NumericCase = {
  name: string
  resource: keyof BitcoinResources
  maximum: number
  fractional?: boolean
  provider: (value: number) => unknown
  browser: (value: number) => unknown
}

const cases: NumericCase[] = [
  {
    name: 'height',
    resource: 'height',
    maximum: Number.MAX_SAFE_INTEGER,
    provider: (value) => parseHeight(String(value)),
    browser: (value) => ({ height: value }),
  },
  ...(
    [
      ['height', 'height', Number.MAX_SAFE_INTEGER],
      ['timestamp', 'timestamp', MAX_BLOCK_TIMESTAMP],
      ['tx_count', 'transactionCount', Number.MAX_SAFE_INTEGER],
      ['size', 'sizeBytes', MAX_BLOCK_SIZE],
      ['weight', 'weightUnits', MAX_BLOCK_SIZE],
    ] as const
  ).flatMap(([rawKey, key, maximum]): NumericCase[] => [
    {
      name: `block ${key}`,
      resource: 'latest-block',
      maximum,
      provider: (value) => parseBlock({ ...rawBlock, [rawKey]: value }),
      browser: (value) => ({ ...block, [key]: value }),
    },
    {
      name: `blocks ${key}`,
      resource: 'blocks',
      maximum,
      provider: (value) => parseBlocks([{ ...rawBlock, [rawKey]: value }]),
      browser: (value) => [{ ...block, [key]: value }],
    },
  ]),
  ...(
    [
      ['fastestFee', 'fastest'],
      ['halfHourFee', 'halfHour'],
      ['hourFee', 'hour'],
      ['economyFee', 'economy'],
      ['minimumFee', 'minimum'],
    ] as const
  ).map(([rawKey, key]): NumericCase => ({
    name: `fees ${key}`,
    resource: 'fees',
    maximum: MAX_FEE_RATE,
    fractional: true,
    provider: (value) => parseFees({ ...rawFees, [rawKey]: value }),
    browser: (value) => ({
      fastest: 2,
      halfHour: 1.5,
      hour: 1,
      economy: 0.5,
      minimum: 0.1,
      [key]: value,
    }),
  })),
  ...(
    [
      ['count', 'transactionCount'],
      ['vsize', 'virtualSizeBytes'],
      ['total_fee', 'totalFeeSats'],
    ] as const
  ).map(([rawKey, key]): NumericCase => ({
    name: `mempool ${key}`,
    resource: 'mempool',
    maximum: Number.MAX_SAFE_INTEGER,
    provider: (value) => parseMempool({ ...rawMempool, fee_histogram: [], [rawKey]: value }),
    browser: (value) => ({
      transactionCount: 123,
      virtualSizeBytes: 456789,
      totalFeeSats: 9876,
      feeHistogram: [],
      [key]: value,
    }),
  })),
  ...(['feeRate', 'virtualSizeBytes'] as const).map((key): NumericCase => ({
    name: `histogram ${key}`,
    resource: 'mempool',
    maximum: key === 'feeRate' ? MAX_FEE_RATE : Number.MAX_SAFE_INTEGER,
    fractional: key === 'feeRate',
    provider: (value) =>
      parseMempool({ ...rawMempool, fee_histogram: [key === 'feeRate' ? [value, 0] : [0, value]] }),
    browser: (value) => ({
      transactionCount: 123,
      virtualSizeBytes: 456789,
      totalFeeSats: 9876,
      feeHistogram: [{ feeRate: 0, virtualSizeBytes: 0, [key]: value }],
    }),
  })),
]

describe.each(cases)(
  '$name numeric limits',
  ({ resource, maximum, fractional, provider, browser }) => {
    it('accepts the same boundary values and the normalized provider result', () => {
      for (const value of [
        0,
        1,
        maximum,
        maximum - 1,
        ...(fractional ? [0.1, 1.5, maximum - 0.5] : []),
      ]) {
        const normalized = provider(value)
        expect(parseBitcoinResponse(resource, envelope(normalized)).data).toEqual(normalized)
        expect(parseBitcoinResponse(resource, envelope(browser(value))).data).toEqual(normalized)
      }
    })

    it('rejects negative, out-of-range, unsafe and nonfinite values in both validators', () => {
      for (const value of [
        -1,
        -Number.MIN_VALUE,
        maximum + 1,
        Number.MAX_SAFE_INTEGER + 1,
        Number.MAX_VALUE,
        Infinity,
        -Infinity,
        NaN,
        ...(fractional ? [] : [0.1, 1.5]),
      ]) {
        expect(() => provider(value), `provider: ${value}`).toThrow()
        expect(
          () => parseBitcoinResponse(resource, envelope(browser(value))),
          `browser: ${value}`,
        ).toThrow()
      }
    })
  },
)
