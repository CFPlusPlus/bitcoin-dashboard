import type { Fees, Mempool } from '../../shared/bitcoin'

// Stable half-open intervals, including fractional rates, zero and an unbounded tail.
const boundaries = [0, 1, 2, 4, 8, 16, 32] as const

export interface FeeBucket {
  id: string
  label: string
  shortLabel: string
  lower: number | null
  upper: number | null
  virtualSizeBytes: bigint
}

export function aggregateHistogram(entries: Mempool['feeHistogram']) {
  const buckets: FeeBucket[] = boundaries.map((lower, index) => {
    const upper = boundaries[index + 1] ?? null
    return {
      id: `fee-${lower}`,
      label: upper === null ? `≥ ${lower}` : `${lower}–<${upper}`,
      shortLabel: upper === null ? `≥${lower}` : `${lower}–${upper}`,
      lower,
      upper,
      virtualSizeBytes: 0n,
    }
  })
  const unknown: FeeBucket = {
    id: 'unclassified',
    label: 'Nicht zuordenbar',
    shortLabel: '?',
    lower: null,
    upper: null,
    virtualSizeBytes: 0n,
  }
  let ignoredEntries = 0
  for (const entry of entries) {
    // The API validator guarantees this already; keep exact totals defensively too.
    if (!Number.isSafeInteger(entry.virtualSizeBytes) || entry.virtualSizeBytes < 0) {
      ignoredEntries++
      continue
    }
    const bucket =
      Number.isFinite(entry.feeRate) && entry.feeRate >= 0
        ? buckets.find(
            (range) =>
              entry.feeRate >= range.lower! &&
              (range.upper === null || entry.feeRate < range.upper),
          )!
        : unknown
    bucket.virtualSizeBytes += BigInt(entry.virtualSizeBytes)
  }
  if (unknown.virtualSizeBytes > 0n) buckets.push(unknown)
  const total = buckets.reduce((sum, bucket) => sum + bucket.virtualSizeBytes, 0n)
  return { buckets: total > 0n ? buckets : [], total, ignoredEntries }
}

export const feeLabels: { key: keyof Fees; label: string }[] = [
  { key: 'fastest', label: 'Hohe Priorität' },
  { key: 'halfHour', label: 'Etwa 30 Minuten' },
  { key: 'hour', label: 'Etwa 60 Minuten' },
  { key: 'economy', label: 'Sparsam' },
  { key: 'minimum', label: 'Minimum' },
]

export function scaleFees(fees: Fees) {
  const maximum = Math.max(...feeLabels.map(({ key }) => fees[key]))
  return feeLabels.map(({ key, label }) => ({
    key,
    label,
    value: fees[key],
    fraction: maximum > 0 ? fees[key] / maximum : 0,
  }))
}

export const exactNumber = (value: bigint) => value.toLocaleString('de-DE')
export const mvb = (bytes: bigint | number) => Number(bytes) / 1_000_000
export const share = (part: bigint, total: bigint) =>
  total > 0n ? Number(part) / Number(total) : 0

export function histogramScale(maximumBytes: bigint) {
  const maximum = mvb(maximumBytes)
  if (maximum <= 0) return { maximum: 1, ticks: [1, 0.75, 0.5, 0.25, 0] }
  const rawStep = maximum / 5
  const magnitude = 10 ** Math.floor(Math.log10(rawStep))
  const step = Math.max(
    0.000001,
    [1, 2, 5, 10].find((factor) => factor * magnitude >= rawStep)! * magnitude,
  )
  const count = Math.ceil(maximum / step)
  return {
    maximum: step * count,
    ticks: Array.from({ length: count + 1 }, (_, i) => (count - i) * step),
  }
}
