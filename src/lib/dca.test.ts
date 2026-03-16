import { describe, expect, it } from "vitest";
import { buildDcaEntries, buildDcaView, calculateBitcoinAmount } from "./dca";
import type { DcaEntry } from "../types/dashboard";

const entries: DcaEntry[] = [
  {
    id: "1",
    date: "2026-03-01",
    amountInvested: 200,
    bitcoinPrice: 40000,
    note: "Rate 1",
  },
  {
    id: "2",
    date: "2026-03-15",
    amountInvested: 300,
    bitcoinPrice: 50000,
    note: "Rate 2",
  },
];

describe("dca helpers", () => {
  it("calculates bitcoin amount for a purchase", () => {
    expect(calculateBitcoinAmount(250, 50000)).toBeCloseTo(0.005);
  });

  it("builds snapshots with accumulated bitcoin amounts", () => {
    const snapshots = buildDcaEntries(entries);

    expect(snapshots).toHaveLength(2);
    expect(snapshots[0].bitcoinAmount).toBeCloseTo(0.005);
    expect(snapshots[1].bitcoinAmount).toBeCloseTo(0.006);
  });

  it("builds summary metrics including average buy price and pnl", () => {
    const view = buildDcaView(entries, 55000);

    expect(view.summary.totalEntries).toBe(2);
    expect(view.summary.totalInvested).toBe(500);
    expect(view.summary.totalBitcoin).toBeCloseTo(0.011);
    expect(view.summary.averageBuyPrice).toBeCloseTo(45454.5454, 3);
    expect(view.summary.currentValue).toBeCloseTo(605, 3);
    expect(view.summary.pnlAbsolute).toBeCloseTo(105, 3);
    expect(view.summary.pnlPercent).toBeCloseTo(21, 3);
  });

  it("returns null-sensitive metrics when market price is unavailable", () => {
    const view = buildDcaView(entries, null);

    expect(view.summary.averageBuyPrice).not.toBeNull();
    expect(view.summary.currentValue).toBeNull();
    expect(view.summary.pnlAbsolute).toBeNull();
  });
});
