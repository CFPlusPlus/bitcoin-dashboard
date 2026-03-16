import { formatDateTime } from "../lib/format";
import type { Currency } from "../types/dashboard";

type DashboardToolbarProps = {
  autoRefresh: boolean;
  currency: Currency;
  lastRefreshAt: string | null;
  refreshing: boolean;
  onAutoRefreshChange: (value: boolean) => void;
  onCurrencyChange: (value: Currency) => void;
  onRefresh: () => void;
};

export default function DashboardToolbar({
  autoRefresh,
  currency,
  lastRefreshAt,
  refreshing,
  onAutoRefreshChange,
  onCurrencyChange,
  onRefresh,
}: DashboardToolbarProps) {
  return (
    <div className="toolbar">
      <div className="toolbar-info">
        <div className="toolbar-status">
          <span className="toolbar-label">Auto-Refresh:</span>
          <span>{autoRefresh ? "alle 60 Sekunden" : "pausiert"}</span>
        </div>
        <p className="toolbar-note">Einstellungen werden lokal gespeichert.</p>
      </div>

      <div className="toolbar-actions">
        <div className="range-switcher" role="tablist" aria-label="Währung">
          {(["usd", "eur"] as const).map((value) => (
            <button
              key={value}
              type="button"
              className={currency === value ? "range-btn active" : "range-btn"}
              onClick={() => onCurrencyChange(value)}
            >
              {value.toUpperCase()}
            </button>
          ))}
        </div>

        <button
          type="button"
          className={autoRefresh ? "range-btn active" : "range-btn"}
          onClick={() => onAutoRefreshChange(!autoRefresh)}
        >
          {autoRefresh ? "Live an" : "Live aus"}
        </button>

        <span className="toolbar-time">Zuletzt aktualisiert: {formatDateTime(lastRefreshAt)}</span>

        <button
          type="button"
          className="refresh-btn"
          onClick={onRefresh}
          disabled={refreshing}
        >
          {refreshing ? "Aktualisiere..." : "Jetzt aktualisieren"}
        </button>
      </div>
    </div>
  );
}
