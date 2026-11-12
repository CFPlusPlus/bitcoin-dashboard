import { describe, expect, it } from 'vitest'
import { normalizeCoinGeckoDominance } from '../../functions/lib/coingecko'
import { normalizeFearGreed } from '../../functions/lib/alternative'
import { parseMarketDominance, parseFearGreed } from '../../shared/market-validation'
import { FEAR_GREED_LABELS } from '../../shared/market'
import { dominance, fearGreed, rawDominance, rawFearGreed } from './market-indicator-fixtures'

const now = Date.parse('2026-11-12T12:00:00.000Z')
describe('dominance contract on both trust boundaries', () => {
  it('uses the direct percentage and provider seconds, dropping unrelated fields', () => {
    const raw = { ...rawDominance(now), private: 'discard' }
    const result = normalizeCoinGeckoDominance(raw, now)
    expect(result).toEqual(dominance(now))
    expect(parseMarketDominance(result, now)).toEqual(result)
    expect(JSON.stringify(result)).not.toContain('discard')
  })
  it.each([undefined, null, NaN, Infinity, '57', -0.1, 100.1])(
    'rejects invalid percentages %s',
    (value) => {
      const raw = rawDominance(now)
      expect(() =>
        normalizeCoinGeckoDominance(
          { data: { ...raw.data, market_cap_percentage: { btc: value } } },
          now,
        ),
      ).toThrow()
      const normal = dominance(now)
      expect(() =>
        parseMarketDominance({ ...normal, data: { ...normal.data, btcPercent: value } }, now),
      ).toThrow()
    },
  )
  it.each([0, 100])('allows boundary %s', (btcPercent) => {
    const normal = dominance(now)
    expect(
      parseMarketDominance({ ...normal, data: { ...normal.data, btcPercent } }, now).data
        .btcPercent,
    ).toBe(btcPercent)
  })
  it.each([{}, { data: {} }, { data: { market_cap_percentage: {} } }])(
    'rejects missing fields',
    (raw) => {
      expect(() => normalizeCoinGeckoDominance(raw, now)).toThrow()
    },
  )
})
describe('daily Alternative.me contract', () => {
  it.each(Object.keys(FEAR_GREED_LABELS))(
    'preserves API classification %s with a German label',
    (classification) => {
      const raw = rawFearGreed(now)
      raw.data[0].value_classification = classification
      expect(normalizeFearGreed(raw, now).data.classification).toBe(classification)
    },
  )
  it.each(['0', '100'])('accepts index boundary %s and converts seconds once', (value) => {
    const raw = rawFearGreed(now)
    raw.data[0].value = value
    const result = normalizeFearGreed(raw, now)
    expect(result.data.value).toBe(Number(value))
    expect(result.sourceUpdatedAt).toBe('2026-11-12T11:00:00.000Z')
    expect(parseFearGreed(result, now)).toEqual(result)
  })
  it.each(['-1', '101', '1.5', '', 'NaN', '01'])('rejects invalid provider value %s', (value) => {
    const raw = rawFearGreed(now)
    raw.data[0].value = value
    expect(() => normalizeFearGreed(raw, now)).toThrow()
  })
  it.each([
    undefined,
    null,
    123,
    'nonsense',
    String(now),
    '0',
    String(Math.floor(now / 1000) + 301),
  ])('rejects invalid publication seconds %s', (timestamp) => {
    const raw = rawFearGreed(now)
    expect(() =>
      normalizeFearGreed({ ...raw, data: [{ ...raw.data[0], timestamp }] }, now),
    ).toThrow()
  })
  it.each([
    {},
    { data: [], metadata: { error: null } },
    { data: [null], metadata: { error: null } },
    { ...rawFearGreed(now), metadata: { error: 'provider private error' } },
  ])('rejects malformed payloads', (raw) => {
    expect(() => normalizeFearGreed(raw, now)).toThrow()
  })
  it('rejects unknown classifications without inventing threshold rules', () => {
    const raw = rawFearGreed(now)
    raw.data[0].value_classification = 'Happy'
    expect(() => normalizeFearGreed(raw, now)).toThrow()
  })
})
describe('browser metadata validation', () => {
  for (const [fixture, parse] of [
    [dominance, parseMarketDominance],
    [fearGreed, parseFearGreed],
  ] as const) {
    it.each(['source', 'provider', 'updatedAt', 'sourceUpdatedAt'])(
      'rejects altered %s',
      (field) => {
        expect(() => parse({ ...fixture(now), [field]: 'untrusted' }, now)).toThrow()
      },
    )
    it('accepts old source dates but rejects source dates after retrieval and unsafe attribution URLs', () => {
      const value = fixture(now)
      expect(() =>
        parse({ ...value, sourceUpdatedAt: new Date(now - 3 * 86_400_000).toISOString() }, now),
      ).not.toThrow()
      expect(() =>
        parse({ ...value, updatedAt: new Date(now - 7_200_000).toISOString() }, now),
      ).toThrow()
      expect(() =>
        parse(
          { ...value, provider: { ...value.provider, attributionUrl: 'javascript:alert(1)' } },
          now,
        ),
      ).toThrow()
    })
  }
})
