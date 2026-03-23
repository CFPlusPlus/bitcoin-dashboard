import type {
  MempoolBlock,
  MempoolDifficultyAdjustment,
  MempoolHashrate,
  MempoolRecentBlock,
  MempoolRecommendedFees,
} from "../../server/providers/mempool";
import type { NetworkDto } from "./dto";

const HALVING_INTERVAL = 210_000;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const INITIAL_BLOCK_REWARD = 50;
const BYTES_PER_FULL_BLOCK = 1_000_000;

function getBlockReward(halvingIndex: number) {
  return INITIAL_BLOCK_REWARD / 2 ** halvingIndex;
}

function round(value: number, digits = 2) {
  return Number(value.toFixed(digits));
}

function average(values: number[]) {
  if (values.length === 0) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getSpread(higher: number | null | undefined, lower: number | null | undefined) {
  if (
    higher === null ||
    higher === undefined ||
    lower === null ||
    lower === undefined ||
    !Number.isFinite(higher) ||
    !Number.isFinite(lower)
  ) {
    return null;
  }

  return round(Math.max(higher - lower, 0), 1);
}

function getEstimatedHalvingDate(input: {
  difficultyAdjustment: MempoolDifficultyAdjustment | null;
  fetchedAt: string;
  halvingBlocksRemaining: number;
}) {
  const retargetTimestamp = input.difficultyAdjustment?.estimatedRetargetDate ?? null;
  const retargetBlocksRemaining = input.difficultyAdjustment?.remainingBlocks ?? null;
  const fetchedAtTimestamp = new Date(input.fetchedAt).getTime();

  if (
    retargetTimestamp === null ||
    retargetBlocksRemaining === null ||
    !Number.isFinite(retargetTimestamp) ||
    !Number.isFinite(retargetBlocksRemaining) ||
    retargetBlocksRemaining <= 0 ||
    Number.isNaN(fetchedAtTimestamp)
  ) {
    return null;
  }

  const millisecondsUntilRetarget = retargetTimestamp - fetchedAtTimestamp;

  if (!Number.isFinite(millisecondsUntilRetarget) || millisecondsUntilRetarget <= 0) {
    return null;
  }

  const millisecondsPerBlock = millisecondsUntilRetarget / retargetBlocksRemaining;

  if (!Number.isFinite(millisecondsPerBlock) || millisecondsPerBlock <= 0) {
    return null;
  }

  return fetchedAtTimestamp + input.halvingBlocksRemaining * millisecondsPerBlock;
}

function mapHalving(input: {
  latestBlockHeight: number | null;
  difficultyAdjustment: MempoolDifficultyAdjustment | null;
  fetchedAt: string;
}): NetworkDto["halving"] {
  const { latestBlockHeight } = input;

  if (latestBlockHeight === null || latestBlockHeight === undefined) {
    return {
      progressPercent: null,
      estimatedDaysUntil: null,
      remainingBlocks: null,
      nextHalvingHeight: null,
      estimatedDate: null,
      currentReward: null,
      nextReward: null,
    };
  }

  const nextHalvingHeight =
    (Math.floor(latestBlockHeight / HALVING_INTERVAL) + 1) * HALVING_INTERVAL;
  const lastHalvingHeight = Math.floor(latestBlockHeight / HALVING_INTERVAL) * HALVING_INTERVAL;
  const remainingBlocks = Math.max(nextHalvingHeight - latestBlockHeight, 0);
  const progressBlocks = Math.max(latestBlockHeight - lastHalvingHeight, 0);
  const halvingIndex = Math.floor(latestBlockHeight / HALVING_INTERVAL);
  const fetchedAtTimestamp = new Date(input.fetchedAt).getTime();
  const estimatedTimestamp = getEstimatedHalvingDate({
    difficultyAdjustment: input.difficultyAdjustment,
    fetchedAt: input.fetchedAt,
    halvingBlocksRemaining: remainingBlocks,
  });

  return {
    progressPercent: (progressBlocks / HALVING_INTERVAL) * 100,
    estimatedDaysUntil:
      estimatedTimestamp === null || Number.isNaN(fetchedAtTimestamp)
        ? null
        : Math.max(0, Math.round((estimatedTimestamp - fetchedAtTimestamp) / MS_PER_DAY)),
    remainingBlocks,
    nextHalvingHeight,
    estimatedDate:
      estimatedTimestamp === null || Number.isNaN(estimatedTimestamp)
        ? null
        : new Date(estimatedTimestamp).toISOString(),
    currentReward: getBlockReward(halvingIndex),
    nextReward: getBlockReward(halvingIndex + 1),
  };
}

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
    maxFeeRate: block.feeRange ? (block.feeRange[block.feeRange.length - 1] ?? null) : null,
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
  const blockIntervalsMinutes = latestBlocks
    .slice(0, -1)
    .map((block, index) => {
      const nextBlockTimestamp = latestBlocks[index + 1]?.timestamp ?? null;

      if (nextBlockTimestamp === null) {
        return null;
      }

      return Math.abs(block.timestamp - nextBlockTimestamp) / 60_000;
    })
    .filter((value): value is number => value !== null && Number.isFinite(value));
  const averageBlockTimeMinutes = average(blockIntervalsMinutes);
  const averageTransactionsPerBlock = average(
    latestBlocks
      .map((block) => block.transactionCount)
      .filter((value): value is number => value !== null && Number.isFinite(value))
  );
  const averageBlockSizeBytes = average(
    latestBlocks
      .map((block) => block.sizeBytes)
      .filter((value): value is number => value !== null && Number.isFinite(value))
  );
  const backlogBlocks =
    pendingVirtualSizeMb === null
      ? null
      : round((pendingVirtualSizeMb * 1_000_000) / BYTES_PER_FULL_BLOCK, 1);

  return {
    source: "mempool.space",
    latestBlockHeight: input.latestBlockHeight,
    halving: mapHalving({
      latestBlockHeight: input.latestBlockHeight,
      difficultyAdjustment: input.difficultyAdjustment,
      fetchedAt: input.fetchedAt,
    }),
    fees: {
      fastestFee: input.fees?.fastestFee ?? null,
      halfHourFee: input.fees?.halfHourFee ?? null,
      hourFee: input.fees?.hourFee ?? null,
      economyFee: input.fees?.economyFee ?? null,
      minimumFee: input.fees?.minimumFee ?? null,
    },
    feeSpread: {
      fastestToHour: getSpread(input.fees?.fastestFee, input.fees?.hourFee),
      hourToMinimum: getSpread(input.fees?.hourFee, input.fees?.minimumFee),
      fastestToMinimum: getSpread(input.fees?.fastestFee, input.fees?.minimumFee),
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
    activity: {
      averageBlockTimeMinutes:
        averageBlockTimeMinutes === null ? null : round(averageBlockTimeMinutes, 1),
      averageTransactionsPerBlock:
        averageTransactionsPerBlock === null ? null : round(averageTransactionsPerBlock, 0),
      averageBlockSizeBytes:
        averageBlockSizeBytes === null ? null : round(averageBlockSizeBytes, 0),
    },
    mempool: {
      pendingTransactions,
      pendingVirtualSizeMb,
      backlogBlocks,
      projectedBlocks,
    },
    latestBlocks,
    partial: Boolean(warnings?.length),
    warnings: warnings?.length ? warnings : undefined,
    fetchedAt: input.fetchedAt,
  };
}
