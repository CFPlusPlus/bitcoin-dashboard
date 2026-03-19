import { mapNetworkDto } from "../../../domain/dashboard/network.mapper";
import { getCacheControlHeader, networkCachePolicy } from "../../../server/cache";
import { errorResponse, getReasonMessage, jsonResponse } from "../../../server/http";
import {
  fetchDifficultyAdjustment,
  fetchHashrateHistory,
  fetchLatestBlockHeight,
  fetchMempoolBlocks,
  fetchRecentBlocks,
  fetchRecommendedFees,
} from "../../../server/providers/mempool";
import { isUpstreamError } from "../../../server/upstream";

function getRejectedReason<T>(result: PromiseSettledResult<T>) {
  return result.status === "rejected" ? result.reason : null;
}

export async function GET() {
  const [
    feesResult,
    blockHeightResult,
    hashrateResult,
    difficultyResult,
    mempoolBlocksResult,
    recentBlocksResult,
  ] = await Promise.allSettled([
    fetchRecommendedFees(networkCachePolicy),
    fetchLatestBlockHeight(networkCachePolicy),
    fetchHashrateHistory(networkCachePolicy),
    fetchDifficultyAdjustment(networkCachePolicy),
    fetchMempoolBlocks(networkCachePolicy),
    fetchRecentBlocks(networkCachePolicy),
  ]);

  const warnings: string[] = [];

  if (feesResult.status === "rejected") {
    warnings.push(getReasonMessage("Fee-Daten nicht verfügbar", feesResult.reason));
  }

  if (blockHeightResult.status === "rejected") {
    warnings.push(getReasonMessage("Blockhöhe nicht verfügbar", blockHeightResult.reason));
  }

  if (hashrateResult.status === "rejected") {
    warnings.push(getReasonMessage("Hashrate nicht verfügbar", hashrateResult.reason));
  }

  if (difficultyResult.status === "rejected") {
    warnings.push(
      getReasonMessage("Difficulty-Anpassung nicht verfügbar", difficultyResult.reason)
    );
  }

  if (mempoolBlocksResult.status === "rejected") {
    warnings.push(getReasonMessage("Mempool-Blöcke nicht verfügbar", mempoolBlocksResult.reason));
  }

  if (recentBlocksResult.status === "rejected") {
    warnings.push(getReasonMessage("Letzte Blöcke nicht verfügbar", recentBlocksResult.reason));
  }

  const rejectedResults = [
    feesResult,
    blockHeightResult,
    hashrateResult,
    difficultyResult,
    mempoolBlocksResult,
    recentBlocksResult,
  ].filter((result) => result.status === "rejected");

  if (rejectedResults.length === 6) {
    const errors = [
      getRejectedReason(feesResult),
      getRejectedReason(blockHeightResult),
      getRejectedReason(hashrateResult),
      getRejectedReason(difficultyResult),
      getRejectedReason(mempoolBlocksResult),
      getRejectedReason(recentBlocksResult),
    ].filter(isUpstreamError);

    return errorResponse(502, "Fehler beim Laden der mempool.space-Daten.", warnings.join(" "), {
      ...(errors.length > 0 ? { codes: [...new Set(errors.map((error) => error.code))] } : {}),
      ...(errors.length > 0
        ? { providers: [...new Set(errors.map((error) => error.provider))] }
        : {}),
    });
  }

  const dto = mapNetworkDto({
    fees: feesResult.status === "fulfilled" ? feesResult.value : null,
    latestBlockHeight: blockHeightResult.status === "fulfilled" ? blockHeightResult.value : null,
    hashrate: hashrateResult.status === "fulfilled" ? hashrateResult.value : null,
    difficultyAdjustment:
      difficultyResult.status === "fulfilled" ? difficultyResult.value : null,
    mempoolBlocks: mempoolBlocksResult.status === "fulfilled" ? mempoolBlocksResult.value : null,
    recentBlocks: recentBlocksResult.status === "fulfilled" ? recentBlocksResult.value : null,
    fetchedAt: new Date().toISOString(),
    warnings,
  });

  return jsonResponse(dto, {
    headers: {
      // Network metrics and mempool queues move quickly, so keep this window short.
      "cache-control": getCacheControlHeader(networkCachePolicy),
    },
  });
}
