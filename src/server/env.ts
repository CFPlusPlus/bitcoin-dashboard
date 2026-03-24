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

export function getAppEnv() {
  const { env } = getCloudflareContext();
  return env as AppEnv;
}
