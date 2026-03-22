import type { Currency, Overview } from "../../types/dashboard";

const EMPTY_OVERVIEW_VALUES = {
  ath: null,
  athChangePercent: null,
  athDate: null,
  circulatingSupply: null,
  price: null,
  change24h: null,
  fullyDilutedValuation: null,
  marketCapRank: null,
  volume24h: null,
  marketCap: null,
  maxSupply: null,
  btcDominance: null,
  supplyProgressPercent: null,
  high24h: null,
  low24h: null,
};

export function getOverviewValues(overview: Overview | null, currency: Currency) {
  if (!overview || overview.currency !== currency) {
    return EMPTY_OVERVIEW_VALUES;
  }

  return {
    ath: overview.ath,
    athChangePercent: overview.athChangePercent,
    athDate: overview.athDate,
    circulatingSupply: overview.circulatingSupply,
    price: overview.price,
    change24h: overview.change24h,
    fullyDilutedValuation: overview.fullyDilutedValuation,
    marketCapRank: overview.marketCapRank,
    volume24h: overview.volume24h,
    marketCap: overview.marketCap,
    maxSupply: overview.maxSupply,
    btcDominance: overview.btcDominance,
    supplyProgressPercent: overview.supplyProgressPercent,
    high24h: overview.high24h,
    low24h: overview.low24h,
  };
}
