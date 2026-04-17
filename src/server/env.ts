import { getCloudflareContext } from "@opennextjs/cloudflare";

type KvGetOptions = {
  type?: "text" | "json";
};

type KvPutOptions = {
  expirationTtl?: number;
};

export type KvNamespaceBinding = {
  get(key: string, options?: KvGetOptions): Promise<unknown>;
  put(key: string, value: string, options?: KvPutOptions): Promise<void>;
};

type AppEnv = {
  COINGECKO_DEMO_API_KEY?: string;
  BITCOIN_DASHBOARD_CACHE?: KvNamespaceBinding;
};

function getCloudflareEnv(): AppEnv | null {
  try {
    const { env } = getCloudflareContext();
    return env as AppEnv;
  } catch {
    return null;
  }
}

export function getAppEnv() {
  const cloudflareEnv = getCloudflareEnv();

  return {
    COINGECKO_DEMO_API_KEY:
      cloudflareEnv?.COINGECKO_DEMO_API_KEY ?? process.env.COINGECKO_DEMO_API_KEY,
    BITCOIN_DASHBOARD_CACHE: cloudflareEnv?.BITCOIN_DASHBOARD_CACHE,
  };
}
