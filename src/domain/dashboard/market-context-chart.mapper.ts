import type { CoinGeckoMarketChartResponse } from "../../server/providers/coingecko";
import { missingUpstreamData } from "../../server/upstream";
import type {
  CacheMeta,
  MarketContextChartDto,
  MarketContextChartPointDto,
  MarketContextChartSeriesDto,
  MarketContextMetricKey,
  Currency,
} from "./dto";

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

function mapPoint([timestamp, value]: [number, number]): MarketContextChartPointDto {
  return {
    timestamp,
    value: Number(value.toFixed(2)),
  };
}

function mapSeries(
  key: MarketContextMetricKey,
  rawPoints: Array<[number, number]> | undefined
): MarketContextChartSeriesDto {
  if (!rawPoints?.length) {
    throw missingUpstreamData(
      "coingecko",
      `CoinGecko market chart response missing ${key} points.`
    );
  }

  const points = rawPoints.filter(isPoint).map(mapPoint);

  if (points.length === 0) {
    throw missingUpstreamData(
      "coingecko",
      `CoinGecko market chart response contained no valid ${key} points.`
    );
  }

  const values = points.map((point) => point.value);

  return {
    key,
    points,
    stats: {
      currentValue: values[values.length - 1] ?? null,
      minValue: values.length > 0 ? Math.min(...values) : null,
      maxValue: values.length > 0 ? Math.max(...values) : null,
    },
  };
}

export function mapMarketContextChartDto(input: {
  payload: CoinGeckoMarketChartResponse;
  currency: Currency;
  fetchedAt: string;
  cache?: CacheMeta;
  warnings?: string[];
}): MarketContextChartDto {
  const warnings = [...new Set(input.warnings?.filter(Boolean) ?? [])];

  return {
    source: "coingecko",
    currency: input.currency,
    range: 30,
    series: [
      mapSeries("marketCap", input.payload.market_caps),
      mapSeries("volume24h", input.payload.total_volumes),
    ],
    fetchedAt: input.fetchedAt,
    cache: input.cache,
    partial: warnings.length > 0,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}
