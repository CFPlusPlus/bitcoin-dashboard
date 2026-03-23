import { mapOnChainActivityDto } from "../../../domain/dashboard/onchain-activity.mapper";
import { getCacheControlHeader, onChainActivityCachePolicy } from "../../../server/cache";
import { jsonResponse } from "../../../server/http";
import { fetchCoinMetricsActivityHistory } from "../../../server/providers/coinmetrics";
import { upstreamErrorResponse } from "../../../server/upstream";

export async function GET() {
  try {
    const payload = await fetchCoinMetricsActivityHistory(onChainActivityCachePolicy);

    const dto = mapOnChainActivityDto({
      payload,
      fetchedAt: new Date().toISOString(),
    });

    return jsonResponse(dto, {
      headers: {
        "cache-control": getCacheControlHeader(onChainActivityCachePolicy),
      },
    });
  } catch (error) {
    return upstreamErrorResponse(
      "coinmetrics",
      error,
      "Fehler beim Laden der On-Chain-Aktivitaet von Coin Metrics."
    );
  }
}
