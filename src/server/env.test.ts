import { afterEach, describe, expect, it, vi } from "vitest";

describe("getAppEnv", () => {
  const originalApiKey = process.env.COINGECKO_DEMO_API_KEY;

  afterEach(() => {
    vi.resetModules();
    vi.doUnmock("@opennextjs/cloudflare");

    if (originalApiKey === undefined) {
      delete process.env.COINGECKO_DEMO_API_KEY;
    } else {
      process.env.COINGECKO_DEMO_API_KEY = originalApiKey;
    }
  });

  it("returns Cloudflare bindings when the context is available", async () => {
    const kv = {
      get: vi.fn(),
      put: vi.fn(),
    };

    vi.doMock("@opennextjs/cloudflare", () => ({
      getCloudflareContext: () => ({
        env: {
          COINGECKO_DEMO_API_KEY: "cloudflare-key",
          BITCOIN_DASHBOARD_CACHE: kv,
        },
      }),
    }));

    const { getAppEnv } = await import("./env");

    expect(getAppEnv()).toEqual({
      COINGECKO_DEMO_API_KEY: "cloudflare-key",
      BITCOIN_DASHBOARD_CACHE: kv,
    });
  });

  it("falls back to process env when the Cloudflare context is unavailable", async () => {
    process.env.COINGECKO_DEMO_API_KEY = "process-key";

    vi.doMock("@opennextjs/cloudflare", () => ({
      getCloudflareContext: () => {
        throw new Error("not initialized");
      },
    }));

    const { getAppEnv } = await import("./env");

    expect(getAppEnv()).toEqual({
      COINGECKO_DEMO_API_KEY: "process-key",
      BITCOIN_DASHBOARD_CACHE: undefined,
    });
  });

  it("uses the process env key when the Cloudflare context omits it", async () => {
    process.env.COINGECKO_DEMO_API_KEY = "process-key";

    vi.doMock("@opennextjs/cloudflare", () => ({
      getCloudflareContext: () => ({
        env: {
          BITCOIN_DASHBOARD_CACHE: undefined,
        },
      }),
    }));

    const { getAppEnv } = await import("./env");

    expect(getAppEnv()).toEqual({
      COINGECKO_DEMO_API_KEY: "process-key",
      BITCOIN_DASHBOARD_CACHE: undefined,
    });
  });
});
