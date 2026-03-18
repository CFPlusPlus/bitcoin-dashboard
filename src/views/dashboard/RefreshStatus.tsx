import type { AsyncDataState } from "../../lib/data-state";
import DataStateMeta from "../../components/ui/data-state/DataStateMeta";

type RefreshStatusProps = {
  autoRefresh: boolean;
  dashboardState: AsyncDataState<{ lastRefreshAt: string }>;
};

function getStatusCopy(state: AsyncDataState<{ lastRefreshAt: string }>) {
  if (!state.hasUsableData && state.isLoading) {
    return "Der erste Abruf laeuft. Die Bereiche fuellen sich, sobald die ersten Daten vorliegen.";
  }

  if (state.isStale) {
    return "Mindestens ein Bereich zeigt derzeit aeltere Daten. Vorhandene Inhalte bleiben sichtbar.";
  }

  if (state.isPartial) {
    return "Einzelne Bereiche liefern gerade unvollstaendige Werte. Der Rest bleibt weiter nutzbar.";
  }

  if (state.isRefreshing) {
    return "Die aktuelle Ansicht bleibt waehrend der Aktualisierung sichtbar.";
  }

  return "Deine Einstellungen bleiben auf diesem Geraet gespeichert.";
}

export default function RefreshStatus({
  autoRefresh,
  dashboardState,
}: RefreshStatusProps) {
  return (
    <div className="flex flex-col items-start gap-2">
      <div className="flex flex-wrap items-center gap-2 text-sm text-fg-secondary">
        <span className="font-medium text-fg-muted">Aktualisierung:</span>
        <span>{autoRefresh ? "alle 60 Sekunden" : "pausiert"}</span>
      </div>
      <DataStateMeta lastUpdatedLabel="Zuletzt erneuert" state={dashboardState} />
      <p className="text-sm text-fg-muted">{getStatusCopy(dashboardState)}</p>
    </div>
  );
}
