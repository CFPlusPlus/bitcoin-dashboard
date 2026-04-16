"use client";
import type { AsyncDataState } from "../../lib/data-state";
import type { Sentiment } from "../../types/dashboard";
import { getDashboardSectionStateMessages } from "../../lib/dashboard-state-copy";
import type { AppLocale } from "../../i18n/config";
import { formatMessage } from "../../i18n/template";
import { formatCountdown, formatNumber, formatPercent } from "../../lib/format";
import { useI18n } from "../../i18n/context";
import { cn } from "../../lib/cn";
import {
  getSentimentNeedleAngle,
  getSentimentZoneKey,
  sentimentZoneRanges,
  type SentimentZoneKey,
} from "../../lib/sentiment";
import Card from "../../components/ui/Card";
import DataState from "../../components/ui/data-state/DataState";
import DataStateMeta from "../../components/ui/data-state/DataStateMeta";
import Label from "../../components/ui/content/Label";
import MetaText from "../../components/ui/content/MetaText";
import SectionHeader from "../../components/ui/layout/SectionHeader";
import Stack from "../../components/ui/layout/Stack";
import MetricCard from "../../components/MetricCard";

type SentimentSectionProps = {
  onRetry: () => void;
  sentiment: Sentiment | null;
  sentimentState: AsyncDataState<Sentiment>;
};

const zoneVisuals: Record<
  SentimentZoneKey,
  {
    accent: string;
    soft: string;
    strong: string;
  }
> = {
  extremeFear: {
    accent: "var(--token-color-danger)",
    soft: "color-mix(in srgb, var(--token-color-danger) 18%, var(--token-color-bg-elevated) 82%)",
    strong:
      "color-mix(in srgb, var(--token-color-danger) 40%, var(--token-color-border-default) 60%)",
  },
  fear: {
    accent: "color-mix(in srgb, var(--token-color-danger) 62%, var(--token-color-warning) 38%)",
    soft: "color-mix(in srgb, color-mix(in srgb, var(--token-color-danger) 62%, var(--token-color-warning) 38%) 18%, var(--token-color-bg-elevated) 82%)",
    strong:
      "color-mix(in srgb, color-mix(in srgb, var(--token-color-danger) 62%, var(--token-color-warning) 38%) 36%, var(--token-color-border-default) 64%)",
  },
  neutral: {
    accent:
      "color-mix(in srgb, var(--token-color-warning) 72%, var(--token-color-accent-primary) 28%)",
    soft: "color-mix(in srgb, color-mix(in srgb, var(--token-color-warning) 72%, var(--token-color-accent-primary) 28%) 18%, var(--token-color-bg-elevated) 82%)",
    strong:
      "color-mix(in srgb, color-mix(in srgb, var(--token-color-warning) 72%, var(--token-color-accent-primary) 28%) 36%, var(--token-color-border-default) 64%)",
  },
  greed: {
    accent:
      "color-mix(in srgb, var(--token-color-accent-primary) 38%, var(--token-color-success) 62%)",
    soft: "color-mix(in srgb, color-mix(in srgb, var(--token-color-accent-primary) 38%, var(--token-color-success) 62%) 18%, var(--token-color-bg-elevated) 82%)",
    strong:
      "color-mix(in srgb, color-mix(in srgb, var(--token-color-accent-primary) 38%, var(--token-color-success) 62%) 36%, var(--token-color-border-default) 64%)",
  },
  extremeGreed: {
    accent: "var(--token-color-success)",
    soft: "color-mix(in srgb, var(--token-color-success) 18%, var(--token-color-bg-elevated) 82%)",
    strong:
      "color-mix(in srgb, var(--token-color-success) 40%, var(--token-color-border-default) 60%)",
  },
};

const fallbackVisual = {
  accent: "var(--token-color-text-secondary)",
  soft: "var(--token-color-bg-elevated)",
  strong: "var(--token-color-border-default)",
};

function getValueTone(zoneKey: SentimentZoneKey | null) {
  if (zoneKey === "greed" || zoneKey === "extremeGreed") {
    return "positive" as const;
  }

  if (zoneKey === "fear" || zoneKey === "extremeFear") {
    return "negative" as const;
  }

  return "default" as const;
}

