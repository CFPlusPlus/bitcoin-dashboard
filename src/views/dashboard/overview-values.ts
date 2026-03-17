import type { Currency, Overview } from "../../types/dashboard";

export function getOverviewValues(overview: Overview | null, currency: Currency) {
  return {
    price: currency === "usd" ? overview?.priceUsd ?? null : overview?.priceEur ?? null,
    change24h:
      currency === "usd" ? overview?.change24hUsd ?? null : overview?.change24hEur ?? null,
    volume24h:
      currency === "usd" ? overview?.volume24hUsd ?? null : overview?.volume24hEur ?? null,
    marketCap:
      currency === "usd" ? overview?.marketCapUsd ?? null : overview?.marketCapEur ?? null,
    high24h: currency === "usd" ? overview?.high24hUsd ?? null : overview?.high24hEur ?? null,
    low24h: currency === "usd" ? overview?.low24hUsd ?? null : overview?.low24hEur ?? null,
  };
}
