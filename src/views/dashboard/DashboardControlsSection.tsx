"use client";

import type { AsyncDataState } from "../../lib/data-state";
import { useI18n } from "../../i18n/context";
import Surface from "../../components/ui/Surface";
import AutoRefreshToggle from "./AutoRefreshToggle";
import RefreshButton from "./RefreshButton";
import RefreshStatus from "./RefreshStatus";

type DashboardControlsSectionProps = {
  autoRefresh: boolean;
  dashboardState: AsyncDataState<{ lastRefreshAt: string }>;
  refreshing: boolean;
  onAutoRefreshChange: (value: boolean) => void;
  onRefresh: () => void;
};

export default function DashboardControlsSection(props: DashboardControlsSectionProps) {
  const { messages } = useI18n();

  return (
    <Surface
      as="section"
      tone="elevated"
      padding="md"
      className="flex flex-col gap-6 border-border-default/80 bg-muted-surface/65 xl:h-full xl:px-6 xl:py-6"
      aria-label={messages.dashboard.controlsAriaLabel}
    >
      <div className="border-b border-border-subtle/80 pb-5">
        <p className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-accent">
          {messages.dashboard.controls.statusLabel}
        </p>
        <p className="mt-3 max-w-[16rem] text-sm leading-7 text-fg-secondary">
          {messages.dashboard.controls.refreshing}
        </p>
      </div>

      <RefreshStatus autoRefresh={props.autoRefresh} dashboardState={props.dashboardState} />

      <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-border-subtle pt-5">
        <AutoRefreshToggle autoRefresh={props.autoRefresh} onChange={props.onAutoRefreshChange} />
        <RefreshButton refreshing={props.refreshing} onRefresh={props.onRefresh} />
      </div>
    </Surface>
  );
}
