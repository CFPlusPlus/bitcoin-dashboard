import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getCacheControlHeader,
  getChartCachePolicy,
  networkCachePolicy,
  overviewCachePolicy,
  performanceCachePolicy,
  sentimentCachePolicy,
} from "../../server/cache";

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

  it("sets the overview cache header explicitly", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify([
              {
                current_price: 67000,
                market_cap: 1,
                total_volume: 1,
                high_24h: 1,
                low_24h: 1,
                price_change_percentage_24h: 1,
                last_updated: "2026-03-17T00:00:00.000Z",
              },
            ]),
            {
              status: 200,
              headers: { "content-type": "application/json" },
            }
          )
        )
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify([
              {
                current_price: 62000,
                market_cap: 1,
                total_volume: 1,
                high_24h: 1,
                low_24h: 1,
                price_change_percentage_24h: 1,
                last_updated: "2026-03-17T00:00:00.000Z",
              },
            ]),
            {
              status: 200,
              headers: { "content-type": "application/json" },
            }
          )
        )
    );

    const { GET } = await import("./overview/route");
    const response = await GET();

    expect(response.headers.get("cache-control")).toBe(getCacheControlHeader(overviewCachePolicy));
  });

  it("sets a range-aware chart cache header explicitly", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ prices: [[1, 67000]] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        })
      )
    );

    const { GET } = await import("./chart/route");
    const response = await GET(new Request("https://example.com/api/chart?days=30&currency=usd"));

    expect(response.headers.get("cache-control")).toBe(
      getCacheControlHeader(getChartCachePolicy(30))
    );
  });

  it("returns a controlled performance error for malformed upstream data", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ prices: [] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        })
      )
    );

    const { GET } = await import("./performance/route");
    const response = await GET(new Request("https://example.com/api/performance?currency=usd"));
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body).toMatchObject({
      error: "Fehler beim Laden der Performance-Daten von CoinGecko.",
      code: "upstream_missing_data",
      provider: "coingecko",
    });
  });

  it("sets the performance cache header explicitly", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ prices: [[1, 67000], [2, 68000]] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        })
      )
    );

    const { GET } = await import("./performance/route");
    const response = await GET(new Request("https://example.com/api/performance?currency=usd"));

    expect(response.headers.get("cache-control")).toBe(
      getCacheControlHeader(performanceCachePolicy)
    );
  });

  it("sets the network cache header explicitly", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              fastestFee: 12,
              halfHourFee: 10,
              hourFee: 8,
              economyFee: 4,
              minimumFee: 2,
            }),
            {
              status: 200,
              headers: { "content-type": "application/json" },
            }
          )
        )
        .mockResolvedValueOnce(
          new Response("890000", {
            status: 200,
            headers: { "content-type": "text/plain" },
          })
        )
    );

    const { GET } = await import("./network/route");
    const response = await GET();

    expect(response.headers.get("cache-control")).toBe(getCacheControlHeader(networkCachePolicy));
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

  it("sets the sentiment cache header explicitly", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            name: "Fear and Greed Index",
            data: [{ value: "71", timestamp: "1710000000", time_until_update: "3600" }],
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

    expect(response.headers.get("cache-control")).toBe(getCacheControlHeader(sentimentCachePolicy));
  });
});
