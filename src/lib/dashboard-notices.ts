import type { AppLocale } from "../i18n/config";
import { getDictionary } from "../i18n/dictionaries";
import type { AsyncDataState } from "./data-state";
import type { Network } from "../types/dashboard";

export const PERSISTENT_NOTICE_DELAY_MS = 2 * 60_000;

export type DashboardNoticeCandidate = {
  key: string;
  message: string;
};

type NetworkStateForNotices = Pick<
  AsyncDataState<Network>,
  "error" | "hasUsableData" | "isLoading"
>;

function areAllValuesMissing(values: Array<number | null | undefined>) {
  return values.every((value) => value === null || value === undefined);
}

function hasCriticalNetworkDataLoss(network: Network | null) {
  if (!network) {
    return false;
  }

  const blockHeightMissing =
    network.latestBlockHeight === null || network.latestBlockHeight === undefined;
  const allFeeEstimatesMissing = areAllValuesMissing([
    network.fees.fastestFee,
    network.fees.halfHourFee,
    network.fees.hourFee,
    network.fees.economyFee,
    network.fees.minimumFee,
  ]);

  return blockHeightMissing || allFeeEstimatesMissing;
}

export function getDashboardNoticeCandidates({
  locale,
  network,
  networkState,
}: {
  locale: AppLocale;
  network: Network | null;
  networkState: NetworkStateForNotices;
}) {
  const copy = getDictionary(locale).dashboard.stateCopy?.persistentNotices;

  if (networkState.isLoading) {
    return [];
  }

  if (!networkState.hasUsableData && networkState.error) {
    return [
      {
        key: "network-unavailable",
        message:
          copy?.networkUnavailable ??
          "Netzwerkdaten sind seit einigen Minuten nicht verlässlich verfügbar.",
      },
    ];
  }

  if (networkState.hasUsableData && hasCriticalNetworkDataLoss(network)) {
    return [
      {
        key: "network-critical-loss",
        message:
          copy?.networkCriticalLoss ??
          "Wichtige Netzwerkdaten sind seit einigen Minuten nur eingeschränkt verfügbar.",
      },
    ];
  }

  return [];
}
