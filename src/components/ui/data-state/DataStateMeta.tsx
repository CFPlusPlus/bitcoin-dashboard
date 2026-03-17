import type { AsyncDataState } from "../../../lib/data-state";
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

export default function DataStateMeta({
  className,
  lastUpdatedLabel,
  state,
}: DataStateMetaProps) {
  const showMeta =
    state.isRefreshing || state.isPartial || state.isStale || state.hasUsableData;

  if (!showMeta) {
    return null;
  }

  return (
    <Cluster gap="sm" justify="end" className={className}>
      {state.isRefreshing ? (
        <StateBadge tone="loading" spinning>
          Aktualisierung laeuft
        </StateBadge>
      ) : null}
      {state.isPartial ? <StateBadge tone="partial">Teilweise</StateBadge> : null}
      {state.isStale ? <StaleBadge /> : null}
      <LastUpdated label={lastUpdatedLabel} value={state.lastUpdatedAt} />
    </Cluster>
  );
}
