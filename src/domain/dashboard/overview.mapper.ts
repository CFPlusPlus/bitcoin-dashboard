import type { Currency } from "../../lib/currency";
import type { CoinGeckoMarketItem } from "../../server/providers/coingecko";
import type { OverviewDto } from "./dto";

type OverviewMarketSlice = {
  change24h: number | null;
  high24h: number | null;
  lastUpdatedAt: string | null;
  low24h: number | null;
  marketCap: number | null;
  price: number | null;
  volume24h: number | null;
};

function mapCoinGeckoMarketItem(item: CoinGeckoMarketItem): OverviewMarketSlice {
  return {
    price: item.current_price ?? null,
    change24h: item.price_change_percentage_24h ?? null,
    marketCap: item.market_cap ?? null,
    volume24h: item.total_volume ?? null,
    high24h: item.high_24h ?? null,
    low24h: item.low_24h ?? null,
    lastUpdatedAt: item.last_updated ?? null,
  };
}

export function mapOverviewDto(input: {
  market: CoinGeckoMarketItem;
  currency: Currency;
  btcDominance: number | null;
  fetchedAt: string;
  warnings?: string[];
}): OverviewDto {
  const market = mapCoinGeckoMarketItem(input.market);
  const warnings = input.warnings?.filter(Boolean);

  return {
    name: "bitcoin-dashboard",
    source: "coingecko",
    currency: input.currency,
    price: market.price,
    change24h: market.change24h,
    marketCap: market.marketCap,
    volume24h: market.volume24h,
    btcDominance: input.btcDominance,
    high24h: market.high24h,
    low24h: market.low24h,
    lastUpdatedAt: market.lastUpdatedAt,
    partial: Boolean(warnings?.length),
    warnings: warnings?.length ? warnings : undefined,
    fetchedAt: input.fetchedAt,
  };
}
