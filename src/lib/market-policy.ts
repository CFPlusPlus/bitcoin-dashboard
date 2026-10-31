import type { MarketSnapshotResponse } from '../../shared/market'

export const marketPolicy = {
  intervalMs: 5 * 60_000,
  warnAfterMs: 10 * 60_000,
  gcTimeMs: 30 * 60_000,
  cooldownMs: 10 * 60_000,
  manualPauseMs: 60_000,
} as const

export function marketAge(snapshot: MarketSnapshotResponse, now: number) {
  return {
    retrievalOld: now - Date.parse(snapshot.updatedAt) >= marketPolicy.warnAfterMs,
    sourceOld: now - Date.parse(snapshot.sourceUpdatedAt) >= marketPolicy.warnAfterMs,
  }
}
