import { z } from "zod";
import type { CachePolicy } from "../cache";
import { getNextFetchCacheOptions } from "../cache";
import { fetchWithTimeout, readErrorBody } from "../http";
import {
  invalidUpstreamShape,
  missingUpstreamData,
  upstreamFetchFailed,
} from "../upstream";

const provider = "mempool.space";
const finiteNumber = z.number().finite();

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

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
  let response: Response;

  try {
    response = await fetchWithTimeout(
      "https://mempool.space/api/v1/fees/recommended",
      {
        ...(cachePolicy ? getNextFetchCacheOptions(cachePolicy) : {}),
        headers: { accept: "application/json" },
      },
      6000
    );
  } catch (error) {
    throw upstreamFetchFailed(provider, `Recommended fees request failed: ${getErrorMessage(error)}`, {
      cause: error,
    });
  }

  if (!response.ok) {
    const details = await readErrorBody(response);
    throw upstreamFetchFailed(provider, `Recommended fees request failed: ${response.status} ${details}`.trim(), {
      upstreamStatus: response.status,
    });
  }

  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    throw invalidUpstreamShape(provider, "mempool.space fee response returned invalid JSON.");
  }

  const parsed = mempoolRecommendedFeesSchema.safeParse(payload);

  if (!parsed.success) {
    throw invalidUpstreamShape(provider, parsed.error);
  }

  ensureRecommendedFeesComplete(parsed.data);

  return parsed.data;
}

export async function fetchLatestBlockHeight(cachePolicy?: CachePolicy) {
  let response: Response;

  try {
    response = await fetchWithTimeout(
      "https://mempool.space/api/blocks/tip/height",
      {
        ...(cachePolicy ? getNextFetchCacheOptions(cachePolicy) : {}),
        headers: { accept: "text/plain" },
      },
      6000
    );
  } catch (error) {
    throw upstreamFetchFailed(provider, `Block height request failed: ${getErrorMessage(error)}`, {
      cause: error,
    });
  }

  if (!response.ok) {
    const details = await readErrorBody(response);
    throw upstreamFetchFailed(provider, `Block height request failed: ${response.status} ${details}`.trim(), {
      upstreamStatus: response.status,
    });
  }

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
