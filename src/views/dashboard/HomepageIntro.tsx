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
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.42fr)_21.5rem] xl:items-stretch">
        <Surface
          as="section"
          tone="elevated"
          padding="lg"
          className="border-border-default/80 xl:px-10 xl:py-10"
        >
          <div className="flex flex-col gap-10">
            <PageHeader />

            <Stack gap="xl" className="max-w-[42rem]">
              <p className="max-w-[37rem] text-base leading-8 text-fg-secondary sm:text-[1.08rem]">
                {copy.heroBody}
              </p>

              <div className="border-t border-border-subtle/80 pt-5">
                <div className="flex flex-wrap gap-3.5">
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
              </div>
            </Stack>

            <div className="grid gap-6 border-t border-border-subtle/80 pt-6 md:grid-cols-3">
              {copy.benefits.map((benefit, index) => (
                <div
                  key={benefit.title}
                  className={cn(
                    "flex flex-col gap-4",
                    index > 0 && "md:border-l md:border-border-subtle/80 md:pl-6"
                  )}
                >
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
                      "max-w-[14ch] font-serif text-[1.45rem] leading-[1.03] tracking-[-0.04em] text-fg",
                      index === 1 && "text-accent-strong"
                    )}
                  >
                    {benefit.title}
                  </p>
                  <p className="max-w-[18rem] text-sm leading-7 text-fg-secondary">
                    {benefit.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Surface>

        <div className="grid gap-4 xl:h-full xl:grid-rows-[auto_minmax(0,1fr)]">
          <Surface
            as="aside"
            tone="elevated"
            padding="lg"
            className="border-border-default/80 bg-muted-surface xl:px-7 xl:py-7"
            aria-label={copy.snapshotTitle}
          >
            <div className="flex items-center gap-3">
              <span aria-hidden className="h-px w-8 bg-accent/65" />
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-accent">
                {copy.snapshotEyebrow}
              </p>
            </div>
            <p className="mt-5 max-w-[11ch] font-serif text-[2rem] leading-[1.01] tracking-[-0.045em] text-fg sm:text-[2.25rem] xl:text-[2.1rem]">
              {copy.snapshotTitle}
            </p>
            <p className="mt-4 max-w-[19rem] text-sm leading-7 text-fg-secondary">
              {copy.snapshotDescription}
            </p>

            <ul className="mt-7 grid gap-4 border-t border-border-subtle/80 pt-5">
              {copy.snapshotPoints.map((point, index) => (
                <li key={point} className="flex gap-3.5">
                  <span className="pt-0.5 font-mono text-xs text-accent">0{index + 1}</span>
                  <span className="text-sm leading-6 text-fg-secondary">{point}</span>
                </li>
              ))}
            </ul>
          </Surface>

          <DashboardControlsSection
            autoRefresh={autoRefresh}
            dashboardState={dashboardState}
            refreshing={refreshing}
            onAutoRefreshChange={onAutoRefreshChange}
            onRefresh={onRefresh}
          />
        </div>
      </div>

      <NoticeBar warnings={warnings} />
    </Section>
  );
}
