// Both provider normalization and browser validation use these numeric rules.
export function number(value: unknown, integer = true, maximum = Number.MAX_SAFE_INTEGER): number {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value < 0 ||
    value > maximum ||
    (integer && !Number.isSafeInteger(value))
  )
    throw new Error('Invalid number')
  return value
}
