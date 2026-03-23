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
const DAYS_IN_YEAR = 365;

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
      key: "90d",
      targetTimestamp: nowTimestamp - 90 * DAY_MS,
      toleranceMs: 5 * DAY_MS,
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

function getPointsSince(points: PricePoint[], startTimestamp: number) {
  return points.filter((point) => point.timestamp >= startTimestamp);
}

function round(value: number, digits = 2) {
  return Number(value.toFixed(digits));
}

function average(values: number[]) {
  if (values.length === 0) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getRangeStats(points: PricePoint[]) {
  if (points.length === 0) {
    return {
      high: { price: null, timestamp: null },
      low: { price: null, timestamp: null },
    };
  }

  let high = points[0];
  let low = points[0];

  for (const point of points) {
    if (point.price > high.price) {
      high = point;
    }

    if (point.price < low.price) {
      low = point;
    }
  }

  return {
    high: { price: round(high.price), timestamp: high.timestamp },
    low: { price: round(low.price), timestamp: low.timestamp },
  };
}

function getDistancePercent(currentPrice: number | null, referencePrice: number | null) {
  if (
    currentPrice === null ||
    referencePrice === null ||
    !Number.isFinite(currentPrice) ||
    !Number.isFinite(referencePrice) ||
    referencePrice <= 0
  ) {
    return null;
  }

  return round(((currentPrice - referencePrice) / referencePrice) * 100);
}

function getMovingAverage(points: PricePoint[], days: number) {
  if (points.length === 0) {
    return null;
  }

  const currentTimestamp = points[points.length - 1]?.timestamp ?? null;

  if (currentTimestamp === null) {
    return null;
  }

  const windowPoints = getPointsSince(points, currentTimestamp - days * DAY_MS);
  const movingAverage = average(windowPoints.map((point) => point.price));

  return movingAverage === null ? null : round(movingAverage);
}

function getAnnualizedVolatility(points: PricePoint[], days: number) {
  if (points.length < 2) {
    return null;
  }

  const currentTimestamp = points[points.length - 1]?.timestamp ?? null;

  if (currentTimestamp === null) {
    return null;
  }

  const windowPoints = getPointsSince(points, currentTimestamp - days * DAY_MS);

  if (windowPoints.length < 3) {
    return null;
  }

  const returns = windowPoints
    .slice(1)
    .map((point, index) => {
      const previousPrice = windowPoints[index]?.price ?? null;

      if (previousPrice === null || previousPrice <= 0) {
        return null;
      }

      return (point.price - previousPrice) / previousPrice;
    })
    .filter((value): value is number => value !== null && Number.isFinite(value));

  if (returns.length < 2) {
    return null;
  }

  const mean = average(returns);

  if (mean === null) {
    return null;
  }

  const variance =
    returns.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (returns.length - 1);

  if (!Number.isFinite(variance) || variance < 0) {
    return null;
  }

  return round(Math.sqrt(variance) * Math.sqrt(DAYS_IN_YEAR) * 100);
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
  const rangeStats = getRangeStats(points);
  const movingAverage200d = getMovingAverage(points, 200);
  const currentPrice = currentPoint ? round(currentPoint.price) : null;

  return {
    source: "coingecko",
    currency: input.currency,
    currentPrice,
    periods: currentPoint
      ? getWindowDefinitions(currentPoint.timestamp).map((definition) =>
          toWindowResult(definition, points, currentPoint)
        )
      : [],
    stats: {
      high52w: rangeStats.high,
      low52w: rangeStats.low,
      distanceFromHigh52wPercent: getDistancePercent(currentPrice, rangeStats.high.price),
      movingAverage200d,
      distanceFromMovingAverage200dPercent: getDistancePercent(currentPrice, movingAverage200d),
      volatility30dPercent: getAnnualizedVolatility(points, 30),
      volatility90dPercent: getAnnualizedVolatility(points, 90),
    },
    partial: warnings.length > 0,
    warnings: warnings.length > 0 ? warnings : undefined,
    fetchedAt: input.fetchedAt,
  };
}
