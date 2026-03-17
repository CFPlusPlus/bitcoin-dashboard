"use client";

import Link from "next/link";
import NoticeBar from "../../components/NoticeBar";
import PageHeader from "../../components/PageHeader";
import Surface from "../../components/ui/Surface";
import Section from "../../components/ui/layout/Section";
import Stack from "../../components/ui/layout/Stack";
import { buttonVariants } from "../../components/ui/Button";
import { cn } from "../../lib/cn";
import type { AsyncDataState } from "../../lib/data-state";
import type { Currency } from "../../types/dashboard";
import DashboardControlsSection from "./DashboardControlsSection";

type HomepageIntroProps = {
  autoRefresh: boolean;
  currency: Currency;
  dashboardState: AsyncDataState<{ lastRefreshAt: string }>;
  onAutoRefreshChange: (value: boolean) => void;
  onCurrencyChange: (value: Currency) => void;
  onRefresh: () => void;
  refreshing: boolean;
  warnings: string[];
};

export default function HomepageIntro({
  autoRefresh,
  currency,
  dashboardState,
  onAutoRefreshChange,
  onCurrencyChange,
  onRefresh,
  refreshing,
  warnings,
}: HomepageIntroProps) {
  return (
    <Section aria-label="Seiteneinordnung und Einstellungen" space="md">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)] xl:items-stretch">
        <Surface as="section" tone="elevated" padding="lg" className="flex flex-col gap-6">
          <PageHeader />

          <Stack gap="sm" className="max-w-2xl">
            <p className="text-sm font-medium text-fg-secondary">
              Preis, Verlauf, Sentiment und Netzwerkdaten folgen der V1-Prioritaet: zuerst
              Orientierung, dann Exploration, dann tieferer Kontext.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="#main-chart-zone"
                className={cn(
                  buttonVariants({
                    intent: "primary",
                    size: "md",
                  }),
                  "no-underline"
                )}
              >
                Zum Hauptchart
              </Link>
              <Link
                href="/tools"
                className={cn(
                  buttonVariants({
                    intent: "ghost",
                    size: "md",
                  }),
                  "no-underline"
                )}
              >
                Tools ansehen
              </Link>
            </div>
          </Stack>
        </Surface>

        <DashboardControlsSection
          autoRefresh={autoRefresh}
          currency={currency}
          dashboardState={dashboardState}
          refreshing={refreshing}
          onAutoRefreshChange={onAutoRefreshChange}
          onCurrencyChange={onCurrencyChange}
          onRefresh={onRefresh}
        />
      </div>

      <NoticeBar warnings={warnings} />
    </Section>
  );
}
