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
    <div className="toolbar-info">
      <div className="toolbar-status">
        <span className="toolbar-label">Auto-Refresh:</span>
        <span>{autoRefresh ? "alle 60 Sekunden" : "pausiert"}</span>
      </div>
      <p className="toolbar-note">Einstellungen werden lokal gespeichert.</p>
      <span className="toolbar-time">
        Zuletzt aktualisiert: {formatDateTime(lastRefreshAt)}
      </span>
    </div>
  );
}
