import type { AsyncDataState } from "../../lib/data-state";
import DataStateMeta from "../../components/ui/data-state/DataStateMeta";

type RefreshStatusProps = {
  autoRefresh: boolean;
  dashboardState: AsyncDataState<{ lastRefreshAt: string }>;
};

function getStatusCopy(state: AsyncDataState<{ lastRefreshAt: string }>) {
  if (!state.hasUsableData && state.isLoading) {
    return "Der erste Abruf laeuft. Bestehende Bereiche werden befuellt, sobald Daten vorliegen.";
  }

  if (state.isStale) {
    return "Mindestens ein Bereich zeigt derzeit aeltere Daten. Vorhandene Inhalte bleiben sichtbar.";
  }

  if (state.isPartial) {
    return "Einzelne Bereiche liefern gerade unvollstaendige Werte. Die restlichen Daten bleiben nutzbar.";
  }

  if (state.isRefreshing) {
    return "Bestehende Inhalte bleiben waehrend der Aktualisierung sichtbar.";
  }

  return "Einstellungen werden lokal gespeichert.";
}

export default function RefreshStatus({
  autoRefresh,
  dashboardState,
}: RefreshStatusProps) {
  return (
    <div className="flex flex-col items-start gap-2">
      <div className="flex flex-wrap items-center gap-2 text-sm text-fg-secondary">
        <span className="font-medium text-fg-muted">Auto-Aktualisierung:</span>
        <span>{autoRefresh ? "alle 60 Sekunden" : "pausiert"}</span>
      </div>
      <DataStateMeta lastUpdatedLabel="Zuletzt erfolgreich" state={dashboardState} />
      <p className="text-sm text-fg-muted">{getStatusCopy(dashboardState)}</p>
    </div>
  );
}
