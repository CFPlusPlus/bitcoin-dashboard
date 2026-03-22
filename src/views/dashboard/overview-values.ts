import type { Currency, Overview } from "../../types/dashboard";

const EMPTY_OVERVIEW_VALUES = {
  price: null,
  change24h: null,
  volume24h: null,
  marketCap: null,
  btcDominance: null,
  high24h: null,
  low24h: null,
};

export function getOverviewValues(overview: Overview | null, currency: Currency) {
  if (!overview || overview.currency !== currency) {
    return EMPTY_OVERVIEW_VALUES;
  }

  return {
    price: overview.price,
    change24h: overview.change24h,
    volume24h: overview.volume24h,
    marketCap: overview.marketCap,
    btcDominance: overview.btcDominance,
    high24h: overview.high24h,
    low24h: overview.low24h,
  };
}
