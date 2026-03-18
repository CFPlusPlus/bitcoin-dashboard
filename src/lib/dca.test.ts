import { describe, expect, it } from "vitest";
import {
  addDcaEntry,
  buildDcaEntries,
  buildDcaSummary,
  buildDcaView,
  calculateBitcoinAmount,
  clearDcaEntries,
  createDcaEntry,
  createDcaEntryId,
  EMPTY_DCA_ENTRY_STORE,
  getCurrentPrice,
  getDcaTone,
  getDefaultDcaDate,
  normalizeDcaEntryStore,
  removeDcaEntry,
  validateDcaFormInput,
} from "./dca";
import type { DcaEntry, DcaEntryStore, Overview } from "../types/dashboard";

const entries: DcaEntry[] = [
  {
    amountInvested: 200,
    bitcoinPrice: 40000,
    date: "2026-03-01",
    id: "1",
    note: "Rate 1",
  },
  {
    amountInvested: 300,
    bitcoinPrice: 50000,
    date: "2026-03-15",
    id: "2",
    note: "Rate 2",
  },
];

describe("dca helpers", () => {
  it("calculates bitcoin amount for a purchase", () => {
    expect(calculateBitcoinAmount(250, 50000)).toBeCloseTo(0.005);
  });

  it("returns zero bitcoin amount for invalid calculation inputs", () => {
    expect(calculateBitcoinAmount(0, 50000)).toBe(0);
    expect(calculateBitcoinAmount(100, 0)).toBe(0);
    expect(calculateBitcoinAmount(Number.NaN, 50000)).toBe(0);
  });

  it("builds snapshots with accumulated bitcoin amounts", () => {
    const snapshots = buildDcaEntries(entries);

    expect(snapshots).toHaveLength(2);
    expect(snapshots[0].bitcoinAmount).toBeCloseTo(0.005);
    expect(snapshots[1].bitcoinAmount).toBeCloseTo(0.006);
  });

  it("filters malformed entries when building the view", () => {
    const snapshots = buildDcaEntries([
      ...entries,
      {
        amountInvested: -10,
        bitcoinPrice: 50000,
        date: "2026-03-20",
        id: "bad",
        note: "Ignored",
      },
    ]);

    expect(snapshots).toHaveLength(2);
    expect(snapshots.map((entry) => entry.id)).toEqual(["1", "2"]);
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

  it("treats non-positive market prices as unavailable", () => {
    const summary = buildDcaSummary(buildDcaEntries(entries), 0);

    expect(summary.currentPrice).toBeNull();
    expect(summary.currentValue).toBeNull();
    expect(summary.pnlAbsolute).toBeNull();
  });
});

describe("dca validation and persistence helpers", () => {
  it("accepts valid form input and normalizes decimal commas and note spacing", () => {
    const result = validateDcaFormInput({
      amountInvested: " 250,50 ",
      bitcoinPrice: "50000,25",
      date: "2026-03-17",
      note: " Monatsrate ",
    });

    expect(result).toEqual({
      success: true,
      value: {
        amountInvested: 250.5,
        bitcoinPrice: 50000.25,
        date: "2026-03-17",
        note: "Monatsrate",
      },
    });
  });

  it("rejects empty and invalid boundary inputs explicitly", () => {
    expect(
      validateDcaFormInput({
        amountInvested: "",
        bitcoinPrice: "50000",
        date: "2026-03-17",
        note: "",
      })
    ).toEqual({
      error: "Bitte gib ein, wie viel du investiert hast.",
      field: "amountInvested",
      success: false,
    });

    expect(
      validateDcaFormInput({
        amountInvested: "50",
        bitcoinPrice: "0",
        date: "2026-03-17",
        note: "",
      })
    ).toEqual({
      error: "Der BTC-Preis muss groesser als 0 sein.",
      field: "bitcoinPrice",
      success: false,
    });

    expect(
      validateDcaFormInput({
        amountInvested: "50",
        bitcoinPrice: "50000",
        date: "2026-02-31",
        note: "",
      })
    ).toEqual({
      error: "Bitte gib ein gueltiges Kaufdatum an.",
      field: "date",
      success: false,
    });
  });

  it("rejects future dates explicitly", () => {
    expect(
      validateDcaFormInput({
        amountInvested: "50",
        bitcoinPrice: "50000",
        date: "2999-03-17",
        note: "",
      })
    ).toEqual({
      error: "Das Kaufdatum darf nicht in der Zukunft liegen.",
      field: "date",
      success: false,
    });
  });

  it("creates entries with injected ids after validation", () => {
    const result = createDcaEntry(
      {
        amountInvested: "100",
        bitcoinPrice: "40000",
        date: "2026-03-17",
        note: "Test",
      },
      "entry-1"
    );

    expect(result).toEqual({
      success: true,
      value: {
        amountInvested: 100,
        bitcoinPrice: 40000,
        date: "2026-03-17",
        id: "entry-1",
        note: "Test",
      },
    });
  });

  it("normalizes persisted stores by preserving valid entries and dropping malformed ones", () => {
    const normalized = normalizeDcaEntryStore({
      eur: [
        {
          amountInvested: 80,
          bitcoinPrice: 40000,
          date: "2026-03-01",
          id: "eur-1",
          note: "  Sparplan ",
        },
      ],
      usd: [
        {
          amountInvested: 100,
          bitcoinPrice: 50000,
          date: "2026-03-02",
          id: "usd-1",
          note: " Valid ",
        },
        {
          amountInvested: 0,
          bitcoinPrice: 50000,
          date: "2026-03-03",
          id: "usd-2",
          note: "Broken",
        },
      ],
    });

    expect(normalized).toEqual({
      eur: [
        {
          amountInvested: 80,
          bitcoinPrice: 40000,
          date: "2026-03-01",
          id: "eur-1",
          note: "Sparplan",
        },
      ],
      usd: [
        {
          amountInvested: 100,
          bitcoinPrice: 50000,
          date: "2026-03-02",
          id: "usd-1",
          note: "Valid",
        },
      ],
    });
  });

  it("falls back to the initial store when persisted data is unusable", () => {
    const initialStore: DcaEntryStore = {
      eur: [{ ...entries[0], id: "fallback-eur" }],
      usd: [{ ...entries[1], id: "fallback-usd" }],
    };

    expect(normalizeDcaEntryStore("bad-data", initialStore)).toBe(initialStore);
  });

  it("supports adding, removing, and clearing entries by currency without touching the other side", () => {
    const store = addDcaEntry(EMPTY_DCA_ENTRY_STORE, "usd", {
      amountInvested: 150,
      bitcoinPrice: 45000,
      date: "2026-03-17",
      id: "usd-1",
      note: "  First buy  ",
    });

    const withEur: DcaEntryStore = {
      ...store,
      eur: [
        {
          amountInvested: 90,
          bitcoinPrice: 41000,
          date: "2026-03-16",
          id: "eur-1",
          note: "EUR buy",
        },
      ],
    };

    expect(withEur.usd[0].note).toBe("First buy");

    const removed = removeDcaEntry(withEur, "usd", "usd-1");
    expect(removed.usd).toEqual([]);
    expect(removed.eur).toHaveLength(1);

    const cleared = clearDcaEntries(withEur, "eur");
    expect(cleared.eur).toEqual([]);
    expect(cleared.usd).toHaveLength(1);
  });
});

describe("dca view helpers", () => {
  it("returns a deterministic entry id when time and random are injected", () => {
    expect(createDcaEntryId(12345, 0.5)).toBe("12345-i");
  });

  it("returns the current market price for the selected currency only when valid", () => {
    const overview: Overview = {
      fetchedAt: "2026-03-17T12:00:00.000Z",
      marketCapUsd: 1,
      priceEur: 45000,
      priceUsd: 50000,
      volume24hUsd: 1,
      warnings: [],
    };

    expect(getCurrentPrice(overview, "usd")).toBe(50000);
    expect(getCurrentPrice({ ...overview, priceEur: 0 }, "eur")).toBeNull();
  });

  it("derives UI-friendly defaults for date and pnl tone", () => {
    expect(getDefaultDcaDate(new Date("2026-03-17T10:00:00.000Z"))).toBe("2026-03-17");
    expect(getDcaTone(12)).toBe("positive");
    expect(getDcaTone(-1)).toBe("negative");
    expect(getDcaTone(0)).toBe("default");
  });
});
