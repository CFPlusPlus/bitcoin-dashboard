import { mapNetworkDto } from "../../../domain/dashboard/network.mapper";
import { errorResponse, getReasonMessage, jsonResponse } from "../../../server/http";
import {
  fetchLatestBlockHeight,
  fetchRecommendedFees,
} from "../../../server/providers/mempool";
import { isUpstreamError } from "../../../server/upstream";

export async function GET() {
  const [feesResult, blockHeightResult] = await Promise.allSettled([
    fetchRecommendedFees(),
    fetchLatestBlockHeight(),
  ]);

  const warnings: string[] = [];

  if (feesResult.status === "rejected") {
    warnings.push(getReasonMessage("Fee-Daten nicht verfügbar", feesResult.reason));
  }

  if (blockHeightResult.status === "rejected") {
    warnings.push(getReasonMessage("Blockhöhe nicht verfügbar", blockHeightResult.reason));
  }

  if (feesResult.status === "rejected" && blockHeightResult.status === "rejected") {
    const errors = [feesResult.reason, blockHeightResult.reason].filter(isUpstreamError);

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
    fetchedAt: new Date().toISOString(),
    warnings,
  });

  return jsonResponse(dto, {
    headers: {
      "cache-control": "public, max-age=30",
    },
  });
}
