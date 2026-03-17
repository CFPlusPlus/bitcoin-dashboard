import type { CoinGeckoMarketItem } from "../../server/providers/coingecko";
import type { OverviewDto } from "./dto";

type OverviewCurrencySlice = {
  price: number | null;
  change24h: number | null;
  marketCap: number | null;
  volume24h: number | null;
  high24h: number | null;
  low24h: number | null;
  lastUpdatedAt: string | null;
};

function mapCoinGeckoMarketItem(item: CoinGeckoMarketItem | null): OverviewCurrencySlice {
  return {
    price: item?.current_price ?? null,
    change24h: item?.price_change_percentage_24h ?? null,
    marketCap: item?.market_cap ?? null,
    volume24h: item?.total_volume ?? null,
    high24h: item?.high_24h ?? null,
    low24h: item?.low_24h ?? null,
    lastUpdatedAt: item?.last_updated ?? null,
  };
}

export function mapOverviewDto(input: {
  usd: CoinGeckoMarketItem | null;
  eur: CoinGeckoMarketItem | null;
  fetchedAt: string;
  warnings?: string[];
}): OverviewDto {
  const usd = mapCoinGeckoMarketItem(input.usd);
  const eur = mapCoinGeckoMarketItem(input.eur);
  const warnings = input.warnings?.filter(Boolean);

  return {
    name: "bitcoin-dashboard",
    source: "coingecko",
    priceUsd: usd.price,
    priceEur: eur.price,
    change24hUsd: usd.change24h,
    change24hEur: eur.change24h,
    marketCapUsd: usd.marketCap,
    marketCapEur: eur.marketCap,
    volume24hUsd: usd.volume24h,
    volume24hEur: eur.volume24h,
    high24hUsd: usd.high24h,
    high24hEur: eur.high24h,
    low24hUsd: usd.low24h,
    low24hEur: eur.low24h,
    lastUpdatedAt: usd.lastUpdatedAt ?? eur.lastUpdatedAt,
    partial: Boolean(warnings?.length),
    warnings: warnings?.length ? warnings : undefined,
    fetchedAt: input.fetchedAt,
  };
}
