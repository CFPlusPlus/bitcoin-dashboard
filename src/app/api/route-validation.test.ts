import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: () => ({
    env: {
      COINGECKO_DEMO_API_KEY: "demo-key",
    },
  }),
}));

describe("route validation handling", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("returns a controlled chart error for malformed upstream data", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ prices: [] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        })
      )
    );

    const { GET } = await import("./chart/route");
    const response = await GET(new Request("https://example.com/api/chart?days=1&currency=usd"));
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body).toMatchObject({
      error: "Fehler beim Laden der Chartdaten von CoinGecko.",
      code: "upstream_missing_data",
      provider: "coingecko",
    });
  });

  it("returns a controlled sentiment error for incomplete upstream data", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            name: "Fear and Greed Index",
            data: [{ value: "71" }],
            metadata: { error: null },
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          }
        )
      )
    );

    const { GET } = await import("./sentiment/route");
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body).toMatchObject({
      error: "Fehler beim Laden des Fear-&-Greed-Index.",
      code: "upstream_missing_data",
      provider: "alternative.me",
    });
  });
});
