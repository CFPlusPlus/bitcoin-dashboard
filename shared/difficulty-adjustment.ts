import type { DifficultyAdjustment } from './bitcoin'
import { number } from './bitcoin-number'

export const DIFFICULTY_EPOCH_BLOCKS = 2016
const GENESIS_MS = 1_231_006_505_000
const MAX_DATE_MS = 8_640_000_000_000_000

export function retargetTimestamp(value: unknown): number {
  const timestamp = number(value, true, MAX_DATE_MS)
  if (timestamp < GENESIS_MS) throw new Error('Invalid retarget milliseconds')
  return timestamp
}

// Validate the normalized contract on both sides of the same-origin boundary.
export function parseDifficultyAdjustment(value: unknown): DifficultyAdjustment {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Invalid difficulty adjustment')
  const data = value as Record<string, unknown>
  const change = data.estimatedChangePercent
  if (typeof change !== 'number' || !Number.isFinite(change) || change < -75 || change > 300)
    throw new Error('Invalid difficulty forecast')
  const remainingBlocks = number(data.remainingBlocks, true, DIFFICULTY_EPOCH_BLOCKS)
  const progressPercent = number(data.progressPercent, false, 100)
  const nextRetargetHeight = number(data.nextRetargetHeight)
  if (
    remainingBlocks < 1 ||
    nextRetargetHeight < DIFFICULTY_EPOCH_BLOCKS ||
    nextRetargetHeight % DIFFICULTY_EPOCH_BLOCKS !== 0 ||
    Math.abs(
      progressPercent -
        ((DIFFICULTY_EPOCH_BLOCKS - remainingBlocks) / DIFFICULTY_EPOCH_BLOCKS) * 100,
    ) > 1e-6
  )
    throw new Error('Invalid difficulty epoch')
  if (typeof data.estimatedRetargetAt !== 'string') throw new Error('Invalid retarget date')
  const timestamp = retargetTimestamp(Date.parse(data.estimatedRetargetAt))
  if (new Date(timestamp).toISOString() !== data.estimatedRetargetAt)
    throw new Error('Invalid retarget ISO UTC')
  return {
    estimatedChangePercent: change,
    remainingBlocks,
    progressPercent,
    nextRetargetHeight,
    estimatedRetargetAt: data.estimatedRetargetAt,
  }
}
