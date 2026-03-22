import { describe, expect, it } from "vitest";
import { mapOverviewDto } from "./overview.mapper";

describe("mapOverviewDto", () => {
  it("maps CoinGecko market structure fields into the overview contract", () => {
    const dto = mapOverviewDto({
      market: {
        current_price: 62000,
        market_cap: 1230000000000,
        market_cap_rank: 1,
        fully_diluted_valuation: 1300000000000,
        total_volume: 21000000000,
        high_24h: 62500,
        low_24h: 60300,
        price_change_percentage_24h: 2.4,
        circulating_supply: 19850000,
        max_supply: 21000000,
        ath: 73738,
        ath_change_percentage: -15.92,
        ath_date: "2026-03-14T07:10:36.635Z",
        last_updated: "2026-03-18T10:00:00.000Z",
      },
      referenceUsdMarket: null,
      currency: "usd",
      btcDominance: 58.3,
      fetchedAt: "2026-03-18T10:00:10.000Z",
    });

    expect(dto).toMatchObject({
      marketCapRank: 1,
      fullyDilutedValuation: 1300000000000,
      circulatingSupply: 19850000,
      maxSupply: 21000000,
      supplyProgressPercent: (19850000 / 21000000) * 100,
      ath: 73738,
      athDate: "2026-03-14T07:10:36.635Z",
      athChangePercent: -15.92,
    });
  });
});
