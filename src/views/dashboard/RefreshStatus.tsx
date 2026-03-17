import { formatDateTime } from "../../lib/format";

type RefreshStatusProps = {
  autoRefresh: boolean;
  lastRefreshAt: string | null;
};

export default function RefreshStatus({
  autoRefresh,
  lastRefreshAt,
}: RefreshStatusProps) {
  return (
    <div className="flex flex-col items-start gap-1.5">
      <div className="flex flex-wrap items-center gap-2 text-sm text-fg-secondary">
        <span className="font-medium text-fg-muted">Auto-Refresh:</span>
        <span>{autoRefresh ? "alle 60 Sekunden" : "pausiert"}</span>
      </div>
      <p className="text-sm text-fg-muted">Einstellungen werden lokal gespeichert.</p>
      <span className="text-sm text-fg-muted">Zuletzt aktualisiert: {formatDateTime(lastRefreshAt)}</span>
    </div>
  );
}
