import { z } from "zod";
import type { CachePolicy } from "../cache";
import { readUpstreamJson, requestUpstream } from "../provider-fetch";
import { invalidUpstreamShape, missingUpstreamData } from "../upstream";

const provider = "mempool.space";
const finiteNumber = z.number().finite();

const mempoolRecommendedFeesSchema = z.object({
  fastestFee: finiteNumber.optional(),
  halfHourFee: finiteNumber.optional(),
  hourFee: finiteNumber.optional(),
  economyFee: finiteNumber.optional(),
  minimumFee: finiteNumber.optional(),
});

export type MempoolRecommendedFees = z.infer<typeof mempoolRecommendedFeesSchema>;

function ensureRecommendedFeesComplete(fees: MempoolRecommendedFees) {
  const requiredFields = [
    "fastestFee",
    "halfHourFee",
    "hourFee",
    "economyFee",
    "minimumFee",
  ] as const;

  const missingFields = requiredFields.filter((field) => fees[field] == null);

  if (missingFields.length > 0) {
    throw missingUpstreamData(
      provider,
      `mempool.space fee response missing required fields: ${missingFields.join(", ")}.`
    );
  }
}

export async function fetchRecommendedFees(cachePolicy?: CachePolicy) {
  const response = await requestUpstream({
    provider,
    resource: "Recommended fees",
    url: "https://mempool.space/api/v1/fees/recommended",
    accept: "application/json",
    timeoutMs: 6000,
    cachePolicy,
  });

  const payload = await readUpstreamJson(
    response,
    provider,
    "mempool.space fee response returned invalid JSON."
  );

  const parsed = mempoolRecommendedFeesSchema.safeParse(payload);

  if (!parsed.success) {
    throw invalidUpstreamShape(provider, parsed.error);
  }

  ensureRecommendedFeesComplete(parsed.data);

  return parsed.data;
}

export async function fetchLatestBlockHeight(cachePolicy?: CachePolicy) {
  const response = await requestUpstream({
    provider,
    resource: "Block height",
    url: "https://mempool.space/api/blocks/tip/height",
    accept: "text/plain",
    timeoutMs: 6000,
    cachePolicy,
  });

  const text = (await response.text()).trim();

  if (!text) {
    throw missingUpstreamData(provider, "mempool.space block height response was empty.");
  }

  const latestBlockHeight = Number(text);

  if (!Number.isInteger(latestBlockHeight) || latestBlockHeight < 0) {
    throw invalidUpstreamShape(provider, "mempool.space block height response was not a valid integer.");
  }

  return latestBlockHeight;
}
