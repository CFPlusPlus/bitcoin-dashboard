// Synthetic snapshot. No requests, timers or real Bitcoin block identifiers.
// Decimal units: 1 MvB = 1,000,000 virtual bytes; 1 MWU = 1,000,000 weight units.
export const fixture = {
  id: 'OBS-01',
  date: '22.10.2026',
  timezone: 'MESZ',
  source: 'mempool.space',
  height: 968421,
  times: { height: '14:32:20', blocks: '14:32:19', fees: '14:32:16', mempool: '14:32:18' },
  mempool: { transactionCount: 8426, virtualSizeBytes: 13840000, totalFeeSats: 48320000 },
  // Explicit half-open fee ranges, NOT a time series. Sum = mempool virtual size.
  // This prototype groups illustrative fee-rate entries into these ranges;
  // it does not assert that provider feeHistogram entries already have this shape.
  buckets: [
    { label: '0–<1', low: 0, high: 1, virtualSizeBytes: 920000 },
    { label: '1–<2', low: 1, high: 2, virtualSizeBytes: 4380000 },
    { label: '2–<3', low: 2, high: 3, virtualSizeBytes: 3260000 },
    { label: '3–<4', low: 3, high: 4, virtualSizeBytes: 2180000 },
    { label: '4–<6', low: 4, high: 6, virtualSizeBytes: 1480000 },
    { label: '6–<10', low: 6, high: 10, virtualSizeBytes: 960000 },
    { label: '≥10', low: 10, high: null, virtualSizeBytes: 660000 },
  ],
  fees: [
    { label: 'Hohe Priorität', value: 6, note: 'Nächster Block', key: 'fastest' },
    { label: 'Etwa 30 Minuten', value: 4, note: 'Zeitliche Schätzung', key: 'halfHour' },
    { label: 'Etwa 60 Minuten', value: 3, note: 'Zeitliche Schätzung', key: 'hour' },
    { label: 'Sparsam', value: 2, note: 'Geringere Priorität', key: 'economy' },
    { label: 'Minimum', value: 1, note: 'Untere Empfehlung', key: 'minimum' },
  ],
  blocks: [
    {
      height: 968421,
      time: '14:29:06',
      tx: 2841,
      size: 1542836,
      weight: 3993216,
      hash: '0'.repeat(19) + 'a'.repeat(45),
    },
    {
      height: 968420,
      time: '14:18:42',
      tx: 3106,
      size: 1684120,
      weight: 3996840,
      hash: '0'.repeat(19) + 'b'.repeat(45),
    },
    {
      height: 968419,
      time: '14:10:15',
      tx: 2674,
      size: 1468024,
      weight: 3984652,
      hash: '0'.repeat(19) + 'c'.repeat(45),
    },
    {
      height: 968418,
      time: '13:56:38',
      tx: 3258,
      size: 1732950,
      weight: 3998124,
      hash: '0'.repeat(19) + 'd'.repeat(45),
    },
    {
      height: 968417,
      time: '13:48:21',
      tx: 2917,
      size: 1583208,
      weight: 3990456,
      hash: '0'.repeat(19) + 'e'.repeat(45),
    },
  ],
}
