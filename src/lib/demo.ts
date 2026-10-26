// Synthetic, deliberately indexed values. These are not Bitcoin prices or historical observations.
export const demoSeries = [100, 104, 102, 109, 107, 113, 110, 115, 119, 116, 123, 121]
export async function getDemoSeries() {
  return { values: demoSeries, source: 'synthetic' as const }
}
