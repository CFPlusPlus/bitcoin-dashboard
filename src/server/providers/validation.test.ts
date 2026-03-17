import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchFearAndGreedIndex } from "./alternative";
import { fetchCoinGeckoMarketChart, fetchCoinGeckoMarketData } from "./coingecko";
import { fetchLatestBlockHeight, fetchRecommendedFees } from "./mempool";

describe("provider validation", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("rejects invalid CoinGecko market item shapes", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify([{ current_price: "67000" }]), {
          status: 200,
          headers: { "content-type": "application/json" },
        })
      )
    );

    await expect(fetchCoinGeckoMarketData("usd", "demo-key")).rejects.toMatchObject({
      code: "upstream_invalid_shape",
      provider: "coingecko",
    });
  });

  it("rejects empty CoinGecko chart responses as missing data", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ prices: [] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        })
      )
    );

    await expect(
      fetchCoinGeckoMarketChart({ apiKey: "demo-key", currency: "usd", days: 1 })
    ).rejects.toMatchObject({
      code: "upstream_missing_data",
      provider: "coingecko",
    });
  });

  it("rejects incomplete mempool recommended fees", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            fastestFee: 12,
            halfHourFee: 10,
            hourFee: 8,
            economyFee: 4,
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          }
        )
      )
    );

    await expect(fetchRecommendedFees()).rejects.toMatchObject({
      code: "upstream_missing_data",
      provider: "mempool.space",
    });
  });

  it("rejects invalid mempool block heights", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("not-a-number", {
          status: 200,
          headers: { "content-type": "text/plain" },
        })
      )
    );

    await expect(fetchLatestBlockHeight()).rejects.toMatchObject({
      code: "upstream_invalid_shape",
      provider: "mempool.space",
    });
  });

  it("maps Alternative.me metadata errors to controlled fetch failures", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            name: "Fear and Greed Index",
            data: [],
            metadata: { error: "Provider overloaded" },
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          }
        )
      )
    );

    await expect(fetchFearAndGreedIndex()).rejects.toMatchObject({
      code: "upstream_fetch_failed",
      provider: "alternative.me",
    });
  });

  it("rejects incomplete Alternative.me payloads", async () => {
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

    await expect(fetchFearAndGreedIndex()).rejects.toMatchObject({
      code: "upstream_missing_data",
      provider: "alternative.me",
    });
  });
});
