import type {
  DcaEntry,
  DcaEntrySnapshot,
  DcaSummary,
} from "../types/dashboard";

function isFiniteNumber(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function calculateBitcoinAmount(amountInvested: number, bitcoinPrice: number) {
  if (!isFiniteNumber(amountInvested) || !isFiniteNumber(bitcoinPrice) || bitcoinPrice <= 0) {
    return 0;
  }

  return amountInvested / bitcoinPrice;
}

export function buildDcaEntries(entries: DcaEntry[]): DcaEntrySnapshot[] {
  return entries.map((entry) => ({
    ...entry,
    bitcoinAmount: calculateBitcoinAmount(entry.amountInvested, entry.bitcoinPrice),
  }));
}

export function buildDcaSummary(
  entries: DcaEntrySnapshot[],
  currentPrice: number | null
): DcaSummary {
  const totalEntries = entries.length;
  const totalInvested = entries.reduce((sum, entry) => sum + entry.amountInvested, 0);
  const totalBitcoin = entries.reduce((sum, entry) => sum + entry.bitcoinAmount, 0);
  const averageBuyPrice = totalBitcoin > 0 ? totalInvested / totalBitcoin : null;
  const currentValue =
    isFiniteNumber(currentPrice) && totalBitcoin > 0 ? totalBitcoin * currentPrice : null;
  const pnlAbsolute = currentValue === null ? null : currentValue - totalInvested;
  const pnlPercent =
    pnlAbsolute === null || totalInvested <= 0 ? null : (pnlAbsolute / totalInvested) * 100;

  return {
    totalEntries,
    totalInvested,
    totalBitcoin,
    averageBuyPrice,
    currentPrice,
    currentValue,
    pnlAbsolute,
    pnlPercent,
  };
}

export function buildDcaView(entries: DcaEntry[], currentPrice: number | null) {
  const items = buildDcaEntries(entries);

  return {
    items,
    summary: buildDcaSummary(items, currentPrice),
  };
}
