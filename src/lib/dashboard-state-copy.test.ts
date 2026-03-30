import { describe, expect, it } from "vitest";
import {
  getDashboardSectionStateMessages,
  getUnavailableText,
  sanitizeDashboardErrorMessage,
} from "./dashboard-state-copy";

describe("dashboard-state-copy", () => {
  it("returns calm fallback text for unavailable values", () => {
    expect(getUnavailableText()).toBe("Nicht verfügbar");
  });

  it("replaces technical provider errors with calmer dashboard copy", () => {
    expect(
      sanitizeDashboardErrorMessage(
        "Fehler beim Laden der Chartdaten von CoinGecko. market_chart request failed: 502 Provider overloaded",
        "Es konnten noch keine verlässlichen Chartdaten geladen werden."
      )
    ).toBe("Es konnten noch keine verlässlichen Chartdaten geladen werden.");
  });

  it("keeps friendly non-technical error messages", () => {
    expect(
      sanitizeDashboardErrorMessage(
        "Der Datendienst meldet vorübergehend keine neuen Werte.",
        "Fallback"
      )
    ).toBe("Der Datendienst meldet vorübergehend keine neuen Werte.");
  });

  it("replaces technical runtime errors with calmer fallback copy", () => {
    expect(
      sanitizeDashboardErrorMessage(
        "TypeError: fetch failed at loadOverviewData (https://example.com/app.js:12:5)",
        "Es konnten noch keine verlässlichen Marktdaten geladen werden."
      )
    ).toBe("Es konnten noch keine verlässlichen Marktdaten geladen werden.");
  });

  it("builds consistent messages for dashboard sections", () => {
    expect(
      getDashboardSectionStateMessages("overview", "CoinGecko timeout").error.description
    ).toBe("Der Datendienst antwortet im Moment zu langsam. Bitte gleich erneut laden.");
  });
});
