import { errorResponse, fetchWithTimeout, jsonResponse, readErrorBody } from "../lib/http";

type FearAndGreedApiResponse = {
  name?: string;
  data?: Array<{
    value?: string;
    value_classification?: string;
    timestamp?: string;
    time_until_update?: string;
  }>;
  metadata?: {
    error?: string | null;
  };
};

export const onRequestGet: PagesFunction = async () => {
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

  const payload = (await response.json()) as FearAndGreedApiResponse;

  if (payload.metadata?.error) {
    return errorResponse(502, "Fear-&-Greed-Providerfehler.", payload.metadata.error);
  }

  const item = payload.data?.[0];
  const value = Number(item?.value);
  const timestamp = Number(item?.timestamp);
  const rawTimeUntilUpdate = item?.time_until_update;
  const timeUntilUpdateSeconds = rawTimeUntilUpdate ? Number(rawTimeUntilUpdate) : null;
  const warnings: string[] = [];

  if (!Number.isFinite(value) || !Number.isFinite(timestamp)) {
    return errorResponse(502, "Fear-&-Greed-Daten unvollständig.");
  }

  if (rawTimeUntilUpdate && !Number.isFinite(timeUntilUpdateSeconds)) {
    warnings.push("Zeit bis zum nächsten Sentiment-Update konnte nicht verarbeitet werden.");
  }

  return jsonResponse(
    {
      source: "alternative.me",
      name: payload.name ?? "Fear and Greed Index",
      value,
      classification: item?.value_classification ?? null,
      timestamp: new Date(timestamp * 1000).toISOString(),
      timeUntilUpdateSeconds: Number.isFinite(timeUntilUpdateSeconds) ? timeUntilUpdateSeconds : null,
      nextUpdateAt:
        Number.isFinite(timeUntilUpdateSeconds) && timeUntilUpdateSeconds !== null
          ? new Date(Date.now() + timeUntilUpdateSeconds * 1000).toISOString()
          : null,
      attribution: "Source: Alternative.me",
      partial: warnings.length > 0,
      warnings: warnings.length > 0 ? warnings : undefined,
      fetchedAt: new Date().toISOString(),
    },
    {
      headers: {
        "cache-control": "public, max-age=300",
      },
    }
  );
};
