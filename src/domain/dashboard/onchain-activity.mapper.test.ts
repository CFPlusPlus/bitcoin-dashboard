import { describe, expect, it } from "vitest";
import { mapOnChainActivityDto } from "./onchain-activity.mapper";

describe("mapOnChainActivityDto", () => {
  it("maps Coin Metrics history into current values and 7-day deltas", () => {
    const dto = mapOnChainActivityDto({
      payload: {
        data: [
          { asset: "btc", time: "2026-03-16T00:00:00.000Z", AdrActCnt: "586709", TxCnt: "490235" },
          { asset: "btc", time: "2026-03-17T00:00:00.000Z", AdrActCnt: "570000", TxCnt: "505000" },
          { asset: "btc", time: "2026-03-18T00:00:00.000Z", AdrActCnt: "560000", TxCnt: "520000" },
          { asset: "btc", time: "2026-03-19T00:00:00.000Z", AdrActCnt: "550000", TxCnt: "540000" },
          { asset: "btc", time: "2026-03-20T00:00:00.000Z", AdrActCnt: "548000", TxCnt: "555000" },
          { asset: "btc", time: "2026-03-21T00:00:00.000Z", AdrActCnt: "546500", TxCnt: "575000" },
          { asset: "btc", time: "2026-03-22T00:00:00.000Z", AdrActCnt: "545348", TxCnt: "639039" },
        ],
      },
      fetchedAt: "2026-03-23T12:00:00.000Z",
    });

    expect(dto.activeAddresses.current).toBe(545348);
    expect(dto.activeAddresses.average7d).toBe(558080);
    expect(dto.activeAddresses.change7dPercent).toBe(-7.05);
    expect(dto.transactionCount.current).toBe(639039);
    expect(dto.transactionCount.average7d).toBe(546325);
    expect(dto.transactionCount.change7dPercent).toBe(30.35);
  });
});
