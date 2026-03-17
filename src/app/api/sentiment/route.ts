import {
  mapSentimentDto,
  type AlternativeMeFearAndGreedResponse,
} from "../../../domain/dashboard/sentiment.mapper";
import { errorResponse, fetchWithTimeout, jsonResponse, readErrorBody } from "../../../server/http";

export async function GET() {
  let response: Response;

  try {
    response = await fetchWithTimeout(
      "https://api.alternative.me/fng/?limit=1",
      {
        headers: {
          accept: "application/json",
        },
      },
      6000
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return errorResponse(502, "Fehler beim Laden des Fear-&-Greed-Index.", message);
  }

  if (!response.ok) {
    const details = await readErrorBody(response);
    return errorResponse(502, "Fehler beim Laden des Fear-&-Greed-Index.", details, {
      status: response.status,
    });
  }

  const payload = (await response.json()) as AlternativeMeFearAndGreedResponse;

  if (payload.metadata?.error) {
    return errorResponse(502, "Fear-&-Greed-Providerfehler.", payload.metadata.error);
  }

  const dto = mapSentimentDto({
    payload,
    now: Date.now(),
    fetchedAt: new Date().toISOString(),
  });

  if (dto.value === null || dto.timestamp === null) {
    return errorResponse(502, "Fear-&-Greed-Daten unvollständig.");
  }

  return jsonResponse(dto, {
    headers: {
      "cache-control": "public, max-age=300",
    },
  });
}
