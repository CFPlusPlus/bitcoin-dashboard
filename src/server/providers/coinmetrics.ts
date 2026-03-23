import { z } from "zod";
import type { CachePolicy } from "../cache";
import { readUpstreamJson, requestUpstream } from "../provider-fetch";
import { invalidUpstreamShape, missingUpstreamData } from "../upstream";

const provider = "coinmetrics";

const coinMetricsItemSchema = z.object({
  asset: z.string(),
  time: z.string(),
  AdrActCnt: z.string().optional(),
  AdrBalCnt: z.string().optional(),
  FeeTotNtv: z.string().optional(),
  TxCnt: z.string().optional(),
  TxTfrCnt: z.string().optional(),
});

const coinMetricsResponseSchema = z.object({
  data: z.array(coinMetricsItemSchema),
});

export type CoinMetricsAssetMetricsResponse = z.infer<typeof coinMetricsResponseSchema>;

export async function fetchCoinMetricsActivityHistory(cachePolicy?: CachePolicy) {
  const response = await requestUpstream({
    provider,
    resource: "BTC on-chain activity",
    url:
      "https://community-api.coinmetrics.io/v4/timeseries/asset-metrics" +
      "?assets=btc&metrics=AdrActCnt,AdrBalCnt,TxCnt,TxTfrCnt,FeeTotNtv&frequency=1d&limit_per_asset=7",
    accept: "application/json",
    timeoutMs: 8000,
    cachePolicy,
  });

  const payload = await readUpstreamJson(
    response,
    provider,
    "Coin Metrics response returned invalid JSON."
  );

  const parsed = coinMetricsResponseSchema.safeParse(payload);

  if (!parsed.success) {
    throw invalidUpstreamShape(provider, parsed.error);
  }

  if (parsed.data.data.length === 0) {
    throw missingUpstreamData(provider, "Coin Metrics returned no BTC on-chain activity rows.");
  }

  return parsed.data;
}
