import type { AsyncDataState } from "../../lib/data-state";
import { getDashboardSectionStateMessages } from "../../lib/dashboard-state-copy";
import { FALLBACK_TEXT, formatCountdown } from "../../lib/format";
import type { Sentiment } from "../../types/dashboard";
import { cn } from "../../lib/cn";
import Card from "../../components/ui/Card";
import DataState from "../../components/ui/data-state/DataState";
import DataStateMeta from "../../components/ui/data-state/DataStateMeta";
import KpiValue from "../../components/ui/content/KpiValue";
import MetaText from "../../components/ui/content/MetaText";
import SectionHeader from "../../components/ui/layout/SectionHeader";
import Stack from "../../components/ui/layout/Stack";

type SentimentSectionProps = {
  onRetry: () => void;
  sentiment: Sentiment | null;
  sentimentState: AsyncDataState<Sentiment>;
};

function getSentimentTone(classification: string | null) {
  const normalized = classification?.toLowerCase() ?? "";

  if (normalized.includes("greed")) {
    return {
      badgeClassName: "border-success/30 bg-success/10 text-success",
      tone: "positive" as const,
    };
  }

  if (normalized.includes("fear")) {
    return {
      badgeClassName: "border-danger/30 bg-danger/10 text-danger",
      tone: "negative" as const,
    };
  }

  return {
    badgeClassName: "border-border-default bg-muted-surface text-fg-secondary",
    tone: "default" as const,
  };
}

export default function SentimentSection({
  onRetry,
  sentiment,
  sentimentState,
}: SentimentSectionProps) {
  const sentimentUi = getSentimentTone(sentiment?.classification ?? null);
  const stateMessages = getDashboardSectionStateMessages("sentiment", sentimentState.error);
  const sentimentValue =
    typeof sentiment?.value === "number" ? `${sentiment.value} / 100` : FALLBACK_TEXT;

  return (
    <Card as="section" tone="muted" padding="md" className="h-full gap-4 border-border-default/80">
      <SectionHeader
        eyebrow="Sentiment"
        title="Fear &amp; Greed"
        description="Ein kompakter Signalblock fuer Marktstimmung, der schnell erfassbar bleibt und sich klar hinter Preis und Chart einordnet."
        meta={<DataStateMeta state={sentimentState} />}
      />

      <DataState
        state={sentimentState}
        onRetry={onRetry}
        retryBusy={sentimentState.isLoading}
        messages={stateMessages}
      >
        <Stack gap="md">
          <div className="flex flex-col gap-4 border border-border-subtle bg-surface px-3 py-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <KpiValue
                label="Indexstand"
                value={sentimentValue}
                meta="Fear & Greed Index"
                size="lg"
                tone={sentimentUi.tone}
              />
              <span
                className={cn(
                  "inline-flex items-center rounded-sm border px-3 py-1 text-[0.68rem] font-medium uppercase tracking-[0.18em]",
                  sentimentUi.badgeClassName
                )}
              >
                {sentiment?.classification ?? FALLBACK_TEXT}
              </span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-2 border border-border-subtle bg-surface px-3 py-3">
              <MetaText size="xs" className="uppercase tracking-[0.16em]">
                Naechstes Update
              </MetaText>
              <p className="font-mono text-base text-fg">
                {formatCountdown(sentiment?.timeUntilUpdateSeconds ?? null)}
              </p>
            </div>

            <div className="flex flex-col gap-2 border border-accent/30 bg-accent-soft px-3 py-3">
              <MetaText size="xs" className="uppercase tracking-[0.16em]">
                Quelle
              </MetaText>
              <p className="text-base font-medium text-fg">
                {sentiment?.attribution ?? FALLBACK_TEXT}
              </p>
            </div>
          </div>
        </Stack>
      </DataState>
    </Card>
  );
}
