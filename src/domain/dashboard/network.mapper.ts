import type { MempoolRecommendedFees } from "../../server/providers/mempool";
import type { NetworkDto } from "./dto";

export function mapNetworkDto(input: {
  fees: MempoolRecommendedFees | null;
  latestBlockHeight: number | null;
  fetchedAt: string;
  warnings?: string[];
}): NetworkDto {
  const warnings = input.warnings?.filter(Boolean);

  return {
    source: "mempool.space",
    latestBlockHeight: input.latestBlockHeight,
    fees: {
      fastestFee: input.fees?.fastestFee ?? null,
      halfHourFee: input.fees?.halfHourFee ?? null,
      hourFee: input.fees?.hourFee ?? null,
      economyFee: input.fees?.economyFee ?? null,
      minimumFee: input.fees?.minimumFee ?? null,
    },
    partial: Boolean(warnings?.length),
    warnings: warnings?.length ? warnings : undefined,
    fetchedAt: input.fetchedAt,
  };
}
