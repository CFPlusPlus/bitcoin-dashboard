import type {
  MempoolBlock,
  MempoolDifficultyAdjustment,
  MempoolHashrate,
  MempoolRecentBlock,
  MempoolRecommendedFees,
} from "../../server/providers/mempool";
import type { NetworkDto } from "./dto";

export function mapNetworkDto(input: {
  fees: MempoolRecommendedFees | null;
  latestBlockHeight: number | null;
  hashrate: MempoolHashrate | null;
  difficultyAdjustment: MempoolDifficultyAdjustment | null;
  mempoolBlocks: MempoolBlock[] | null;
  recentBlocks: MempoolRecentBlock[] | null;
  fetchedAt: string;
  warnings?: string[];
}): NetworkDto {
  const warnings = input.warnings?.filter(Boolean);
  const hashratePoints = input.hashrate?.hashrates ?? [];
  const hashrateValues = hashratePoints.map((point) => point.avgHashrate / 1e18);
  const projectedBlocks = (input.mempoolBlocks ?? []).slice(0, 4).map((block, index) => ({
    blockIndex: index + 1,
    transactionCount: block.nTx ?? null,
    minFeeRate: block.feeRange?.[0] ?? null,
    maxFeeRate: block.feeRange ? block.feeRange[block.feeRange.length - 1] ?? null : null,
    medianFeeRate: block.medianFee ?? null,
  }));
  const pendingTransactions = input.mempoolBlocks
    ? input.mempoolBlocks.reduce((sum, block) => sum + (block.nTx ?? 0), 0)
    : null;
  const pendingVirtualSizeMb = input.mempoolBlocks
    ? input.mempoolBlocks.reduce((sum, block) => sum + (block.blockVSize ?? 0), 0) / 1_000_000
    : null;
  const latestBlocks = (input.recentBlocks ?? []).slice(0, 6).map((block) => ({
    height: block.height,
    timestamp: block.timestamp * 1000,
    transactionCount: block.tx_count ?? null,
    sizeBytes: block.size ?? null,
  }));

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
    hashrate: {
      currentEhPerSecond: input.hashrate ? input.hashrate.currentHashrate / 1e18 : null,
      changePercent30d:
        hashrateValues.length >= 2 && hashrateValues[0] !== 0
          ? ((hashrateValues[hashrateValues.length - 1] - hashrateValues[0]) / hashrateValues[0]) *
            100
          : null,
      points: hashratePoints.map((point) => ({
        timestamp: point.timestamp * 1000,
        ehPerSecond: point.avgHashrate / 1e18,
      })),
      stats: {
        low30d: hashrateValues.length > 0 ? Math.min(...hashrateValues) : null,
        high30d: hashrateValues.length > 0 ? Math.max(...hashrateValues) : null,
        average30d:
          hashrateValues.length > 0
            ? hashrateValues.reduce((sum, value) => sum + value, 0) / hashrateValues.length
            : null,
      },
    },
    difficulty: {
      current: input.hashrate?.currentDifficulty ?? null,
      adjustmentPercent: input.difficultyAdjustment?.difficultyChange ?? null,
      progressPercent: input.difficultyAdjustment?.progressPercent ?? null,
      remainingBlocks: input.difficultyAdjustment?.remainingBlocks ?? null,
      nextRetargetHeight: input.difficultyAdjustment?.nextRetargetHeight ?? null,
      estimatedRetargetDate: input.difficultyAdjustment
        ? new Date(input.difficultyAdjustment.estimatedRetargetDate).toISOString()
        : null,
    },
    mempool: {
      pendingTransactions,
      pendingVirtualSizeMb,
      projectedBlocks,
    },
    latestBlocks,
    partial: Boolean(warnings?.length),
    warnings: warnings?.length ? warnings : undefined,
    fetchedAt: input.fetchedAt,
  };
}
