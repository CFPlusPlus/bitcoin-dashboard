import type { SentimentDto } from "./dto";

export type AlternativeMeFearAndGreedResponse = {
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

export function mapSentimentDto(input: {
  payload: AlternativeMeFearAndGreedResponse;
  now: number;
  fetchedAt: string;
}): SentimentDto {
  const item = input.payload.data?.[0];
  const value = Number(item?.value);
  const timestamp = Number(item?.timestamp);
  const rawTimeUntilUpdate = item?.time_until_update;
  const timeUntilUpdateSeconds = rawTimeUntilUpdate ? Number(rawTimeUntilUpdate) : null;
  const warnings: string[] = [];

  if (rawTimeUntilUpdate && !Number.isFinite(timeUntilUpdateSeconds)) {
    warnings.push("Zeit bis zum nächsten Sentiment-Update konnte nicht verarbeitet werden.");
  }

  return {
    source: "alternative.me",
    name: input.payload.name ?? "Fear and Greed Index",
    value: Number.isFinite(value) ? value : null,
    classification: item?.value_classification ?? null,
    timestamp: Number.isFinite(timestamp) ? new Date(timestamp * 1000).toISOString() : null,
    timeUntilUpdateSeconds: Number.isFinite(timeUntilUpdateSeconds) ? timeUntilUpdateSeconds : null,
    nextUpdateAt:
      Number.isFinite(timeUntilUpdateSeconds) && timeUntilUpdateSeconds !== null
        ? new Date(input.now + timeUntilUpdateSeconds * 1000).toISOString()
        : null,
    attribution: "Source: Alternative.me",
    partial: warnings.length > 0,
    warnings: warnings.length > 0 ? warnings : undefined,
    fetchedAt: input.fetchedAt,
  };
}
