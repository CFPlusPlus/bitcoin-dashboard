import { mapSentimentDto } from "../../../domain/dashboard/sentiment.mapper";
import { jsonResponse } from "../../../server/http";
import { fetchFearAndGreedIndex } from "../../../server/providers/alternative";
import { upstreamErrorResponse } from "../../../server/upstream";

export async function GET() {
  try {
    const payload = await fetchFearAndGreedIndex();

    const dto = mapSentimentDto({
      payload,
      now: Date.now(),
      fetchedAt: new Date().toISOString(),
    });

    return jsonResponse(dto, {
      headers: {
        "cache-control": "public, max-age=300",
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
