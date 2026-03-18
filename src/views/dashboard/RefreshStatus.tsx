"use client";

import type { AsyncDataState } from "../../lib/data-state";
import { useI18n } from "../../i18n/context";
import DataStateMeta from "../../components/ui/data-state/DataStateMeta";

type RefreshStatusProps = {
  autoRefresh: boolean;
  dashboardState: AsyncDataState<{ lastRefreshAt: string }>;
};

function getStatusCopy(
  state: AsyncDataState<{ lastRefreshAt: string }>,
  copy: {
    firstLoad: string;
    stale: string;
    partial: string;
    refreshing: string;
    persisted: string;
  }
) {
  if (!state.hasUsableData && state.isLoading) {
    return copy.firstLoad;
  }

  if (state.isStale) {
    return copy.stale;
  }

  if (state.isPartial) {
    return copy.partial;
  }

  if (state.isRefreshing) {
    return copy.refreshing;
  }

  return copy.persisted;
}

export default function RefreshStatus({ autoRefresh, dashboardState }: RefreshStatusProps) {
  const { messages } = useI18n();
  const copy = messages.dashboard.controls;

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="flex flex-wrap items-center gap-2 text-sm text-fg-secondary">
        <span className="font-medium text-fg-muted">{copy.statusLabel}</span>
        <span>{autoRefresh ? copy.everyMinute : copy.paused}</span>
      </div>
      <DataStateMeta lastUpdatedLabel={messages.common.lastUpdated} state={dashboardState} />
      <p className="text-sm text-fg-muted">{getStatusCopy(dashboardState, copy)}</p>
    </div>
  );
}
