import { describe, expect, it } from "vitest";
import {
  getDashboardSectionStateMessages,
  getUnavailableText,
  normalizeDashboardWarningMessage,
  sanitizeDashboardErrorMessage,
} from "./dashboard-state-copy";

describe("dashboard-state-copy", () => {
  it("returns calm fallback text for unavailable values", () => {
    expect(getUnavailableText()).toBe("Nicht verfuegbar");
  });

  it("replaces technical provider errors with calmer dashboard copy", () => {
    expect(
      sanitizeDashboardErrorMessage(
        "Fehler beim Laden der Chartdaten von CoinGecko. market_chart request failed: 502 Provider overloaded",
        "Es konnten noch keine verlaesslichen Chartdaten geladen werden."
      )
    ).toBe("Es konnten noch keine verlaesslichen Chartdaten geladen werden.");
  });

  it("keeps friendly non-technical error messages", () => {
    expect(
      sanitizeDashboardErrorMessage(
        "Der Datendienst meldet voruebergehend keine neuen Werte.",
        "Fallback"
      )
    ).toBe("Der Datendienst meldet voruebergehend keine neuen Werte.");
  });

  it("normalizes provider warnings into user-facing microcopy", () => {
    expect(
      normalizeDashboardWarningMessage(
        "Fee-Daten nicht verfuegbar: fees request failed: 502 Provider overloaded"
      )
    ).toBe(
      "Fee-Schaetzungen werden gerade nicht vollstaendig erneuert. Vorhandene Werte bleiben sichtbar."
    );
  });

  it("builds consistent messages for dashboard sections", () => {
    expect(
      getDashboardSectionStateMessages("overview", "CoinGecko timeout").error.description
    ).toBe("Der Datendienst antwortet im Moment zu langsam. Bitte gleich erneut laden.");
  });
});
