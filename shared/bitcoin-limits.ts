// Generous ceiling for the aggregated [fee rate, vsize] histogram, not a tx list.
export const MAX_HISTOGRAM_ENTRIES = 10_000

// Conservative sat/vB ceiling: even one vbyte cannot cost more than the entire
// Bitcoin supply in satoshis. Fractional rates (including sub-sat/vB) stay valid.
export const MAX_FEE_RATE = 21_000_000 * 100_000_000
export const MAX_BLOCK_SIZE = 4_000_000
// Seconds; stays within the JavaScript Date range after conversion to ms.
export const MAX_BLOCK_TIMESTAMP = 8_640_000_000_000
