import Surface from "../../components/ui/Surface";
import type { Currency } from "../../types/dashboard";
import AutoRefreshToggle from "./AutoRefreshToggle";
import CurrencySwitcher from "./CurrencySwitcher";
import RefreshButton from "./RefreshButton";
import RefreshStatus from "./RefreshStatus";

type DashboardControlsSectionProps = {
  autoRefresh: boolean;
  currency: Currency;
  lastRefreshAt: string | null;
  refreshing: boolean;
  onAutoRefreshChange: (value: boolean) => void;
  onCurrencyChange: (value: Currency) => void;
  onRefresh: () => void;
};

export default function DashboardControlsSection({
  autoRefresh,
  currency,
  lastRefreshAt,
  refreshing,
  onAutoRefreshChange,
  onCurrencyChange,
  onRefresh,
}: DashboardControlsSectionProps) {
  return (
    <Surface
      as="section"
      tone="elevated"
      className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
      aria-label="Aktualisierung und Einstellungen"
    >
      <RefreshStatus autoRefresh={autoRefresh} lastRefreshAt={lastRefreshAt} />

      <div className="flex flex-wrap items-center gap-3">
        <CurrencySwitcher currency={currency} onChange={onCurrencyChange} />
        <AutoRefreshToggle autoRefresh={autoRefresh} onChange={onAutoRefreshChange} />
        <RefreshButton refreshing={refreshing} onRefresh={onRefresh} />
      </div>
    </Surface>
  );
}
