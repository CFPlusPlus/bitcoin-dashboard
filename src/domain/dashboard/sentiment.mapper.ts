import type { AlternativeMeFearAndGreedResponse } from "../../server/providers/alternative";
import type { SentimentDto } from "./dto";

function average(values: number[]) {
  if (values.length === 0) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function mapSentimentDto(input: {
  payload: AlternativeMeFearAndGreedResponse;
  now: number;
  fetchedAt: string;
}): SentimentDto {
  const item = input.payload.data[0];
  const value = Number(item?.value);
  const timestamp = Number(item?.timestamp);
  const rawTimeUntilUpdate = item?.time_until_update;
  const timeUntilUpdateSeconds = rawTimeUntilUpdate ? Number(rawTimeUntilUpdate) : null;
  const warnings: string[] = [];
  const parsedValues = input.payload.data
    .map((entry) => Number(entry.value))
    .filter((entry) => Number.isFinite(entry));
  const currentValue = Number.isFinite(value) ? value : null;
  const oldestValue =
    parsedValues.length > 0 ? (parsedValues[parsedValues.length - 1] ?? null) : null;
  const average7dValue = average(parsedValues);

  if (rawTimeUntilUpdate && !Number.isFinite(timeUntilUpdateSeconds)) {
    warnings.push("Zeit bis zum naechsten Sentiment-Update konnte nicht verarbeitet werden.");
  }

  return {
    source: "alternative.me",
    name: input.payload.name ?? "Fear and Greed Index",
    value: currentValue,
    classification: item?.value_classification ?? null,
    timestamp: Number.isFinite(timestamp) ? new Date(timestamp * 1000).toISOString() : null,
    average7d: average7dValue === null ? null : Number(average7dValue.toFixed(2)),
    change7d:
      currentValue !== null && oldestValue !== null
        ? Number((currentValue - oldestValue).toFixed(2))
        : null,
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
