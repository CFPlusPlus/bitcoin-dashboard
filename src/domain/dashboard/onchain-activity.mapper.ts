import type { CoinMetricsAssetMetricsResponse } from "../../server/providers/coinmetrics";
import type { OnChainActivityDto } from "./dto";

type Point = {
  timestamp: string;
  value: number;
};

type SeriesStatsOptions = {
  averageDigits?: number;
  changeDigits?: number;
  currentDigits?: number;
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

function getSeriesStats(points: Point[], options: SeriesStatsOptions = {}) {
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
  const currentDigits = options.currentDigits ?? 0;
  const averageDigits = options.averageDigits ?? currentDigits;
  const changeDigits = options.changeDigits ?? 2;

  return {
    current: current === null ? null : round(current, currentDigits),
    average7d: average7d === null ? null : round(average7d, averageDigits),
    change7dPercent:
      current !== null && first !== null && first > 0
        ? round(((current - first) / first) * 100, changeDigits)
        : null,
  };
}

export function mapOnChainActivityDto(input: {
  payload: CoinMetricsAssetMetricsResponse;
  fetchedAt: string;
}): OnChainActivityDto {
  const warnings: string[] = [];
  const activeAddressPoints: Point[] = [];
  const nonZeroAddressPoints: Point[] = [];
  const transactionCountPoints: Point[] = [];
  const transferCountPoints: Point[] = [];
  const dailyFeesPoints: Point[] = [];

  for (const item of input.payload.data) {
    const activeAddresses = toNumber(item.AdrActCnt);
    const nonZeroAddresses = toNumber(item.AdrBalCnt);
    const transactionCount = toNumber(item.TxCnt);
    const transferCount = toNumber(item.TxTfrCnt);
    const dailyFees = toNumber(item.FeeTotNtv);

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

    if (nonZeroAddresses !== null) {
      nonZeroAddressPoints.push({
        timestamp: item.time,
        value: nonZeroAddresses,
      });
    } else {
      warnings.push(
        "Adressen mit Guthaben konnten fuer mindestens einen Coin Metrics Punkt nicht verarbeitet werden."
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

    if (transferCount !== null) {
      transferCountPoints.push({
        timestamp: item.time,
        value: transferCount,
      });
    } else {
      warnings.push(
        "Transfer Count konnte fuer mindestens einen Coin Metrics Punkt nicht verarbeitet werden."
      );
    }

    if (dailyFees !== null) {
      dailyFeesPoints.push({
        timestamp: item.time,
        value: dailyFees,
      });
    } else {
      warnings.push(
        "Gesamte Fees pro Tag konnten fuer mindestens einen Coin Metrics Punkt nicht verarbeitet werden."
      );
    }
  }

  const activeAddressStats = getSeriesStats(activeAddressPoints);
  const nonZeroAddressStats = getSeriesStats(nonZeroAddressPoints);
  const transactionCountStats = getSeriesStats(transactionCountPoints);
  const transferCountStats = getSeriesStats(transferCountPoints);
  const dailyFeesStats = getSeriesStats(dailyFeesPoints, {
    currentDigits: 8,
    averageDigits: 8,
  });
  const dedupedWarnings = [...new Set(warnings)];

  return {
    source: "coinmetrics",
    activeAddresses: {
      current: activeAddressStats.current,
      change7dPercent: activeAddressStats.change7dPercent,
      average7d: activeAddressStats.average7d,
      points: activeAddressPoints,
    },
    nonZeroAddresses: {
      current: nonZeroAddressStats.current,
      change7dPercent: nonZeroAddressStats.change7dPercent,
      average7d: nonZeroAddressStats.average7d,
      points: nonZeroAddressPoints,
    },
    transactionCount: {
      current: transactionCountStats.current,
      change7dPercent: transactionCountStats.change7dPercent,
      average7d: transactionCountStats.average7d,
      points: transactionCountPoints,
    },
    transferCount: {
      current: transferCountStats.current,
      change7dPercent: transferCountStats.change7dPercent,
      average7d: transferCountStats.average7d,
      points: transferCountPoints,
    },
    dailyFeesBtc: {
      current: dailyFeesStats.current,
      change7dPercent: dailyFeesStats.change7dPercent,
      average7d: dailyFeesStats.average7d,
      points: dailyFeesPoints,
    },
    derived: {
      transfersPerTransaction:
        transferCountStats.current !== null &&
        transactionCountStats.current !== null &&
        transactionCountStats.current > 0
          ? round(transferCountStats.current / transactionCountStats.current, 2)
          : null,
      nonZeroAddressesChange7dPercent: nonZeroAddressStats.change7dPercent,
      averageDailyFees7dBtc: dailyFeesStats.average7d,
    },
    partial: dedupedWarnings.length > 0,
    warnings: dedupedWarnings.length > 0 ? dedupedWarnings : undefined,
    fetchedAt: input.fetchedAt,
  };
}
