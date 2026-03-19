"use client";

import type { AsyncDataState } from "../../../lib/data-state";
import { useI18n } from "../../../i18n/context";
import Cluster from "../layout/Cluster";
import LastUpdated from "./LastUpdated";
import StateBadge from "./StateBadge";
import StaleBadge from "./StaleBadge";

type DataStateMetaProps = {
  className?: string;
  lastUpdatedLabel?: string;
  state: Pick<
    AsyncDataState<unknown>,
    "hasUsableData" | "isPartial" | "isRefreshing" | "isStale" | "lastUpdatedAt"
  >;
};

export default function DataStateMeta({ className, lastUpdatedLabel, state }: DataStateMetaProps) {
  const { messages } = useI18n();
  const showMeta = state.isRefreshing || state.isPartial || state.isStale || state.hasUsableData;

  if (!showMeta) {
    return null;
  }

  return (
    <Cluster gap="sm" justify="end" className={className}>
      {state.isRefreshing ? (
        <StateBadge tone="loading" spinning>
          {messages.common.refreshing}
        </StateBadge>
      ) : null}
      {state.isPartial ? <StateBadge tone="partial">{messages.common.partially}</StateBadge> : null}
      {state.isStale ? <StaleBadge /> : null}
      <LastUpdated label={lastUpdatedLabel} value={state.lastUpdatedAt} />
    </Cluster>
  );
}
