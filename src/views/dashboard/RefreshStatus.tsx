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
    <div className="flex flex-col items-start gap-2.5">
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="inline-flex min-h-8 items-center rounded-md border border-border-default bg-muted-surface px-3 py-1 text-[0.68rem] font-medium uppercase tracking-[0.18em] text-fg">
          {autoRefresh ? copy.everyMinute : copy.paused}
        </span>
        <DataStateMeta
          className="justify-start"
          lastUpdatedLabel={messages.common.lastUpdated}
          state={dashboardState}
        />
      </div>
      <p className="max-w-[34rem] text-sm leading-6 text-fg-muted">
        {getStatusCopy(dashboardState, copy)}
      </p>
    </div>
  );
}
