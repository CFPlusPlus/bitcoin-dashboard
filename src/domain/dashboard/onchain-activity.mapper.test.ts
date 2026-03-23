import { describe, expect, it } from "vitest";
import { mapOnChainActivityDto } from "./onchain-activity.mapper";

describe("mapOnChainActivityDto", () => {
  it("maps Coin Metrics history into current values and 7-day deltas", () => {
    const dto = mapOnChainActivityDto({
      payload: {
        data: [
          {
            asset: "btc",
            time: "2026-03-16T00:00:00.000Z",
            AdrActCnt: "586709",
            AdrBalCnt: "56000000",
            TxCnt: "490235",
            TxTfrCnt: "700000",
            FeeTotNtv: "1.8",
          },
          {
            asset: "btc",
            time: "2026-03-17T00:00:00.000Z",
            AdrActCnt: "570000",
            AdrBalCnt: "56050000",
            TxCnt: "505000",
            TxTfrCnt: "720000",
            FeeTotNtv: "2.1",
          },
          {
            asset: "btc",
            time: "2026-03-18T00:00:00.000Z",
            AdrActCnt: "560000",
            AdrBalCnt: "56100000",
            TxCnt: "520000",
            TxTfrCnt: "735000",
            FeeTotNtv: "2.0",
          },
          {
            asset: "btc",
            time: "2026-03-19T00:00:00.000Z",
            AdrActCnt: "550000",
            AdrBalCnt: "56150000",
            TxCnt: "540000",
            TxTfrCnt: "760000",
            FeeTotNtv: "1.9",
          },
          {
            asset: "btc",
            time: "2026-03-20T00:00:00.000Z",
            AdrActCnt: "548000",
            AdrBalCnt: "56200000",
            TxCnt: "555000",
            TxTfrCnt: "780000",
            FeeTotNtv: "2.3",
          },
          {
            asset: "btc",
            time: "2026-03-21T00:00:00.000Z",
            AdrActCnt: "546500",
            AdrBalCnt: "56280000",
            TxCnt: "575000",
            TxTfrCnt: "820000",
            FeeTotNtv: "2.5",
          },
          {
            asset: "btc",
            time: "2026-03-22T00:00:00.000Z",
            AdrActCnt: "545348",
            AdrBalCnt: "56519257",
            TxCnt: "639039",
            TxTfrCnt: "885419",
            FeeTotNtv: "2.74078545",
          },
        ],
      },
      fetchedAt: "2026-03-23T12:00:00.000Z",
    });

    expect(dto.activeAddresses.current).toBe(545348);
    expect(dto.activeAddresses.average7d).toBe(558080);
    expect(dto.activeAddresses.change7dPercent).toBe(-7.05);
    expect(dto.nonZeroAddresses.current).toBe(56519257);
    expect(dto.nonZeroAddresses.average7d).toBe(56185608);
    expect(dto.nonZeroAddresses.change7dPercent).toBe(0.93);
    expect(dto.transactionCount.current).toBe(639039);
    expect(dto.transactionCount.average7d).toBe(546325);
    expect(dto.transactionCount.change7dPercent).toBe(30.35);
    expect(dto.transferCount.current).toBe(885419);
    expect(dto.transferCount.average7d).toBe(771488);
    expect(dto.transferCount.change7dPercent).toBe(26.49);
    expect(dto.dailyFeesBtc.current).toBe(2.74078545);
    expect(dto.dailyFeesBtc.average7d).toBe(2.19154078);
    expect(dto.dailyFeesBtc.change7dPercent).toBe(52.27);
    expect(dto.derived.transfersPerTransaction).toBe(1.39);
    expect(dto.derived.nonZeroAddressesChange7dPercent).toBe(0.93);
    expect(dto.derived.averageDailyFees7dBtc).toBe(2.19154078);
  });
});
