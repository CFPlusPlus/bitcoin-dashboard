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

export function difficulty(value: unknown): number {
  // Non-integer positive ratio. A 256-bit target cannot imply a ratio above 2^256.
  const result = number(value, false, 2 ** 256)
  if (result < 1) throw new Error('Invalid mainnet difficulty')
  return result
}
