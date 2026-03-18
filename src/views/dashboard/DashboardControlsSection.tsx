import type { AsyncDataState } from "../../lib/data-state";
import type { Currency } from "../../types/dashboard";
import Surface from "../../components/ui/Surface";
import AutoRefreshToggle from "./AutoRefreshToggle";
import CurrencySwitcher from "./CurrencySwitcher";
import RefreshButton from "./RefreshButton";
import RefreshStatus from "./RefreshStatus";

type DashboardControlsSectionProps = {
  autoRefresh: boolean;
  currency: Currency;
  dashboardState: AsyncDataState<{ lastRefreshAt: string }>;
  refreshing: boolean;
  onAutoRefreshChange: (value: boolean) => void;
  onCurrencyChange: (value: Currency) => void;
  onRefresh: () => void;
};

export default function DashboardControlsSection({
  autoRefresh,
  currency,
  dashboardState,
  refreshing,
  onAutoRefreshChange,
  onCurrencyChange,
  onRefresh,
}: DashboardControlsSectionProps) {
  return (
    <Surface
      as="section"
      tone="elevated"
      padding="md"
      className="flex h-full flex-col gap-4 border-border-default/80"
      aria-label="Aktualisierung und Einstellungen"
    >
      <RefreshStatus autoRefresh={autoRefresh} dashboardState={dashboardState} />

      <div className="flex flex-wrap items-center gap-2 border-t border-border-subtle pt-3">
        <CurrencySwitcher currency={currency} onChange={onCurrencyChange} />
        <AutoRefreshToggle autoRefresh={autoRefresh} onChange={onAutoRefreshChange} />
        <RefreshButton refreshing={refreshing} onRefresh={onRefresh} />
      </div>
    </Surface>
  );
}
