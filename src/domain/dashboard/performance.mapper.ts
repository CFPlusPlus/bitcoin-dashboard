import type { CoinGeckoMarketChartResponse } from "../../server/providers/coingecko";
import type { PerformanceDto, PerformanceWindowDto, PerformanceWindowKey, Currency } from "./dto";

type PricePoint = {
  timestamp: number;
  price: number;
};

type WindowDefinition = {
  key: PerformanceWindowKey;
  targetTimestamp: number;
  toleranceMs: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function isPoint(value: unknown): value is [number, number] {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    typeof value[0] === "number" &&
    Number.isFinite(value[0]) &&
    typeof value[1] === "number" &&
    Number.isFinite(value[1])
  );
}

function toPoint([timestamp, price]: [number, number]): PricePoint {
  return {
    timestamp,
    price,
  };
}

function subtractYears(timestamp: number, years: number) {
  const date = new Date(timestamp);
  date.setUTCFullYear(date.getUTCFullYear() - years);
  return date.getTime();
}

function getYearStartTimestamp(timestamp: number) {
  const now = new Date(timestamp);
  return Date.UTC(now.getUTCFullYear(), 0, 1, 0, 0, 0, 0);
}

function getWindowDefinitions(nowTimestamp: number): WindowDefinition[] {
  return [
    {
      key: "7d",
      targetTimestamp: nowTimestamp - 7 * DAY_MS,
      toleranceMs: 2 * DAY_MS,
    },
    {
      key: "30d",
      targetTimestamp: nowTimestamp - 30 * DAY_MS,
      toleranceMs: 3 * DAY_MS,
    },
    {
      key: "1y",
      targetTimestamp: subtractYears(nowTimestamp, 1),
      toleranceMs: 14 * DAY_MS,
    },
    {
      key: "ytd",
      targetTimestamp: getYearStartTimestamp(nowTimestamp),
      toleranceMs: 3 * DAY_MS,
    },
  ];
}

function findClosestReferencePoint(
  points: PricePoint[],
  targetTimestamp: number,
  toleranceMs: number,
  currentTimestamp: number
) {
  let candidate: PricePoint | null = null;

  for (const point of points) {
    if (point.timestamp >= currentTimestamp) {
      continue;
    }

    const distance = Math.abs(point.timestamp - targetTimestamp);

    if (distance > toleranceMs) {
      continue;
    }

    if (!candidate) {
      candidate = point;
      continue;
    }

    const candidateDistance = Math.abs(candidate.timestamp - targetTimestamp);

    if (
      distance < candidateDistance ||
      (distance === candidateDistance && point.timestamp > candidate.timestamp)
    ) {
      candidate = point;
    }
  }

  return candidate;
}

function toWindowResult(
  definition: WindowDefinition,
  points: PricePoint[],
  currentPoint: PricePoint
): PerformanceWindowDto {
  const referencePoint = findClosestReferencePoint(
    points,
    definition.targetTimestamp,
    definition.toleranceMs,
    currentPoint.timestamp
  );

  if (!referencePoint || referencePoint.price <= 0) {
    return {
      key: definition.key,
      referencePrice: null,
      referenceTimestamp: null,
      changePercent: null,
    };
  }

  return {
    key: definition.key,
    referencePrice: Number(referencePoint.price.toFixed(2)),
    referenceTimestamp: referencePoint.timestamp,
    changePercent: Number(
      (((currentPoint.price - referencePoint.price) / referencePoint.price) * 100).toFixed(2)
    ),
  };
}

export function mapPerformanceDto(input: {
  payload: CoinGeckoMarketChartResponse;
  currency: Currency;
  fetchedAt: string;
}): PerformanceDto {
  const rawPoints = input.payload.prices;
  const points = rawPoints
    .filter(isPoint)
    .map(toPoint)
    .sort((left, right) => left.timestamp - right.timestamp);
  const warnings =
    points.length !== rawPoints.length
      ? ["Einige Performance-Punkte konnten nicht verarbeitet werden."]
      : [];
  const currentPoint = points[points.length - 1] ?? null;

  return {
    source: "coingecko",
    currency: input.currency,
    currentPrice: currentPoint ? Number(currentPoint.price.toFixed(2)) : null,
    periods: currentPoint
      ? getWindowDefinitions(currentPoint.timestamp).map((definition) =>
          toWindowResult(definition, points, currentPoint)
        )
      : [],
    partial: warnings.length > 0,
    warnings: warnings.length > 0 ? warnings : undefined,
    fetchedAt: input.fetchedAt,
  };
}
