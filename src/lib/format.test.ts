import { describe, expect, it } from "vitest";
import { getUnavailableText } from "./dashboard-state-copy";
import { formatCompactCurrencyValue, formatCurrencyValue } from "./format";

describe("format value helpers", () => {
  it("formats fiat values without repeating the currency symbol", () => {
    expect(formatCurrencyValue(60828, "eur", "de")).toBe("60.828");
    expect(formatCurrencyValue(60828, "usd", "de")).toBe("60,828");
  });

  it("keeps compact locale-specific number formatting without appending the symbol", () => {
    expect(formatCompactCurrencyValue(24600000000, "eur", "de")).toBe("24,6\u00A0Mrd.");
    expect(formatCompactCurrencyValue(24600000000, "usd", "de")).toBe("24.6B");
  });

  it("falls back to the shared unavailable copy for missing values", () => {
    expect(formatCurrencyValue(null, "eur", "de")).toBe(getUnavailableText("de"));
    expect(formatCompactCurrencyValue(null, "eur", "de")).toBe(getUnavailableText("de"));
  });
});
