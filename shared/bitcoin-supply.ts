// Mainnet subsidy schedule. Monetary arithmetic stays in integer satoshis.
export const SATOSHIS_PER_BTC = 100_000_000n
export const INITIAL_SUBSIDY_SATS = 50n * SATOSHIS_PER_BTC
export const HALVING_INTERVAL = 210_000
export const MAX_BLOCK_HEIGHT = 2_147_483_647
export const MODEL_BLOCKS_PER_DAY = 144
export const MODEL_YEAR_DAYS = 365
export const MODEL_YEAR_BLOCKS = MODEL_BLOCKS_PER_DAY * MODEL_YEAR_DAYS

function validHeight(height: number) {
  if (!Number.isSafeInteger(height) || height < 0 || height > MAX_BLOCK_HEIGHT)
    throw new Error('Invalid block height')
}

function subsidyForCycle(cycle: number): bigint {
  // Match Bitcoin Core's guard before shifting; satoshi truncation reaches zero at 33.
  return cycle >= 64 ? 0n : INITIAL_SUBSIDY_SATS >> BigInt(cycle)
}

export function blockSubsidySats(height: number): bigint {
  validHeight(height)
  return subsidyForCycle(Math.floor(height / HALVING_INTERVAL))
}

// Inclusive height: blocks 0..height. Genesis contributes 50 BTC to this schedule
// total, but its coinbase is unspendable and is never claimed to be circulating.
function scheduledSatsThrough(height: number): bigint {
  let blocks = BigInt(height) + 1n
  let total = 0n
  for (let cycle = 0; cycle < 64 && blocks > 0n; cycle++) {
    const subsidy = subsidyForCycle(cycle)
    if (subsidy === 0n) break
    const count = blocks < BigInt(HALVING_INTERVAL) ? blocks : BigInt(HALVING_INTERVAL)
    total += count * subsidy
    blocks -= count
  }
  return total
}

export function issuedSupplySats(height: number): bigint {
  validHeight(height)
  return scheduledSatsThrough(height)
}

// Exact theoretical schedule maximum, including genesis; 21 million is rounded.
export const MAX_SUBSIDY_SUPPLY_SATS = scheduledSatsThrough(64 * HALVING_INTERVAL - 1)

export function halvingAt(height: number) {
  validHeight(height)
  const cycle = Math.floor(height / HALVING_INTERVAL)
  const completed = height % HALVING_INTERVAL
  return {
    height,
    cycle, // Zero-based number of completed halvings.
    lastHeight: cycle === 0 ? null : cycle * HALVING_INTERVAL,
    nextHeight: (cycle + 1) * HALVING_INTERVAL,
    remaining: HALVING_INTERVAL - completed,
    progressPercent: (completed / HALVING_INTERVAL) * 100,
    // Keep the overview's public contract; each subsidy fits exactly in a number.
    subsidySats: Number(subsidyForCycle(cycle)),
    nextSubsidySats: Number(subsidyForCycle(cycle + 1)),
  }
}

export function bitcoinSupplyAt(height: number) {
  const halving = halvingAt(height)
  const issuedSats = issuedSupplySats(height)
  // The next 52,560 blocks are height+1..height+52,560, across all affected
  // subsidy intervals. The current tip's reward is already included in issuedSats.
  const annualIssuanceSats = scheduledSatsThrough(height + MODEL_YEAR_BLOCKS) - issuedSats
  return {
    ...halving,
    issuedSats,
    remainingSats: MAX_SUBSIDY_SUPPLY_SATS - issuedSats,
    annualIssuanceSats,
    // Convert only final ratios to floating point for presentation.
    issuedPercent: (Number(issuedSats) / Number(MAX_SUBSIDY_SUPPLY_SATS)) * 100,
    annualInflationPercent: (Number(annualIssuanceSats) / Number(issuedSats)) * 100,
  }
}

// All schedule totals are below 2^53 satoshis; convert only at the UI boundary.
export function satsToBtc(sats: bigint): number {
  return Number(sats) / Number(SATOSHIS_PER_BTC)
}