function polarToCartesian(centerX: number, centerY: number, radius: number, angleDegrees: number) {
  const angleRadians = (angleDegrees * Math.PI) / 180;

  return {
    x: centerX + radius * Math.cos(angleRadians),
    y: centerY + radius * Math.sin(angleRadians),
  };
}

function describeArc(
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number
) {
  const start = polarToCartesian(centerX, centerY, radius, startAngle);
  const end = polarToCartesian(centerX, centerY, radius, endAngle);
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
}

function getWeeklyContext({
  average7d,
  copy,
  locale,
  value,
}: {
  average7d: number | null;
  copy: ReturnType<typeof useI18n>["messages"]["dashboard"]["sentiment"];
  locale: AppLocale;
  value: number | null;
}) {
  if (typeof average7d !== "number") {
    return copy.average7dFootnote;
  }

  const formattedAverage = formatNumber(average7d, locale);

  if (typeof value !== "number") {
    return formatMessage(copy.weekNearAverage, { value: formattedAverage });
  }

  const difference = value - average7d;

  if (Math.abs(difference) < 3) {
    return formatMessage(copy.weekNearAverage, { value: formattedAverage });
  }

  return formatMessage(difference > 0 ? copy.weekAboveAverage : copy.weekBelowAverage, {
    value: formattedAverage,
  });
}

