import type { BitcoinResources } from '../../shared/bitcoin'

const standard = { intervalMs: 60_000, warnAfterMs: 60_000, gcTimeMs: 10 * 60_000 }
const difficulty = { intervalMs: 10 * 60_000, warnAfterMs: 20 * 60_000, gcTimeMs: 30 * 60_000 }

export function bitcoinPolicy(resource: keyof BitcoinResources) {
  return resource === 'difficulty-adjustment' ? difficulty : standard
}
