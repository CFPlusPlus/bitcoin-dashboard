export type SentimentZoneKey = "extremeFear" | "fear" | "neutral" | "greed" | "extremeGreed";

export const sentimentZoneRanges: Array<{
  key: SentimentZoneKey;
  max: number;
  min: number;
}> = [
  { key: "extremeFear", max: 24, min: 0 },
  { key: "fear", max: 44, min: 25 },
  { key: "neutral", max: 54, min: 45 },
  { key: "greed", max: 74, min: 55 },
  { key: "extremeGreed", max: 100, min: 75 },
];

export function clampSentimentValue(value: number | null) {
  if (typeof value !== "number" || Number.isNaN(value) || !Number.isFinite(value)) {
    return null;
  }

  return Math.min(100, Math.max(0, value));
}

export function getSentimentZoneKey(
  value: number | null,
  classification: string | null
): SentimentZoneKey | null {
  const clampedValue = clampSentimentValue(value);

  if (clampedValue !== null) {
    return (
      sentimentZoneRanges.find((range) => clampedValue >= range.min && clampedValue <= range.max)
        ?.key ?? null
    );
  }

  const normalizedClassification = classification?.trim().toLowerCase() ?? "";

  if (normalizedClassification.includes("extreme greed")) {
    return "extremeGreed";
  }

  if (normalizedClassification.includes("greed")) {
    return "greed";
  }

  if (normalizedClassification.includes("neutral")) {
    return "neutral";
  }

  if (normalizedClassification.includes("extreme fear")) {
    return "extremeFear";
  }

  if (normalizedClassification.includes("fear")) {
    return "fear";
  }

  return null;
}

export function getSentimentNeedleAngle(value: number | null) {
  const clampedValue = clampSentimentValue(value);

  if (clampedValue === null) {
    return 270;
  }

  return 180 + clampedValue * 1.8;
}