export default function SentimentSection({
  onRetry,
  sentiment,
  sentimentState,
}: SentimentSectionProps) {
  const { locale, messages } = useI18n();
  const copy = messages.dashboard.sentiment;
  const fallback = messages.common.unavailable;
  const stateMessages = getDashboardSectionStateMessages("sentiment", sentimentState.error, locale);
  const zoneKey = getSentimentZoneKey(sentiment?.value ?? null, sentiment?.classification ?? null);
  const zoneCopy = zoneKey ? copy.zones[zoneKey] : copy.zones.unknown;
  const currentVisual = zoneKey ? zoneVisuals[zoneKey] : fallbackVisual;
  const sentimentValue =
    typeof sentiment?.value === "number" ? formatNumber(sentiment.value, locale) : fallback;
  const weeklyContext = getWeeklyContext({
    average7d: sentiment?.average7d ?? null,
    copy,
    locale,
    value: sentiment?.value ?? null,
  });
  const needleAngle = getSentimentNeedleAngle(sentiment?.value ?? null);
  const pointerTip = polarToCartesian(160, 176, 118, needleAngle);
  const pointerBase = polarToCartesian(160, 176, 94, needleAngle);
  const pointerAngleRadians = (needleAngle * Math.PI) / 180;
  const pointerOffsetX = Math.cos(pointerAngleRadians + Math.PI / 2) * 7;
  const pointerOffsetY = Math.sin(pointerAngleRadians + Math.PI / 2) * 7;
  const pointerPoints = [
    `${pointerTip.x},${pointerTip.y}`,
    `${pointerBase.x + pointerOffsetX},${pointerBase.y + pointerOffsetY}`,
    `${pointerBase.x - pointerOffsetX},${pointerBase.y - pointerOffsetY}`,
  ].join(" ");

  return (
    <Card as="section" tone="muted" padding="md" className="h-full gap-4 border-border-default">
      <SectionHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
        meta={<DataStateMeta state={sentimentState} />}
      />

      <DataState
        state={sentimentState}
        onRetry={onRetry}
        retryBusy={sentimentState.isLoading}
        messages={stateMessages}
      >
        <Stack gap="md">
          <div
            className="overflow-hidden rounded-md border px-4 py-5 sm:px-5 sm:py-6"
            style={{
              backgroundColor: "var(--token-color-bg-surface)",
              borderColor: currentVisual.strong,
            }}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="max-w-2xl">
                <Label tone="muted">{copy.scaleLabel}</Label>
                <p className="mt-2 text-sm leading-relaxed text-fg-secondary">{copy.scaleHint}</p>
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <div className="relative w-full max-w-[46rem]">
                <svg viewBox="0 0 320 220" className="block w-full" aria-hidden="true">
                  <path
                    d={describeArc(160, 176, 128, 180, 360)}
                    fill="none"
                    stroke="color-mix(in srgb, var(--token-color-text-primary) 9%, transparent)"
                    strokeWidth="18"
                    strokeLinecap="round"
                  />
                  <path
                    d={describeArc(160, 176, 128, 180, 360)}
                    fill="none"
                    stroke={currentVisual.accent}
                    strokeWidth="15"
                    strokeLinecap="round"
                  />
                  <polygon points={pointerPoints} fill={currentVisual.accent} />
                </svg>

                <div className="pointer-events-none absolute inset-x-0 top-[61%] flex -translate-y-1/2 flex-col items-center px-6 text-center">
                  <p
                    className={cn(
                      "font-numeric tabular-nums text-[clamp(3rem,10vw,4.8rem)] leading-none tracking-[-0.05em]",
                      getValueTone(zoneKey) === "positive"
                        ? "text-success"
                        : getValueTone(zoneKey) === "negative"
                          ? "text-danger"
                          : "text-fg"
                    )}
                  >
                    {sentimentValue}
                  </p>
                  <p className="mt-2 text-[clamp(1.35rem,4vw,1.9rem)] font-medium text-fg">
                    {zoneCopy.label}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-2 flex flex-wrap justify-center gap-2">
              {sentimentZoneRanges.map((range) => {
                const visual = zoneVisuals[range.key];
                const isActive = zoneKey === range.key;

                return (
                  <div
                    key={range.key}
                    className="min-w-[6.25rem] rounded-md border px-3 py-2 text-center transition-colors duration-[var(--motion-base)] ease-[var(--ease-standard)]"
                    style={{
                      backgroundColor: isActive ? visual.soft : "var(--token-color-bg-elevated)",
                      borderColor: isActive ? visual.strong : "var(--token-color-border-subtle)",
                    }}
                  >
                    <p
                      className="font-mono tabular-nums text-[0.72rem] tracking-[0.12em]"
                      style={{ color: visual.accent }}
                    >
                      {range.min}-{range.max}
                    </p>
                    <p className="mt-1 text-xs text-fg-secondary">{copy.zones[range.key].label}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="flex flex-col gap-3 rounded-md border border-border-subtle bg-surface px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Label tone="muted">{copy.currentZoneLabel}</Label>
                  <p className="mt-2 text-lg font-medium text-fg">{zoneCopy.label}</p>
                </div>
                <span
                  className="mt-0.5 h-3 w-3 rounded-full"
                  style={{ backgroundColor: currentVisual.accent }}
                  aria-hidden="true"
                />
              </div>
              <p className="text-sm leading-relaxed text-fg-secondary">{zoneCopy.description}</p>
            </div>

            <div className="flex flex-col gap-3 rounded-md border border-border-subtle bg-surface px-4 py-4">
              <Label tone="muted">{copy.weekContextLabel}</Label>
              <p className="text-sm leading-relaxed text-fg-secondary">{weeklyContext}</p>
            </div>

            <div className="flex flex-col gap-3 rounded-md border border-border-subtle bg-surface px-4 py-4">
              <Label tone="muted">{copy.nextUpdate}</Label>
              <p className="font-numeric tabular-nums text-[1.2rem] text-fg">
                {formatCountdown(sentiment?.timeUntilUpdateSeconds ?? null, locale)}
              </p>
              <MetaText>{copy.nextUpdateHint}</MetaText>
            </div>

            <div className="flex flex-col gap-3 rounded-md border border-border-subtle bg-surface px-4 py-4">
              <Label tone="muted">{copy.sourceLabel}</Label>
              <p className="text-base font-medium text-fg">{sentiment?.attribution ?? fallback}</p>
              <MetaText>{copy.sourceHint}</MetaText>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <MetricCard
              label={copy.average7dLabel}
              value={formatNumber(sentiment?.average7d ?? null, locale)}
              meta={copy.average7dMeta}
              valueFootnote={copy.average7dFootnote}
              tone="default"
            />
            <MetricCard
              label={copy.change7dLabel}
              value={formatPercent(sentiment?.change7d ?? null, locale)}
              meta={copy.change7dMeta}
              valueFootnote={copy.change7dFootnote}
              valueTone={
                typeof sentiment?.change7d === "number" && sentiment.change7d < 0
                  ? "negative"
                  : typeof sentiment?.change7d === "number" && sentiment.change7d > 0
                    ? "positive"
                    : "default"
              }
            />
          </div>
        </Stack>
      </DataState>
    </Card>
  );
}
