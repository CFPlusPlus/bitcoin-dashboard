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

const mempoolHashratePointSchema = z.object({
  timestamp: z.number().int().nonnegative(),
  avgHashrate: finiteNumber,
});

const mempoolHashrateDifficultyPointSchema = z.object({
  time: z.number().int().nonnegative(),
  height: z.number().int().nonnegative(),
  difficulty: finiteNumber,
  adjustment: finiteNumber,
});

const mempoolHashrateSchema = z.object({
  hashrates: z.array(mempoolHashratePointSchema),
  difficulty: z.array(mempoolHashrateDifficultyPointSchema).optional(),
  currentHashrate: finiteNumber,
  currentDifficulty: finiteNumber.optional(),
});

const mempoolDifficultyAdjustmentSchema = z.object({
  progressPercent: finiteNumber,
  difficultyChange: finiteNumber,
  estimatedRetargetDate: z.number().int().nonnegative(),
  remainingBlocks: z.number().int().nonnegative(),
  nextRetargetHeight: z.number().int().nonnegative(),
});

const mempoolBlockSchema = z.object({
  blockVSize: finiteNumber.optional(),
  nTx: finiteNumber.optional(),
  medianFee: finiteNumber.optional(),
  feeRange: z.array(finiteNumber).optional(),
});

export type MempoolRecommendedFees = z.infer<typeof mempoolRecommendedFeesSchema>;
export type MempoolHashrate = z.infer<typeof mempoolHashrateSchema>;
export type MempoolDifficultyAdjustment = z.infer<typeof mempoolDifficultyAdjustmentSchema>;
export type MempoolBlock = z.infer<typeof mempoolBlockSchema>;

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

export async function fetchHashrateHistory(cachePolicy?: CachePolicy) {
  const response = await requestUpstream({
    provider,
    resource: "Mining hashrate",
    url: "https://mempool.space/api/v1/mining/hashrate/1m",
    accept: "application/json",
    timeoutMs: 6000,
    cachePolicy,
  });

  const payload = await readUpstreamJson(
    response,
    provider,
    "mempool.space hashrate response returned invalid JSON."
  );

  const parsed = mempoolHashrateSchema.safeParse(payload);

  if (!parsed.success) {
    throw invalidUpstreamShape(provider, parsed.error);
  }

  if (parsed.data.hashrates.length === 0) {
    throw missingUpstreamData(provider, "mempool.space hashrate response was empty.");
  }

  return parsed.data;
}

export async function fetchDifficultyAdjustment(cachePolicy?: CachePolicy) {
  const response = await requestUpstream({
    provider,
    resource: "Difficulty adjustment",
    url: "https://mempool.space/api/v1/difficulty-adjustment",
    accept: "application/json",
    timeoutMs: 6000,
    cachePolicy,
  });

  const payload = await readUpstreamJson(
    response,
    provider,
    "mempool.space difficulty adjustment response returned invalid JSON."
  );

  const parsed = mempoolDifficultyAdjustmentSchema.safeParse(payload);

  if (!parsed.success) {
    throw invalidUpstreamShape(provider, parsed.error);
  }

  return parsed.data;
}

export async function fetchMempoolBlocks(cachePolicy?: CachePolicy) {
  const response = await requestUpstream({
    provider,
    resource: "Mempool blocks",
    url: "https://mempool.space/api/v1/fees/mempool-blocks",
    accept: "application/json",
    timeoutMs: 6000,
    cachePolicy,
  });

  const payload = await readUpstreamJson(
    response,
    provider,
    "mempool.space mempool blocks response returned invalid JSON."
  );

  const parsed = z.array(mempoolBlockSchema).safeParse(payload);

  if (!parsed.success) {
    throw invalidUpstreamShape(provider, parsed.error);
  }

  if (parsed.data.length === 0) {
    throw missingUpstreamData(provider, "mempool.space mempool blocks response was empty.");
  }

  return parsed.data;
}
