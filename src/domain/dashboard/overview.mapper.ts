import type { Currency } from "../../lib/currency";
import type { CoinGeckoMarketItem } from "../../server/providers/coingecko";
import type { CacheMeta, OverviewDto } from "./dto";

type OverviewMarketSlice = {
  ath: number | null;
  athChangePercent: number | null;
  athDate: string | null;
  atl: number | null;
  atlChangePercent: number | null;
  atlDate: string | null;
  change24h: number | null;
  circulatingSupply: number | null;
  fullyDilutedValuation: number | null;
  high24h: number | null;
  lastUpdatedAt: string | null;
  low24h: number | null;
  marketCap: number | null;
  marketCapChange24h: number | null;
  marketCapChange24hPercent: number | null;
  marketCapRank: number | null;
  maxSupply: number | null;
  price: number | null;
  volume24h: number | null;
};

function mapCoinGeckoMarketItem(item: CoinGeckoMarketItem): OverviewMarketSlice {
  return {
    price: item.current_price ?? null,
    change24h: item.price_change_percentage_24h ?? null,
    marketCap: item.market_cap ?? null,
    marketCapChange24h: item.market_cap_change_24h ?? null,
    marketCapChange24hPercent: item.market_cap_change_percentage_24h ?? null,
    marketCapRank: item.market_cap_rank ?? null,
    fullyDilutedValuation: item.fully_diluted_valuation ?? null,
    volume24h: item.total_volume ?? null,
    circulatingSupply: item.circulating_supply ?? null,
    maxSupply: item.max_supply ?? null,
    ath: item.ath ?? null,
    athChangePercent: item.ath_change_percentage ?? null,
    athDate: item.ath_date ?? null,
    atl: item.atl ?? null,
    atlChangePercent: item.atl_change_percentage ?? null,
    atlDate: item.atl_date ?? null,
    high24h: item.high_24h ?? null,
    low24h: item.low_24h ?? null,
    lastUpdatedAt: item.last_updated ?? null,
  };
}

export function mapOverviewDto(input: {
  market: CoinGeckoMarketItem;
  referenceUsdMarket: CoinGeckoMarketItem | null;
  currency: Currency;
  btcDominance: number | null;
  fetchedAt: string;
  cache?: CacheMeta;
  warnings?: string[];
}): OverviewDto {
  const market = mapCoinGeckoMarketItem(input.market);
  const usdMarket =
    input.referenceUsdMarket !== null ? mapCoinGeckoMarketItem(input.referenceUsdMarket) : null;
  const warnings = input.warnings?.filter(Boolean);

  return {
    name: "bitcoin-dashboard",
    source: "coingecko",
    currency: input.currency,
    referenceUsdPrice: usdMarket?.price ?? null,
    price: market.price,
    change24h: market.change24h,
    marketCap: market.marketCap,
    marketCapChange24h: market.marketCapChange24h,
    marketCapChange24hPercent: market.marketCapChange24hPercent,
    marketCapRank: market.marketCapRank,
    fullyDilutedValuation: market.fullyDilutedValuation,
    volume24h: market.volume24h,
    volumeMarketCapRatio:
      market.volume24h !== null && market.marketCap !== null && market.marketCap > 0
        ? market.volume24h / market.marketCap
        : null,
    btcDominance: input.btcDominance,
    circulatingSupply: market.circulatingSupply,
    maxSupply: market.maxSupply,
    supplyProgressPercent:
      market.circulatingSupply !== null && market.maxSupply !== null && market.maxSupply > 0
        ? (market.circulatingSupply / market.maxSupply) * 100
        : null,
    ath: market.ath,
    athDate: market.athDate,
    athChangePercent: market.athChangePercent,
    atl: market.atl,
    atlDate: market.atlDate,
    atlChangePercent: market.atlChangePercent,
    high24h: market.high24h,
    low24h: market.low24h,
    lastUpdatedAt: market.lastUpdatedAt,
    partial: Boolean(warnings?.length),
    warnings: warnings?.length ? warnings : undefined,
    fetchedAt: input.fetchedAt,
    cache: input.cache,
  };
}
