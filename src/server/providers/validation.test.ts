import { afterEach, describe, expect, it, vi } from "vitest";
import { networkCachePolicy, overviewCachePolicy, sentimentCachePolicy } from "../cache";
import { fetchFearAndGreedIndex } from "./alternative";
import { fetchCoinGeckoGlobalData, fetchCoinGeckoMarketChart, fetchCoinGeckoMarketData } from "./coingecko";
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

  it("passes overview revalidation options to CoinGecko market requests", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
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
    );

    vi.stubGlobal("fetch", fetchMock);

    await fetchCoinGeckoMarketData("usd", "demo-key", overviewCachePolicy);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        cache: "force-cache",
        next: { revalidate: overviewCachePolicy.revalidateSeconds },
      })
    );
  });

  it("passes overview revalidation options to CoinGecko global requests", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: {
            market_cap_percentage: {
              btc: 58.42,
            },
          },
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        }
      )
    );

    vi.stubGlobal("fetch", fetchMock);

    await fetchCoinGeckoGlobalData("demo-key", overviewCachePolicy);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        cache: "force-cache",
        next: { revalidate: overviewCachePolicy.revalidateSeconds },
      })
    );
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

  it("passes revalidation options to CoinGecko chart requests", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ prices: [[1, 67000]] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );

    vi.stubGlobal("fetch", fetchMock);

    await fetchCoinGeckoMarketChart({
      apiKey: "demo-key",
      cachePolicy: overviewCachePolicy,
      currency: "usd",
      days: 1,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        cache: "force-cache",
        next: { revalidate: overviewCachePolicy.revalidateSeconds },
      })
    );
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

  it("passes revalidation options to mempool requests", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
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
    );

    vi.stubGlobal("fetch", fetchMock);

    await fetchRecommendedFees(networkCachePolicy);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        cache: "force-cache",
        next: { revalidate: networkCachePolicy.revalidateSeconds },
      })
    );
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

  it("passes revalidation options to Alternative.me requests", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
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
    );

    vi.stubGlobal("fetch", fetchMock);

    await fetchFearAndGreedIndex(sentimentCachePolicy);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        cache: "force-cache",
        next: { revalidate: sentimentCachePolicy.revalidateSeconds },
      })
    );
  });
});
