"use client";

import type { AsyncDataState } from "../../lib/data-state";
import type { Currency } from "../../types/dashboard";
import { useI18n } from "../../i18n/context";
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

export default function DashboardControlsSection(props: DashboardControlsSectionProps) {
  const { messages } = useI18n();

  return (
    <Surface
      as="section"
      tone="elevated"
      padding="md"
      className="flex h-full flex-col gap-4 border-border-default/80"
      aria-label={messages.dashboard.controlsAriaLabel}
    >
      <RefreshStatus autoRefresh={props.autoRefresh} dashboardState={props.dashboardState} />

      <div className="flex flex-wrap items-center gap-2 border-t border-border-subtle pt-3">
        <CurrencySwitcher currency={props.currency} onChange={props.onCurrencyChange} />
        <AutoRefreshToggle autoRefresh={props.autoRefresh} onChange={props.onAutoRefreshChange} />
        <RefreshButton refreshing={props.refreshing} onRefresh={props.onRefresh} />
      </div>
    </Surface>
  );
}
