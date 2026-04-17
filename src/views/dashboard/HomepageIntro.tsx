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
    <Section aria-label={copy.introAriaLabel} space="lg">
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.5fr)_24rem] xl:items-start">
        <Surface
          as="section"
          tone="elevated"
          padding="lg"
          className="border-border-default/80 xl:px-11 xl:py-10"
        >
          <div className="flex flex-col gap-10">
            <PageHeader />

            <div className="grid gap-10 xl:grid-cols-[minmax(0,1.12fr)_minmax(23rem,0.88fr)] xl:items-start">
              <Stack gap="xl" className="max-w-[44rem]">
                <p className="type-body max-w-[38rem] text-fg-secondary">{copy.heroBody}</p>

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
                    className="inline-flex h-7 items-center border-b border-transparent pb-px text-[0.68rem] font-medium uppercase tracking-[0.22em] text-fg-secondary transition-[border-color,color,opacity] duration-[var(--motion-base)] ease-[var(--ease-standard)] no-underline hover:border-border-default/70 hover:text-fg focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45 focus-visible:ring-offset-2 focus-visible:ring-offset-app sm:h-8 sm:text-[0.69rem]"
                  >
                    {copy.jumpToTools}
                  </Link>
                </div>
              </Stack>

              <div
                aria-label={copy.snapshotTitle}
                className="border-l border-border-subtle/80 pl-0 xl:pl-8"
              >
                <div className="flex items-center gap-3">
                  <span aria-hidden className="h-px w-8 bg-accent/65" />
                  <p className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-accent">
                    {copy.snapshotEyebrow}
                  </p>
                </div>
                <p className="type-section mt-4 max-w-[16ch] text-fg">{copy.snapshotTitle}</p>
                <p className="type-body mt-4 max-w-[23rem] text-fg-secondary">
                  {copy.snapshotDescription}
                </p>

                <p className="type-body mt-5 max-w-[23rem] text-fg-secondary">{copy.introBody}</p>

                <ul className="mt-7 grid gap-4 border-t border-border-subtle/80 pt-5">
                  {copy.snapshotPoints.map((point, index) => (
                    <li key={point} className="flex gap-3.5">
                      <span className="pt-0.5 font-mono text-xs text-accent">0{index + 1}</span>
                      <span className="type-body text-fg-secondary">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="grid gap-6 border-t border-border-subtle/80 pt-7 md:grid-cols-3">
              {copy.benefits.map((benefit, index) => (
                <div key={benefit.title} className="flex h-full flex-col gap-3">
                  <span
                    className={cn(
                      "font-mono text-[0.68rem] uppercase tracking-[0.22em]",
                      index === 1 ? "text-accent" : "text-fg-muted"
                    )}
                  >
                    0{index + 1}
                  </span>
                  <p
                    className={cn(
                      "type-section max-w-[18ch] text-fg",
                      index === 1 && "text-accent-strong"
                    )}
                  >
                    {benefit.title}
                  </p>
                  <p className="type-body max-w-[20rem] text-fg-secondary">{benefit.description}</p>
                </div>
              ))}
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
