import { mapSentimentDto } from "../../../domain/dashboard/sentiment.mapper";
import { getCacheControlHeader, sentimentCachePolicy } from "../../../server/cache";
import { jsonResponse } from "../../../server/http";
import { fetchFearAndGreedIndex } from "../../../server/providers/alternative";
import { upstreamErrorResponse } from "../../../server/upstream";

export async function GET() {
  try {
    const payload = await fetchFearAndGreedIndex(sentimentCachePolicy);

    const dto = mapSentimentDto({
      payload,
      now: Date.now(),
      fetchedAt: new Date().toISOString(),
    });

    return jsonResponse(dto, {
      headers: {
        // Fear & Greed updates slowly enough that a warmer edge cache meaningfully cuts provider traffic.
        "cache-control": getCacheControlHeader(sentimentCachePolicy),
      },
    });
  } catch (error) {
    return upstreamErrorResponse(
      "alternative.me",
      error,
      "Fehler beim Laden des Fear-&-Greed-Index."
    );
  }
}
