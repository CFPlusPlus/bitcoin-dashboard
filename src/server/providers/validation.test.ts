import { afterEach, describe, expect, it, vi } from "vitest";
import { networkCachePolicy, overviewCachePolicy, sentimentCachePolicy } from "../cache";
import { fetchFearAndGreedIndex } from "./alternative";
import {
  fetchCoinGeckoGlobalData,
  fetchCoinGeckoMarketChart,
  fetchCoinGeckoMarketData,
} from "./coingecko";
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

  it("serves fresh CoinGecko market data from KV without calling upstream", async () => {
    const nowEpochSeconds = Math.floor(Date.now() / 1000);
    const fetchMock = vi.fn();
    const kv = {
      get: vi.fn().mockResolvedValue({
        storedAtEpochSeconds: nowEpochSeconds - 60,
        payload: {
          current_price: 67000,
          market_cap: 1,
          total_volume: 1,
          high_24h: 1,
          low_24h: 1,
          price_change_percentage_24h: 1,
          last_updated: "2026-03-17T00:00:00.000Z",
        },
      }),
      put: vi.fn(),
    };

    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchCoinGeckoMarketData("usd", "demo-key", overviewCachePolicy, kv);

    expect(result.cache.source).toBe("kv");
    expect(result.data.current_price).toBe(67000);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns stale CoinGecko chart data from KV when upstream fails", async () => {
    const nowEpochSeconds = Math.floor(Date.now() / 1000);
    const kv = {
      get: vi.fn().mockResolvedValue({
        storedAtEpochSeconds: nowEpochSeconds - 1800,
        payload: {
          prices: [[1, 67000]],
          market_caps: [[1, 1200000000000]],
          total_volumes: [[1, 20000000000]],
        },
      }),
      put: vi.fn(),
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("CoinGecko temporarily unavailable"))
    );

    const result = await fetchCoinGeckoMarketChart({
      apiKey: "demo-key",
      cachePolicy: overviewCachePolicy,
      currency: "usd",
      days: 1,
      kv,
    });

    expect(result.cache.source).toBe("stale");
    expect(result.data.prices.length).toBe(1);
  });

  it("writes fresh CoinGecko global data back to KV", async () => {
    const kv = {
      get: vi.fn().mockResolvedValue(null),
      put: vi.fn().mockResolvedValue(undefined),
    };
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

    const result = await fetchCoinGeckoGlobalData("demo-key", overviewCachePolicy, kv);

    expect(result.cache.source).toBe("api");
    expect(kv.put).toHaveBeenCalledTimes(1);
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

    await fetchFearAndGreedIndex(1, sentimentCachePolicy);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        cache: "force-cache",
        next: { revalidate: sentimentCachePolicy.revalidateSeconds },
      })
    );
  });
});
