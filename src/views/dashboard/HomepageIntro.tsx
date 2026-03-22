"use client";

import Link from "next/link";
import NoticeBar from "../../components/NoticeBar";
import PageHeader from "../../components/PageHeader";
import { buttonVariants } from "../../components/ui/Button";
import Surface from "../../components/ui/Surface";
import Section from "../../components/ui/layout/Section";
import Stack from "../../components/ui/layout/Stack";
import { getLocalizedPathname } from "../../i18n/config";
import { useI18n } from "../../i18n/context";
import { cn } from "../../lib/cn";
import type { AsyncDataState } from "../../lib/data-state";
import DashboardControlsSection from "./DashboardControlsSection";

type HomepageIntroProps = {
  autoRefresh: boolean;
  dashboardState: AsyncDataState<{ lastRefreshAt: string }>;
  onAutoRefreshChange: (value: boolean) => void;
  onRefresh: () => void;
  refreshing: boolean;
  warnings: string[];
};

export default function HomepageIntro({
  autoRefresh,
  dashboardState,
  onAutoRefreshChange,
  onRefresh,
  refreshing,
  warnings,
}: HomepageIntroProps) {
  const { locale, messages } = useI18n();
  const copy = messages.home;

  return (
    <Section aria-label={copy.introAriaLabel} space="md">
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.2fr)_minmax(19rem,0.8fr)] xl:items-start">
        <Surface as="section" tone="elevated" padding="md" className="border-border-default/80">
          <div className="flex flex-col gap-5">
            <PageHeader />

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_14rem]">
              <Stack gap="md" className="max-w-2xl">
                <p className="text-sm leading-7 text-fg-secondary">{copy.introBody}</p>
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
                    {copy.jumpToChart}
                  </Link>
                  <Link
                    href={getLocalizedPathname(locale, "/tools")}
                    className={cn(
                      buttonVariants({
                        intent: "ghost",
                        size: "md",
                      }),
                      "no-underline"
                    )}
                  >
                    {copy.jumpToTools}
                  </Link>
                </div>
              </Stack>

              <div className="grid gap-2 xl:border-l xl:border-border-subtle xl:pl-4">
                <div className="border border-border-subtle bg-muted-surface px-3 py-3">
                  <p className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-fg-muted">
                    {copy.focusLabel}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-fg-secondary">{copy.focusBody}</p>
                </div>
                <div className="border border-accent/40 bg-accent-soft px-3 py-3">
                  <p className="font-serif text-base leading-none tracking-[-0.03em] text-accent">
                    {copy.sourcesLabel}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-fg-secondary">{copy.sourcesBody}</p>
                </div>
              </div>
            </div>
          </div>
        </Surface>

        <DashboardControlsSection
          autoRefresh={autoRefresh}
          dashboardState={dashboardState}
          refreshing={refreshing}
          onAutoRefreshChange={onAutoRefreshChange}
          onRefresh={onRefresh}
        />
      </div>

      <NoticeBar warnings={warnings} />
    </Section>
  );
}
