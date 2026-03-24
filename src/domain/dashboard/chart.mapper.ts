import type { CoinGeckoMarketChartResponse } from "../../server/providers/coingecko";
import type { CacheMeta, ChartDto, ChartPointDto, ChartRange, Currency } from "./dto";

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

function mapChartPoint([timestamp, price]: [number, number]): ChartPointDto {
  return {
    timestamp,
    price: Number(price.toFixed(2)),
  };
}

export function mapChartDto(input: {
  payload: CoinGeckoMarketChartResponse;
  currency: Currency;
  range: ChartRange;
  fetchedAt: string;
  cache?: CacheMeta;
  warnings?: string[];
}): ChartDto {
  const rawPoints = input.payload.prices;
  const points = rawPoints.filter(isPoint).map(mapChartPoint);
  const warnings = [
    ...(points.length !== rawPoints.length
      ? ["Einige Chartpunkte konnten nicht verarbeitet werden."]
      : []),
    ...(input.warnings ?? []),
  ];
  const dedupedWarnings = [...new Set(warnings)];

  const prices = points.map((point) => point.price);
  const currentPrice = prices[prices.length - 1] ?? null;

  return {
    source: "coingecko",
    currency: input.currency,
    range: input.range,
    points,
    stats: {
      currentPrice,
      minPrice: prices.length > 0 ? Math.min(...prices) : null,
      maxPrice: prices.length > 0 ? Math.max(...prices) : null,
    },
    partial: dedupedWarnings.length > 0,
    warnings: dedupedWarnings.length > 0 ? dedupedWarnings : undefined,
    fetchedAt: input.fetchedAt,
    cache: input.cache,
  };
}
