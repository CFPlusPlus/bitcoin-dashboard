import type { CoinMetricsAssetMetricsResponse } from "../../server/providers/coinmetrics";
import type { OnChainActivityDto } from "./dto";

type Point = {
  timestamp: string;
  value: number;
};

function toNumber(value: string | undefined) {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
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

function getSeriesStats(points: Point[]) {
  if (points.length === 0) {
    return {
      current: null,
      average7d: null,
      change7dPercent: null,
    };
  }

  const current = points[points.length - 1]?.value ?? null;
  const first = points[0]?.value ?? null;
  const average7d = average(points.map((point) => point.value));

  return {
    current: current === null ? null : round(current, 0),
    average7d: average7d === null ? null : round(average7d, 0),
    change7dPercent:
      current !== null && first !== null && first > 0
        ? round(((current - first) / first) * 100)
        : null,
  };
}

export function mapOnChainActivityDto(input: {
  payload: CoinMetricsAssetMetricsResponse;
  fetchedAt: string;
}): OnChainActivityDto {
  const warnings: string[] = [];
  const activeAddressPoints: Point[] = [];
  const transactionCountPoints: Point[] = [];

  for (const item of input.payload.data) {
    const activeAddresses = toNumber(item.AdrActCnt);
    const transactionCount = toNumber(item.TxCnt);

    if (activeAddresses !== null) {
      activeAddressPoints.push({
        timestamp: item.time,
        value: activeAddresses,
      });
    } else {
      warnings.push(
        "Aktive Adressen konnten fuer mindestens einen Coin Metrics Punkt nicht verarbeitet werden."
      );
    }

    if (transactionCount !== null) {
      transactionCountPoints.push({
        timestamp: item.time,
        value: transactionCount,
      });
    } else {
      warnings.push(
        "Transaktionsanzahl konnte fuer mindestens einen Coin Metrics Punkt nicht verarbeitet werden."
      );
    }
  }

  const activeAddressStats = getSeriesStats(activeAddressPoints);
  const transactionCountStats = getSeriesStats(transactionCountPoints);
  const dedupedWarnings = [...new Set(warnings)];

  return {
    source: "coinmetrics",
    activeAddresses: {
      current: activeAddressStats.current,
      change7dPercent: activeAddressStats.change7dPercent,
      average7d: activeAddressStats.average7d,
      points: activeAddressPoints,
    },
    transactionCount: {
      current: transactionCountStats.current,
      change7dPercent: transactionCountStats.change7dPercent,
      average7d: transactionCountStats.average7d,
      points: transactionCountPoints,
    },
    partial: dedupedWarnings.length > 0,
    warnings: dedupedWarnings.length > 0 ? dedupedWarnings : undefined,
    fetchedAt: input.fetchedAt,
  };
}
