import { getCloudflareContext } from "@opennextjs/cloudflare";

type AppEnv = {
  COINGECKO_DEMO_API_KEY?: string;
};

export function getAppEnv() {
  const { env } = getCloudflareContext();
  return env as AppEnv;
}
